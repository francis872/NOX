const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/dashboard', async (_req, res) => {
  try {
    const result = await pool.query(`
      WITH events AS (
        SELECT * FROM analytics_events WHERE created_at >= NOW() - INTERVAL '30 days'
      ),
      counts AS (
        SELECT
          COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN user_id END) AS dau,
          COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN user_id END) AS wau,
          COUNT(DISTINCT user_id) AS mau,
          COUNT(*) FILTER (WHERE event_name = 'idea_created' AND created_at >= NOW() - INTERVAL '1 day') AS ideas_24h,
          COUNT(*) FILTER (WHERE event_name = 'vibe_created' AND created_at >= NOW() - INTERVAL '1 day') AS vibes_24h,
          COUNT(*) FILTER (WHERE event_name = 'message_sent' AND created_at >= NOW() - INTERVAL '1 day') AS messages_24h,
          COUNT(*) FILTER (WHERE event_name = 'follow_created' AND created_at >= NOW() - INTERVAL '1 day') AS follows_24h
        FROM events
      ),
      avg_session AS (
        SELECT COALESCE(AVG(minutes_spent),0) AS avg_minutes
        FROM daily_user_metrics
        WHERE day >= CURRENT_DATE - INTERVAL '7 days'
      ),
      signups AS (
        SELECT COUNT(*) AS signups_24h
        FROM users
        WHERE created_at >= NOW() - INTERVAL '1 day'
      ),
      activated AS (
        SELECT COUNT(DISTINCT user_id) AS activated_24h
        FROM analytics_events
        WHERE event_name = 'onboarding_completed' AND created_at >= NOW() - INTERVAL '1 day'
      ),
      d1_ret AS (
        SELECT
          (SELECT COUNT(*) FROM users WHERE created_at::date = CURRENT_DATE - INTERVAL '1 day') AS base,
          (SELECT COUNT(DISTINCT u.id)
             FROM users u
            WHERE u.created_at::date = CURRENT_DATE - INTERVAL '1 day'
              AND EXISTS (
                SELECT 1 FROM analytics_events e
                WHERE e.user_id = u.id AND e.created_at::date = CURRENT_DATE
              )) AS retained
      )
      SELECT c.*, s.signups_24h, a.activated_24h, av.avg_minutes, d.base, d.retained
      FROM counts c, signups s, activated a, avg_session av, d1_ret d
    `);

    const topExperiments = await pool.query(`
      SELECT
        ea.experiment_key,
        ea.variant,
        COUNT(*)::int AS participants,
        COALESCE(SUM(ec.value),0) AS conversion_value
      FROM experiment_assignments ea
      LEFT JOIN experiment_conversions ec
        ON ec.experiment_key = ea.experiment_key
       AND ec.variant = ea.variant
      GROUP BY ea.experiment_key, ea.variant
      ORDER BY conversion_value DESC, participants DESC
      LIMIT 12
    `);

    const row = result.rows[0] || {};
    const dau = Number(row.dau || 0);
    const mau = Number(row.mau || 0);
    const signups = Number(row.signups_24h || 0);
    const activated = Number(row.activated_24h || 0);
    const d1Base = Number(row.base || 0);
    const d1Retained = Number(row.retained || 0);

    res.json({
      kpis: {
        dau,
        wau: Number(row.wau || 0),
        mau,
        dau_mau_ratio: mau ? Number(((dau / mau) * 100).toFixed(2)) : 0,
        activation_rate_24h: signups ? Number(((activated / signups) * 100).toFixed(2)) : 0,
        d1_retention: d1Base ? Number(((d1Retained / d1Base) * 100).toFixed(2)) : 0,
        avg_session_minutes_7d: Number(row.avg_minutes || 0).toFixed(1),
        ideas_created_24h: Number(row.ideas_24h || 0),
        vibes_created_24h: Number(row.vibes_24h || 0),
        messages_sent_24h: Number(row.messages_24h || 0),
        follows_24h: Number(row.follows_24h || 0),
      },
      experiments: topExperiments.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN day >= CURRENT_DATE - INTERVAL '7 days' THEN meaningful_interactions ELSE 0 END),0)::int AS meaningful_7d,
        COALESCE(SUM(CASE WHEN day >= CURRENT_DATE - INTERVAL '7 days' THEN sessions_count ELSE 0 END),0)::int AS sessions_7d,
        COALESCE(SUM(CASE WHEN day >= CURRENT_DATE - INTERVAL '7 days' THEN minutes_spent ELSE 0 END),0)::int AS minutes_7d,
        COALESCE(MAX(segment), 'new') AS segment
      FROM daily_user_metrics
      WHERE user_id = $1
    `, [userId]);

    const topIdeas = await pool.query(`
      SELECT id, premise, (COALESCE(ignite_count,0) + COALESCE(expand_count,0) + COALESCE(challenge_count,0)) AS score, created_at
      FROM ideas
      WHERE author_id = $1
      ORDER BY score DESC, created_at DESC
      LIMIT 3
    `, [userId]);

    res.json({
      metrics: result.rows[0] || {
        meaningful_7d: 0,
        sessions_7d: 0,
        minutes_7d: 0,
        segment: 'new',
      },
      top_ideas: topIdeas.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
