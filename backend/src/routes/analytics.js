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

router.get('/cohorts', async (_req, res) => {
  try {
    const result = await pool.query(`
      WITH signup_cohorts AS (
        SELECT created_at::date AS cohort_day, id AS user_id
        FROM users
        WHERE created_at::date >= CURRENT_DATE - INTERVAL '45 days'
      ),
      retention AS (
        SELECT
          c.cohort_day,
          COUNT(*)::int AS cohort_size,
          COUNT(*) FILTER (
            WHERE EXISTS (
              SELECT 1 FROM analytics_events e
              WHERE e.user_id = c.user_id
                AND e.created_at::date = c.cohort_day + INTERVAL '7 days'
            )
          )::int AS retained_d7,
          COUNT(*) FILTER (
            WHERE EXISTS (
              SELECT 1 FROM analytics_events e
              WHERE e.user_id = c.user_id
                AND e.created_at::date = c.cohort_day + INTERVAL '30 days'
            )
          )::int AS retained_d30
        FROM signup_cohorts c
        GROUP BY c.cohort_day
      )
      SELECT
        cohort_day,
        cohort_size,
        retained_d7,
        retained_d30,
        CASE WHEN cohort_size > 0 THEN ROUND((retained_d7::numeric / cohort_size::numeric) * 100, 2) ELSE 0 END AS d7_rate,
        CASE WHEN cohort_size > 0 THEN ROUND((retained_d30::numeric / cohort_size::numeric) * 100, 2) ELSE 0 END AS d30_rate
      FROM retention
      ORDER BY cohort_day DESC
      LIMIT 12
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
