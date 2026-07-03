import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { uploadBlogImages, publicUrl } from '../middleware/upload.js';
import { query } from '../db/pool.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

function serializePost(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    description: row.content,
    coverImage: row.cover_image,
    images: row.images || [],
    author: row.author_name,
    status: row.status,
    scheduledAt: row.scheduled_at,
    publishedAt: row.published_at,
    views: row.views,
    likes: row.likes,
    comments: row.comment_count ? Number(row.comment_count) : 0,
    date: row.published_at || row.scheduled_at || row.created_at,
  };
}

function slugify(title) {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).slice(2, 6);
}

const POST_SELECT = `
  SELECT p.*, u.name AS author_name,
    (SELECT COUNT(*) FROM blog_comments c WHERE c.post_id = p.id) AS comment_count
  FROM blog_posts p LEFT JOIN users u ON u.id = p.author_id
`;

// Public: published posts only
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const isStaff = req.user && ['admin', 'blogger'].includes(req.user.role);
  const where = isStaff ? '' : `WHERE p.status = 'published'`;
  const result = await query(`${POST_SELECT} ${where} ORDER BY p.created_at DESC`);
  res.json(result.rows.map(serializePost));
}));

router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const result = await query(`${POST_SELECT} WHERE p.id = $1`, [req.params.id]);
  const post = result.rows[0];
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const isStaff = req.user && ['admin', 'blogger'].includes(req.user.role);
  if (post.status !== 'published' && !isStaff) return res.status(404).json({ error: 'Post not found' });
  if (post.status === 'published') {
    await query('UPDATE blog_posts SET views = views + 1 WHERE id = $1', [post.id]);
  }
  res.json(serializePost(post));
}));

router.post('/', requireAuth, requireRole('admin', 'blogger'), asyncHandler(async (req, res) => {
  const { title, content, description, coverImage, status = 'draft', scheduledAt } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const body = content !== undefined ? content : description;
  const publishedAt = status === 'published' ? new Date() : null;
  const result = await query(
    `INSERT INTO blog_posts (title, slug, content, cover_image, author_id, status, scheduled_at, published_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [title, slugify(title), body || '', coverImage || null, req.user.id, status, scheduledAt || null, publishedAt]
  );
  if (status === 'published') {
    await logAudit(req, {
      action: 'blog.publish',
      entityType: 'blog_post',
      entityId: result.rows[0].id,
      details: { title: result.rows[0].title },
    });
  }
  res.status(201).json(serializePost({ ...result.rows[0], author_name: req.user.name, comment_count: 0 }));
}));

router.patch('/:id', requireAuth, requireRole('admin', 'blogger'), asyncHandler(async (req, res) => {
  const { title, content, description, coverImage, status, scheduledAt } = req.body;
  const body = content !== undefined ? content : description;
  const sets = [];
  const params = [];
  if (title !== undefined) { params.push(title); sets.push(`title = $${params.length}`); }
  if (body !== undefined) { params.push(body); sets.push(`content = $${params.length}`); }
  if (coverImage !== undefined) { params.push(coverImage); sets.push(`cover_image = $${params.length}`); }
  if (scheduledAt !== undefined) { params.push(scheduledAt); sets.push(`scheduled_at = $${params.length}`); }
  if (status !== undefined) {
    params.push(status); sets.push(`status = $${params.length}`);
    if (status === 'published') sets.push(`published_at = now()`);
  }
  if (!sets.length) return res.status(400).json({ error: 'No valid fields to update' });

  // Capture the prior status so the audit entry can record the transition,
  // not just the new value.
  let previousStatus = null;
  if (status !== undefined) {
    const existing = await query('SELECT status FROM blog_posts WHERE id = $1', [req.params.id]);
    previousStatus = existing.rows[0]?.status || null;
  }

  params.push(req.params.id);
  const result = await query(`UPDATE blog_posts SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  if (!result.rows[0]) return res.status(404).json({ error: 'Post not found' });

  if (status !== undefined && status !== previousStatus) {
    await logAudit(req, {
      action: status === 'published' ? 'blog.publish' : 'blog.status_change',
      entityType: 'blog_post',
      entityId: result.rows[0].id,
      details: { title: result.rows[0].title, previousStatus, status },
    });
  }

  const full = await query(`${POST_SELECT} WHERE p.id = $1`, [req.params.id]);
  res.json(serializePost(full.rows[0]));
}));

router.delete('/:id', requireAuth, requireRole('admin', 'blogger'), asyncHandler(async (req, res) => {
  await query('DELETE FROM blog_posts WHERE id = $1', [req.params.id]);
  res.json({ success: true });
}));

// Raw image uploads for a blog post (multipart/form-data, field "images", up to 10 files)
router.post(
  '/:id/images',
  requireAuth,
  requireRole('admin', 'blogger'),
  (req, res, next) => uploadBlogImages(req, res, (err) => (err ? res.status(400).json({ error: err.message }) : next())),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await query('SELECT * FROM blog_posts WHERE id = $1', [id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Post not found' });

    const files = req.files || [];
    if (files.length === 0) return res.status(400).json({ error: 'No image files were uploaded' });

    const urls = files.map((f) => publicUrl(req, f.path));
    const currentImages = existing.rows[0].images || [];
    const newImages = [...currentImages, ...urls];
    const coverImage = existing.rows[0].cover_image || urls[0];

    const result = await query(
      `UPDATE blog_posts SET images = $1, cover_image = $2 WHERE id = $3 RETURNING *`,
      [newImages, coverImage, id]
    );
    const full = await query(`${POST_SELECT} WHERE p.id = $1`, [id]);
    res.json(serializePost(full.rows[0]));
  })
);

// Remove a single uploaded image URL from a post's gallery.
router.delete('/:id/images', requireAuth, requireRole('admin', 'blogger'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  const existing = await query('SELECT * FROM blog_posts WHERE id = $1', [id]);
  if (!existing.rows[0]) return res.status(404).json({ error: 'Post not found' });

  const remaining = (existing.rows[0].images || []).filter((u) => u !== url);
  const coverImage = existing.rows[0].cover_image === url ? (remaining[0] || null) : existing.rows[0].cover_image;

  const result = await query(
    `UPDATE blog_posts SET images = $1, cover_image = $2 WHERE id = $3 RETURNING *`,
    [remaining, coverImage, id]
  );
  const full = await query(`${POST_SELECT} WHERE p.id = $1`, [id]);
  res.json(serializePost(full.rows[0]));
}));

router.post('/:id/comments', requireAuth, asyncHandler(async (req, res) => {
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'body is required' });
  const result = await query(
    `INSERT INTO blog_comments (post_id, author_id, body) VALUES ($1,$2,$3) RETURNING *`,
    [req.params.id, req.user.id, body]
  );
  res.status(201).json(result.rows[0]);
}));

router.post('/:id/like', requireAuth, asyncHandler(async (req, res) => {
  const result = await query('UPDATE blog_posts SET likes = likes + 1 WHERE id = $1 RETURNING likes', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Post not found' });
  res.json({ likes: result.rows[0].likes });
}));

export default router;
