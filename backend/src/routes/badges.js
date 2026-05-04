// badges.js - Endpoints para badges/logros
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Obtener badges de un usuario
router.get('/:user_id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM badges WHERE user_id = $1', [req.params.user_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Asignar badge a usuario
router.post('/', async (req, res) => {
  try {
    const { user_id, name, description, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO badges (user_id, name, description, icon) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, name, description, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
