import crypto from 'crypto';
import { query } from '../db/pool.js';
import { sendOtpEmail } from './mailer.js';

const OTP_EXPIRES_MIN = Number(process.env.OTP_EXPIRES_MIN || 10);
const MAX_ATTEMPTS = 5;

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function generateCode() {
  // 6-digit numeric code, e.g. 042193
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

/**
 * Creates a one-time code for the given user + purpose, emails it, and
 * stores only its hash. `purpose` is one of 'change_email' | 'change_password'.
 * `newValue` is optional context to remember (e.g. the new email being
 * confirmed) so /verify can apply the change atomically.
 */
export async function requestOtp({ userId, email, purpose, newValue = null }) {
  const code = generateCode();
  const codeHash = hashCode(code);

  await query(
    `INSERT INTO otp_codes (user_id, purpose, code_hash, new_value, expires_at)
     VALUES ($1,$2,$3,$4, now() + ($5 || ' minutes')::interval)`,
    [userId, purpose, codeHash, newValue, OTP_EXPIRES_MIN]
  );

  const purposeLabel = purpose === 'change_email' ? 'confirm your new email address'
    : purpose === 'change_password' ? 'confirm your password change'
    : 'verify this request';

  const mailResult = await sendOtpEmail(email, code, { purpose: purposeLabel, minutes: OTP_EXPIRES_MIN });

  // In dev (no SMTP configured) hand the code back so it can be tested
  // without an inbox.
  return { sent: true, devCode: mailResult.delivered ? undefined : mailResult.devCode };
}

/**
 * Verifies a code for a user + purpose. Returns the stored `newValue` on
 * success (or null) and marks the code consumed. Throws a {status, message}
 * style error on failure.
 */
export async function verifyOtp({ userId, purpose, code }) {
  const result = await query(
    `SELECT * FROM otp_codes
     WHERE user_id = $1 AND purpose = $2 AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [userId, purpose]
  );
  const row = result.rows[0];

  if (!row) {
    const err = new Error('No pending verification code. Please request a new one.');
    err.status = 400;
    throw err;
  }
  if (new Date(row.expires_at) < new Date()) {
    const err = new Error('This code has expired. Please request a new one.');
    err.status = 400;
    throw err;
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    const err = new Error('Too many incorrect attempts. Please request a new code.');
    err.status = 429;
    throw err;
  }

  if (hashCode(String(code)) !== row.code_hash) {
    await query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1', [row.id]);
    const err = new Error('Incorrect code.');
    err.status = 400;
    throw err;
  }

  await query('UPDATE otp_codes SET consumed_at = now() WHERE id = $1', [row.id]);
  return { newValue: row.new_value };
}
