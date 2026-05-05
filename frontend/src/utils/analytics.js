import axios from 'axios';

function getOrCreateVisitorId() {
  const key = 'nox_visitor_id';
  let value = localStorage.getItem(key);
  if (!value) {
    value = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, value);
  }
  return value;
}

function getOrCreateSessionId() {
  const key = 'nox_session_id';
  let value = sessionStorage.getItem(key);
  if (!value) {
    value = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(key, value);
  }
  return value;
}

export async function track(eventName, metadata = {}) {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    await axios.post('/api/analytics/events', {
      event_name: eventName,
      user_id: user?.id || null,
      visitor_id: getOrCreateVisitorId(),
      session_id: getOrCreateSessionId(),
      screen: window.location.pathname,
      platform: 'web',
      metadata,
    });
  } catch {
    // Ignore analytics failures.
  }
}

export async function assignExperiment(experimentKey) {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const visitorId = getOrCreateVisitorId();
    const res = await axios.post('/api/experiments/assign', {
      experiment_key: experimentKey,
      user_id: user?.id || null,
      visitor_id: user ? null : visitorId,
    });
    return res.data?.variant || null;
  } catch {
    return null;
  }
}

export async function convertExperiment(experimentKey, metricKey, value = 1) {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const visitorId = getOrCreateVisitorId();
    await axios.post('/api/experiments/convert', {
      experiment_key: experimentKey,
      metric_key: metricKey,
      user_id: user?.id || null,
      visitor_id: user ? null : visitorId,
      value,
    });
  } catch {
    // Ignore conversion failures.
  }
}
