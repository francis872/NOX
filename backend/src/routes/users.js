const express = require('express');
const router = express.Router();
const pool = require('../db');

// Heartbeat para presencia en tiempo real.
router.post('/heartbeat', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'Falta user_id' });
  try {
    await pool.query('UPDATE users SET last_active_at = NOW() WHERE id = $1', [user_id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar presencia' });
  }
});

// Presencia por lista de IDs.
router.get('/presence', async (req, res) => {
  const idsRaw = req.query.ids;
  if (!idsRaw) return res.json([]);
  const ids = String(idsRaw)
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!ids.length) return res.json([]);

  try {
    const result = await pool.query(
      `SELECT id, username, last_active_at,
              (last_active_at >= NOW() - INTERVAL '2 minutes') AS online
       FROM users
       WHERE id = ANY($1)`,
      [ids]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener presencia' });
  }
});

// Obtener publicaciones (ideas) de un usuario
router.get('/:id/posts', async (req, res) => {
  const viewerId = req.query.viewer_id;
  try {
    // Check if account is private
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE');
    const privRes = await pool.query('SELECT is_private FROM users WHERE id = $1', [req.params.id]);
    if (privRes.rows.length > 0 && privRes.rows[0].is_private) {
      // Check if viewer follows this account
      if (!viewerId || String(viewerId) === String(req.params.id)) {
        // Owner can always see their own posts
        if (!viewerId || String(viewerId) !== String(req.params.id)) {
          return res.json([]);
        }
      } else {
        const followRes = await pool.query('SELECT 1 FROM followers WHERE follower_id = $1 AND user_id = $2', [viewerId, req.params.id]);
        if (followRes.rows.length === 0) return res.json([]);
      }
    }
    const postsRes = await pool.query(
      'SELECT id, premise, argument, evidence, conclusion, counterargument, media_url, ignite_count, expand_count, challenge_count, created_at FROM ideas WHERE author_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(postsRes.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener publicaciones' });
  }
});

// Obtener perfil de usuario con contadores
router.get('/:id', async (req, res) => {
  try {
    const userRes = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [req.params.id]
    );
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    const raw  = userRes.rows[0];
    const user = {
      ...raw,
      username:      raw.username || raw.name || raw.email?.split('@')[0] || `user_${raw.id}`,
      bio:           raw.bio           || '',
      interests:     raw.interests     || [],
      principios:    raw.principios    || [],
      age:           raw.age           ?? null,
      origin:        raw.origin        || '',
      account_type:  raw.account_type  || 'free',
      verified:      raw.verified      ?? false,
      is_private:    raw.is_private    ?? false,
      thought_level: raw.thought_level || 'Explorador',
      avatar_url:    raw.avatar_url    ?? null,
      banner:        raw.banner        || '',
      nx_balance:    raw.nx_balance    ?? 0,
    };
    delete user.password;
    // Contadores
    const postsRes = await pool.query('SELECT COUNT(*) FROM ideas WHERE author_id = $1', [req.params.id]);
    const followersRes = await pool.query('SELECT COUNT(*) FROM followers WHERE user_id = $1', [req.params.id]);
    const followingRes = await pool.query('SELECT COUNT(*) FROM followers WHERE follower_id = $1', [req.params.id]);
    user.posts_count = parseInt(postsRes.rows[0].count);
    user.followers_count = parseInt(followersRes.rows[0].count);
    user.following_count = parseInt(followingRes.rows[0].count);

    // Thought level — calculated from ideas table
    try {
      const forkedIdeas = await pool.query('SELECT COUNT(*) FROM ideas WHERE author_id = $1 AND parent_id IS NOT NULL', [req.params.id]);
      const origIdeas   = await pool.query('SELECT COUNT(*) FROM ideas WHERE author_id = $1 AND parent_id IS NULL', [req.params.id]);
      const forks   = parseInt(forkedIdeas.rows[0].count) || 0;
      const originals = parseInt(origIdeas.rows[0].count) || 0;
      if (forks >= 3)       user.thought_level = 'Arquitecto';
      else if (originals >= 7) user.thought_level = 'Constructor';
      else                  user.thought_level = user.thought_level || 'Explorador';
    } catch { /* skip thought_level calculation if it fails */ }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// Ganar NX tokens
router.post('/:id/earn-nx', async (req, res) => {
  const amount = Math.min(Math.max(parseInt(req.body.amount) || 10, 1), 500);
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS nx_balance INTEGER DEFAULT 0');
    const result = await pool.query(
      'UPDATE users SET nx_balance = COALESCE(nx_balance, 0) + $1 WHERE id = $2 RETURNING COALESCE(nx_balance, 0) AS nx_balance',
      [amount, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ nx_balance: result.rows[0].nx_balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar perfil de usuario (bio, intereses, edad, origen, tipo de cuenta, avatar, banner, full_name)
router.put('/:id', async (req, res) => {
  const { bio, interests, principios, age, origin, account_type, avatar_url, banner, full_name } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET 
        bio = COALESCE($1, bio), 
        interests = COALESCE($2, interests), 
        principios = COALESCE($3, principios), 
        age = COALESCE($4, age), 
        origin = COALESCE($5, origin), 
        account_type = COALESCE($6, account_type), 
        avatar_url = COALESCE($7, avatar_url), 
        banner = COALESCE($8, banner),
        full_name = COALESCE($9, full_name)
       WHERE id = $10 
       RETURNING id, username, email, full_name, bio, interests, principios, age, origin, account_type, avatar_url, banner, verified, created_at, is_private, is_minor`,
      [bio, interests, principios, age, origin, account_type, avatar_url, banner, full_name, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al editar perfil' });
  }
});

// Listar todos los usuarios
router.get('/', async (req, res) => {
  const follower_id = req.query.follower_id;
  try {
    const usersRes = await pool.query(
      `SELECT u.*,
              (SELECT COUNT(*) FROM followers f WHERE f.user_id = u.id)::int AS followers_count
       FROM users u ORDER BY id ASC`
    );
    let users = usersRes.rows.map(u => ({
      id:              u.id,
      username:        u.username || u.name || u.email?.split('@')[0] || `user_${u.id}`,
      email:           u.email,
      avatar_url:      u.avatar_url      ?? null,
      is_private:      u.is_private      ?? false,
      last_active_at:  u.last_active_at  ?? null,
      followers_count: u.followers_count || 0,
    }));
    if (follower_id) {
      const followedRes = await pool.query('SELECT user_id FROM followers WHERE follower_id = $1', [follower_id]);
      const followedIds = new Set(followedRes.rows.map(r => r.user_id));
      users = users.map(u => ({ ...u, followed: followedIds.has(u.id) }));
    }
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle account privacy (public / private)
router.patch('/:id/privacy', async (req, res) => {
  const { is_private } = req.body;
  try {
    // Auto-create column if missing (first call)
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE');
    const result = await pool.query(
      'UPDATE users SET is_private = $1 WHERE id = $2 RETURNING id, is_private',
      [!!is_private, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar privacidad' });
  }
});

// Get account settings (privacy + preferences)
router.get('/:id/settings', async (req, res) => {
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE');
    const result = await pool.query('SELECT id, is_private FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener ajustes' });
  }
});

// Change password
router.patch('/:id/password', async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: 'Faltan datos' });
  if (new_password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  if (!/[A-Z]/.test(new_password)) return res.status(400).json({ error: 'La contraseña debe contener mayúsculas' });
  if (!/[0-9]/.test(new_password)) return res.status(400).json({ error: 'La contraseña debe contener números' });
  try {
    const result = await pool.query('SELECT id, password FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(current_password, user.password);
    if (!valid) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    const hashed = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
});

// Update account_type (normal / creator / business)
router.patch('/:id/account-type', async (req, res) => {
  const { account_type } = req.body;
  const valid = ['normal', 'creator', 'business'];
  if (!valid.includes(account_type)) return res.status(400).json({ error: 'Tipo invalido' });
  try {
    const result = await pool.query('UPDATE users SET account_type = $1 WHERE id = $2 RETURNING id, account_type', [account_type, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar tipo' });
  }
});

module.exports = router;
