const express = require('express');
const router = express.Router();
const pool = require('../../db');

// Obtener favoritos de un usuario
router.get('/:user_id', async (req, res) => {
  try {
    const favs = await pool.query('SELECT f.id, f.post_id, p.content FROM favorites f JOIN posts p ON f.post_id = p.id WHERE f.user_id = $1', [req.params.user_id]);
    res.json(favs.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener favoritos' });
  }
});

// Agregar favorito
router.post('/:user_id', async (req, res) => {
  const { post_id } = req.body;
  try {
    await pool.query('INSERT INTO favorites (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.params.user_id, post_id]);
    res.json({ message: 'Favorito agregado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al agregar favorito' });
  }
});

// Eliminar favorito
router.delete('/:user_id/:post_id', async (req, res) => {
  try {
    await pool.query('DELETE FROM favorites WHERE user_id = $1 AND post_id = $2', [req.params.user_id, req.params.post_id]);
    res.json({ message: 'Favorito eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar favorito' });
  }
});

module.exports = router;
