import { query } from '../db/pool.js';

// Create a single notification for one user. Safe to call with a falsy
// userId (e.g. an order with no owner) — it just no-ops.
export async function notifyUser(userId, title, body = '') {
  if (!userId) return;
  await query(
    `INSERT INTO notifications (user_id, title, body) VALUES ($1,$2,$3)`,
    [userId, title, body]
  );
}

// Fan a notification out to every active user holding one of the given
// roles. Used for staff-facing events (new ticket, low stock, etc.) where
// there's no single "owner" to notify.
export async function notifyRoles(roles, title, body = '') {
  const result = await query(
    `SELECT id FROM users WHERE role = ANY($1::text[]) AND status = 'active'`,
    [roles]
  );
  for (const row of result.rows) {
    await query(
      `INSERT INTO notifications (user_id, title, body) VALUES ($1,$2,$3)`,
      [row.id, title, body]
    );
  }
}
