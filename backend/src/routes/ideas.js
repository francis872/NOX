// ideas.js - Endpoints for structured ideas (CRUD, versioning, fork, feed)
const express = require('express');
const router = express.Router();
const { Idea } = require('../models');

// Create new structured idea
router.post('/', async (req, res) => {
  try {
    const { author_id, premise, argument, evidence, conclusion, counterargument, parent_id } = req.body;
    // Versioning: if parent_id, increment version, else version = 1
    let version = 1;
    if (parent_id) {
      const parent = await Idea.findByPk(parent_id);
      version = parent ? parent.version + 1 : 1;
    }
    const idea = await Idea.create({
      author_id, premise, argument, evidence, conclusion, counterargument, parent_id, version
    });
    res.status(201).json(idea);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all ideas (feed, excluding own ideas if user_id provided)
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;
    let where = {};
    if (user_id) {
      where.author_id = { $ne: user_id };
    }
    const ideas = await Idea.findAll({ where, order: [['created_at', 'DESC']] });
    res.json(ideas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get idea by id (with version history)
router.get('/:id', async (req, res) => {
  try {
    const idea = await Idea.findByPk(req.params.id);
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    // Get all versions (forks/children)
    const versions = await Idea.findAll({ where: { parent_id: idea.id } });
    res.json({ idea, versions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fork/version an idea
router.post('/:id/fork', async (req, res) => {
  try {
    const parent = await Idea.findByPk(req.params.id);
    if (!parent) return res.status(404).json({ error: 'Parent idea not found' });
    const { author_id, premise, argument, evidence, conclusion, counterargument } = req.body;
    const version = parent.version + 1;
    const forked = await Idea.create({
      author_id, premise, argument, evidence, conclusion, counterargument, parent_id: parent.id, version
    });
    res.status(201).json(forked);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update idea (edit)
router.put('/:id', async (req, res) => {
  try {
    const idea = await Idea.findByPk(req.params.id);
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    await idea.update(req.body);
    res.json(idea);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete idea
router.delete('/:id', async (req, res) => {
  try {
    const idea = await Idea.findByPk(req.params.id);
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    await idea.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
