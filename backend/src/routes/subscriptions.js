// subscriptions.js - Suscripciones de usuarios a canales
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Obtener suscripciones de un usuario
router.get('/:user_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Añadir suscripción
router.post('/:user_id', async (req, res) => {
  try {
    const { channel } = req.body;
    const result = await pool.query(
      'INSERT INTO subscriptions (user_id, channel) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
      [req.params.user_id, channel]
    );
    res.status(201).json(result.rows[0] || {});
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar suscripción
router.delete('/:user_id/:sub_id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM subscriptions WHERE id = $1 AND user_id = $2',
      [req.params.sub_id, req.params.user_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
