import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/pool.js';
import { serializeProduct } from '../controllers/products.controller.js';

const router = express.Router();

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT p.* FROM wishlist_items w JOIN products p ON p.id = w.product_id
     WHERE w.user_id = $1 ORDER BY w.created_at DESC`,
    [req.user.id]
  );
  res.json(result.rows.map(serializeProduct));
}));

router.post('/:productId', requireAuth, asyncHandler(async (req, res) => {
  await query(
    `INSERT INTO wishlist_items (user_id, product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [req.user.id, req.params.productId]
  );
  res.status(201).json({ success: true });
}));

router.delete('/:productId', requireAuth, asyncHandler(async (req, res) => {
  await query('DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2', [req.user.id, req.params.productId]);
  res.json({ success: true });
}));

export default router;
