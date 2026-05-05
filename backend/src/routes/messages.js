// messages.js - Endpoints for direct messages between users
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { trackEvent } = require('../utils/analytics');

// Send a message
router.post('/', async (req, res) => {
  try {
    const { sender_id, receiver_id, content } = req.body;
    const result = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, content, delivered_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [sender_id, receiver_id, content]
    );
    await pool.query('UPDATE users SET last_active_at = NOW() WHERE id = $1', [sender_id]);
    const actor = await pool.query('SELECT username FROM users WHERE id = $1', [sender_id]);
    await pool.query(
      'INSERT INTO notifications (user_id, type, message) VALUES ($1,$2,$3)',
      [receiver_id, 'message', `Nuevo mensaje de ${actor.rows[0]?.username || 'usuario'}`]
    );
    await trackEvent({
      eventName: 'message_sent',
      userId: sender_id,
      metadata: { receiver_id, message_id: result.rows[0].id },
    });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all messages between two users
router.get('/:user1_id/:user2_id', async (req, res) => {
  try {
    const { user1_id, user2_id } = req.params;
    await pool.query(
      `UPDATE messages
       SET delivered_at = COALESCE(delivered_at, NOW()),
           read_at = COALESCE(read_at, NOW())
       WHERE sender_id = $1 AND receiver_id = $2`,
      [user2_id, user1_id]
    );
    await pool.query('UPDATE users SET last_active_at = NOW() WHERE id = $1', [user1_id]);
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
