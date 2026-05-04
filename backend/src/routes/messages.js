// messages.js - Endpoints for direct messages between users
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Send a message
router.post('/', async (req, res) => {
  try {
    const { sender_id, receiver_id, content } = req.body;
    const result = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *',
      [sender_id, receiver_id, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all messages between two users
router.get('/:user1_id/:user2_id', async (req, res) => {
  try {
    const { user1_id, user2_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM messages WHERE (sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1) ORDER BY created_at ASC',
      [user1_id, user2_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
