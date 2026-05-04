const express = require('express');
const router = express.Router();
const pool = require('../../db');

// Obtener bloqueos de un usuario
router.get('/:user_id', async (req, res) => {
  try {
    const blocks = await pool.query('SELECT b.id, b.blocked_id, u.username FROM blocks b JOIN users u ON b.blocked_id = u.id WHERE b.user_id = $1', [req.params.user_id]);
    res.json(blocks.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener bloqueos' });
  }
});

// Agregar bloqueo
router.post('/:user_id', async (req, res) => {
  const { blocked_id } = req.body;
  try {
    await pool.query('INSERT INTO blocks (user_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.params.user_id, blocked_id]);
    res.json({ message: 'Usuario bloqueado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al bloquear usuario' });
  }
});

// Eliminar bloqueo
router.delete('/:user_id/:blocked_id', async (req, res) => {
  try {
    await pool.query('DELETE FROM blocks WHERE user_id = $1 AND blocked_id = $2', [req.params.user_id, req.params.blocked_id]);
    res.json({ message: 'Bloqueo eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar bloqueo' });
  }
});

module.exports = router;
