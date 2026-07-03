import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { query } from '../db/pool.js';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.js';
import { uploadAvatar, publicUrl } from '../middleware/upload.js';

import { requestOtp, verifyOtp } from '../utils/otp.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

function serializeUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatar_url,
    role: row.role,
    status: row.status,
    joined: row.created_at,
  };
}

function serializeFullUser(updated) {
  return {
    id: updated.id,
    email: updated.email,
    name: updated.name,
    avatarUrl: updated.avatar_url,
    role: updated.role,
    status: updated.status,
    createdAt: updated.created_at,
    hasPassword: Boolean(updated.password_hash),
  };
}

// Upload a raw profile picture file (multipart/form-data, field "avatar").
router.post(
  '/me/avatar',
  requireAuth,
  (req, res, next) => uploadAvatar(req, res, (err) => (err ? res.status(400).json({ error: err.message }) : next())),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No avatar file was uploaded' });
    const url = publicUrl(req, req.file.path);
    const result = await query('UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING *', [url, req.user.id]);
    res.json(serializeFullUser(result.rows[0]));
  })
);

// Self-service profile edit: name, avatar, and (optionally) password change.
router.patch('/me', requireAuth, asyncHandler(async (req, res) => {
  const { name, avatarUrl, currentPassword, newPassword } = req.body;
  const sets = [];
  const params = [];

  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ error: 'name cannot be empty' });
    params.push(name.trim());
    sets.push(`name = $${params.length}`);
  }
  if (avatarUrl !== undefined) {
    params.push(avatarUrl || null);
    sets.push(`avatar_url = $${params.length}`);
  }

  if (newPassword) {
    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) return res.status(400).json({ error: passwordError });

    // If the account already has a password, the current one must be confirmed.
    if (req.user.password_hash) {
      const valid = await comparePassword(currentPassword || '', req.user.password_hash);
      if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
    }
    const passwordHash = await hashPassword(newPassword);
    params.push(passwordHash);
    sets.push(`password_hash = $${params.length}`);
  }

  if (!sets.length) return res.status(400).json({ error: 'No valid fields to update' });

  params.push(req.user.id);
  const result = await query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  res.json(serializeFullUser(result.rows[0]));
}));

router.get('/', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM users ORDER BY created_at DESC');
  res.json(result.rows.map(serializeUser));
}));

router.get('/agents', requireAuth, requireRole('admin', 'support'), asyncHandler(async (req, res) => {
  const result = await query(`SELECT * FROM users WHERE role = 'support' AND status = 'active' ORDER BY name`);
  res.json(result.rows.map(serializeUser));
}));

router.patch('/:id/role', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const { role } = req.body;
  // Promoting/demoting to 'admin' is intentionally NOT allowed through this
  // generic endpoint — that's handled via Settings → Staff Accounts
  // (/api/admin/management/staff), which also sets name/email/password.
  const valid = ['warehouse', 'support', 'blogger', 'customer'];
  if (!valid.includes(role)) return res.status(400).json({ error: `role must be one of ${valid.join(', ')}` });
  const result = await query(
    `UPDATE users SET role = $1 WHERE id = $2 AND role != 'admin' RETURNING *`,
    [role, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
  await logAudit(req, { action: 'user.role_change', entityType: 'user', entityId: result.rows[0].id, details: { role } });
  res.json(serializeUser(result.rows[0]));
}));

router.patch('/:id/status', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'disabled'].includes(status)) return res.status(400).json({ error: 'status must be active or disabled' });
  const result = await query(
    `UPDATE users SET status = $1 WHERE id = $2 AND role != 'admin' RETURNING *`,
    [status, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
  await logAudit(req, { action: 'user.status_change', entityType: 'user', entityId: result.rows[0].id, details: { status } });
  res.json(serializeUser(result.rows[0]));
}));

// ---------- OTP-protected email change ----------
// Step 1: send a 6-digit code to the NEW email address to prove ownership.
router.post('/me/request-email-otp', requireAuth, asyncHandler(async (req, res) => {
  const { newEmail } = req.body;
  if (!newEmail) return res.status(400).json({ error: 'newEmail is required' });
  const normalized = String(newEmail).toLowerCase().trim();

  const existing = await query('SELECT id FROM users WHERE email = $1', [normalized]);
  if (existing.rows.length > 0) return res.status(409).json({ error: 'An account with this email already exists' });

  const { devCode } = await requestOtp({
    userId: req.user.id,
    email: normalized,
    purpose: 'change_email',
    newValue: normalized,
  });
  res.json({ success: true, message: `Verification code sent to ${normalized}`, devCode });
}));

// Step 2: confirm the code and apply the new email.
router.post('/me/confirm-email-otp', requireAuth, asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code is required' });
  const { newValue } = await verifyOtp({ userId: req.user.id, purpose: 'change_email', code });
  const result = await query('UPDATE users SET email = $1 WHERE id = $2 RETURNING *', [newValue, req.user.id]);
  res.json(serializeFullUser(result.rows[0]));
}));

// ---------- OTP-protected password change ----------
// Step 1: send a 6-digit code to the account's CURRENT email.
router.post('/me/request-password-otp', requireAuth, asyncHandler(async (req, res) => {
  const { currentPassword } = req.body;
  if (req.user.password_hash) {
    const valid = await comparePassword(currentPassword || '', req.user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
  }
  const { devCode } = await requestOtp({ userId: req.user.id, email: req.user.email, purpose: 'change_password' });
  res.json({ success: true, message: `Verification code sent to ${req.user.email}`, devCode });
}));

// Step 2: confirm the code and set the new password.
router.post('/me/confirm-password-otp', requireAuth, asyncHandler(async (req, res) => {
  const { code, newPassword } = req.body;
  if (!code || !newPassword) return res.status(400).json({ error: 'code and newPassword are required' });
  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) return res.status(400).json({ error: passwordError });

  await verifyOtp({ userId: req.user.id, purpose: 'change_password', code });
  const passwordHash = await hashPassword(newPassword);
  const result = await query('UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING *', [passwordHash, req.user.id]);
  res.json(serializeFullUser(result.rows[0]));
}));

export default router;
