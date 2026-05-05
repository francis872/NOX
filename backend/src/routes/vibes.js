// vibes.js - Vibes route (ephemeral 24h stories)
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { trackEvent } = require('../utils/analytics');

// Get all active vibes (not expired) — also deletes expired ones
router.get('/', async (req, res) => {
  try {
    // Auto-cleanup expired vibes
    await pool.query('DELETE FROM vibes WHERE expires_at <= NOW()');
    const result = await pool.query(
      `SELECT v.*, u.username FROM vibes v
       JOIN users u ON v.author_id = u.id
       WHERE v.expires_at > NOW()
       ORDER BY v.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get vibes for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM vibes WHERE author_id = $1 AND expires_at > NOW() ORDER BY created_at DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a vibe
router.post('/', async (req, res) => {
  try {
    const { author_id, media_type, media_data, caption } = req.body;
    if (!author_id) return res.status(400).json({ error: 'author_id required' });
    // Limit media_data to ~2MB base64
    if (media_data && media_data.length > 2_800_000) {
      return res.status(400).json({ error: 'Archivo demasiado grande (máx ~2MB)' });
    }
    const result = await pool.query(
      `INSERT INTO vibes (author_id, media_type, media_data, caption)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [author_id, media_type || 'text', media_data || null, caption || null]
    );
    await trackEvent({
      eventName: 'vibe_created',
      userId: author_id,
      metadata: { vibe_id: result.rows[0].id, media_type: media_type || 'text' },
    });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a vibe
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM vibes WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
