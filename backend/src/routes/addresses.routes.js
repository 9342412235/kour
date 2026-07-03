import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = express.Router();

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at', [req.user.id]);
  res.json(result.rows);
}));

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { label, line1, line2, city, state, postalCode, country = 'IN', phone, isDefault } = req.body;
  if (!line1 || !city || !postalCode) return res.status(400).json({ error: 'line1, city, and postalCode are required' });
  if (isDefault) await query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
  const result = await query(
    `INSERT INTO addresses (user_id, label, line1, line2, city, state, postal_code, country, phone, is_default)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.user.id, label || 'Home', line1, line2 || null, city, state || null, postalCode, country, phone || null, !!isDefault]
  );
  res.status(201).json(result.rows[0]);
}));

router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  await query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ success: true });
}));

export default router;
