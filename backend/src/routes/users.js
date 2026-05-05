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
    const userRes = await pool.query('SELECT id, username, email, bio, interests, principios, age, origin, account_type, verified, is_private, thought_level, last_active_at, created_at FROM users WHERE id = $1', [req.params.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const user = userRes.rows[0];
    // Contadores
    const postsRes = await pool.query('SELECT COUNT(*) FROM ideas WHERE author_id = $1', [req.params.id]);
    const followersRes = await pool.query('SELECT COUNT(*) FROM followers WHERE user_id = $1', [req.params.id]);
    const followingRes = await pool.query('SELECT COUNT(*) FROM followers WHERE follower_id = $1', [req.params.id]);
    user.posts_count = parseInt(postsRes.rows[0].count);
    user.followers_count = parseInt(followersRes.rows[0].count);
    user.following_count = parseInt(followingRes.rows[0].count);

    // Cálculo de nivel de pensamiento (con forks y umbrales definidos)
    // Visionario: 5 forks recibidos
    // Arquitecto: 3 forks hechos
    // Constructor: 7 ideas originales
    // Explorador: 10 desafíos realizados

    // Forks hechos: posts donde user_id = usuario y parent_id no null
    const forksHechosRes = await pool.query('SELECT COUNT(*) FROM posts WHERE user_id = $1 AND parent_id IS NOT NULL', [req.params.id]);
    const forksHechos = parseInt(forksHechosRes.rows[0].count) || 0;
    // Forks recibidos: posts de otros usuarios donde parent_id IN (ids de posts originales del usuario)
    const postsIdsRes = await pool.query('SELECT id FROM posts WHERE user_id = $1', [req.params.id]);
    const postsIds = postsIdsRes.rows.map(r => r.id);
    let forksRecibidos = 0;
    if (postsIds.length > 0) {
      const forksRecibidosRes = await pool.query('SELECT COUNT(*) FROM posts WHERE parent_id = ANY($1)', [postsIds]);
      forksRecibidos = parseInt(forksRecibidosRes.rows[0].count) || 0;
    }
    // Ideas originales: posts donde parent_id IS NULL
    const ideasOriginalesRes = await pool.query('SELECT COUNT(*) FROM posts WHERE user_id = $1 AND parent_id IS NULL', [req.params.id]);
    const ideasOriginales = parseInt(ideasOriginalesRes.rows[0].count) || 0;
    // Desafíos realizados: suma de challenge_count en posts del usuario
    const challengeRes = await pool.query('SELECT SUM(challenge_count) FROM posts WHERE user_id = $1', [req.params.id]);
    const desafios = parseInt(challengeRes.rows[0].sum) || 0;

    let thought_level = 'Explorador';
    if (forksRecibidos >= 5) {
      thought_level = 'Visionario';
    } else if (forksHechos >= 3) {
      thought_level = 'Arquitecto';
    } else if (ideasOriginales >= 7) {
      thought_level = 'Constructor';
    } else if (desafios >= 10) {
      thought_level = 'Explorador';
    }
    user.thought_level = thought_level;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// Editar perfil de usuario (bio, intereses, edad, origen, tipo de cuenta)
router.put('/:id', async (req, res) => {
  const { bio, interests, principios, age, origin, account_type } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET bio = $1, interests = $2, principios = $3, age = $4, origin = $5, account_type = COALESCE($6, account_type) WHERE id = $7 RETURNING id, username, email, bio, interests, principios, age, origin, account_type, verified, created_at',
      [bio || '', interests || [], principios || [], age || null, origin || '', account_type, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al editar perfil' });
  }
});

// Listar todos los usuarios y marcar si el usuario autenticado los sigue
router.get('/', async (req, res) => {
  const follower_id = req.query.follower_id;
  try {
    let usersRes = await pool.query('SELECT id, username, email, last_active_at FROM users');
    let users = usersRes.rows;
    if (follower_id) {
      const followedRes = await pool.query('SELECT user_id FROM followers WHERE follower_id = $1', [follower_id]);
      const followedIds = followedRes.rows.map(r => r.user_id);
      users = users.map(u => ({ ...u, followed: followedIds.includes(u.id) }));
    }
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar usuarios' });
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
  if (new_password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  try {
    const result = await pool.query('SELECT id, password FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(current_password, user.password);
    if (!valid) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    const hashed = await bcrypt.hash(new_password, 10);
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
