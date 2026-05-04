// comments.js - Endpoints para comentarios en ideas
const express = require('express');
const router = express.Router();
const { Comment } = require('../models');

// Crear comentario
router.post('/', async (req, res) => {
  try {
    const { idea_id, user_id, content } = req.body;
    const comment = await Comment.create({ idea_id, user_id, content });
    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Obtener comentarios de una idea
router.get('/idea/:idea_id', async (req, res) => {
  try {
    const comments = await Comment.findAll({ where: { idea_id: req.params.idea_id }, order: [['created_at', 'ASC']] });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
