// backend/src/index.js - Servidor principal NOX
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/ideas', require('./routes/ideas'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/follow', require('./routes/follow'));
app.use('/api/explore', require('./routes/explore'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/badges', require('./routes/badges'));
app.use('/api/activitylog', require('./routes/activitylog'));
app.use('/api/contributions', require('./routes/contributions'));
app.use('/api/duels', require('./routes/duels'));
app.use('/api/missions', require('./routes/missions'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/vibes', require('./routes/vibes'));

app.get('/', (req, res) => res.json({ status: 'NOX API running' }));

// Exportar para Vercel serverless
module.exports = app;

// Solo arrancar servidor HTTP/WS en entorno local
if (require.main === module) {
  const setupMyLinkServer = require('./myLinkSocket');
  const PORT = process.env.PORT || 3001;
  const server = http.createServer(app);
  setupMyLinkServer(server);
  server.listen(PORT, () => {
    console.log(`NOX Backend corriendo en puerto ${PORT}`);
  });
}
