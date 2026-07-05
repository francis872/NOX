const express = require('express');
const router = express.Router();


const pool = require('../db');
const { trackEvent } = require('../utils/analytics');
const { recordEdge } = require('../utils/graph');

// Seguir usuario
router.post('/:id/follow', async (req, res) => {
  const { follower_id } = req.body; // ID del usuario que sigue
  const user_id = req.params.id;    // ID del usuario a seguir
  if (!follower_id) return res.status(400).json({ error: 'Falta follower_id' });
  if (follower_id == user_id) return res.status(400).json({ error: 'No puedes seguirte a ti mismo' });
  try {
    await pool.query('INSERT INTO followers (user_id, follower_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [user_id, follower_id]);
    const actor = await pool.query('SELECT username FROM users WHERE id = $1', [follower_id]);
    await pool.query(
      'INSERT INTO notifications (user_id, type, message) VALUES ($1,$2,$3)',
      [user_id, 'follow', `${actor.rows[0]?.username || 'Alguien'} empezó a seguirte`]
    );
    await trackEvent({
      eventName: 'follow_created',
      userId: Number(follower_id),
      metadata: { target_user_id: Number(user_id) },
    });
    await recordEdge(
      { type: 'user', entityId: follower_id, label: actor.rows[0]?.username || '' },
      { type: 'user', entityId: user_id, label: '' },
      'follows',
    );
    res.json({ message: 'Ahora sigues a este usuario' });
  } catch (err) {
    res.status(500).json({ error: 'Error al seguir usuario' });
  }
});

// Dejar de seguir usuario
router.post('/:id/unfollow', async (req, res) => {
  const { follower_id } = req.body;
  const user_id = req.params.id;
  if (!follower_id) return res.status(400).json({ error: 'Falta follower_id' });
  try {
    await pool.query('DELETE FROM followers WHERE user_id = $1 AND follower_id = $2', [user_id, follower_id]);
    res.json({ message: 'Has dejado de seguir a este usuario' });
  } catch (err) {
    res.status(500).json({ error: 'Error al dejar de seguir usuario' });
  }
});

module.exports = router;
