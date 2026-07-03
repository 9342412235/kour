import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { query } from '../db/pool.js';
import { notifyUser, notifyRoles } from '../utils/notify.js';

const router = express.Router();

function serializeTicket(row) {
  return {
    id: row.id,
    ticketNo: row.ticket_no,
    subject: row.subject,
    description: row.description,
    customer: row.customer_name,
    customerId: row.customer_id,
    priority: row.priority,
    status: row.status,
    assignee: row.assignee_name || 'Unassigned',
    assigneeId: row.assignee_id,
    assigneeRole: row.assignee_role || null,
    escalated: row.escalated,
    slaDueAt: row.sla_due_at,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

function genTicketNo() {
  return `TCK-${Math.floor(500 + Math.random() * 499)}`;
}

const TICKET_SELECT = `
  SELECT t.*, c.name AS customer_name, a.name AS assignee_name, a.role AS assignee_role
  FROM tickets t
  LEFT JOIN users c ON c.id = t.customer_id
  LEFT JOIN users a ON a.id = t.assignee_id
`;

// A ticket is a three-way thread: the customer who raised it, the support
// agent assigned to it, and admin who has full oversight of everything.
// Anyone outside those three roles for THIS ticket gets a 403.
async function loadTicketWithAccess(req, res) {
  const result = await query(`${TICKET_SELECT} WHERE t.id = $1`, [req.params.id]);
  const ticket = result.rows[0];
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return null;
  }
  const isOwner = ticket.customer_id === req.user.id;
  const isStaff = req.user.role === 'admin' || req.user.role === 'support';
  if (!isOwner && !isStaff) {
    res.status(403).json({ error: 'You do not have access to this ticket' });
    return null;
  }
  return ticket;
}

// Admin + support: full queue across all three parties.
router.get('/', requireAuth, requireRole('admin', 'support'), asyncHandler(async (req, res) => {
  const result = await query(`${TICKET_SELECT} ORDER BY t.escalated DESC, t.created_at DESC`);
  res.json(result.rows.map(serializeTicket));
}));

// Customer: only their own tickets.
router.get('/my', requireAuth, asyncHandler(async (req, res) => {
  const result = await query(`${TICKET_SELECT} WHERE t.customer_id = $1 ORDER BY t.created_at DESC`, [req.user.id]);
  res.json(result.rows.map(serializeTicket));
}));

router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const ticket = await loadTicketWithAccess(req, res);
  if (!ticket) return;
  res.json(serializeTicket(ticket));
}));

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { subject, description, priority = 'medium' } = req.body;
  if (!subject) return res.status(400).json({ error: 'subject is required' });
  const slaHours = { urgent: 2, high: 4, medium: 12, low: 24 }[priority] || 12;
  const ticketNo = genTicketNo();
  const result = await query(
    `INSERT INTO tickets (ticket_no, customer_id, subject, description, priority, sla_due_at)
     VALUES ($1,$2,$3,$4,$5, now() + ($6 || ' hours')::interval) RETURNING *`,
    [ticketNo, req.user.id, subject, description || '', priority, slaHours]
  );

  await notifyRoles(['admin', 'support'], 'New support ticket', `${ticketNo}: ${subject}`);

  res.status(201).json(serializeTicket({ ...result.rows[0], customer_name: req.user.name }));
}));

// Customers can edit their own ticket's subject/description while it's
// still open. Admin/support use this same endpoint for status, priority,
// assignee, and escalation — kept on one route since both branches share
// the same "load -> check -> patch -> notify" shape.
router.patch('/:id', requireAuth, asyncHandler(async (req, res) => {
  const existing = await query(`${TICKET_SELECT} WHERE t.id = $1`, [req.params.id]);
  if (!existing.rows[0]) return res.status(404).json({ error: 'Ticket not found' });
  const ticket = existing.rows[0];

  const isOwner = ticket.customer_id === req.user.id;
  const isStaff = req.user.role === 'admin' || req.user.role === 'support';
  if (!isOwner && !isStaff) {
    return res.status(403).json({ error: 'You do not have access to this ticket' });
  }

  const sets = [];
  const params = [];

  if (isOwner && !isStaff) {
    // Customer editing their own ticket — only the original request text,
    // and only before staff have started working it.
    if (ticket.status !== 'open') {
      return res.status(400).json({ error: 'This ticket is already being worked on and can no longer be edited' });
    }
    const { subject, description } = req.body;
    if (subject !== undefined) { params.push(subject); sets.push(`subject = $${params.length}`); }
    if (description !== undefined) { params.push(description); sets.push(`description = $${params.length}`); }
  } else {
    if (ticket.escalated && req.user.role !== 'admin' && req.body.escalated === false) {
      return res.status(403).json({ error: 'Only an admin can resolve an escalation' });
    }
    const { status, priority, assigneeId, escalated, subject, description } = req.body;
    if (status) { params.push(status); sets.push(`status = $${params.length}`); }
    if (priority) { params.push(priority); sets.push(`priority = $${params.length}`); }
    if (assigneeId !== undefined) { params.push(assigneeId); sets.push(`assignee_id = $${params.length}`); }
    if (escalated !== undefined) { params.push(escalated); sets.push(`escalated = $${params.length}`); }
    if (subject !== undefined) { params.push(subject); sets.push(`subject = $${params.length}`); }
    if (description !== undefined) { params.push(description); sets.push(`description = $${params.length}`); }

    if (status === 'resolved') {
      await notifyUser(ticket.customer_id, 'Ticket resolved', `${ticket.ticket_no}: ${ticket.subject} has been marked resolved.`);
    }
  }

  if (!sets.length) return res.status(400).json({ error: 'No valid fields to update' });
  params.push(req.params.id);
  const result = await query(`UPDATE tickets SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  if (!result.rows[0]) return res.status(404).json({ error: 'Ticket not found' });
  const full = await query(`${TICKET_SELECT} WHERE t.id = $1`, [req.params.id]);
  res.json(serializeTicket(full.rows[0]));
}));

// Customers can withdraw their own ticket; admin/support can remove any
// ticket from the queue (e.g. spam, duplicate).
router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const existing = await query('SELECT * FROM tickets WHERE id = $1', [req.params.id]);
  const ticket = existing.rows[0];
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const isOwner = ticket.customer_id === req.user.id;
  const isStaff = req.user.role === 'admin' || req.user.role === 'support';
  if (!isOwner && !isStaff) {
    return res.status(403).json({ error: 'You do not have access to this ticket' });
  }

  await query('DELETE FROM tickets WHERE id = $1', [req.params.id]);

  if (isStaff && !isOwner) {
    await notifyUser(ticket.customer_id, 'Ticket removed', `${ticket.ticket_no}: ${ticket.subject} was removed by support.`);
  }

  res.json({ success: true });
}));

// A support agent escalates a ticket to admin (e.g. needs sign-off, refund
// approval, or a policy exception). This surfaces it at the top of the admin
// queue, making the conversation three-way: customer, agent, and admin.
router.post('/:id/escalate', requireAuth, requireRole('support', 'admin'), asyncHandler(async (req, res) => {
  const result = await query(
    `UPDATE tickets SET escalated = true, priority = 'urgent' WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Ticket not found' });
  const full = await query(`${TICKET_SELECT} WHERE t.id = $1`, [req.params.id]);
  res.json(serializeTicket(full.rows[0]));
}));

router.post('/:id/messages', requireAuth, asyncHandler(async (req, res) => {
  const ticket = await loadTicketWithAccess(req, res);
  if (!ticket) return;
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'body is required' });
  const result = await query(
    `INSERT INTO ticket_messages (ticket_id, author_id, body) VALUES ($1,$2,$3) RETURNING *`,
    [req.params.id, req.user.id, body]
  );

  // Notify whoever didn't just send this message.
  if (req.user.role === 'customer') {
    if (ticket.assignee_id) {
      await notifyUser(ticket.assignee_id, 'New reply on ticket', `${ticket.ticket_no}: ${ticket.subject}`);
    } else {
      await notifyRoles(['admin', 'support'], 'New reply on ticket', `${ticket.ticket_no}: ${ticket.subject}`);
    }
  } else {
    await notifyUser(ticket.customer_id, 'New reply on your ticket', `${ticket.ticket_no}: ${ticket.subject}`);
  }

  res.status(201).json({
    id: result.rows[0].id,
    ticketId: result.rows[0].ticket_id,
    body: result.rows[0].body,
    createdAt: result.rows[0].created_at,
    authorId: req.user.id,
    authorName: req.user.name,
    authorRole: req.user.role,
  });
}));

// Authors can retract their own message; admins can remove any message
// (moderation) on a ticket they have access to.
router.delete('/:id/messages/:messageId', requireAuth, asyncHandler(async (req, res) => {
  const ticket = await loadTicketWithAccess(req, res);
  if (!ticket) return;

  const msgResult = await query('SELECT * FROM ticket_messages WHERE id = $1 AND ticket_id = $2', [req.params.messageId, req.params.id]);
  const message = msgResult.rows[0];
  if (!message) return res.status(404).json({ error: 'Message not found' });

  const isAuthor = message.author_id === req.user.id;
  if (!isAuthor && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'You can only delete your own replies' });
  }

  await query('DELETE FROM ticket_messages WHERE id = $1', [req.params.messageId]);
  res.json({ success: true });
}));

router.get('/:id/messages', requireAuth, asyncHandler(async (req, res) => {
  const ticket = await loadTicketWithAccess(req, res);
  if (!ticket) return;
  const result = await query(
    `SELECT m.*, u.name AS author_name, u.role AS author_role FROM ticket_messages m
     LEFT JOIN users u ON u.id = m.author_id WHERE ticket_id = $1 ORDER BY created_at`,
    [req.params.id]
  );
  res.json(result.rows.map((m) => ({
    id: m.id,
    ticketId: m.ticket_id,
    body: m.body,
    createdAt: m.created_at,
    authorId: m.author_id,
    authorName: m.author_name,
    authorRole: m.author_role,
  })));
}));

export default router;
