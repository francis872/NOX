const express = require('express');
const router = express.Router();
const db = require('../db');

// Accessibility
router.get('/accessibility/:userId', async (req, res) => {
  const { userId } = req.params;
  const result = await db.query('SELECT * FROM accessibility WHERE user_id = $1', [userId]);
  res.json(result.rows[0] || {});
});

router.post('/accessibility', async (req, res) => {
  const { user_id, mode } = req.body;
  const result = await db.query('INSERT INTO accessibility (user_id, mode) VALUES ($1, $2) RETURNING *', [user_id, mode]);
  res.json(result.rows[0]);
});

router.put('/accessibility/:userId', async (req, res) => {
  const { userId } = req.params;
  const { mode } = req.body;
  const result = await db.query('UPDATE accessibility SET mode = $1 WHERE user_id = $2 RETURNING *', [mode, userId]);
  res.json(result.rows[0]);
});

// Language
router.get('/language/:userId', async (req, res) => {
  const { userId } = req.params;
  const result = await db.query('SELECT * FROM languages WHERE user_id = $1', [userId]);
  res.json(result.rows[0] || {});
});

router.post('/language', async (req, res) => {
  const { user_id, language } = req.body;
  const result = await db.query('INSERT INTO languages (user_id, language) VALUES ($1, $2) RETURNING *', [user_id, language]);
  res.json(result.rows[0]);
});

router.put('/language/:userId', async (req, res) => {
  const { userId } = req.params;
  const { language } = req.body;
  const result = await db.query('UPDATE languages SET language = $1 WHERE user_id = $2 RETURNING *', [language, userId]);
  res.json(result.rows[0]);
});

// Data Usage
router.get('/data-usage/:userId', async (req, res) => {
  const { userId } = req.params;
  const result = await db.query('SELECT * FROM data_usage WHERE user_id = $1', [userId]);
  res.json(result.rows[0] || {});
});

router.post('/data-usage', async (req, res) => {
  const { user_id, quality } = req.body;
  const result = await db.query('INSERT INTO data_usage (user_id, quality) VALUES ($1, $2) RETURNING *', [user_id, quality]);
  res.json(result.rows[0]);
});

router.put('/data-usage/:userId', async (req, res) => {
  const { userId } = req.params;
  const { quality } = req.body;
  const result = await db.query('UPDATE data_usage SET quality = $1 WHERE user_id = $2 RETURNING *', [quality, userId]);
  res.json(result.rows[0]);
});

// Permissions
router.get('/permissions/:userId', async (req, res) => {
  const { userId } = req.params;
  const result = await db.query('SELECT * FROM permissions WHERE user_id = $1', [userId]);
  res.json(result.rows);
});

router.post('/permissions', async (req, res) => {
  const { user_id, permission } = req.body;
  const result = await db.query('INSERT INTO permissions (user_id, permission) VALUES ($1, $2) RETURNING *', [user_id, permission]);
  res.json(result.rows[0]);
});

router.delete('/permissions/:id', async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM permissions WHERE id = $1', [id]);
  res.json({ success: true });
});

module.exports = router;
