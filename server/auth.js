/* Password hashing, sessions, rate limiting */
const crypto = require('crypto');
const { q, users } = require('./db');

const COOKIE = 'fs_sid';
const SESSION_MS = 7 * 24 * 3600 * 1000;
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const h = crypto.scryptSync(String(pw), salt, 64).toString('hex');
  return `scrypt$${salt}$${h}`;
}
function verifyPassword(pw, stored) {
  try {
    const [alg, salt, h] = String(stored).split('$');
    if (alg !== 'scrypt') return false;
    const a = Buffer.from(h, 'hex'), b = crypto.scryptSync(String(pw), salt, 64);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch { return false; }
}

function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  q('INSERT INTO sessions(token,user_id,expires) VALUES(?,?,?)').run(sha(token), userId, Date.now() + SESSION_MS);
  const secure = process.env.COOKIE_SECURE === '1' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}${secure}`);
}
function destroySession(req, res) {
  const t = readToken(req);
  if (t) q('DELETE FROM sessions WHERE token=?').run(sha(t));
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
}
function readToken(req) {
  const m = /(?:^|;\s*)fs_sid=([^;]+)/.exec(req.headers.cookie || '');
  return m ? m[1] : null;
}
/* attaches req.user (or null) */
function loadUser(req, _res, next) {
  req.user = null;
  const t = readToken(req);
  if (t) {
    const s = q('SELECT user_id,expires FROM sessions WHERE token=?').get(sha(t));
    if (s && s.expires > Date.now()) req.user = users.byId(s.user_id);
    else if (s) q('DELETE FROM sessions WHERE token=?').run(sha(t));
  }
  next();
}
const requireUser = (req, res, next) => req.user ? next() : res.status(401).json({ error: 'Please log in.' });
const requireRole = (...roles) => (req, res, next) =>
  !req.user ? res.status(401).json({ error: 'Please log in.' })
    : roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Not allowed.' });

/* tiny in-memory fixed-window limiter, keyed by ip+name */
const hits = new Map();
function limit(name, max, windowMs) {
  return (req, res, next) => {
    const k = name + ':' + req.ip, now = Date.now();
    const h = hits.get(k);
    if (!h || h.reset < now) { hits.set(k, { n: 1, reset: now + windowMs }); return next(); }
    if (++h.n > max) return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    next();
  };
}
setInterval(() => { const n = Date.now(); for (const [k, v] of hits) if (v.reset < n) hits.delete(k); }, 60000).unref();
setInterval(() => { q('DELETE FROM sessions WHERE expires<?').run(Date.now()); q('DELETE FROM resets WHERE expires<?').run(Date.now()); }, 3600000).unref();

module.exports = { hashPassword, verifyPassword, createSession, destroySession, loadUser, requireUser, requireRole, limit, sha };
