// notifications.js - Endpoints para notificaciones
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Obtener notificaciones de un usuario
router.get('/:user_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear notificación
router.post('/', async (req, res) => {
  try {
    const { user_id, type, message } = req.body;
    const result = await pool.query(
      'INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3) RETURNING *',
      [user_id, type, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Marcar notificación como leída
router.post('/:id/read', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE notifications SET read = true WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Notificación no encontrada' });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
