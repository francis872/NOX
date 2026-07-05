// comments.js - Endpoints para comentarios en ideas
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { recordEdge } = require('../utils/graph');

// Crear comentario
router.post('/', async (req, res) => {
  try {
    const { idea_id, user_id, content } = req.body;
    const result = await pool.query(
      'INSERT INTO comments (idea_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [idea_id, user_id, content]
    );
    const idea = await pool.query('SELECT author_id, premise FROM ideas WHERE id = $1', [idea_id]);
    const actor = await pool.query('SELECT username FROM users WHERE id = $1', [user_id]);
    if (idea.rows.length && String(idea.rows[0].author_id) !== String(user_id)) {
      await pool.query(
        'INSERT INTO notifications (user_id, type, message) VALUES ($1,$2,$3)',
        [idea.rows[0].author_id, 'comment', `${actor.rows[0]?.username || 'Alguien'} comentó tu publicación`]
      );
    }
    await recordEdge(
      { type: 'user', entityId: user_id, label: actor.rows[0]?.username || '' },
      { type: 'idea', entityId: idea_id, label: (idea.rows[0]?.premise || '').slice(0, 60) },
      'commented',
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Obtener comentarios de una idea
router.get('/idea/:idea_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM comments WHERE idea_id = $1 ORDER BY created_at ASC',
      [req.params.idea_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
