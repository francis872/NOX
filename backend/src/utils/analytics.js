const pool = require('../db');

const MEANINGFUL_EVENTS = new Set([
  'idea_created',
  'idea_reacted',
  'vibe_created',
  'message_sent',
  'follow_created',
  'onboarding_completed'
]);

async function trackEvent({
  eventName,
  userId = null,
  visitorId = null,
  sessionId = null,
  screen = null,
  platform = 'web',
  metadata = {}
}) {
  try {
    await pool.query(
      `INSERT INTO analytics_events
         (event_name, user_id, visitor_id, session_id, screen, platform, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [eventName, userId, visitorId, sessionId, screen, platform, metadata || {}]
    );

    if (!userId) return;

    const meaningful = MEANINGFUL_EVENTS.has(eventName) ? 1 : 0;
    const minutesSpent = metadata && Number.isFinite(metadata.minutes_spent)
      ? Math.max(0, Math.floor(metadata.minutes_spent))
      : 0;

    await pool.query(
      `INSERT INTO daily_user_metrics (day, user_id, events_count, meaningful_interactions, sessions_count, minutes_spent)
       VALUES (CURRENT_DATE, $1, 1, $2, $3, $4)
       ON CONFLICT (day, user_id)
       DO UPDATE SET
         events_count = daily_user_metrics.events_count + 1,
         meaningful_interactions = daily_user_metrics.meaningful_interactions + EXCLUDED.meaningful_interactions,
         sessions_count = daily_user_metrics.sessions_count + EXCLUDED.sessions_count,
         minutes_spent = daily_user_metrics.minutes_spent + EXCLUDED.minutes_spent`,
      [userId, meaningful, eventName === 'app_open' ? 1 : 0, minutesSpent]
    );

    await pool.query('UPDATE users SET last_active_at = NOW() WHERE id = $1', [userId]);
  } catch {
    // Prevent analytics failures from breaking main flow.
  }
}

module.exports = {
  trackEvent,
  MEANINGFUL_EVENTS,
};
