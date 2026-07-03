import express from 'express';
import path from 'path';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { query } from '../db/pool.js';
import { hashPassword, validatePasswordStrength } from '../utils/password.js';
import { runBackup, BACKUP_DIR } from '../utils/backup.js';
import { logAudit } from '../utils/audit.js';
import { rescheduleBackup } from '../server.js';

const router = express.Router();

// Roles an Admin is allowed to create/manage from Settings → Staff Accounts.
// There is only one Admin role now, so 'admin' is included here too —
// any admin can create/edit/disable other admin logins.
const STAFF_ROLES = ['admin', 'warehouse', 'support', 'blogger'];

router.use(requireAuth, requireRole('admin'));

function serializeStaff(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    canViewTaxInvoices: row.can_view_tax_invoices,
    createdAt: row.created_at,
  };
}

// ---------- Staff accounts (admin / warehouse / support / blogger logins) ----------

router.get('/staff', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT * FROM users WHERE role = ANY($1) ORDER BY created_at DESC`,
    [STAFF_ROLES]
  );
  res.json(result.rows.map(serializeStaff));
}));

router.post('/staff', asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password and role are required' });
  }
  if (!STAFF_ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of ${STAFF_ROLES.join(', ')}` });
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
    `INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING *`,
    [name.trim(), normalizedEmail, passwordHash, role]
  );
  await logAudit(req, { action: 'staff.create', entityType: 'user', entityId: result.rows[0].id, details: { email: result.rows[0].email, role: result.rows[0].role } });
  res.status(201).json(serializeStaff(result.rows[0]));
}));

router.patch('/staff/:id', asyncHandler(async (req, res) => {
  const { name, role, status, password, canViewTaxInvoices } = req.body;

  // Only ever touch staff rows through this endpoint — never customers or
  // other admin accounts.
  const current = await query(
    `SELECT * FROM users WHERE id = $1 AND role = ANY($2)`,
    [req.params.id, STAFF_ROLES]
  );
  if (!current.rows[0]) return res.status(404).json({ error: 'Staff account not found' });

  const sets = [];
  const params = [];

  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ error: 'name cannot be empty' });
    params.push(name.trim());
    sets.push(`name = $${params.length}`);
  }
  if (role !== undefined) {
    if (!STAFF_ROLES.includes(role)) {
      return res.status(400).json({ error: `role must be one of ${STAFF_ROLES.join(', ')}` });
    }
    params.push(role);
    sets.push(`role = $${params.length}`);
  }
  if (status !== undefined) {
    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ error: 'status must be active or disabled' });
    }
    params.push(status);
    sets.push(`status = $${params.length}`);
  }
  if (password) {
    const passwordError = validatePasswordStrength(password);
    if (passwordError) return res.status(400).json({ error: passwordError });
    params.push(await hashPassword(password));
    sets.push(`password_hash = $${params.length}`);
  }
  if (canViewTaxInvoices !== undefined) {
    // This flag only ever matters for the 'admin' role, but we don't
    // hard-block setting it on others — it simply has no effect for
    // roles that aren't checked by requireTaxAccess.
    params.push(Boolean(canViewTaxInvoices));
    sets.push(`can_view_tax_invoices = $${params.length}`);
  }

  if (!sets.length) return res.status(400).json({ error: 'No valid fields to update' });

  params.push(req.params.id);
  const result = await query(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  await logAudit(req, { action: 'staff.update', entityType: 'user', entityId: result.rows[0].id, details: req.body });
  res.json(serializeStaff(result.rows[0]));
}));

router.delete('/staff/:id', asyncHandler(async (req, res) => {
  const result = await query(
    `DELETE FROM users WHERE id = $1 AND role = ANY($2) RETURNING id`,
    [req.params.id, STAFF_ROLES]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Staff account not found' });
  await logAudit(req, { action: 'staff.delete', entityType: 'user', entityId: result.rows[0].id });
  res.json({ success: true });
}));

// ---------- Company settings ----------
// company_settings is a singleton row (id = 1), created by the schema
// migration, so it always exists by the time this route runs.

function serializeSettings(row) {
  return {
    company: {
      name: row.company_name,
      legalName: row.legal_name,
      registrationNumber: row.registration_number,
      taxId: row.tax_id,
      logoUrl: row.logo_url,
    },
    contact: {
      email: row.contact_email,
      phone: row.contact_phone,
      supportEmail: row.support_email,
      website: row.website,
    },
    address: {
      line1: row.address_line1,
      line2: row.address_line2,
      city: row.city,
      state: row.state,
      postalCode: row.postal_code,
      country: row.country,
    },
    emailNotifications: {
      smtpFromName: row.smtp_from_name,
      notifyNewOrders: row.notify_new_orders,
      notifyLowStock: row.notify_low_stock,
      notifyNewTickets: row.notify_new_tickets,
      notifyNewUsers: row.notify_new_users,
      notificationEmails: row.notification_emails || [],
    },
    maintenance: {
      enabled: row.maintenance_mode,
      message: row.maintenance_message,
    },
    backup: {
      frequency: row.backup_frequency,
      retentionDays: row.backup_retention_days,
      storageLocation: row.backup_storage_location,
      lastBackupAt: row.last_backup_at,
    },
    tax: {
      label: row.tax_label,
      ratePercent: Number(row.tax_rate_percent),
      inclusive: row.tax_inclusive,
      invoicePrefix: row.invoice_prefix,
      invoiceNotes: row.invoice_notes,
    },
    updatedAt: row.updated_at,
  };
}

router.get('/settings', asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM company_settings WHERE id = 1');
  res.json(serializeSettings(result.rows[0]));
}));

const FIELD_MAP = {
  // section.key from the request body -> column name
  'company.name': 'company_name',
  'company.legalName': 'legal_name',
  'company.registrationNumber': 'registration_number',
  'company.taxId': 'tax_id',
  'company.logoUrl': 'logo_url',
  'contact.email': 'contact_email',
  'contact.phone': 'contact_phone',
  'contact.supportEmail': 'support_email',
  'contact.website': 'website',
  'address.line1': 'address_line1',
  'address.line2': 'address_line2',
  'address.city': 'city',
  'address.state': 'state',
  'address.postalCode': 'postal_code',
  'address.country': 'country',
  'emailNotifications.smtpFromName': 'smtp_from_name',
  'emailNotifications.notifyNewOrders': 'notify_new_orders',
  'emailNotifications.notifyLowStock': 'notify_low_stock',
  'emailNotifications.notifyNewTickets': 'notify_new_tickets',
  'emailNotifications.notifyNewUsers': 'notify_new_users',
  'emailNotifications.notificationEmails': 'notification_emails',
  'maintenance.enabled': 'maintenance_mode',
  'maintenance.message': 'maintenance_message',
  'backup.frequency': 'backup_frequency',
  'backup.retentionDays': 'backup_retention_days',
  'backup.storageLocation': 'backup_storage_location',
  'tax.label': 'tax_label',
  'tax.ratePercent': 'tax_rate_percent',
  'tax.inclusive': 'tax_inclusive',
  'tax.invoicePrefix': 'invoice_prefix',
  'tax.invoiceNotes': 'invoice_notes',
};

router.put('/settings', asyncHandler(async (req, res) => {
  const sets = [];
  const params = [];

  for (const [section, values] of Object.entries(req.body || {})) {
    if (typeof values !== 'object' || values === null) continue;
    for (const [key, value] of Object.entries(values)) {
      const column = FIELD_MAP[`${section}.${key}`];
      if (!column) continue;
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    }
  }

  if (!sets.length) return res.status(400).json({ error: 'No valid settings fields to update' });

  const result = await query(
    `UPDATE company_settings SET ${sets.join(', ')} WHERE id = 1 RETURNING *`,
    params
  );

  await logAudit(req, { action: 'settings.update', entityType: 'company_settings', entityId: '1', details: req.body });

  // If backup frequency changed, update the running cron job immediately.
  if (req.body?.backup?.frequency) {
    try { await rescheduleBackup(); } catch { /* non-critical */ }
  }

  res.json(serializeSettings(result.rows[0]));
}));

// ---------- Backups ----------

// Manually trigger a real backup run: exports current orders + stock to an
// .xlsx file under backend/backups/, recorded in backup_runs.
router.post('/settings/backup-now', asyncHandler(async (req, res) => {
  const result = await runBackup({ triggeredBy: 'manual' });
  await logAudit(req, { action: 'backup.manual_run', entityType: 'backup', details: result });
  const settingsRes = await query('SELECT * FROM company_settings WHERE id = 1');
  res.json({ ...serializeSettings(settingsRes.rows[0]), lastRun: result });
}));

// History of automatic + manual backup runs, newest first.
router.get('/backups', asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM backup_runs ORDER BY created_at DESC LIMIT 100');
  res.json(result.rows.map((r) => ({
    id: r.id,
    triggeredBy: r.triggered_by,
    fileName: r.file_name,
    ordersCount: r.orders_count,
    productsCount: r.products_count,
    status: r.status,
    error: r.error,
    createdAt: r.created_at,
  })));
}));

// Manual download of a specific backup .xlsx file by name.
router.get('/backups/:fileName/download', asyncHandler(async (req, res) => {
  const fileName = path.basename(req.params.fileName); // prevent path traversal
  const filePath = path.join(BACKUP_DIR, fileName);
  res.download(filePath, fileName, (err) => {
    if (err) res.status(404).json({ error: 'Backup file not found' });
  });
}));

// ---------- Audit logs ----------

router.get('/audit-logs', asyncHandler(async (req, res) => {
  const { action, actorId, page = 1, limit = 50 } = req.query;
  const conditions = [];
  const params = [];
  if (action) {
    params.push(`%${action}%`);
    conditions.push(`action ILIKE $${params.length}`);
  }
  if (actorId) {
    params.push(actorId);
    conditions.push(`actor_id = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const result = await query(
    `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json(result.rows.map((r) => ({
    id: r.id,
    actorId: r.actor_id,
    actorName: r.actor_name,
    actorRole: r.actor_role,
    action: r.action,
    entityType: r.entity_type,
    entityId: r.entity_id,
    details: r.details,
    ipAddress: r.ip_address,
    createdAt: r.created_at,
  })));
}));

export default router;

// ---------- SMTP test ----------

// Tests the current SMTP configuration (from backend/.env) by sending a
// test email to the requesting admin's own email address.
router.post('/settings/test-smtp', asyncHandler(async (req, res) => {
  const { testSmtpConnection } = await import('../utils/mailer.js');
  const toEmail = req.user.email;
  try {
    const result = await testSmtpConnection(toEmail);
    res.json({ success: true, message: `Test email sent to ${result.deliveredTo}` });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}));

// Returns the current SMTP configuration status (redacts the password).
router.get('/settings/smtp-status', asyncHandler(async (_req, res) => {
  const host = process.env.SMTP_HOST || '';
  const user = process.env.SMTP_USER || '';
  const hasPass = Boolean(process.env.SMTP_PASS);
  res.json({
    configured: Boolean(host && user && hasPass),
    host,
    port: Number(process.env.SMTP_PORT || 587),
    user,
    from: process.env.SMTP_FROM || '',
    passwordSet: hasPass,
  });
}));
