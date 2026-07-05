// backend/src/index.js - Servidor principal NOX
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const bootstrapSchema = require('./utils/bootstrapSchema');
const { attachRealtime } = require('./realtime');

const app = express();
app.use(cors());
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

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
app.use('/api/stories', require('./routes/vibes')); // alias historias → vibes
app.use('/api/spaces', require('./routes/spaces'));
app.use('/api/actions', require('./routes/actions'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/experiments', require('./routes/experiments'));
app.use('/api/insights', require('./routes/insights'));
app.use('/api/graph', require('./routes/graph'));
app.use('/api/search', require('./routes/search'));

app.get('/', (req, res) => res.json({ status: 'NOX API running' }));

// Diagnostic — shows actual DB columns
app.get('/api/_schema', async (req, res) => {
  const pool = require('./db');
  try {
    const cols  = await pool.query("SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, ordinal_position");
    const sample = await pool.query('SELECT * FROM users LIMIT 1');
    res.json({ tables: cols.rows, user_keys: Object.keys(sample.rows[0] || {}) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

bootstrapSchema().catch((err) => {
  console.error('Schema bootstrap failed:', err.message);
});

// Exportar para Vercel serverless
module.exports = app;

// Solo arrancar servidor HTTP/WS en entorno local
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  const server = http.createServer(app);
  attachRealtime(server);
  server.listen(PORT, () => {
    console.log(`NOX Backend corriendo en puerto ${PORT}`);
  });
}
