// ideas.js - Endpoints for structured ideas (CRUD, versioning, fork, feed)
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { trackEvent } = require('../utils/analytics');
const { recordEdge } = require('../utils/graph');

// Create new structured idea
router.post('/', async (req, res) => {
  try {
    const { author_id, premise, argument, evidence, conclusion, counterargument, parent_id, media_url, media_type } = req.body;
    if (!author_id || !premise) return res.status(400).json({ error: 'author_id y premise son obligatorios' });
    let version = 1;
    if (parent_id) {
      const parent = await pool.query('SELECT version FROM ideas WHERE id = $1', [parent_id]);
      version = parent.rows.length ? parent.rows[0].version + 1 : 1;
    }
    const result = await pool.query(
      'INSERT INTO ideas (author_id, premise, argument, evidence, conclusion, counterargument, parent_id, version, media_url, media_type) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [
        author_id,
        premise,
        argument || '',
        evidence || '',
        conclusion || '',
        counterargument || null,
        parent_id || null,
        version,
        media_url || null,
        media_type || 'text',
      ]
    );
    await trackEvent({ eventName: 'idea_created', userId: author_id, metadata: { idea_id: result.rows[0].id, has_media: !!media_url } });
    const author = await pool.query('SELECT username, avatar_url FROM users WHERE id = $1', [author_id]);
    const ideaWithAuthor = { ...result.rows[0], username: author.rows[0]?.username, avatar_url: author.rows[0]?.avatar_url };
    await recordEdge(
      { type: 'user', entityId: author_id, label: author.rows[0]?.username || '' },
      { type: 'idea', entityId: result.rows[0].id, label: (premise || '').slice(0, 60) },
      'created',
    );
    res.status(201).json(ideaWithAuthor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get trending hashtags from recent ideas
router.get('/trending-tags', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT lower(t.tag) AS tag, COUNT(*) AS cnt
      FROM ideas,
           LATERAL unnest(regexp_matches(premise, '#[A-Za-z0-9_]+', 'g')) t(tag)
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY lower(t.tag)
      ORDER BY cnt DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch {
    res.json([]);
  }
});

// Get all ideas — supports ?following=true&user_id=X, ?tag=#nox, ?q=text
router.get('/', async (req, res) => {
  try {
    const { user_id, following, tag, q } = req.query;
    const conditions = [];
    const params = [];

    if (following === 'true' && user_id) {
      params.push(user_id);
      conditions.push(`author_id IN (SELECT user_id FROM followers WHERE follower_id = $${params.length})`);
    }
    if (tag) {
      params.push(`%${tag}%`);
      conditions.push(`premise ILIKE $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      conditions.push(`premise ILIKE $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const ideasResult = await pool.query(
      `SELECT * FROM ideas ${where} ORDER BY created_at DESC LIMIT 80`,
      params
    );
    const ideas = ideasResult.rows;

    // Batch-fetch author info using SELECT * to avoid column-not-exists errors
    if (ideas.length > 0) {
      const authorIds = [...new Set(ideas.map(i => i.author_id).filter(Boolean))];
      const usersResult = await pool.query(
        'SELECT * FROM users WHERE id = ANY($1)',
        [authorIds]
      );
      const userMap = {};
      usersResult.rows.forEach(u => {
        userMap[u.id] = {
          username:   u.username || u.name || u.email?.split('@')[0] || `user_${u.id}`,
          avatar_url: u.avatar_url ?? null,
        };
      });
      ideas.forEach(idea => {
        const u = userMap[idea.author_id];
        idea.username   = u?.username   ?? null;
        idea.avatar_url = u?.avatar_url ?? null;
      });
    }
    res.json(ideas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get idea by id (with version history)
router.get('/:id', async (req, res) => {
  try {
    const idea = await pool.query('SELECT * FROM ideas WHERE id = $1', [req.params.id]);
    if (idea.rows.length === 0) return res.status(404).json({ error: 'Idea not found' });
    const versions = await pool.query('SELECT * FROM ideas WHERE parent_id = $1', [req.params.id]);
    res.json({ idea: idea.rows[0], versions: versions.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fork/version an idea
router.post('/:id/fork', async (req, res) => {
  try {
    const parent = await pool.query('SELECT * FROM ideas WHERE id = $1', [req.params.id]);
    if (parent.rows.length === 0) return res.status(404).json({ error: 'Parent idea not found' });
    const { author_id, premise, argument, evidence, conclusion, counterargument } = req.body;
    const version = parent.rows[0].version + 1;
    const result = await pool.query(
      'INSERT INTO ideas (author_id, premise, argument, evidence, conclusion, counterargument, parent_id, version) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [author_id, premise, argument, evidence, conclusion, counterargument || null, req.params.id, version]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// React to an idea (ignite, expand, challenge) - cannot react to own idea
router.post('/:id/react', async (req, res) => {
  try {
    const { user_id, reaction, type } = req.body;
    const reactionType = reaction || type;
    const idea = await pool.query('SELECT author_id, premise FROM ideas WHERE id = $1', [req.params.id]);
    if (idea.rows.length === 0) return res.status(404).json({ error: 'Idea not found' });
    if (idea.rows[0].author_id == user_id) return res.status(403).json({ error: 'No puedes reaccionar a tu propia idea' });
    const col = reactionType === 'ignite' ? 'ignite_count' : reactionType === 'expand' ? 'expand_count' : 'challenge_count';
    await pool.query(`UPDATE ideas SET ${col} = COALESCE(${col}, 0) + 1 WHERE id = $1`, [req.params.id]);
    const actor = await pool.query('SELECT username FROM users WHERE id = $1', [user_id]);
    const pretty = reactionType === 'ignite' ? '🔥 reaccionó' : reactionType === 'expand' ? '🧠 expandió' : '⚡ desafió';
    await pool.query(
      'INSERT INTO notifications (user_id, type, message) VALUES ($1,$2,$3)',
      [
        idea.rows[0].author_id,
        'reaction',
        `${actor.rows[0]?.username || 'Alguien'} ${pretty} tu publicación`,
      ]
    );
    await trackEvent({
      eventName: 'idea_reacted',
      userId: user_id,
      metadata: { idea_id: Number(req.params.id), reaction: reactionType },
    });
    await recordEdge(
      { type: 'user', entityId: user_id, label: actor.rows[0]?.username || '' },
      { type: 'idea', entityId: req.params.id, label: (idea.rows[0].premise || '').slice(0, 60) },
      'reacted',
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update idea
router.put('/:id', async (req, res) => {
  try {
    const { premise, argument, evidence, conclusion, counterargument } = req.body;
    const result = await pool.query(
      'UPDATE ideas SET premise=$1, argument=$2, evidence=$3, conclusion=$4, counterargument=$5 WHERE id=$6 RETURNING *',
      [premise, argument, evidence, conclusion, counterargument || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Idea not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete idea
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM ideas WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Idea not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
