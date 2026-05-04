// messages.js - Endpoints for direct messages between users
const express = require('express');
const router = express.Router();
const { Message } = require('../models');

// Send a message
router.post('/', async (req, res) => {
  try {
    const { sender_id, receiver_id, content } = req.body;
    const message = await Message.create({ sender_id, receiver_id, content });
    res.status(201).json(message);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all messages between two users
router.get('/:user1_id/:user2_id', async (req, res) => {
  try {
    const { user1_id, user2_id } = req.params;
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { sender_id: user1_id, receiver_id: user2_id },
          { sender_id: user2_id, receiver_id: user1_id }
        ]
      },
      order: [['created_at', 'ASC']]
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
