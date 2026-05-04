const express = require('express');
const router = express.Router();
const pool = require('../../db');

// Obtener silenciados de un usuario
router.get('/:user_id', async (req, res) => {
  try {
    const sil = await pool.query('SELECT s.id, s.silenced_id, u.username FROM silenced s JOIN users u ON s.silenced_id = u.id WHERE s.user_id = $1', [req.params.user_id]);
    res.json(sil.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener silenciados' });
  }
});

// Agregar silenciado
router.post('/:user_id', async (req, res) => {
  const { silenced_id } = req.body;
  try {
    await pool.query('INSERT INTO silenced (user_id, silenced_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.params.user_id, silenced_id]);
    res.json({ message: 'Usuario silenciado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al silenciar usuario' });
  }
});

// Eliminar silenciado
router.delete('/:user_id/:silenced_id', async (req, res) => {
  try {
    await pool.query('DELETE FROM silenced WHERE user_id = $1 AND silenced_id = $2', [req.params.user_id, req.params.silenced_id]);
    res.json({ message: 'Silenciado eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar silenciado' });
  }
});

module.exports = router;
