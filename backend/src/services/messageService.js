const pool = require('../db');
const { trackEvent } = require('../utils/analytics');
const { recordEdge } = require('../utils/graph');

async function createDirectMessage({ senderId, receiverId, content, mediaType, mediaData }) {
  const receiver = await pool.query('SELECT is_private FROM users WHERE id = $1', [receiverId]);
  const isPrivate = !!receiver.rows[0]?.is_private;

  if (isPrivate) {
    const accepted = await pool.query(
      `SELECT 1 FROM dm_requests
       WHERE sender_id = $1 AND receiver_id = $2 AND status = 'accepted'`,
      [senderId, receiverId]
    );

    if (!accepted.rows.length) {
      await pool.query(
        `INSERT INTO dm_requests (sender_id, receiver_id, status, updated_at)
         VALUES ($1,$2,'pending',NOW())
         ON CONFLICT (sender_id, receiver_id)
         DO UPDATE SET status = 'pending', updated_at = NOW()`,
        [senderId, receiverId]
      );

      const actorReq = await pool.query('SELECT username FROM users WHERE id = $1', [senderId]);
      await pool.query(
        'INSERT INTO notifications (user_id, type, message) VALUES ($1,$2,$3)',
        [receiverId, 'dm_request', `${actorReq.rows[0]?.username || 'Alguien'} quiere enviarte mensajes`]
      );

      const error = new Error('Esta cuenta es privada. Se envió una solicitud de mensaje.');
      error.statusCode = 403;
      error.code = 'DM_REQUEST_REQUIRED';
      throw error;
    }
  }

  const result = await pool.query(
    `INSERT INTO messages (sender_id, receiver_id, content, media_type, media_data, delivered_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING *`,
    [senderId, receiverId, content || '', mediaType || 'text', mediaData || null]
  );

  await pool.query('UPDATE users SET last_active_at = NOW() WHERE id = $1', [senderId]);
  const actor = await pool.query('SELECT username FROM users WHERE id = $1', [senderId]);
  await pool.query(
    'INSERT INTO notifications (user_id, type, message) VALUES ($1,$2,$3)',
    [receiverId, 'message', `Nuevo mensaje de ${actor.rows[0]?.username || 'usuario'}`]
  );

  await trackEvent({
    eventName: 'message_sent',
    userId: senderId,
    metadata: { receiver_id: receiverId, message_id: result.rows[0].id },
  });

  const senderInfo = await pool.query('SELECT username FROM users WHERE id = $1', [senderId]);
  const receiverInfo = await pool.query('SELECT username FROM users WHERE id = $1', [receiverId]);
  await recordEdge(
    { type: 'user', entityId: senderId, label: senderInfo.rows[0]?.username || '' },
    { type: 'user', entityId: receiverId, label: receiverInfo.rows[0]?.username || '' },
    'dm_sent'
  );

  return result.rows[0];
}

module.exports = {
  createDirectMessage,
};