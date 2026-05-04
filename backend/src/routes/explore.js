// explore.js - Endpoint para explorar usuarios
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Explorar usuarios
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, bio, thought_level FROM users ORDER BY username ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
