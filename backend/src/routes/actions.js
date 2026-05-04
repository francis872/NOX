// actions.js - Micro-posts (tweet-like short posts)
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Ensure table exists
const initTable = pool.query(`
  CREATE TABLE IF NOT EXISTS actions (
    id        SERIAL PRIMARY KEY,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content   VARCHAR(280) NOT NULL,
    like_count INTEGER DEFAULT 0,
    repost_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(() => {});

// GET all actions (feed)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.username
       FROM actions a
       JOIN users u ON a.author_id = u.id
       ORDER BY a.created_at DESC
       LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET actions by user
router.get('/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.username FROM actions a
       JOIN users u ON a.author_id = u.id
       WHERE a.author_id = $1 ORDER BY a.created_at DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create action
router.post('/', async (req, res) => {
  try {
    const { author_id, content } = req.body;
    if (!author_id || !content) return res.status(400).json({ error: 'author_id y content son requeridos' });
    if (content.length > 280) return res.status(400).json({ error: 'Máximo 280 caracteres' });
    const result = await pool.query(
      `INSERT INTO actions (author_id, content) VALUES ($1, $2) RETURNING *`,
      [author_id, content.trim()]
    );
    // Return with username for immediate display
    const row = result.rows[0];
    const user = await pool.query('SELECT username FROM users WHERE id = $1', [author_id]);
    res.status(201).json({ ...row, username: user.rows[0]?.username || '' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST like an action
router.post('/:id/like', async (req, res) => {
  try {
    await pool.query('UPDATE actions SET like_count = like_count + 1 WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST repost
router.post('/:id/repost', async (req, res) => {
  try {
    await pool.query('UPDATE actions SET repost_count = repost_count + 1 WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE action (own posts only)
router.delete('/:id', async (req, res) => {
  try {
    const { author_id } = req.body;
    const check = await pool.query('SELECT author_id FROM actions WHERE id = $1', [req.params.id]);
    if (!check.rows.length) return res.status(404).json({ error: 'No encontrado' });
    if (author_id && check.rows[0].author_id != author_id) return res.status(403).json({ error: 'No autorizado' });
    await pool.query('DELETE FROM actions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
