import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// Legacy single cookie name — kept only so we can clear it on logout for
// anyone who still has it from before dashboards got their own cookies.
export const COOKIE_NAME = process.env.COOKIE_NAME || 'thekour_token';

// ── Per-dashboard cookies ───────────────────────────────────────────────────
// Each frontend (customer/admin/warehouse/support/blogger) sends an
// `X-App` header on every request (see each frontend's src/lib/api.js).
// We use that to read/write a SEPARATE cookie per dashboard, so logging in
// on one dashboard never overwrites or hijacks the session on another —
// even though they all share the same backend domain.
export const APP_KEYS = ['customer', 'admin', 'warehouse', 'support', 'blogger'];

export const APP_COOKIE_NAMES = {
  customer: 'thekour_customer_token',
  admin: 'thekour_admin_token',
  warehouse: 'thekour_warehouse_token',
  support: 'thekour_support_token',
  blogger: 'thekour_blogger_token',
};

// Resolve which dashboard a request came from. Defaults to 'customer' so
// any old client code / direct API calls without the header still work.
export function getAppKey(req) {
  const raw = (req.headers['x-app'] || '').toString().toLowerCase().trim();
  return APP_KEYS.includes(raw) ? raw : 'customer';
}

export function getCookieName(req) {
  return APP_COOKIE_NAMES[getAppKey(req)];
}

export function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
}
