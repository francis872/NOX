const express = require('express');
const router = express.Router();
const pool = require('../../db');

// Obtener palabras filtradas de un usuario
router.get('/:user_id', async (req, res) => {
  try {
    const words = await pool.query('SELECT id, word FROM filtered_words WHERE user_id = $1', [req.params.user_id]);
    res.json(words.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener palabras filtradas' });
  }
});

// Agregar palabra filtrada
router.post('/:user_id', async (req, res) => {
  const { word } = req.body;
  try {
    await pool.query('INSERT INTO filtered_words (user_id, word) VALUES ($1, $2)', [req.params.user_id, word]);
    res.json({ message: 'Palabra filtrada agregada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al agregar palabra filtrada' });
  }
});

// Eliminar palabra filtrada
router.delete('/:user_id/:word_id', async (req, res) => {
  try {
    await pool.query('DELETE FROM filtered_words WHERE user_id = $1 AND id = $2', [req.params.user_id, req.params.word_id]);
    res.json({ message: 'Palabra filtrada eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar palabra filtrada' });
  }
});

module.exports = router;
