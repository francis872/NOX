const express = require('express');
const router = express.Router();
const pool = require('../../db');

// Obtener suscripciones de un usuario
router.get('/:user_id', async (req, res) => {
  try {
    const subs = await pool.query('SELECT id, channel FROM subscriptions WHERE user_id = $1', [req.params.user_id]);
    res.json(subs.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener suscripciones' });
  }
});

// Agregar suscripción
router.post('/:user_id', async (req, res) => {
  const { channel } = req.body;
  try {
    await pool.query('INSERT INTO subscriptions (user_id, channel) VALUES ($1, $2)', [req.params.user_id, channel]);
    res.json({ message: 'Suscripción agregada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al agregar suscripción' });
  }
});

// Eliminar suscripción
router.delete('/:user_id/:sub_id', async (req, res) => {
  try {
    await pool.query('DELETE FROM subscriptions WHERE user_id = $1 AND id = $2', [req.params.user_id, req.params.sub_id]);
    res.json({ message: 'Suscripción eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar suscripción' });
  }
});

module.exports = router;
