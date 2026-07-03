import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/pool.js';
import { serializeProduct } from '../controllers/products.controller.js';

const router = express.Router();

function serializeCartItem(row) {
  return {
    cartItemId: row.id,
    id: row.product_id,
    sku: row.sku,
    name: row.name,
    price: Number(row.price),
    image: row.image_url,
    selectedColor: row.color,
    selectedSize: row.size,
    qty: row.qty,
    stock: row.stock,
  };
}

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT ci.*, p.sku, p.name, p.price, p.image_url, p.stock
     FROM cart_items ci JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = $1 ORDER BY ci.created_at`,
    [req.user.id]
  );
  res.json(result.rows.map(serializeCartItem));
}));

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { productId, color, size, qty = 1 } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId is required' });

  const result = await query(
    `INSERT INTO cart_items (user_id, product_id, color, size, qty)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (user_id, product_id, color, size)
     DO UPDATE SET qty = cart_items.qty + EXCLUDED.qty
     RETURNING *`,
    [req.user.id, productId, color || null, size || null, qty]
  );
  res.status(201).json(result.rows[0]);
}));

router.patch('/:cartItemId', requireAuth, asyncHandler(async (req, res) => {
  const { qty } = req.body;
  if (!qty || qty < 1) return res.status(400).json({ error: 'qty must be >= 1' });
  const result = await query(
    `UPDATE cart_items SET qty = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
    [qty, req.params.cartItemId, req.user.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Cart item not found' });
  res.json(result.rows[0]);
}));

router.delete('/:cartItemId', requireAuth, asyncHandler(async (req, res) => {
  await query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [req.params.cartItemId, req.user.id]);
  res.json({ success: true });
}));

router.delete('/', requireAuth, asyncHandler(async (req, res) => {
  await query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
  res.json({ success: true });
}));

export default router;
