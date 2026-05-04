const express = require('express');
const router = express.Router();
const pool = require('../../db');

// Obtener preferencias de un usuario
router.get('/:user_id', async (req, res) => {
  try {
    const prefs = await pool.query('SELECT id, preference FROM preferences WHERE user_id = $1', [req.params.user_id]);
    res.json(prefs.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener preferencias' });
  }
});

// Agregar preferencia
router.post('/:user_id', async (req, res) => {
  const { preference } = req.body;
  try {
    await pool.query('INSERT INTO preferences (user_id, preference) VALUES ($1, $2)', [req.params.user_id, preference]);
    res.json({ message: 'Preferencia agregada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al agregar preferencia' });
  }
});

// Eliminar preferencia
router.delete('/:user_id/:pref_id', async (req, res) => {
  try {
    await pool.query('DELETE FROM preferences WHERE user_id = $1 AND id = $2', [req.params.user_id, req.params.pref_id]);
    res.json({ message: 'Preferencia eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar preferencia' });
  }
});

module.exports = router;
