// explore.js - Endpoint para explorar usuarios
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Explorar usuarios
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.*, (SELECT COUNT(*) FROM followers WHERE user_id = u.id)::int AS followers_count
       FROM users u ORDER BY followers_count DESC, id ASC LIMIT 60`
    );
    const rows = result.rows.map(u => ({
      id:              u.id,
      username:        u.username || u.name || u.email?.split('@')[0] || `user_${u.id}`,
      bio:             u.bio             || '',
      thought_level:   u.thought_level   || 'Explorador',
      avatar_url:      u.avatar_url      || null,
      followers_count: u.followers_count || 0,
    }));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
