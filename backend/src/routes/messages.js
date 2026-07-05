// messages.js - Endpoints for direct messages between users
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { createDirectMessage } = require('../services/messageService');

// Send a message
router.post('/', async (req, res) => {
  try {
    const { sender_id, receiver_id, content, media_type, media_data } = req.body;
    const message = await createDirectMessage({
      senderId: sender_id,
      receiverId: receiver_id,
      content,
      mediaType: media_type,
      mediaData: media_data,
    });
    res.status(201).json(message);
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message, code: err.code });
  }
});

// Get all messages between two users
router.get('/thread/:user1_id/:user2_id', async (req, res) => {
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

// Solicitudes de DM pendientes para un usuario.
router.get('/requests/:user_id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.sender_id, r.receiver_id, r.status, r.updated_at, u.username, u.avatar_url
       FROM dm_requests r
       JOIN users u ON u.id = r.sender_id
       WHERE r.receiver_id = $1 AND r.status = 'pending'
       ORDER BY r.updated_at DESC`,
      [req.params.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Responder solicitud de DM: accepted | rejected.
router.post('/requests/:id/respond', async (req, res) => {
  const { action } = req.body;
  if (!['accepted', 'rejected'].includes(action)) {
    return res.status(400).json({ error: 'Acción inválida' });
  }
  try {
    const result = await pool.query(
      `UPDATE dm_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [action, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Solicitud no encontrada' });

    const reqRow = result.rows[0];
    await pool.query(
      'INSERT INTO notifications (user_id, type, message) VALUES ($1,$2,$3)',
      [
        reqRow.sender_id,
        'dm_request_response',
        action === 'accepted' ? 'Tu solicitud de mensaje fue aceptada' : 'Tu solicitud de mensaje fue rechazada',
      ]
    );

    res.json({ ok: true, status: action });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
