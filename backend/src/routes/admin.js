// admin.js - Panel de administración básico
const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

// Middleware para admin: verifica JWT y campo is_admin
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Sin token' });
  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.is_admin) return res.status(403).json({ error: 'Solo admins' });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// Métricas generales
router.get('/metrics', requireAdmin, async (req, res) => {
  try {
    const users = await pool.query('SELECT COUNT(*) FROM users');
    const ideas = await pool.query('SELECT COUNT(*) FROM ideas');
    const comments = await pool.query('SELECT COUNT(*) FROM comments');
    res.json({
      users: parseInt(users.rows[0].count),
      ideas: parseInt(ideas.rows[0].count),
      comments: parseInt(comments.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar usuarios
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, is_admin, banned FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Banear usuario
router.post('/ban/:id', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('UPDATE users SET banned = true WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No existe usuario' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
