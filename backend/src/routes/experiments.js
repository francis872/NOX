const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const pool = require('../db');
const { trackEvent } = require('../utils/analytics');

function pickVariant(experimentKey, variants, identity) {
  const hash = crypto
    .createHash('sha256')
    .update(`${experimentKey}:${identity}`)
    .digest('hex');
  const num = parseInt(hash.slice(0, 8), 16);
  return variants[num % variants.length];
}

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM experiments ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/assign', async (req, res) => {
  try {
    const { experiment_key, user_id, visitor_id } = req.body || {};
    if (!experiment_key || (!user_id && !visitor_id)) {
      return res.status(400).json({ error: 'experiment_key y user_id/visitor_id son obligatorios' });
    }

    const experimentResult = await pool.query(
      'SELECT key, status, variants FROM experiments WHERE key = $1',
      [experiment_key]
    );
    if (!experimentResult.rows.length) {
      return res.status(404).json({ error: 'Experimento no encontrado' });
    }

    const experiment = experimentResult.rows[0];
    if (experiment.status !== 'running') {
      return res.status(400).json({ error: 'Experimento no activo' });
    }

    const existing = await pool.query(
      user_id
        ? 'SELECT variant FROM experiment_assignments WHERE experiment_key = $1 AND user_id = $2'
        : 'SELECT variant FROM experiment_assignments WHERE experiment_key = $1 AND visitor_id = $2',
      [experiment_key, user_id || visitor_id]
    );

    if (existing.rows.length) {
      return res.json({ experiment_key, variant: existing.rows[0].variant, sticky: true });
    }

    const variants = Array.isArray(experiment.variants) ? experiment.variants : [];
    if (!variants.length) {
      return res.status(400).json({ error: 'Experimento sin variantes' });
    }

    const identity = String(user_id || visitor_id);
    const variant = pickVariant(experiment_key, variants, identity);

    await pool.query(
      `INSERT INTO experiment_assignments (experiment_key, user_id, visitor_id, variant)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT DO NOTHING`,
      [experiment_key, user_id || null, visitor_id || null, variant]
    );

    await trackEvent({
      eventName: 'experiment_exposure',
      userId: user_id || null,
      visitorId: visitor_id || null,
      metadata: { experiment_key, variant },
    });

    res.json({ experiment_key, variant, sticky: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/convert', async (req, res) => {
  try {
    const { experiment_key, user_id, visitor_id, metric_key, value = 1 } = req.body || {};
    if (!experiment_key || !metric_key || (!user_id && !visitor_id)) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const assignment = await pool.query(
      user_id
        ? 'SELECT variant FROM experiment_assignments WHERE experiment_key = $1 AND user_id = $2 LIMIT 1'
        : 'SELECT variant FROM experiment_assignments WHERE experiment_key = $1 AND visitor_id = $2 LIMIT 1',
      [experiment_key, user_id || visitor_id]
    );
    if (!assignment.rows.length) {
      return res.status(404).json({ error: 'No existe asignacion para ese experimento' });
    }

    const variant = assignment.rows[0].variant;

    await pool.query(
      `INSERT INTO experiment_conversions (experiment_key, user_id, visitor_id, variant, metric_key, value)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [experiment_key, user_id || null, visitor_id || null, variant, metric_key, Number(value) || 1]
    );

    await trackEvent({
      eventName: 'experiment_conversion',
      userId: user_id || null,
      visitorId: visitor_id || null,
      metadata: { experiment_key, variant, metric_key, value: Number(value) || 1 },
    });

    res.status(201).json({ ok: true, variant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const participants = await pool.query(
      `SELECT variant, COUNT(*)::int AS participants
       FROM experiment_assignments
       WHERE experiment_key = $1
       GROUP BY variant
       ORDER BY variant`,
      [key]
    );

    const conversions = await pool.query(
      `SELECT variant, metric_key, COUNT(*)::int AS conversions, COALESCE(SUM(value),0) AS sum_value
       FROM experiment_conversions
       WHERE experiment_key = $1
       GROUP BY variant, metric_key
       ORDER BY variant, metric_key`,
      [key]
    );

    res.json({
      experiment_key: key,
      participants: participants.rows,
      conversions: conversions.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
