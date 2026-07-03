import express from 'express';
import crypto from 'crypto';
import passport from '../config/passport.js';
import { signToken, cookieOptions, COOKIE_NAME, getCookieName, APP_COOKIE_NAMES } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.js';
import { sendOtpEmail } from '../utils/mailer.js';
import { asyncHandler } from '../middleware/error.js';
import { query } from '../db/pool.js';

const router = express.Router();

const OTP_EXPIRES_MIN = Number(process.env.OTP_EXPIRES_MIN || 10);
const MAX_ATTEMPTS = 5;

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}
function generateCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

function serializeUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    hasPassword: Boolean(row.password_hash),
  };
}

// ---------- Google OAuth ----------

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed` }),
  (req, res) => {
    const token = signToken(req.user);
    res.cookie(APP_COOKIE_NAMES.customer, token, cookieOptions());
    // Redirect to home page so the customer sees the storefront, not their profile editor
    res.redirect(`${process.env.CLIENT_URL}/`);
  }
);

// ---------- JWT email/password auth ----------

router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  const passwordError = validatePasswordStrength(password);
  if (passwordError) return res.status(400).json({ error: passwordError });

  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await hashPassword(password);
  const result = await query(
    `INSERT INTO users (email, name, password_hash, role) VALUES ($1,$2,$3,'customer') RETURNING *`,
    [normalizedEmail, name, passwordHash]
  );
  const user = result.rows[0];
  const token = signToken(user);
  res.cookie(getCookieName(req), token, cookieOptions());
  res.status(201).json(serializeUser(user));
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const normalizedEmail = String(email).toLowerCase().trim();
  const result = await query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
  const user = result.rows[0];

  if (!user || !user.password_hash) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (user.status === 'disabled') {
    return res.status(403).json({ error: 'Account disabled' });
  }
  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken(user);
  res.cookie(getCookieName(req), token, cookieOptions());
  res.json(serializeUser(user));
}));

// ── Forgot-password: OTP-based (Step 1) ────────────────────────────────────
// POST /auth/forgot-password  { email }
// Sends a 6-digit OTP to the registered email.  Always returns the same
// generic message so we don't reveal which emails are registered.
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });
  const normalizedEmail = String(email).toLowerCase().trim();

  const genericResponse = {
    success: true,
    message: 'If an account exists for that email, a 6-digit OTP has been sent.',
  };

  const result = await query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
  const user = result.rows[0];
  if (!user) return res.json(genericResponse);

  // Invalidate any previous forgot_password OTPs for this user
  await query(
    `UPDATE otp_codes SET consumed_at = now()
     WHERE user_id = $1 AND purpose = 'forgot_password' AND consumed_at IS NULL`,
    [user.id]
  );

  const code = generateCode();
  const codeHash = hashCode(code);
  await query(
    `INSERT INTO otp_codes (user_id, purpose, code_hash, new_value, expires_at)
     VALUES ($1,'forgot_password',$2,NULL, now() + ($3 || ' minutes')::interval)`,
    [user.id, codeHash, OTP_EXPIRES_MIN]
  );

  const mailResult = await sendOtpEmail(normalizedEmail, code, {
    purpose: 'reset your password',
    minutes: OTP_EXPIRES_MIN,
  });

  if (!mailResult.delivered && process.env.NODE_ENV !== 'production') {
    return res.json({ ...genericResponse, devCode: mailResult.devCode });
  }
  res.json(genericResponse);
}));

// ── Forgot-password: OTP verify + set new password (Step 2) ────────────────
// POST /auth/verify-forgot-otp  { email, code, newPassword }
router.post('/verify-forgot-otp', asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'email, code and newPassword are required' });
  }
  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) return res.status(400).json({ error: passwordError });

  const userRes = await query('SELECT * FROM users WHERE email = $1', [String(email).toLowerCase().trim()]);
  const user = userRes.rows[0];
  if (!user) return res.status(400).json({ error: 'Invalid or expired code.' });

  const otpRes = await query(
    `SELECT * FROM otp_codes
     WHERE user_id = $1 AND purpose = 'forgot_password' AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [user.id]
  );
  const row = otpRes.rows[0];

  if (!row) return res.status(400).json({ error: 'No pending code. Please request a new one.' });
  if (new Date(row.expires_at) < new Date()) {
    return res.status(400).json({ error: 'This code has expired. Please request a new one.' });
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.' });
  }
  if (hashCode(String(code)) !== row.code_hash) {
    await query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1', [row.id]);
    return res.status(400).json({ error: 'Incorrect code.' });
  }

  await query('UPDATE otp_codes SET consumed_at = now() WHERE id = $1', [row.id]);
  const passwordHash = await hashPassword(newPassword);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, user.id]);

  res.json({ success: true, message: 'Password updated. You can now log in.' });
}));

// (Legacy link-based reset kept for backwards compatibility — still works
// if a link was emailed before this deploy.)
router.post('/reset-password/:token', asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'password is required' });
  const passwordError = validatePasswordStrength(password);
  if (passwordError) return res.status(400).json({ error: passwordError });

  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const result = await query(
    `SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > now()`,
    [hashedToken]
  );
  const user = result.rows[0];
  if (!user) return res.status(400).json({ error: 'This reset link is invalid or has expired' });

  const passwordHash = await hashPassword(password);
  await query(
    `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2`,
    [passwordHash, user.id]
  );
  res.json({ success: true, message: 'Password updated. You can now log in.' });
}));

// Current logged-in user
router.get('/me', requireAuth, (req, res) => {
  res.json(serializeUser(req.user));
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie(getCookieName(req), { path: '/' });
  // Clean up the old shared cookie too, in case it's still lingering
  // from before each dashboard had its own.
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ success: true });
});

export default router;
