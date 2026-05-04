// duels.js - Endpoints for idea duels (batallas de ideas)
const express = require('express');
const router = express.Router();
const { Idea, User } = require('../models');

// Create a duel between two ideas
router.post('/', async (req, res) => {
  try {
    const { idea1_id, idea2_id, challenger_id } = req.body;
    // For now, just return the two ideas and challenger
    const idea1 = await Idea.findByPk(idea1_id);
    const idea2 = await Idea.findByPk(idea2_id);
    if (!idea1 || !idea2) return res.status(404).json({ error: 'Idea not found' });
    res.status(201).json({ duel: { idea1, idea2, challenger_id, status: 'pending' } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all duels (stub, to be implemented with duel model)
router.get('/', async (req, res) => {
  res.json([]); // Placeholder
});

module.exports = router;
