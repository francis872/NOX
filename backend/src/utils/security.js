// backend/src/utils/security.js — Utilidades de seguridad NOX
const jwt = require('jsonwebtoken');

// ─── In-memory rate limiter (resets on function cold-start in serverless) ────
const _attempts = new Map();
function createRateLimiter(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  return (req, res, next) => {
    const ip = (req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim();
    const now = Date.now();
    const entry = _attempts.get(ip);
    if (entry && now < entry.resetAt) {
      if (entry.count >= maxAttempts) {
        const wait = Math.ceil((entry.resetAt - now) / 60000);
        return res.status(429).json({ error: `Demasiados intentos. Espera ${wait} minuto(s).`, retryAfter: wait * 60 });
      }
      entry.count++;
    } else {
      _attempts.set(ip, { count: 1, resetAt: now + windowMs });
    }
    next();
  };
}

// ─── Input sanitization (prevent XSS / injection) ────────────────────────────
function sanitizeStr(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

function sanitizeBody(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === 'string' ? sanitizeStr(v) : v;
  }
  return out;
}

// ─── Password strength ────────────────────────────────────────────────────────
function validatePassword(pw) {
  if (!pw || pw.length < 8)   return { valid: false, error: 'La contraseña debe tener al menos 8 caracteres' };
  if (!/[A-Za-z]/.test(pw))  return { valid: false, error: 'Debe contener al menos una letra' };
  if (!/[0-9]/.test(pw))     return { valid: false, error: 'Debe contener al menos un número' };
  return { valid: true };
}

// ─── Age calculator ───────────────────────────────────────────────────────────
function calculateAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ─── JWT middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Autenticación requerida' });
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'noxsecret');
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// ─── Minor mode guard ─────────────────────────────────────────────────────────
function blockMinors(req, res, next) {
  if (req.user?.is_minor) return res.status(403).json({ error: 'Acción no disponible en Modo Menor' });
  next();
}

module.exports = { createRateLimiter, sanitizeBody, validatePassword, calculateAge, requireAuth, blockMinors };
