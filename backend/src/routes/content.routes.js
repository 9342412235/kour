import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { uploadHeroImage } from '../middleware/upload.js';
import { query } from '../db/pool.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

function serialize(row) {
  return {
    navLinks: row.nav_links || [],
    topBar:   { enabled: row.top_bar_enabled, text: row.top_bar_text },
    hero: {
      title:    row.hero_title,
      subtitle: row.hero_subtitle,
      ctaText:  row.hero_cta_text,
      ctaUrl:   row.hero_cta_url,
      imageUrl: row.hero_image_url,
    },
    updatedAt: row.updated_at,
  };
}

router.get('/', asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM site_content WHERE id = 1');
  res.json(serialize(result.rows[0]));
}));

router.put('/', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const { navLinks, topBar, hero } = req.body || {};
  const sets = [], params = [];

  if (navLinks !== undefined) {
    if (!Array.isArray(navLinks)) return res.status(400).json({ error: 'navLinks must be an array' });
    params.push(JSON.stringify(navLinks)); sets.push(`nav_links = $${params.length}::jsonb`);
  }
  if (topBar?.enabled !== undefined) { params.push(Boolean(topBar.enabled)); sets.push(`top_bar_enabled = $${params.length}`); }
  if (topBar?.text    !== undefined) { params.push(topBar.text);             sets.push(`top_bar_text = $${params.length}`); }
  if (hero?.title     !== undefined) { params.push(hero.title);              sets.push(`hero_title = $${params.length}`); }
  if (hero?.subtitle  !== undefined) { params.push(hero.subtitle);           sets.push(`hero_subtitle = $${params.length}`); }
  if (hero?.ctaText   !== undefined) { params.push(hero.ctaText);            sets.push(`hero_cta_text = $${params.length}`); }
  if (hero?.ctaUrl    !== undefined) { params.push(hero.ctaUrl);             sets.push(`hero_cta_url = $${params.length}`); }
  if (hero?.imageUrl  !== undefined) { params.push(hero.imageUrl || null);   sets.push(`hero_image_url = $${params.length}`); }

  if (!sets.length) return res.status(400).json({ error: 'No valid fields to update' });

  const result = await query(`UPDATE site_content SET ${sets.join(', ')} WHERE id = 1 RETURNING *`, params);
  await logAudit(req, { action: 'site_content.update', entityType: 'site_content', entityId: '1', details: { navLinks, topBar, hero } });
  res.json(serialize(result.rows[0]));
}));

// Upload a hero image (supports JPEG, PNG, GIF, WebP) — stored as BYTEA in Postgres
// and served via GET /api/content/hero-image
router.post(
  '/hero-image',
  requireAuth,
  requireRole('admin'),
  (req, res, next) => uploadHeroImage(req, res, (err) => (err ? res.status(400).json({ error: err.message }) : next())),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image file was uploaded' });

    // Store binary in DB
    await query(
      `INSERT INTO site_content_images (purpose, image_data, mime_type)
       VALUES ('hero', $1, $2)
       ON CONFLICT (purpose) DO UPDATE SET image_data = EXCLUDED.image_data, mime_type = EXCLUDED.mime_type`,
      [req.file.buffer, req.file.mimetype]
    );

    const proto    = req.headers['x-forwarded-proto'] || req.protocol;
    const host     = req.headers['x-forwarded-host']  || req.get('host');
    const imageUrl = `${proto}://${host}/api/content/hero-image`;

    const result = await query(
      `UPDATE site_content SET hero_image_url = $1 WHERE id = 1 RETURNING *`,
      [imageUrl]
    );

    await logAudit(req, { action: 'site_content.hero_image_upload', entityType: 'site_content', entityId: '1', details: { imageUrl } });
    res.json(serialize(result.rows[0]));
  })
);

// Serve the hero image (GIF/PNG/JPEG) from Postgres
router.get('/hero-image', asyncHandler(async (req, res) => {
  const result = await query(`SELECT image_data, mime_type FROM site_content_images WHERE purpose = 'hero'`);
  if (!result.rows[0]) return res.status(404).json({ error: 'No hero image uploaded' });
  const { image_data, mime_type } = result.rows[0];
  res.set('Content-Type', mime_type);
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(image_data);
}));

export default router;
