const pool = require('../db');

async function bootstrapSchema() {
  const statements = [
    // ── Tablas base (deben existir antes de cualquier ALTER TABLE) ────────
    `CREATE TABLE IF NOT EXISTS users (
       id SERIAL PRIMARY KEY,
       username VARCHAR(64) UNIQUE NOT NULL,
       email VARCHAR(128) UNIQUE NOT NULL,
       password TEXT NOT NULL,
       bio TEXT DEFAULT '',
       interests TEXT[] DEFAULT '{}',
       principios TEXT[] DEFAULT '{}',
       age INTEGER,
       origin VARCHAR(128) DEFAULT '',
       account_type VARCHAR(32) DEFAULT 'free',
       verified BOOLEAN DEFAULT false,
       is_admin BOOLEAN DEFAULT false,
       banned BOOLEAN DEFAULT false,
       is_private BOOLEAN DEFAULT false,
       thought_level VARCHAR(64) DEFAULT 'Explorador',
       created_at TIMESTAMP DEFAULT NOW()
     )`,
    `CREATE TABLE IF NOT EXISTS ideas (
       id SERIAL PRIMARY KEY,
       author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       premise TEXT NOT NULL,
       argument TEXT NOT NULL,
       evidence TEXT NOT NULL,
       conclusion TEXT NOT NULL,
       counterargument TEXT,
       parent_id INTEGER REFERENCES ideas(id) ON DELETE SET NULL,
       version INTEGER DEFAULT 1,
       ignite_count INTEGER DEFAULT 0,
       expand_count INTEGER DEFAULT 0,
       challenge_count INTEGER DEFAULT 0,
       impact_score INTEGER DEFAULT 0,
       status VARCHAR(32) DEFAULT 'active',
       created_at TIMESTAMP DEFAULT NOW()
     )`,
    `CREATE TABLE IF NOT EXISTS followers (
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       created_at TIMESTAMP DEFAULT NOW(),
       PRIMARY KEY (user_id, follower_id)
     )`,
    `CREATE TABLE IF NOT EXISTS messages (
       id SERIAL PRIMARY KEY,
       sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       content TEXT NOT NULL,
       created_at TIMESTAMP DEFAULT NOW()
     )`,
    `CREATE TABLE IF NOT EXISTS comments (
       id SERIAL PRIMARY KEY,
       idea_id INTEGER REFERENCES ideas(id) ON DELETE CASCADE,
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       content TEXT NOT NULL,
       created_at TIMESTAMP DEFAULT NOW()
     )`,
    `CREATE TABLE IF NOT EXISTS notifications (
       id SERIAL PRIMARY KEY,
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       type VARCHAR(64),
       message TEXT,
       read BOOLEAN DEFAULT false,
       created_at TIMESTAMP DEFAULT NOW()
     )`,
    `CREATE TABLE IF NOT EXISTS reactions (
       id SERIAL PRIMARY KEY,
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       idea_id INTEGER REFERENCES ideas(id) ON DELETE CASCADE,
       type VARCHAR(32) DEFAULT 'ignite',
       created_at TIMESTAMP DEFAULT NOW(),
       UNIQUE (user_id, idea_id, type)
     )`,
    // ── ALTER TABLE para columnas añadidas tras el lanzamiento inicial ───
    // MIGRATION: production DB uses 'name' column — add all NOX-specific columns
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS username    VARCHAR(64)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name   VARCHAR(128) DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_minor    BOOLEAN DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio         TEXT        DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS interests   TEXT[]      DEFAULT '{}'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS principios  TEXT[]      DEFAULT '{}'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS age         INTEGER`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS origin      VARCHAR(128) DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(32) DEFAULT 'free'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS verified    BOOLEAN     DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin    BOOLEAN     DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS banned      BOOLEAN     DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS thought_level VARCHAR(64) DEFAULT 'Explorador'`,
    // Backfill: copy 'name' -> 'username' for existing rows
    `UPDATE users SET username = COALESCE(name, split_part(email,'@',1)) WHERE username IS NULL`,
    `ALTER TABLE users
       ADD COLUMN IF NOT EXISTS role VARCHAR(32) DEFAULT 'user'`,
    `ALTER TABLE users
       ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP DEFAULT NOW()`,
    `ALTER TABLE users
       ADD COLUMN IF NOT EXISTS avatar_url TEXT`,
    `ALTER TABLE ideas
       ADD COLUMN IF NOT EXISTS media_url TEXT`,
    `ALTER TABLE ideas
       ADD COLUMN IF NOT EXISTS media_type VARCHAR(24) DEFAULT 'text'`,
    `ALTER TABLE ideas
       ADD COLUMN IF NOT EXISTS visibility VARCHAR(24) DEFAULT 'public'`,
    `ALTER TABLE messages
       ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP DEFAULT NOW()`,
    `ALTER TABLE messages
       ADD COLUMN IF NOT EXISTS read_at TIMESTAMP`,
    `ALTER TABLE messages
       ADD COLUMN IF NOT EXISTS media_type VARCHAR(24) DEFAULT 'text'`,
    `ALTER TABLE messages
       ADD COLUMN IF NOT EXISTS media_data TEXT`,
    `CREATE TABLE IF NOT EXISTS dm_requests (
       id BIGSERIAL PRIMARY KEY,
       sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       status VARCHAR(24) DEFAULT 'pending',
       created_at TIMESTAMP DEFAULT NOW(),
       updated_at TIMESTAMP DEFAULT NOW(),
       UNIQUE (sender_id, receiver_id)
     )`,
    `CREATE TABLE IF NOT EXISTS vibes (
       id SERIAL PRIMARY KEY,
       author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       media_type VARCHAR(24) DEFAULT 'text',
       media_data TEXT,
       caption TEXT,
       visibility VARCHAR(24) DEFAULT 'public',
       expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours'),
       created_at TIMESTAMP DEFAULT NOW()
     )`,
    `CREATE TABLE IF NOT EXISTS favorites (
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       idea_id INTEGER REFERENCES ideas(id) ON DELETE CASCADE,
       created_at TIMESTAMP DEFAULT NOW(),
       PRIMARY KEY (user_id, idea_id)
     )`,
    `CREATE TABLE IF NOT EXISTS best_friends (
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       created_at TIMESTAMP DEFAULT NOW(),
       PRIMARY KEY (user_id, friend_id)
     )`,
    `CREATE TABLE IF NOT EXISTS analytics_events (
       id BIGSERIAL PRIMARY KEY,
       event_name VARCHAR(128) NOT NULL,
       user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
       visitor_id VARCHAR(128),
       session_id VARCHAR(128),
       screen VARCHAR(128),
       platform VARCHAR(32) DEFAULT 'web',
       metadata JSONB DEFAULT '{}'::jsonb,
       created_at TIMESTAMP DEFAULT NOW()
     )`,
    `CREATE TABLE IF NOT EXISTS experiments (
       id SERIAL PRIMARY KEY,
       key VARCHAR(64) UNIQUE NOT NULL,
       name VARCHAR(128) NOT NULL,
       hypothesis TEXT,
       status VARCHAR(24) DEFAULT 'running',
       traffic_percent INTEGER DEFAULT 100,
       variants JSONB NOT NULL,
       target_metric VARCHAR(64) DEFAULT 'activation',
       start_at TIMESTAMP DEFAULT NOW(),
       end_at TIMESTAMP
     )`,
    `CREATE TABLE IF NOT EXISTS experiment_assignments (
       id BIGSERIAL PRIMARY KEY,
       experiment_key VARCHAR(64) NOT NULL,
       user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
       visitor_id VARCHAR(128),
       variant VARCHAR(64) NOT NULL,
       assigned_at TIMESTAMP DEFAULT NOW(),
       UNIQUE (experiment_key, user_id),
       UNIQUE (experiment_key, visitor_id)
     )`,
    `CREATE TABLE IF NOT EXISTS experiment_conversions (
       id BIGSERIAL PRIMARY KEY,
       experiment_key VARCHAR(64) NOT NULL,
       user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
       visitor_id VARCHAR(128),
       variant VARCHAR(64) NOT NULL,
       metric_key VARCHAR(64) NOT NULL,
       value NUMERIC DEFAULT 1,
       created_at TIMESTAMP DEFAULT NOW()
     )`,
    `CREATE TABLE IF NOT EXISTS reports (
       id BIGSERIAL PRIMARY KEY,
       reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
       target_type VARCHAR(24) NOT NULL,
       target_id BIGINT NOT NULL,
       reason TEXT,
       status VARCHAR(24) DEFAULT 'pending',
       created_at TIMESTAMP DEFAULT NOW()
     )`,
    `CREATE TABLE IF NOT EXISTS moderation_actions (
       id BIGSERIAL PRIMARY KEY,
       report_id BIGINT REFERENCES reports(id) ON DELETE CASCADE,
       moderator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
       action VARCHAR(64) NOT NULL,
       notes TEXT,
       created_at TIMESTAMP DEFAULT NOW()
     )`,
    `CREATE TABLE IF NOT EXISTS daily_user_metrics (
       day DATE NOT NULL,
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       events_count INTEGER DEFAULT 0,
       meaningful_interactions INTEGER DEFAULT 0,
       sessions_count INTEGER DEFAULT 0,
       minutes_spent INTEGER DEFAULT 0,
       segment VARCHAR(24) DEFAULT 'new',
       PRIMARY KEY (day, user_id)
     )`,
    // ── Grafo de conocimiento ─────────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS graph_nodes (
       id BIGSERIAL PRIMARY KEY,
       type VARCHAR(32) NOT NULL,
       entity_id VARCHAR(64) NOT NULL,
       label TEXT,
       metadata JSONB DEFAULT '{}',
       created_at TIMESTAMP DEFAULT NOW(),
       UNIQUE (type, entity_id)
     )`,
    `CREATE TABLE IF NOT EXISTS graph_edges (
       id BIGSERIAL PRIMARY KEY,
       from_node_id BIGINT REFERENCES graph_nodes(id) ON DELETE CASCADE,
       to_node_id BIGINT REFERENCES graph_nodes(id) ON DELETE CASCADE,
       edge_type VARCHAR(48) NOT NULL,
       weight FLOAT DEFAULT 1.0,
       metadata JSONB DEFAULT '{}',
       created_at TIMESTAMP DEFAULT NOW(),
       updated_at TIMESTAMP DEFAULT NOW(),
       UNIQUE (from_node_id, to_node_id, edge_type)
     )`,
    `CREATE INDEX IF NOT EXISTS idx_graph_nodes_type ON graph_nodes(type, entity_id)`,
    `CREATE INDEX IF NOT EXISTS idx_graph_edges_from ON graph_edges(from_node_id, edge_type)`,
    `CREATE INDEX IF NOT EXISTS idx_graph_edges_to ON graph_edges(to_node_id, edge_type)`,
    `CREATE INDEX IF NOT EXISTS idx_graph_edges_weight ON graph_edges(weight DESC)`,
    // ──────────────────────────────────────────────────────────────────
    `CREATE INDEX IF NOT EXISTS idx_ideas_author_created ON ideas(author_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_messages_pair_created ON messages(sender_id, receiver_id, created_at DESC)`,
   `CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at)`,
   `CREATE INDEX IF NOT EXISTS idx_dm_requests_receiver ON dm_requests(receiver_id, status, updated_at DESC)`,
    `CREATE TABLE IF NOT EXISTS spaces (
       id SERIAL PRIMARY KEY,
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       title VARCHAR(128) NOT NULL,
       description TEXT DEFAULT '',
       accent VARCHAR(16) DEFAULT '#7f5af0',
       created_at TIMESTAMP DEFAULT NOW()
     )`,
    `ALTER TABLE users
       ADD COLUMN IF NOT EXISTS nx_balance INTEGER DEFAULT 0`,
    `ALTER TABLE users
       ADD COLUMN IF NOT EXISTS banner VARCHAR(256) DEFAULT ''`,
    `CREATE INDEX IF NOT EXISTS idx_spaces_user ON spaces(user_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_vibes_expires ON vibes(expires_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name)`,
    `CREATE INDEX IF NOT EXISTS idx_daily_metrics_day ON daily_user_metrics(day DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_daily_metrics_segment ON daily_user_metrics(segment)`
  ];

  for (const sql of statements) {
    await pool.query(sql);
  }

  await pool.query(
    `INSERT INTO experiments (key, name, hypothesis, variants, target_metric)
     VALUES
     ('EXP-001', 'CTA crear idea', 'Sticky bottom aumenta conversion de idea_created', '["control_top","sticky_bottom"]'::jsonb, 'idea_created'),
     ('EXP-002', 'Orden tabs explorar', 'Personas primero incrementa follows', '["control_tendencias","personas_first"]'::jsonb, 'follow_created'),
     ('EXP-003', 'Copy boton mensaje', 'Copy directo mejora message_sent', '["mensaje","hablar_ahora"]'::jsonb, 'message_sent'),
     ('EXP-004', 'Onboarding corto', '3 pasos mejora onboarding_completed', '["4_pasos","3_pasos"]'::jsonb, 'onboarding_completed')
     ON CONFLICT (key) DO NOTHING`
  );
}

module.exports = bootstrapSchema;
