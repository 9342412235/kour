/**
 * mailer.js — Nodemailer transporter with Gmail App Password support.
 *
 * SETUP (Gmail):
 *   1. Enable 2-Step Verification on the sending Gmail account.
 *   2. Go to: Google Account → Security → 2-Step Verification → App passwords.
 *   3. Generate an App Password for "Mail" (16 characters, no spaces).
 *   4. In backend/.env set:
 *        SMTP_HOST=smtp.gmail.com
 *        SMTP_PORT=465
 *        SMTP_USER=youraddress@gmail.com
 *        SMTP_PASS=xxxx xxxx xxxx xxxx     ← 16-char App Password
 *        SMTP_FROM="The Kour <youraddress@gmail.com>"
 *
 *   If SMTP vars are not set, every send falls back to console.log so local
 *   development never fails silently or needs a real inbox.
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter = null;

/**
 * Returns (and caches) the Nodemailer transporter.
 * Supports any SMTP provider. For Gmail, SMTP_PORT=465 uses TLS/SSL.
 */
function getTransporter() {
  if (transporter) return transporter;

  const port = Number(process.env.SMTP_PORT || 587);
  const isGmail = (process.env.SMTP_HOST || '').toLowerCase().includes('gmail');

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // Port 465 → SSL, port 587 → STARTTLS, or let Gmail handle it via service
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      // For Gmail this must be a 16-character App Password, not your login
      // password. Generate one at: myaccount.google.com → Security → App passwords.
      pass: process.env.SMTP_PASS,
    },
    ...(isGmail
      ? {
          // Gmail rejects connections where the sender name in the "From"
          // header doesn't match the authenticated account, so we strip tls
          // errors in dev but keep strict in production.
          tls: process.env.NODE_ENV !== 'production' ? { rejectUnauthorized: false } : undefined,
        }
      : {}),
  });
  return transporter;
}

/** Force the cached transporter to be rebuilt on next send (useful after
 *  changing SMTP env vars at runtime, e.g. in tests). */
export function resetTransporter() {
  transporter = null;
}

const FROM = () => process.env.SMTP_FROM || 'The Kour <no-reply@thekour.com>';

// ── Helpers ──────────────────────────────────────────────────────────────────

function devLog(label, ...args) {
  // eslint-disable-next-line no-console
  console.log(`\n[mail:dev] ${label}`, ...args, '\n');
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Sends the 6-digit OTP for forgot-password (and any other purpose).
 * `purpose` is a human-readable phrase, e.g. "reset your password".
 */
export async function sendOtpEmail(toEmail, code, { purpose = 'verify your request', minutes = 10 } = {}) {
  if (!smtpConfigured()) {
    devLog(`OTP for ${toEmail} (${purpose}):`, code, `(expires in ${minutes} min)`);
    return { delivered: false, devCode: code };
  }

  await getTransporter().sendMail({
    from: FROM(),
    to: toEmail,
    subject: `Your The Kour verification code: ${code}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;border:1px solid #e5e7eb;border-radius:8px;">
        <h2 style="font-size:20px;margin:0 0 8px;">The Kour</h2>
        <p style="color:#6b7280;margin:0 0 24px;font-size:14px;">Use the code below to ${purpose}:</p>
        <div style="text-align:center;background:#f9fafb;border-radius:8px;padding:24px;margin-bottom:24px;">
          <span style="font-size:40px;font-weight:700;letter-spacing:10px;color:#111;">${code}</span>
        </div>
        <p style="color:#6b7280;font-size:13px;margin:0;">
          This code expires in <strong>${minutes} minutes</strong>.<br/>
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  return { delivered: true };
}

/**
 * Sends the legacy password-reset link email. Still used for any existing
 * link-based tokens that were issued before the OTP migration.
 */
export async function sendResetPasswordEmail(toEmail, resetUrl) {
  if (!smtpConfigured()) {
    devLog(`Password reset for ${toEmail} — reset link:`, resetUrl);
    return { delivered: false, devLink: resetUrl };
  }

  await getTransporter().sendMail({
    from: FROM(),
    to: toEmail,
    subject: 'Reset your The Kour password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;border:1px solid #e5e7eb;border-radius:8px;">
        <h2 style="font-size:20px;margin:0 0 8px;">The Kour</h2>
        <p style="margin:0 0 24px;font-size:14px;color:#374151;">We received a request to reset your password.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">Reset password</a>
        <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  return { delivered: true };
}

/**
 * Generic notification email (low stock, new order, backup failure, etc.)
 */
export async function sendNotificationEmail(toEmail, subject, html) {
  if (!smtpConfigured()) {
    devLog(`Notification to ${toEmail}:`, subject);
    return { delivered: false };
  }
  await getTransporter().sendMail({
    from: FROM(),
    to: toEmail,
    subject,
    html,
  });
  return { delivered: true };
}

/**
 * Tests the current SMTP configuration by sending a test message.
 * Returns { success: true } or throws with a descriptive error.
 */
export async function testSmtpConnection(toEmail) {
  if (!smtpConfigured()) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS in backend/.env');
  }
  await getTransporter().sendMail({
    from: FROM(),
    to: toEmail,
    subject: 'The Kour — SMTP test',
    html: `<p>Your SMTP configuration is working correctly. This test was sent from the Admin settings panel.</p>`,
  });
  return { success: true, deliveredTo: toEmail };
}
