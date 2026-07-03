import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { uploadProductImages } from '../middleware/upload.js';
import * as ctrl from '../controllers/products.controller.js';

const router = express.Router();

// Public image serving (no auth — src="" in <img> tags)
router.get('/images/:imageId', asyncHandler(ctrl.serveImage));

router.get('/categories',   asyncHandler(ctrl.listCategories));
router.post('/categories',  requireAuth, requireRole('admin'), asyncHandler(ctrl.createCategory));
router.patch('/categories/:id',  requireAuth, requireRole('admin'), asyncHandler(ctrl.updateCategory));
router.delete('/categories/:id', requireAuth, requireRole('admin'), asyncHandler(ctrl.deleteCategory));
router.get('/subcategories', asyncHandler(ctrl.listSubcategories));
router.get('/low-stock',    requireAuth, requireRole('admin','warehouse'), asyncHandler(ctrl.lowStockAlerts));
router.get('/:id',  optionalAuth, asyncHandler(ctrl.getProduct));
router.get('/',     optionalAuth, asyncHandler(ctrl.listProducts));

router.post('/',         requireAuth, requireRole('admin','warehouse'), asyncHandler(ctrl.createProduct));
router.patch('/:id',     requireAuth, requireRole('admin','warehouse'), asyncHandler(ctrl.updateProduct));
router.patch('/:id/stock', requireAuth, requireRole('admin','warehouse'), asyncHandler(ctrl.adjustStock));
router.delete('/:id',    requireAuth, requireRole('admin'), asyncHandler(ctrl.deleteProduct));

// Image management (stored in Postgres BYTEA)
router.post(
  '/:id/images',
  requireAuth,
  requireRole('admin','warehouse'),
  (req, res, next) => uploadProductImages(req, res, (err) => (err ? res.status(400).json({ error: err.message }) : next())),
  asyncHandler(ctrl.uploadImages)
);
router.patch('/:id/images/:imageId', requireAuth, requireRole('admin','warehouse'), asyncHandler(ctrl.updateImageMeta));
router.delete('/:id/images/:imageId', requireAuth, requireRole('admin','warehouse'), asyncHandler(ctrl.removeImage));
router.delete('/:id/images',          requireAuth, requireRole('admin','warehouse'), asyncHandler(ctrl.removeImage));

export default router;
