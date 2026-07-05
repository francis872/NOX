// search.js — buscar usuarios e ideas por texto o hashtag
const express = require('express');
const router  = express.Router();
const pool    = require('../db');

router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1) return res.json({ users: [], ideas: [] });

  const like = `%${q.trim()}%`;
  try {
    // Users matching username or name — use SELECT * to avoid column errors
    const usersR = await pool.query(
      `SELECT u.*,
              (SELECT COUNT(*) FROM followers f WHERE f.user_id = u.id)::int AS followers_count
       FROM users u WHERE u.email ILIKE $1 OR u.name ILIKE $1
       ORDER BY followers_count DESC LIMIT 10`,
      [like]
    );
    const mappedUsers = usersR.rows.map(u => ({
      id:              u.id,
      username:        u.username || u.name || u.email?.split('@')[0] || `user_${u.id}`,
      avatar_url:      u.avatar_url ?? null,
      bio:             u.bio        || '',
      followers_count: u.followers_count || 0,
    }));

    // Ideas matching premise text (or hashtag)
    const ideasR = await pool.query(
      `SELECT * FROM ideas WHERE premise ILIKE $1 ORDER BY created_at DESC LIMIT 20`,
      [like]
    );

    // Batch-fetch author usernames for ideas
    const ideas = ideasR.rows;
    if (ideas.length > 0) {
      const ids = [...new Set(ideas.map(i => i.author_id).filter(Boolean))];
      const authorsR = await pool.query(
        'SELECT id, COALESCE(username, name) AS username, avatar_url FROM users WHERE id = ANY($1)',
        [ids]
      );
      const map = {};
      authorsR.rows.forEach(u => { map[u.id] = u; });
      ideas.forEach(i => {
        i.username   = map[i.author_id]?.username   ?? null;
        i.avatar_url = map[i.author_id]?.avatar_url ?? null;
      });
    }

    res.json({ users: mappedUsers, ideas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
