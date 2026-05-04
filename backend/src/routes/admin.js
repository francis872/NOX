// admin.js - Panel de administración básico
const express = require('express');
const router = express.Router();
const { User, Idea, Comment, ActivityLog } = require('../models');

// Middleware simple para admin (requiere user.is_admin)
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) return res.status(403).json({ error: 'Solo admins' });
  next();
}

// Métricas generales
router.get('/metrics', requireAdmin, async (req, res) => {
  const users = await User.count();
  const ideas = await Idea.count();
  const comments = await Comment.count();
  const logs = await ActivityLog.count();
  res.json({ users, ideas, comments, logs });
});

// Listar usuarios
router.get('/users', requireAdmin, async (req, res) => {
  const users = await User.findAll({ attributes: ['id', 'username', 'email', 'is_admin'] });
  res.json(users);
});

// Banear usuario
router.post('/ban/:id', requireAdmin, async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'No existe usuario' });
  user.banned = true;
  await user.save();
  res.json({ success: true });
});

module.exports = router;
