// badges.js - Endpoints para badges/logros
const express = require('express');
const router = express.Router();
const { Badge } = require('../models');

// Obtener badges de un usuario
router.get('/:user_id', async (req, res) => {
  try {
    const badges = await Badge.findAll({ where: { user_id: req.params.user_id } });
    res.json(badges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Asignar badge a usuario
router.post('/', async (req, res) => {
  try {
    const { user_id, name, description, icon } = req.body;
    const badge = await Badge.create({ user_id, name, description, icon });
    res.status(201).json(badge);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
