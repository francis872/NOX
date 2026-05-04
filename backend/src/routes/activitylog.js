// activitylog.js - Endpoints para logs de actividad
const express = require('express');
const router = express.Router();
const { ActivityLog } = require('../models');

// Registrar actividad
router.post('/', async (req, res) => {
  try {
    const { user_id, action, data } = req.body;
    const log = await ActivityLog.create({ user_id, action, data });
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Obtener logs de un usuario
router.get('/:user_id', async (req, res) => {
  try {
    const logs = await ActivityLog.findAll({ where: { user_id: req.params.user_id }, order: [['created_at', 'DESC']] });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
