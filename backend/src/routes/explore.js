// explore.js - Endpoint para explorar usuarios
const express = require('express');
const router = express.Router();
const { User } = require('../models');

// Explorar usuarios (búsqueda simple)
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'username', 'bio', 'thought_level'] });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
