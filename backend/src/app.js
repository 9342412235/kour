import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import passport from './config/passport.js';

import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/products.routes.js';
import cartRoutes from './routes/cart.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import orderRoutes from './routes/orders.routes.js';
import userRoutes from './routes/users.routes.js';
import ticketRoutes from './routes/tickets.routes.js';
import blogRoutes from './routes/blog.routes.js';
import shipmentRoutes from './routes/shipments.routes.js';
import reviewRoutes from './routes/reviews.routes.js';
import addressRoutes from './routes/addresses.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import adminRoutes from './routes/admin.routes.js';
import adminSettingsRoutes from './routes/admin-settings.routes.js';
import crmRoutes from './routes/crm.routes.js';
import contentRoutes from './routes/content.routes.js';
import taxRoutes from './routes/tax.routes.js';
import couponsRoutes from './routes/coupons.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';

dotenv.config();

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(compression());

const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

console.log('==============================');
console.log('Allowed Origins');
console.log(allowedOrigins);
console.log('==============================');

const corsOptions = {
  origin(origin, callback) {
    console.log('Incoming Origin:', origin);

    // Allow Postman, curl, server-to-server requests
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      console.log('CORS Allowed:', origin);
      return callback(null, true);
    }

    console.error('CORS Blocked:', origin);
    console.error('Allowed Origins:', allowedOrigins);

    return callback(new Error('Not allowed by CORS'));
  },

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-App'
  ]
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')
);

app.use(passport.initialize());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

app.get('/', (req, res) => {
  res.json({
    message: 'The Kour Backend Running',
    status: 'OK'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString()
  });
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/management', adminSettingsRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/tax-settings', taxRoutes);
app.use('/api/coupons', couponsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;