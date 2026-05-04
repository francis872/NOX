// ideas.js - Endpoints for structured ideas (CRUD, versioning, fork, feed)
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Create new structured idea
router.post('/', async (req, res) => {
  try {
    const { author_id, premise, argument, evidence, conclusion, counterargument, parent_id } = req.body;
    let version = 1;
    if (parent_id) {
      const parent = await pool.query('SELECT version FROM ideas WHERE id = $1', [parent_id]);
      version = parent.rows.length ? parent.rows[0].version + 1 : 1;
    }
    const result = await pool.query(
      'INSERT INTO ideas (author_id, premise, argument, evidence, conclusion, counterargument, parent_id, version) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [author_id, premise, argument, evidence, conclusion, counterargument || null, parent_id || null, version]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all ideas (feed, excluding own ideas if user_id provided)
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;
    let result;
    if (user_id) {
      result = await pool.query('SELECT * FROM ideas WHERE author_id != $1 ORDER BY created_at DESC', [user_id]);
    } else {
      result = await pool.query('SELECT * FROM ideas ORDER BY created_at DESC');
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get idea by id (with version history)
router.get('/:id', async (req, res) => {
  try {
    const idea = await pool.query('SELECT * FROM ideas WHERE id = $1', [req.params.id]);
    if (idea.rows.length === 0) return res.status(404).json({ error: 'Idea not found' });
    const versions = await pool.query('SELECT * FROM ideas WHERE parent_id = $1', [req.params.id]);
    res.json({ idea: idea.rows[0], versions: versions.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fork/version an idea
router.post('/:id/fork', async (req, res) => {
  try {
    const parent = await pool.query('SELECT * FROM ideas WHERE id = $1', [req.params.id]);
    if (parent.rows.length === 0) return res.status(404).json({ error: 'Parent idea not found' });
    const { author_id, premise, argument, evidence, conclusion, counterargument } = req.body;
    const version = parent.rows[0].version + 1;
    const result = await pool.query(
      'INSERT INTO ideas (author_id, premise, argument, evidence, conclusion, counterargument, parent_id, version) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [author_id, premise, argument, evidence, conclusion, counterargument || null, req.params.id, version]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// React to an idea (ignite, expand, challenge) - cannot react to own idea
router.post('/:id/react', async (req, res) => {
  try {
    const { user_id, reaction } = req.body;
    const idea = await pool.query('SELECT author_id FROM ideas WHERE id = $1', [req.params.id]);
    if (idea.rows.length === 0) return res.status(404).json({ error: 'Idea not found' });
    if (idea.rows[0].author_id == user_id) return res.status(403).json({ error: 'No puedes reaccionar a tu propia idea' });
    const col = reaction === 'ignite' ? 'ignite_count' : reaction === 'expand' ? 'expand_count' : 'challenge_count';
    await pool.query(`UPDATE ideas SET ${col} = COALESCE(${col}, 0) + 1 WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update idea
router.put('/:id', async (req, res) => {
  try {
    const { premise, argument, evidence, conclusion, counterargument } = req.body;
    const result = await pool.query(
      'UPDATE ideas SET premise=$1, argument=$2, evidence=$3, conclusion=$4, counterargument=$5 WHERE id=$6 RETURNING *',
      [premise, argument, evidence, conclusion, counterargument || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Idea not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete idea
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM ideas WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Idea not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
