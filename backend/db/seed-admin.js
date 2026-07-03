// One-time setup script: creates (or re-points) the first Admin account
// from environment variables. There is a single Admin role on this
// platform (no separate super admin) — this account has full access,
// including Staff Accounts and Company/Settings management.
//
// Run it explicitly, once, after configuring backend/.env:
//
//   npm run seed:admin
//
// Re-running it is safe: if the email already exists it just makes sure
// that account is role='admin' and (optionally) resets its password.
import dotenv from 'dotenv';
import { pool } from '../src/db/pool.js';
import { hashPassword, validatePasswordStrength } from '../src/utils/password.js';

dotenv.config();

async function seedAdmin() {
  const name = process.env.ADMIN_NAME || process.env.SUPERADMIN_NAME || 'Admin';
  const email = (process.env.ADMIN_EMAIL || process.env.SUPERADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || process.env.SUPERADMIN_PASSWORD || '';

  if (!email || !password) {
    console.error(
      'ADMIN_EMAIL and ADMIN_PASSWORD must be set in backend/.env before running this script.'
    );
    process.exit(1);
  }

  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    console.error(`ADMIN_PASSWORD is invalid: ${passwordError}`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET
       role = 'admin',
       password_hash = EXCLUDED.password_hash,
       name = EXCLUDED.name,
       status = 'active'
     RETURNING id, email, role`,
    [name, email, passwordHash]
  );

  console.log('Admin ready:', result.rows[0]);
  await pool.end();
}

seedAdmin().catch((err) => {
  console.error('Failed to seed Admin:', err);
  process.exit(1);
});
