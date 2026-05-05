const pool = require('../db');

async function bootstrapSchema() {
  const statements = [
    `ALTER TABLE users
       ADD COLUMN IF NOT EXISTS role VARCHAR(32) DEFAULT 'user'`,
    `ALTER TABLE users
       ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP DEFAULT NOW()`,
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
    `CREATE INDEX IF NOT EXISTS idx_ideas_author_created ON ideas(author_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_messages_pair_created ON messages(sender_id, receiver_id, created_at DESC)`,
   `CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at)`,
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
