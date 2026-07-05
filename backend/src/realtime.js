const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { createDirectMessage } = require('./services/messageService');

let ioInstance = null;
const userSockets = new Map();

function getUserSockets(userId) {
  const key = String(userId);
  if (!userSockets.has(key)) userSockets.set(key, new Set());
  return userSockets.get(key);
}

function emitToUser(userId, event, payload) {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
}

function attachRealtime(server) {
  if (ioInstance) return ioInstance;

  ioInstance = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((value) => value.trim()) : true,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  ioInstance.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Missing token'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'noxsecret');
      socket.user = payload;
      return next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  ioInstance.on('connection', (socket) => {
    const userId = String(socket.user.id);
    socket.join(`user:${userId}`);
    getUserSockets(userId).add(socket.id);

    socket.on('dm:typing', ({ to }) => {
      if (!to) return;
      emitToUser(to, 'dm:typing', { from: userId });
    });

    socket.on('dm:typing_stop', ({ to }) => {
      if (!to) return;
      emitToUser(to, 'dm:typing_stop', { from: userId });
    });

    socket.on('dm:send', async (payload, ack) => {
      const respond = typeof ack === 'function' ? ack : () => {};
      try {
        const message = await createDirectMessage({
          senderId: socket.user.id,
          receiverId: payload?.to,
          content: payload?.content || '',
          mediaType: payload?.media_type || 'text',
          mediaData: payload?.media_data || null,
        });

        emitToUser(payload.to, 'dm:new', message);
        emitToUser(socket.user.id, 'dm:sent', message);
        respond({ ok: true, message });
      } catch (error) {
        respond({
          ok: false,
          error: error.message,
          code: error.code || 'DM_SEND_FAILED',
          statusCode: error.statusCode || 400,
        });
      }
    });

    socket.on('disconnect', () => {
      const sockets = getUserSockets(userId);
      sockets.delete(socket.id);
      if (sockets.size === 0) userSockets.delete(userId);
    });
  });

  return ioInstance;
}

module.exports = {
  attachRealtime,
  emitToUser,
};