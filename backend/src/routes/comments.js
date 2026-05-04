// comments.js - Endpoints para comentarios en ideas
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Crear comentario
router.post('/', async (req, res) => {
  try {
    const { idea_id, user_id, content } = req.body;
    const result = await pool.query(
      'INSERT INTO comments (idea_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [idea_id, user_id, content]
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
