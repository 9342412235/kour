import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = express.Router();

function serializeCustomer(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatar_url,
    status: row.status,
    joined: row.created_at,
    orderCount: Number(row.order_count || 0),
    totalSpent: Number(row.total_spent || 0),
    lastOrderAt: row.last_order_at,
    openTickets: Number(row.open_tickets || 0),
  };
}

// CRM list: every customer with aggregated lifetime-value stats.
router.get('/customers', requireAuth, requireRole('admin', 'support'), asyncHandler(async (req, res) => {
  const { search } = req.query;
  const params = [];
  let where = `WHERE u.role = 'customer'`;
  if (search) {
    params.push(`%${search}%`);
    where += ` AND (u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
  }
  const result = await query(
    `SELECT u.*,
        COUNT(DISTINCT o.id) AS order_count,
        COALESCE(SUM(o.total) FILTER (WHERE o.payment_status = 'paid'), 0) AS total_spent,
        MAX(o.created_at) AS last_order_at,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status != 'resolved') AS open_tickets
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id
     LEFT JOIN tickets t ON t.customer_id = u.id
     ${where}
     GROUP BY u.id
     ORDER BY total_spent DESC, u.created_at DESC`,
    params
  );
  res.json(result.rows.map(serializeCustomer));
}));

// CRM customer 360: profile + order history + ticket history + notes + addresses.
router.get('/customers/:id', requireAuth, requireRole('admin', 'support'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [userResult, orders, tickets, notes, addresses] = await Promise.all([
    query(`SELECT * FROM users WHERE id = $1 AND role = 'customer'`, [id]),
    query(`SELECT id, order_number, status, payment_status, total, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC`, [id]),
    query(
      `SELECT t.id, t.ticket_no, t.subject, t.status, t.priority, t.created_at, a.name AS assignee_name
       FROM tickets t LEFT JOIN users a ON a.id = t.assignee_id
       WHERE t.customer_id = $1 ORDER BY t.created_at DESC`,
      [id]
    ),
    query(
      `SELECT n.id, n.note, n.created_at, a.name AS author_name
       FROM crm_notes n LEFT JOIN users a ON a.id = n.author_id
       WHERE n.customer_id = $1 ORDER BY n.created_at DESC`,
      [id]
    ),
    query(`SELECT * FROM addresses WHERE user_id = $1`, [id]),
  ]);

  if (!userResult.rows[0]) return res.status(404).json({ error: 'Customer not found' });
  const u = userResult.rows[0];

  res.json({
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatar_url,
    status: u.status,
    joined: u.created_at,
    orders: orders.rows.map((o) => ({
      id: o.id, orderNumber: o.order_number, status: o.status, paymentStatus: o.payment_status,
      total: Number(o.total), createdAt: o.created_at,
    })),
    tickets: tickets.rows.map((t) => ({
      id: t.id, ticketNo: t.ticket_no, subject: t.subject, status: t.status,
      priority: t.priority, assignee: t.assignee_name || 'Unassigned', createdAt: t.created_at,
    })),
    notes: notes.rows.map((n) => ({ id: n.id, note: n.note, author: n.author_name || 'Staff', createdAt: n.created_at })),
    addresses: addresses.rows,
  });
}));

router.post('/customers/:id/notes', requireAuth, requireRole('admin', 'support'), asyncHandler(async (req, res) => {
  const { note } = req.body;
  if (!note || !note.trim()) return res.status(400).json({ error: 'note is required' });
  const customer = await query(`SELECT id FROM users WHERE id = $1 AND role = 'customer'`, [req.params.id]);
  if (!customer.rows[0]) return res.status(404).json({ error: 'Customer not found' });
  const result = await query(
    `INSERT INTO crm_notes (customer_id, author_id, note) VALUES ($1,$2,$3) RETURNING *`,
    [req.params.id, req.user.id, note.trim()]
  );
  res.status(201).json({ id: result.rows[0].id, note: result.rows[0].note, author: req.user.name, createdAt: result.rows[0].created_at });
}));

router.delete('/notes/:noteId', requireAuth, requireRole('admin', 'support'), asyncHandler(async (req, res) => {
  await query('DELETE FROM crm_notes WHERE id = $1', [req.params.noteId]);
  res.json({ success: true });
}));

export default router;
