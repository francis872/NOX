// duels.js - Endpoints for idea duels (batallas de ideas)
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Create a duel between two ideas
router.post('/', async (req, res) => {
  try {
    const { idea1_id, idea2_id, challenger_id } = req.body;
    const idea1 = await pool.query('SELECT * FROM ideas WHERE id = $1', [idea1_id]);
    const idea2 = await pool.query('SELECT * FROM ideas WHERE id = $1', [idea2_id]);
    if (idea1.rows.length === 0 || idea2.rows.length === 0) return res.status(404).json({ error: 'Idea not found' });
    res.status(201).json({ duel: { idea1: idea1.rows[0], idea2: idea2.rows[0], challenger_id, status: 'pending' } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all duels
router.get('/', async (req, res) => {
  res.json([]);
});

module.exports = router;
