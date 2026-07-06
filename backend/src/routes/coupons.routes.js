import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = express.Router();

// --- ADMIN ROUTES ---

// Get all coupons (Admin only)
router.get('/', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM coupons ORDER BY created_at DESC');
  res.json(result.rows);
}));

// Create a coupon (Admin only)
router.post('/', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const {
    code,
    type,
    value,
    min_purchase = 0,
    max_discount = null,
    start_date = null,
    expiry_date = null,
    usage_limit = null,
    per_user_limit = null,
    status = 'active',
    description = ''
  } = req.body;

  if (!code || !type || !value) {
    return res.status(400).json({ error: 'Code, type, and value are required' });
  }

  if (type !== 'percentage' && type !== 'fixed') {
    return res.status(400).json({ error: 'Type must be percentage or fixed' });
  }

  try {
    const result = await query(
      `INSERT INTO coupons (code, type, value, min_purchase, max_discount, start_date, expiry_date, usage_limit, per_user_limit, status, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        code.toUpperCase().trim(),
        type,
        parseFloat(value),
        parseFloat(min_purchase),
        max_discount ? parseFloat(max_discount) : null,
        start_date || null,
        expiry_date || null,
        usage_limit ? parseInt(usage_limit, 10) : null,
        per_user_limit ? parseInt(per_user_limit, 10) : null,
        status,
        description
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }
    throw err;
  }
}));

// Update a coupon (Admin only)
router.patch('/:id', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const {
    code,
    type,
    value,
    min_purchase,
    max_discount,
    start_date,
    expiry_date,
    usage_limit,
    per_user_limit,
    status,
    description
  } = req.body;

  const current = await query('SELECT * FROM coupons WHERE id = $1', [req.params.id]);
  if (!current.rows[0]) {
    return res.status(404).json({ error: 'Coupon not found' });
  }

  const sets = [];
  const params = [];

  const addParam = (val, col) => {
    if (val !== undefined) {
      params.push(val);
      sets.push(`${col} = $${params.length}`);
    }
  };

  addParam(code ? code.toUpperCase().trim() : undefined, 'code');
  addParam(type, 'type');
  addParam(value ? parseFloat(value) : undefined, 'value');
  addParam(min_purchase !== undefined ? parseFloat(min_purchase) : undefined, 'min_purchase');
  addParam(max_discount !== undefined ? (max_discount ? parseFloat(max_discount) : null) : undefined, 'max_discount');
  addParam(start_date !== undefined ? (start_date || null) : undefined, 'start_date');
  addParam(expiry_date !== undefined ? (expiry_date || null) : undefined, 'expiry_date');
  addParam(usage_limit !== undefined ? (usage_limit ? parseInt(usage_limit, 10) : null) : undefined, 'usage_limit');
  addParam(per_user_limit !== undefined ? (per_user_limit ? parseInt(per_user_limit, 10) : null) : undefined, 'per_user_limit');
  addParam(status, 'status');
  addParam(description, 'description');

  if (sets.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  params.push(req.params.id);
  try {
    const result = await query(
      `UPDATE coupons SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }
    throw err;
  }
}));

// Delete a coupon (Admin only)
router.delete('/:id', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM coupons WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows[0]) {
    return res.status(404).json({ error: 'Coupon not found' });
  }
  res.json({ success: true });
}));


// --- CUSTOMER ROUTES ---

// Get active coupons (For customer dashboard)
router.get('/active', requireAuth, asyncHandler(async (req, res) => {
  const now = new Date();
  const result = await query(
    `SELECT * FROM coupons 
     WHERE status = 'active' 
       AND (start_date IS NULL OR start_date <= $1)
       AND (expiry_date IS NULL OR expiry_date >= $1)
     ORDER BY created_at DESC`,
    [now]
  );
  
  // Filter out coupons that have reached usage limits
  const filtered = [];
  for (const coupon of result.rows) {
    let valid = true;
    
    // Overall limit check
    if (coupon.usage_limit !== null) {
      const usageRes = await query('SELECT COUNT(*)::int as count FROM coupon_usages WHERE coupon_id = $1', [coupon.id]);
      if (usageRes.rows[0].count >= coupon.usage_limit) {
        valid = false;
      }
    }
    
    // Per user limit check
    if (valid && coupon.per_user_limit !== null) {
      const userUsageRes = await query(
        'SELECT COUNT(*)::int as count FROM coupon_usages WHERE coupon_id = $1 AND user_id = $2',
        [coupon.id, req.user.id]
      );
      if (userUsageRes.rows[0].count >= coupon.per_user_limit) {
        valid = false;
      }
    }
    
    if (valid) {
      filtered.push(coupon);
    }
  }

  res.json(filtered);
}));

// Validate a coupon (For checkout validation)
router.post('/validate', requireAuth, asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Coupon code is required' });
  }

  const result = await query('SELECT * FROM coupons WHERE code = $1', [code.toUpperCase().trim()]);
  const coupon = result.rows[0];

  if (!coupon) {
    return res.status(400).json({ error: 'Invalid coupon code' });
  }

  if (coupon.status !== 'active') {
    return res.status(400).json({ error: 'Coupon is inactive' });
  }

  const now = new Date();
  if (coupon.start_date && new Date(coupon.start_date) > now) {
    return res.status(400).json({ error: 'Coupon promotion has not started yet' });
  }

  if (coupon.expiry_date && new Date(coupon.expiry_date) < now) {
    return res.status(400).json({ error: 'Coupon has expired' });
  }

  if (subtotal && parseFloat(subtotal) < parseFloat(coupon.min_purchase)) {
    return res.status(400).json({ error: `Minimum purchase of $${parseFloat(coupon.min_purchase).toFixed(2)} required` });
  }

  // Check overall usage limit
  if (coupon.usage_limit !== null) {
    const usageRes = await query('SELECT COUNT(*)::int as count FROM coupon_usages WHERE coupon_id = $1', [coupon.id]);
    if (usageRes.rows[0].count >= coupon.usage_limit) {
      return res.status(400).json({ error: 'Coupon usage limit has been reached' });
    }
  }

  // Check per user usage limit
  if (coupon.per_user_limit !== null) {
    const userUsageRes = await query(
      'SELECT COUNT(*)::int as count FROM coupon_usages WHERE coupon_id = $1 AND user_id = $2',
      [coupon.id, req.user.id]
    );
    if (userUsageRes.rows[0].count >= coupon.per_user_limit) {
      return res.status(400).json({ error: 'You have reached the usage limit for this coupon' });
    }
  }

  // Calculate discount amount
  let discountAmount = 0;
  if (coupon.type === 'percentage') {
    discountAmount = (parseFloat(subtotal) * parseFloat(coupon.value)) / 100;
    if (coupon.max_discount && discountAmount > parseFloat(coupon.max_discount)) {
      discountAmount = parseFloat(coupon.max_discount);
    }
  } else if (coupon.type === 'fixed') {
    discountAmount = parseFloat(coupon.value);
    if (discountAmount > parseFloat(subtotal)) {
      discountAmount = parseFloat(subtotal);
    }
  }

  res.json({
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      description: coupon.description
    },
    discountAmount
  });
}));

export default router;
