const express = require('express');
const router = express.Router();
const pool = require('../db');
const { trackEvent } = require('../utils/analytics');

router.post('/events', async (req, res) => {
  const {
    event_name,
    user_id,
    visitor_id,
    session_id,
    screen,
    platform,
    metadata,
  } = req.body || {};

  if (!event_name) {
    return res.status(400).json({ error: 'event_name es obligatorio' });
  }

  await trackEvent({
    eventName: event_name,
    userId: user_id || null,
    visitorId: visitor_id || null,
    sessionId: session_id || null,
    screen: screen || null,
    platform: platform || 'web',
    metadata: metadata || {},
  });

  res.status(201).json({ ok: true });
});

router.get('/kpis', async (_req, res) => {
  try {
    const result = await pool.query(`
      WITH now_ref AS (
        SELECT NOW()::date AS today
      ),
      dau AS (
        SELECT COUNT(DISTINCT user_id) AS v
        FROM analytics_events, now_ref
        WHERE user_id IS NOT NULL AND created_at >= now_ref.today
      ),
      wau AS (
        SELECT COUNT(DISTINCT user_id) AS v
        FROM analytics_events, now_ref
        WHERE user_id IS NOT NULL AND created_at >= (now_ref.today - INTERVAL '7 days')
      ),
      mau AS (
        SELECT COUNT(DISTINCT user_id) AS v
        FROM analytics_events, now_ref
        WHERE user_id IS NOT NULL AND created_at >= (now_ref.today - INTERVAL '30 days')
      ),
      signups AS (
        SELECT COUNT(*) AS v
        FROM users, now_ref
        WHERE created_at >= (now_ref.today - INTERVAL '1 day')
      ),
      activated AS (
        SELECT COUNT(DISTINCT user_id) AS v
        FROM analytics_events, now_ref
        WHERE event_name = 'onboarding_completed' AND created_at >= (now_ref.today - INTERVAL '1 day')
      ),
      d1 AS (
        SELECT COUNT(DISTINCT u.id) AS retained
        FROM users u
        WHERE u.created_at::date = (NOW()::date - INTERVAL '1 day')
          AND EXISTS (
            SELECT 1 FROM analytics_events e
            WHERE e.user_id = u.id
              AND e.created_at::date = NOW()::date
          )
      ),
      d1_base AS (
        SELECT COUNT(*) AS base
        FROM users
        WHERE created_at::date = (NOW()::date - INTERVAL '1 day')
      )
      SELECT
        (SELECT v FROM dau) AS dau,
        (SELECT v FROM wau) AS wau,
        (SELECT v FROM mau) AS mau,
        (SELECT v FROM signups) AS signups_24h,
        (SELECT v FROM activated) AS activated_24h,
        (SELECT retained FROM d1) AS d1_retained,
        (SELECT base FROM d1_base) AS d1_base
    `);

    const row = result.rows[0] || {};
    const mau = Number(row.mau || 0);
    const dau = Number(row.dau || 0);
    const signups = Number(row.signups_24h || 0);
    const activated = Number(row.activated_24h || 0);
    const d1Base = Number(row.d1_base || 0);
    const d1Retained = Number(row.d1_retained || 0);

    res.json({
      dau,
      wau: Number(row.wau || 0),
      mau,
      dau_mau_ratio: mau ? Number(((dau / mau) * 100).toFixed(2)) : 0,
      activation_rate_24h: signups ? Number(((activated / signups) * 100).toFixed(2)) : 0,
      d1_retention: d1Base ? Number(((d1Retained / d1Base) * 100).toFixed(2)) : 0,
      signups_24h: signups,
      activated_24h: activated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
