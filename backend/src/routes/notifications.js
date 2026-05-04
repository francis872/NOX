// notifications.js - Endpoints para notificaciones
const express = require('express');
const router = express.Router();
const { Notification } = require('../models');

// Obtener notificaciones de un usuario
router.get('/:user_id', async (req, res) => {
  try {
    const notifications = await Notification.findAll({ where: { user_id: req.params.user_id }, order: [['created_at', 'DESC']] });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Marcar notificación como leída
router.post('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return res.status(404).json({ error: 'Notificación no encontrada' });
    notification.read = true;
    await notification.save();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
