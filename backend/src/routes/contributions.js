// contributions.js - Endpoints for idea contributions (fork, edit, review)
const express = require('express');
const router = express.Router();
const { IdeaContribution } = require('../models');

// Create a contribution (fork, edit, review)
router.post('/', async (req, res) => {
  try {
    const { idea_id, user_id, contribution_type, weight } = req.body;
    const contribution = await IdeaContribution.create({ idea_id, user_id, contribution_type, weight });
    res.status(201).json(contribution);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all contributions for an idea
router.get('/idea/:idea_id', async (req, res) => {
  try {
    const contributions = await IdeaContribution.findAll({ where: { idea_id: req.params.idea_id } });
    res.json(contributions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all contributions by a user
router.get('/user/:user_id', async (req, res) => {
  try {
    const contributions = await IdeaContribution.findAll({ where: { user_id: req.params.user_id } });
    res.json(contributions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
