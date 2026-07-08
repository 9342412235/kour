import { query } from '../db/pool.js';
import { notifyRoles } from '../utils/notify.js';
import { logAudit } from '../utils/audit.js';

// Build a public image URL for a DB-stored image
function dbImageUrl(req, imageId) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host  = req.headers['x-forwarded-host']  || req.get('host');
  return `${proto}://${host}/api/products/images/${imageId}`;
}

function serializeProduct(row, imageRecords = []) {
  // Build colorImages map: { 'Black': '/api/products/images/uuid' }
  const colorImages = {};
  for (const img of imageRecords) {
    if (img.color) colorImages[img.color] = img.url;
  }

  const dbImages = imageRecords.map((img) => img.url);

  // Prefer DB images; fall back to legacy URL columns
  const images  = dbImages.length  ? dbImages  : (row.images || []);
  const image   = dbImages.length  ? dbImages[0] : (row.image_url || null);

  return {
    id:               row.id,
    sku:              row.sku,
    name:             row.name,
    description:      row.description,
    category:         row.category_id,
    subcategory:      row.subcategory,
    price:            Number(row.price),
    compareAtPrice:   row.compare_at_price ? Number(row.compare_at_price) : null,
    colors:           row.colors || [],
    sizes:            row.sizes  || [],
    image,
    images,
    colorImages,
    tags:             row.tags   || [],
    relatedProductIds: row.related_product_ids || [],
    badge:            row.badge,
    stock:            row.stock,
    lowStockThreshold: row.low_stock_threshold,
    rating:           Number(row.rating),
    reviews:          row.review_count,
    isActive:         row.is_active,
    warehouse:        row.warehouse,
    productDetails:   row.product_details || '',
    materialCare:     row.material_care || '',
    sizeFitGuide:     row.size_fit_guide || '',
    sustainability:   row.sustainability || '',
  };
}

const MAX_RELATED_PRODUCTS = 10;

async function sanitizeRelatedIds(relatedProductIds, selfId) {
  if (!Array.isArray(relatedProductIds)) return [];
  const ids = [...new Set(relatedProductIds.filter((id) => id && id !== selfId))].slice(0, MAX_RELATED_PRODUCTS);
  if (ids.length === 0) return [];
  const result = await query('SELECT id FROM products WHERE id = ANY($1::uuid[])', [ids]);
  const valid = new Set(result.rows.map((r) => r.id));
  return ids.filter((id) => valid.has(id));
}

// Fetch DB images for a product and attach the served URL
async function fetchImageRecords(req, productId) {
  const result = await query(
    'SELECT id, color, sort_order FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC, created_at ASC',
    [productId]
  );
  return result.rows.map((r) => ({
    id:    r.id,
    color: r.color,
    url:   dbImageUrl(req, r.id),
  }));
}

export async function listProducts(req, res) {
  const { category, subcategory, sort, search, minPrice, maxPrice, inStock, page = 1, limit = 24 } = req.query;
  const conditions = ['is_active = true'];
  const params = [];

  if (category && category !== 'all') { params.push(category); conditions.push(`category_id = $${params.length}`); }
  if (subcategory && subcategory !== 'all') { params.push(subcategory); conditions.push(`subcategory = $${params.length}`); }
  if (search)   { params.push(`%${search}%`); conditions.push(`name ILIKE $${params.length}`); }
  if (minPrice) { params.push(Number(minPrice)); conditions.push(`price >= $${params.length}`); }
  if (maxPrice) { params.push(Number(maxPrice)); conditions.push(`price <= $${params.length}`); }
  if (inStock === 'true') conditions.push(`stock > 0`);

  let orderBy = 'created_at DESC';
  if (sort === 'price-asc')  orderBy = 'price ASC';
  if (sort === 'price-desc') orderBy = 'price DESC';
  if (sort === 'rating')     orderBy = 'rating DESC';

  const offset = (Number(page) - 1) * Number(limit);
  params.push(Number(limit), offset);

  const sql      = `SELECT * FROM products WHERE ${conditions.join(' AND ')} ORDER BY ${orderBy} LIMIT $${params.length - 1} OFFSET $${params.length}`;
  const countSql = `SELECT COUNT(*) FROM products WHERE ${conditions.join(' AND ')}`;

  const [rows, count] = await Promise.all([
    query(sql, params),
    query(countSql, params.slice(0, params.length - 2)),
  ]);

  // Batch-fetch DB images for all returned products
  const productIds = rows.rows.map((r) => r.id);
  let imageMap = {};
  if (productIds.length > 0) {
    const imgRes = await query(
      'SELECT id, product_id, color, sort_order FROM product_images WHERE product_id = ANY($1::uuid[]) ORDER BY sort_order ASC, created_at ASC',
      [productIds]
    );
    for (const img of imgRes.rows) {
      if (!imageMap[img.product_id]) imageMap[img.product_id] = [];
      imageMap[img.product_id].push({ id: img.id, color: img.color, url: dbImageUrl(req, img.id) });
    }
  }

  res.json({
    products: rows.rows.map((r) => serializeProduct(r, imageMap[r.id] || [])),
    total:    Number(count.rows[0].count),
    page:     Number(page),
    limit:    Number(limit),
  });
}

export async function getProduct(req, res) {
  const result = await query('SELECT * FROM products WHERE id = $1', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Product not found' });

  const imageRecords = await fetchImageRecords(req, req.params.id);
  const product = serializeProduct(result.rows[0], imageRecords);

  if (product.relatedProductIds.length > 0) {
    const related = await query(
      'SELECT * FROM products WHERE id = ANY($1::uuid[]) AND is_active = true',
      [product.relatedProductIds]
    );
    const relIds = related.rows.map((r) => r.id);
    const relImgRes = await query(
      'SELECT id, product_id, color, sort_order FROM product_images WHERE product_id = ANY($1::uuid[]) ORDER BY sort_order ASC',
      [relIds]
    );
    const relImgMap = {};
    for (const img of relImgRes.rows) {
      if (!relImgMap[img.product_id]) relImgMap[img.product_id] = [];
      relImgMap[img.product_id].push({ id: img.id, color: img.color, url: dbImageUrl(req, img.id) });
    }
    product.relatedProducts = related.rows.map((r) => serializeProduct(r, relImgMap[r.id] || []));
  } else {
    product.relatedProducts = [];
  }

  res.json(product);
}

export async function listCategories(_req, res) {
  const result = await query('SELECT * FROM categories ORDER BY name');
  res.json(result.rows);
}

// Create a new category on-the-fly from the admin product form
export async function createCategory(req, res) {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  const id = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const result = await query(
    'INSERT INTO categories (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name RETURNING *',
    [id, name.trim()]
  );
  res.status(201).json(result.rows[0]);
}

export async function updateCategory(req, res) {
  const { id } = req.params;
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  const result = await query(
    'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
    [name.trim(), id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
  res.json(result.rows[0]);
}

export async function deleteCategory(req, res) {
  const { id } = req.params;
  const inUse = await query('SELECT COUNT(*)::int AS count FROM products WHERE category_id = $1', [id]);
  if (inUse.rows[0].count > 0) {
    return res.status(400).json({ error: 'Cannot delete a category that is still assigned to products' });
  }
  const result = await query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
  res.json({ success: true });
}

export async function listSubcategories(req, res) {
  const { category } = req.query;
  const params = [];
  let where = 'subcategory IS NOT NULL';
  if (category && category !== 'all') { params.push(category); where += ` AND category_id = $${params.length}`; }
  const result = await query(
    `SELECT DISTINCT subcategory FROM products WHERE ${where} ORDER BY subcategory`,
    params
  );
  res.json(result.rows.map((r) => r.subcategory));
}

export async function createProduct(req, res) {
  const { sku, name, description, category, subcategory, price, compareAtPrice, colors, sizes, image, badge, tags, stock, warehouse, relatedProductIds, lowStockThreshold, productDetails, materialCare, sizeFitGuide, sustainability } = req.body;
  if (!sku || !name || price == null) return res.status(400).json({ error: 'sku, name and price are required' });
  const cleanRelated = await sanitizeRelatedIds(relatedProductIds, null);
  const cleanTags    = Array.isArray(tags) ? tags.filter(Boolean) : [];
  const resolvedBadge = badge || cleanTags[0] || null;
  const result = await query(
    `INSERT INTO products (sku, name, description, category_id, subcategory, price, compare_at_price, colors, sizes, image_url, badge, tags, stock, warehouse, related_product_ids, low_stock_threshold, product_details, material_care, size_fit_guide, sustainability)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING *`,
    [sku, name, description || '', category || null, subcategory || null, price, compareAtPrice || null, colors || [], sizes || [], image || null, resolvedBadge, cleanTags, stock || 0, warehouse || 'WH-NewYork', cleanRelated, lowStockThreshold || 15, productDetails || '', materialCare || '', sizeFitGuide || '', sustainability || '']
  );
  await logAudit(req, { action: 'product.create', entityType: 'product', entityId: result.rows[0].id, details: { sku: result.rows[0].sku, name: result.rows[0].name } });
  res.status(201).json(serializeProduct(result.rows[0], []));
}

export async function updateProduct(req, res) {
  const { id } = req.params;
  const allowed = ['name','description','category','subcategory','price','compareAtPrice','colors','sizes','image','badge','tags','stock','isActive','warehouse','lowStockThreshold','productDetails','materialCare','sizeFitGuide','sustainability'];
  const colMap  = { name:'name', description:'description', category:'category_id', subcategory:'subcategory', price:'price', compareAtPrice:'compare_at_price', colors:'colors', sizes:'sizes', image:'image_url', badge:'badge', tags:'tags', stock:'stock', isActive:'is_active', warehouse:'warehouse', lowStockThreshold:'low_stock_threshold', productDetails:'product_details', materialCare:'material_care', sizeFitGuide:'size_fit_guide', sustainability:'sustainability' };
  const sets = [], params = [];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      let value = req.body[key];
      if (key === 'tags') value = Array.isArray(value) ? value.filter(Boolean) : [];
      params.push(value); sets.push(`${colMap[key]} = $${params.length}`);
    }
  }
  if (req.body.tags !== undefined && req.body.badge === undefined) {
    const cleanTags = Array.isArray(req.body.tags) ? req.body.tags.filter(Boolean) : [];
    params.push(cleanTags[0] || null); sets.push(`badge = $${params.length}`);
  }
  if (req.body.relatedProductIds !== undefined) {
    const cleanRelated = await sanitizeRelatedIds(req.body.relatedProductIds, id);
    params.push(cleanRelated); sets.push(`related_product_ids = $${params.length}`);
  }
  if (sets.length === 0) return res.status(400).json({ error: 'No valid fields to update' });
  params.push(id);
  const result = await query(`UPDATE products SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  if (!result.rows[0]) return res.status(404).json({ error: 'Product not found' });
  await logAudit(req, { action: 'product.update', entityType: 'product', entityId: result.rows[0].id, details: { fields: Object.keys(req.body || {}) } });
  const imageRecords = await fetchImageRecords(req, id);
  res.json(serializeProduct(result.rows[0], imageRecords));
}

export async function deleteProduct(req, res) {
  const result = await query('UPDATE products SET is_active = false WHERE id = $1 RETURNING id, sku, name', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Product not found' });
  await logAudit(req, { action: 'product.delete', entityType: 'product', entityId: result.rows[0].id, details: { sku: result.rows[0].sku, name: result.rows[0].name } });
  res.json({ success: true });
}

export async function adjustStock(req, res) {
  const { delta } = req.body;
  if (typeof delta !== 'number') return res.status(400).json({ error: 'delta must be a number' });
  const result = await query(`UPDATE products SET stock = GREATEST(0, stock + $1) WHERE id = $2 RETURNING *`, [delta, req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Product not found' });
  const product = result.rows[0];
  if (product.stock <= product.low_stock_threshold) {
    await notifyRoles(['admin','warehouse'], 'Low stock alert', `${product.name} (${product.sku}) is down to ${product.stock} units in ${product.warehouse}.`);
  }
  res.json(serializeProduct(product, []));
}

export async function lowStockAlerts(_req, res) {
  const result = await query(`SELECT * FROM products WHERE is_active = true AND stock <= low_stock_threshold ORDER BY stock ASC`);
  res.json(result.rows.map((r) => serializeProduct(r, [])));
}

// Upload images and store as BYTEA in Postgres.
// Optional field `colors` (JSON array) lets admin tag each image with a colour.
// Optional field `sortOrders` (JSON array of numbers) sets display order.
export async function uploadImages(req, res) {
  const { id } = req.params;
  const existing = await query('SELECT id FROM products WHERE id = $1', [id]);
  if (!existing.rows[0]) return res.status(404).json({ error: 'Product not found' });

  const files = req.files || [];
  if (files.length === 0) return res.status(400).json({ error: 'No image files were uploaded' });

  // Parse optional per-image metadata sent alongside files
  let colors     = [];
  let sortOrders = [];
  try { colors     = JSON.parse(req.body.colors     || '[]'); } catch (_) {}
  try { sortOrders = JSON.parse(req.body.sortOrders || '[]'); } catch (_) {}

  for (let i = 0; i < files.length; i++) {
    const f         = files[i];
    const color     = colors[i] || null;
    const sortOrder = sortOrders[i] != null ? Number(sortOrders[i]) : i;
    await query(
      'INSERT INTO product_images (product_id, image_data, mime_type, color, sort_order) VALUES ($1,$2,$3,$4,$5)',
      [id, f.buffer, f.mimetype, color, sortOrder]
    );
  }

  const imageRecords = await fetchImageRecords(req, id);
  const product = await query('SELECT * FROM products WHERE id = $1', [id]);
  res.json(serializeProduct(product.rows[0], imageRecords));
}

// Serve a single product image from Postgres BYTEA
export async function serveImage(req, res) {
  const { imageId } = req.params;
  const result = await query('SELECT image_data, mime_type FROM product_images WHERE id = $1', [imageId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Image not found' });
  const { image_data, mime_type } = result.rows[0];
  res.set('Content-Type', mime_type);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(image_data);
}

// Update metadata (color, sort order) of an existing image record
export async function updateImageMeta(req, res) {
  const { imageId } = req.params;
  const { color, sortOrder } = req.body;
  const sets = [], params = [];
  if (color     !== undefined) { params.push(color || null); sets.push(`color = $${params.length}`); }
  if (sortOrder !== undefined) { params.push(Number(sortOrder)); sets.push(`sort_order = $${params.length}`); }
  if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
  params.push(imageId);
  const result = await query(`UPDATE product_images SET ${sets.join(',')} WHERE id = $${params.length} RETURNING id, color, sort_order`, params);
  if (!result.rows[0]) return res.status(404).json({ error: 'Image not found' });
  res.json(result.rows[0]);
}

// Remove a single image by its DB id
export async function removeImage(req, res) {
  const { id, imageId } = req.params;
  if (imageId) {
    await query('DELETE FROM product_images WHERE id = $1 AND product_id = $2', [imageId, id]);
    return res.json({ success: true });
  }
  // Legacy: remove by URL from images[] column
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'imageId param or url body field required' });
  const existing = await query('SELECT * FROM products WHERE id = $1', [id]);
  if (!existing.rows[0]) return res.status(404).json({ error: 'Product not found' });
  const remaining = (existing.rows[0].images || []).filter((u) => u !== url);
  const imageUrl  = existing.rows[0].image_url === url ? (remaining[0] || null) : existing.rows[0].image_url;
  const result    = await query('UPDATE products SET images=$1, image_url=$2 WHERE id=$3 RETURNING *', [remaining, imageUrl, id]);
  res.json(serializeProduct(result.rows[0], []));
}

export { serializeProduct };
