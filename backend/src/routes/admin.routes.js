import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = express.Router();

router.get('/overview', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const [revenue, orders, users, tickets, lowStock] = await Promise.all([
    query(`SELECT COALESCE(SUM(total),0) AS total FROM orders WHERE payment_status = 'paid'`),
    query(`SELECT COUNT(*) FROM orders`),
    query(`SELECT COUNT(*) FILTER (WHERE status='active') AS active, COUNT(*) FILTER (WHERE status='disabled') AS disabled FROM users`),
    query(`SELECT COUNT(*) FILTER (WHERE status != 'resolved') AS open, COUNT(*) FILTER (WHERE sla_due_at < now() AND status != 'resolved') AS overdue FROM tickets`),
    query(`SELECT COUNT(*) FROM products WHERE is_active=true AND stock <= low_stock_threshold`),
  ]);

  res.json({
    totalRevenue: Number(revenue.rows[0].total),
    totalOrders: Number(orders.rows[0].count),
    activeUsers: Number(users.rows[0].active),
    disabledUsers: Number(users.rows[0].disabled),
    openTickets: Number(tickets.rows[0].open),
    overdueTickets: Number(tickets.rows[0].overdue),
    lowStockCount: Number(lowStock.rows[0].count),
  });
}));

// ---------- Logs & Audit (read-only for Admin; full management lives under /api/admin/management) ----------
router.get('/audit-logs', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const { action, page = 1, limit = 50 } = req.query;
  const conditions = [];
  const params = [];
  if (action) {
    params.push(`%${action}%`);
    conditions.push(`action ILIKE $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const result = await query(
    `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json(result.rows.map((r) => ({
    id: r.id,
    actorName: r.actor_name,
    actorRole: r.actor_role,
    action: r.action,
    entityType: r.entity_type,
    entityId: r.entity_id,
    details: r.details,
    createdAt: r.created_at,
  })));
}));

export default router;
