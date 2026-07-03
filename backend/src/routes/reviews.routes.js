import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';
import { query, withTransaction } from '../db/pool.js';

const router = express.Router();

function serializeReview(row) {
  return {
    id: row.id,
    productId: row.product_id,
    product: row.product_name,
    author: row.author_name,
    rating: row.rating,
    text: row.text,
    createdAt: row.created_at,
  };
}

router.get('/product/:productId', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT r.*, u.name AS author_name, p.name AS product_name
     FROM reviews r JOIN users u ON u.id = r.user_id JOIN products p ON p.id = r.product_id
     WHERE r.product_id = $1 ORDER BY r.created_at DESC`,
    [req.params.productId]
  );
  res.json(result.rows.map(serializeReview));
}));

router.post('/product/:productId', requireAuth, asyncHandler(async (req, res) => {
  const { rating, text } = req.body;
  if (!rating || !text) return res.status(400).json({ error: 'rating and text are required' });
  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'rating must be between 1 and 5' });

  const review = await withTransaction(async (client) => {
    const ins = await client.query(
      `INSERT INTO reviews (product_id, user_id, rating, text) VALUES ($1,$2,$3,$4)
       ON CONFLICT (product_id, user_id) DO UPDATE SET rating = EXCLUDED.rating, text = EXCLUDED.text
       RETURNING *`,
      [req.params.productId, req.user.id, rating, text]
    );
    const stats = await client.query(
      `SELECT AVG(rating)::numeric(3,2) AS avg_rating, COUNT(*) AS cnt FROM reviews WHERE product_id = $1`,
      [req.params.productId]
    );
    await client.query(
      `UPDATE products SET rating = $1, review_count = $2 WHERE id = $3`,
      [stats.rows[0].avg_rating, stats.rows[0].cnt, req.params.productId]
    );
    return ins.rows[0];
  });

  res.status(201).json(serializeReview({ ...review, author_name: req.user.name }));
}));

export default router;
