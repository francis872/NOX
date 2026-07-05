// spaces.js — Espacios creativos por usuario
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/spaces?user_id=X
router.get('/', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id requerido' });
  try {
    const result = await pool.query(
      'SELECT * FROM spaces WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/spaces
router.post('/', async (req, res) => {
  const { user_id, title, description, accent } = req.body;
  if (!user_id || !title) return res.status(400).json({ error: 'user_id y title requeridos' });
  try {
    const result = await pool.query(
      'INSERT INTO spaces (user_id, title, description, accent) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, title.trim().slice(0, 128), description || '', accent || '#7f5af0']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/spaces/:id
router.delete('/:id', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id requerido' });
  try {
    await pool.query(
      'DELETE FROM spaces WHERE id = $1 AND user_id = $2',
      [req.params.id, user_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
