// contributions.js - Endpoints for idea contributions (fork, edit, review)
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Create a contribution (fork, edit, review)
router.post('/', async (req, res) => {
  try {
    const { idea_id, user_id, contribution_type, weight } = req.body;
    const result = await pool.query(
      'INSERT INTO contributions (idea_id, user_id, contribution_type, weight) VALUES ($1, $2, $3, $4) RETURNING *',
      [idea_id, user_id, contribution_type, weight || 1]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all contributions for an idea
router.get('/idea/:idea_id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contributions WHERE idea_id = $1', [req.params.idea_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all contributions by a user
router.get('/user/:user_id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contributions WHERE user_id = $1', [req.params.user_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
