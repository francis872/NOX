// myLinkSocket.js - WebSocket server for MyLink messaging
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'noxsecret';
const clients = new Map(); // userId -> ws

function setupMyLinkServer(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    // Expect token in query: ws://host?token=xxx
    const params = new URLSearchParams(req.url.replace(/^\//, ''));
    const token = params.get('token');
    let userId = null;
    try {
      const payload = jwt.verify(token, SECRET);
      userId = payload.id;
      clients.set(userId, ws);
    } catch {
      ws.close();
      return;
    }
    ws.on('message', msg => {
      try {
        const data = JSON.parse(msg);
        if (data.type === 'message' && data.to) {
          const target = clients.get(data.to);
          if (target) {
            target.send(JSON.stringify({
              type: 'message',
              from: userId,
              content: data.content,
              created_at: new Date().toISOString()
            }));
          }
        }
      } catch {}
    });
    ws.on('close', () => {
      if (userId) clients.delete(userId);
    });
  });
}

module.exports = setupMyLinkServer;
