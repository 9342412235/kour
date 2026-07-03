import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, requireTaxAccess } from '../middleware/auth.js';
import { query } from '../db/pool.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

function serialize(row) {
  return {
    tax: {
      label:         row.tax_label,
      ratePercent:   Number(row.tax_rate_percent),
      inclusive:     row.tax_inclusive,
      invoicePrefix: row.invoice_prefix,
      invoiceNotes:  row.invoice_notes,
    },
    updatedAt: row.updated_at,
  };
}

// GET is readable by any authenticated staff so warehouse/support/blogger
// dashboards can show the current tax settings in their Tax & Invoicing view.
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM company_settings WHERE id = 1');
  res.json(serialize(result.rows[0]));
}));

// PUT is admin-only
router.put('/', requireAuth, requireTaxAccess, asyncHandler(async (req, res) => {
  const { tax } = req.body || {};
  if (!tax || typeof tax !== 'object') {
    return res.status(400).json({ error: 'tax settings object is required' });
  }

  const FIELD_MAP = {
    label:         'tax_label',
    ratePercent:   'tax_rate_percent',
    inclusive:     'tax_inclusive',
    invoicePrefix: 'invoice_prefix',
    invoiceNotes:  'invoice_notes',
  };

  const sets = [], params = [];
  for (const [key, value] of Object.entries(tax)) {
    const column = FIELD_MAP[key];
    if (!column) continue;
    params.push(value);
    sets.push(`${column} = $${params.length}`);
  }

  if (!sets.length) return res.status(400).json({ error: 'No valid tax fields to update' });

  const result = await query(
    `UPDATE company_settings SET ${sets.join(', ')} WHERE id = 1 RETURNING *`,
    params
  );

  await logAudit(req, { action: 'tax_settings.update', entityType: 'company_settings', entityId: '1', details: { tax } });

  res.json(serialize(result.rows[0]));
}));

export default router;
