import { verifyToken, getCookieName } from '../utils/jwt.js';
import { query } from '../db/pool.js';

export function getTokenFromReq(req) {
  const cookieName = getCookieName(req);
  if (req.cookies?.[cookieName]) return req.cookies[cookieName];
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

export async function requireAuth(req, res, next) {
  try {
    const token = getTokenFromReq(req);
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const payload = verifyToken(token);
    const result = await query('SELECT * FROM users WHERE id = $1', [payload.sub]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.status === 'disabled') return res.status(403).json({ error: 'Account disabled' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

// Attaches req.user if present, but does not fail the request if absent.
export async function optionalAuth(req, _res, next) {
  try {
    const token = getTokenFromReq(req);
    if (!token) return next();
    const payload = verifyToken(token);
    const result = await query('SELECT * FROM users WHERE id = $1', [payload.sub]);
    if (result.rows[0] && result.rows[0].status !== 'disabled') {
      req.user = result.rows[0];
    }
    next();
  } catch {
    next();
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Admin always has access to Tax & Invoicing — there is only one admin
// role now, so this no longer depends on a separate super admin flag.
export function requireTaxAccess(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Insufficient permissions' });
}
