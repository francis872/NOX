// frontend/src/utils/security.js — Client-side security utilities

// ─── Password strength ────────────────────────────────────────────────────────
export function passwordStrength(password) {
  if (!password) return { score: 0, label: '', color: '#334155', checks: {} };

  const checks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number:    /[0-9]/.test(password),
    symbol:    /[^A-Za-z0-9]/.test(password),
    long:      password.length >= 12,
  };

  const score = [checks.length, checks.uppercase || checks.lowercase, checks.number, checks.symbol, checks.long]
    .filter(Boolean).length;

  const map = {
    0: { label: '',          color: '#334155' },
    1: { label: 'Muy débil', color: '#ef4444' },
    2: { label: 'Débil',     color: '#f97316' },
    3: { label: 'Moderada',  color: '#fbbf24' },
    4: { label: 'Fuerte',    color: '#22c55e' },
    5: { label: 'Muy fuerte',color: '#10b981' },
  };

  return { score, checks, ...map[score] };
}

// ─── Age calculator ───────────────────────────────────────────────────────────
export function calcAge(dateString) {
  if (!dateString) return null;
  const birth = new Date(dateString);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ─── Input sanitizer ─────────────────────────────────────────────────────────
export function sanitize(str) {
  if (typeof str !== 'string') return str;
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
  return str.replace(/[&<>"']/g, c => map[c]).trim();
}

// ─── Session helpers ──────────────────────────────────────────────────────────
export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('user')) || null; } catch { return null; }
}

export function isMinor() {
  const user = getStoredUser();
  return !!user?.is_minor;
}
