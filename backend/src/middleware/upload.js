import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_ROOT = path.join(__dirname, '../../uploads');

const AVATARS_DIR = path.join(UPLOADS_ROOT, 'avatars');
const BLOG_DIR   = path.join(UPLOADS_ROOT, 'blog');
const HERO_DIR   = path.join(UPLOADS_ROOT, 'hero');
for (const dir of [AVATARS_DIR, BLOG_DIR, HERO_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

function imageFileFilter(req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'));
  }
  cb(null, true);
}

function makeFilename(file) {
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  return `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
}

// ---------- In-memory storage for product images (stored in Postgres BYTEA) ----------
export const uploadProductImages = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
}).array('images', 10);

// ---------- Disk storage for avatars ----------
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATARS_DIR),
  filename:    (req, file, cb) => cb(null, makeFilename(file)),
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('avatar');

// ---------- Disk storage for blog images ----------
const blogStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, BLOG_DIR),
  filename:    (req, file, cb) => cb(null, makeFilename(file)),
});

export const uploadBlogImages = multer({
  storage: blogStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
}).array('images', 10);

// ---------- In-memory storage for hero image (also stored in Postgres) ----------
export const uploadHeroImage = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB — allow GIFs
}).single('image');

export function publicUrl(req, absolutePath) {
  const rel = absolutePath.split(UPLOADS_ROOT)[1].split(path.sep).join('/');
  return `${req.protocol}://${req.get('host')}/uploads${rel}`;
}
