import rateLimit from 'express-rate-limit';

// ---- NoSQL-injection / prototype-pollution guard -------------------------------------------
// Strips keys such as {"$ne": null} or "__proto__" from anything the client sends.
const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function clean(value, depth = 0) {
  if (depth > 20) {
    const err = new Error('Request data is nested too deeply.');
    err.status = 400;
    throw err;
  }
  if (Array.isArray(value)) return value.map(v => clean(v, depth + 1));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (key.startsWith('$') || BLOCKED_KEYS.has(key)) continue;
      out[key] = clean(val, depth + 1);
    }
    return out;
  }
  return value;
}

export function sanitizeRequest(req, _res, next) {
  try {
    if (req.body) req.body = clean(req.body);
    if (req.query) req.query = clean(req.query);
    if (req.params) req.params = clean(req.params);
    next();
  } catch (err) {
    next(err);
  }
}

// ---- Rate limiting --------------------------------------------------------------------------
const tooMany = message => ({ message });

// Whole API: generous, stops scripted abuse.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooMany('Too many requests. Please slow down and try again shortly.')
});

// Login: slows password guessing. Successful logins don't count against the limit.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooMany('Too many failed login attempts. Please try again in 15 minutes.')
});

// Registration: stops mass account creation.
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooMany('Too many accounts created from this network. Please try again later.')
});
