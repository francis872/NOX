-- NOX Database Schema
-- Ejecutar en PostgreSQL: psql -U postgres -d nox -f schema.sql

CREATE TABLE IF NOT EXISTS users (
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
  thought_level VARCHAR(64) DEFAULT 'Explorador',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ideas (
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
);

CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id INTEGER REFERENCES posts(id) ON DELETE SET NULL,
  challenge_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS followers (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, follower_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  idea_id INTEGER REFERENCES ideas(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(64),
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(64) NOT NULL,
  description TEXT,
  icon VARCHAR(128),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(128),
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contributions (
  id SERIAL PRIMARY KEY,
  idea_id INTEGER REFERENCES ideas(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  contribution_type VARCHAR(64),
  weight INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);
