import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = express.Router();

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.id]);
  res.json(result.rows);
}));

router.get('/unread-count', requireAuth, asyncHandler(async (req, res) => {
  const result = await query('SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false', [req.user.id]);
  res.json({ count: Number(result.rows[0].count) });
}));

router.patch('/:id/read', requireAuth, asyncHandler(async (req, res) => {
  await query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ success: true });
}));

router.patch('/read-all', requireAuth, asyncHandler(async (req, res) => {
  await query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id]);
  res.json({ success: true });
}));

export default router;
