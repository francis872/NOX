// activitylog.js - Endpoints para logs de actividad
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Registrar actividad
router.post('/', async (req, res) => {
  try {
    const { user_id, action, data } = req.body;
    const result = await pool.query(
      'INSERT INTO activity_logs (user_id, action, data) VALUES ($1, $2, $3) RETURNING *',
      [user_id, action, data ? JSON.stringify(data) : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Obtener logs de un usuario
router.get('/:user_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM activity_logs WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
