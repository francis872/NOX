const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { trackEvent }    = require('../utils/analytics');
const { createRateLimiter, sanitizeBody, validatePassword, calculateAge } = require('../utils/security');

// Rate limiters
const loginLimiter    = createRateLimiter(5,  15 * 60 * 1000); // 5 / 15min
const registerLimiter = createRateLimiter(3,  60 * 60 * 1000); // 3 / hour

// ─── Registro ────────────────────────────────────────────────────────────────
router.post('/register', registerLimiter, async (req, res) => {
  const body = sanitizeBody(req.body);
  const { username, full_name, email, password, bio, interests, date_of_birth, origin } = body;

  if (!username?.trim())      return res.status(400).json({ error: 'El nombre de usuario es obligatorio' });
  if (!full_name?.trim())     return res.status(400).json({ error: 'El nombre completo es obligatorio' });
  if (!email?.trim())         return res.status(400).json({ error: 'El email es obligatorio' });
  if (!password)              return res.status(400).json({ error: 'La contrasena es obligatoria' });
  if (!date_of_birth)         return res.status(400).json({ error: 'La fecha de nacimiento es obligatoria' });

  const pwCheck = validatePassword(password);
  if (!pwCheck.valid) return res.status(400).json({ error: pwCheck.error });

  const age = calculateAge(date_of_birth);
  if (age === null) return res.status(400).json({ error: 'Fecha de nacimiento invalida' });
  if (age < 13)     return res.status(400).json({ error: 'Debes tener al menos 13 anos para registrarte en NOX' });

  const is_minor = age < 18;

  // Sanitize username: lowercase, only valid chars
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  if (cleanUsername.length < 3)  return res.status(400).json({ error: 'El usuario debe tener al menos 3 caracteres validos (letras, numeros, . _ -)' });

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (username, name, full_name, email, password, bio, interests, age, origin, date_of_birth, is_minor)
       VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, username, email, is_minor, full_name`,
      [
        cleanUsername,
        full_name.trim(),
        email.trim().toLowerCase(),
        hashedPassword,
        bio?.trim() || '',
        interests || [],
        age,
        origin?.trim() || '',
        date_of_birth,
        is_minor,
      ]
    );
    await trackEvent({ eventName: 'signup_completed', userId: result.rows[0].id, metadata: { is_minor } });
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Usuario o email ya existe' });
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// ─── Login ───────────────────────────────────────────────────────────────────
router.post('/login', loginLimiter, async (req, res) => {
  const body = sanitizeBody(req.body);
  const { email, password } = body;
  if (!email || !password) return res.status(400).json({ error: 'Faltan campos obligatorios' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciales invalidas' });

    const user = result.rows[0];

    if (user.banned) return res.status(403).json({ error: 'Cuenta suspendida. Contacta soporte@nox.app' });

    // Account lockout check
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const mins = Math.ceil((new Date(user.locked_until) - Date.now()) / 60000);
      return res.status(403).json({ error: `Cuenta bloqueada temporalmente. Intenta en ${mins} minuto(s).` });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      // Increment login_attempts
      const attempts = (user.login_attempts || 0) + 1;
      const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await pool.query(
        'UPDATE users SET login_attempts = $1, locked_until = $2 WHERE id = $3',
        [attempts, lockedUntil, user.id]
      ).catch(() => {});
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    // Reset attempts on success
    await pool.query('UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = $1', [user.id]).catch(() => {});

    const token = jwt.sign(
      { id: user.id, username: user.username || user.name, is_admin: !!user.is_admin, role: user.role || 'user', is_minor: !!user.is_minor },
      process.env.JWT_SECRET || 'noxsecret',
      { expiresIn: '7d' }
    );
    await trackEvent({ eventName: 'login_success', userId: user.id, metadata: { source: 'login_form' } });
    res.json({
      token,
      user: {
        id:         user.id,
        username:   user.username || user.name || user.email?.split('@')[0],
        full_name:  user.full_name || user.name || '',
        email:      user.email,
        avatar_url: user.avatar_url ?? null,
        is_minor:   !!user.is_minor,
        is_admin:   !!user.is_admin,
        nx_balance: user.nx_balance ?? 0,
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar sesion' });
  }
});

module.exports = router;
