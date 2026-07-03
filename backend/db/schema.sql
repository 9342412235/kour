-- The Kour e-commerce database schema
-- Run via: npm run migrate

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- USERS ----------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id     TEXT UNIQUE,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  avatar_url    TEXT,
  password_hash TEXT,
  reset_token        TEXT,
  reset_token_expires TIMESTAMPTZ,
  role          TEXT NOT NULL DEFAULT 'customer'
                CHECK (role IN ('admin','warehouse','support','blogger','customer')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backfill columns for databases migrated from an earlier schema version.
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;
ALTER TABLE users ALTER COLUMN google_id DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;

-- The platform now has a single 'admin' role (no separate super admin) —
-- collapse any pre-existing super admin accounts into admin before
-- tightening the constraint, then widen/narrow it to match.
UPDATE users SET role = 'admin' WHERE role = 'superadmin';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin','warehouse','support','blogger','customer'));

-- Granular permission, settable from Staff Accounts, that lets a
-- specific Admin login view/edit the Tax & Invoicing settings. Off by
-- default — an Admin account sees nothing in that tab until a Super
-- Admin flips this on for them from Staff Accounts.
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_view_tax_invoices BOOLEAN NOT NULL DEFAULT false;

-- ---------- COMPANY SETTINGS (Admin) ----------
-- Singleton row (id is always 1) holding every setting an Admin
-- frontend manages: company info, contact info, address, email &
-- notification preferences, maintenance mode, and backup settings.
CREATE TABLE IF NOT EXISTS company_settings (
  id                    INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),

  -- Company information
  company_name          TEXT DEFAULT '',
  legal_name            TEXT DEFAULT '',
  registration_number   TEXT DEFAULT '',
  tax_id                TEXT DEFAULT '',
  logo_url              TEXT,

  -- Contact information
  contact_email         TEXT DEFAULT '',
  contact_phone         TEXT DEFAULT '',
  support_email         TEXT DEFAULT '',
  website               TEXT DEFAULT '',

  -- Address details
  address_line1         TEXT DEFAULT '',
  address_line2         TEXT DEFAULT '',
  city                  TEXT DEFAULT '',
  state                 TEXT DEFAULT '',
  postal_code           TEXT DEFAULT '',
  country               TEXT DEFAULT 'IN',

  -- Email & notification settings
  smtp_from_name         TEXT DEFAULT '',
  notify_new_orders      BOOLEAN NOT NULL DEFAULT true,
  notify_low_stock       BOOLEAN NOT NULL DEFAULT true,
  notify_new_tickets     BOOLEAN NOT NULL DEFAULT true,
  notify_new_users       BOOLEAN NOT NULL DEFAULT false,
  notification_emails    TEXT[] DEFAULT '{}',

  -- Maintenance mode
  maintenance_mode       BOOLEAN NOT NULL DEFAULT false,
  maintenance_message    TEXT DEFAULT 'We are performing scheduled maintenance. Please check back soon.',

  -- Backup settings
  backup_frequency       TEXT NOT NULL DEFAULT 'daily' CHECK (backup_frequency IN ('hourly','daily','weekly','monthly')),
  backup_retention_days  INTEGER NOT NULL DEFAULT 30 CHECK (backup_retention_days > 0),
  backup_storage_location TEXT DEFAULT 'local',
  last_backup_at          TIMESTAMPTZ,

  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tax settings used on invoices. Configurable so it can be a flat rate or
-- (later) split into CGST/SGST/IGST without another migration.
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS tax_label TEXT DEFAULT 'Sales Tax';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS tax_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS tax_inclusive BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT 'INV';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS invoice_notes TEXT DEFAULT '';

INSERT INTO company_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ---------- CATEGORIES ----------
CREATE TABLE IF NOT EXISTS categories (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL
);

-- ---------- PRODUCTS ----------
CREATE TABLE IF NOT EXISTS products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku         TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  subcategory TEXT,
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(10,2),
  colors      TEXT[] DEFAULT '{}',
  sizes       TEXT[] DEFAULT '{}',
  image_url   TEXT,
  images      TEXT[] DEFAULT '{}',
  related_product_ids UUID[] DEFAULT '{}',
  badge       TEXT,
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 15,
  rating      NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  warehouse   TEXT DEFAULT 'WH-NewYork',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- Backfill columns for databases migrated from an earlier schema version.
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS related_product_ids UUID[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- ---------- CART ----------
CREATE TABLE IF NOT EXISTS cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color       TEXT,
  size        TEXT,
  qty         INTEGER NOT NULL CHECK (qty > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id, color, size)
);

-- ---------- WISHLIST ----------
CREATE TABLE IF NOT EXISTS wishlist_items (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

-- ---------- ADDRESSES ----------
CREATE TABLE IF NOT EXISTS addresses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label       TEXT DEFAULT 'Home',
  line1       TEXT NOT NULL,
  line2       TEXT,
  city        TEXT NOT NULL,
  state       TEXT,
  postal_code TEXT NOT NULL,
  country     TEXT NOT NULL DEFAULT 'IN',
  phone       TEXT,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- ORDERS ----------
CREATE TABLE IF NOT EXISTS orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number  TEXT UNIQUE NOT NULL,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
                CHECK (payment_status IN ('unpaid','paid','refunded')),
  subtotal      NUMERIC(10,2) NOT NULL,
  shipping_fee  NUMERIC(10,2) NOT NULL DEFAULT 0,
  total         NUMERIC(10,2) NOT NULL,
  shipping_address_id UUID REFERENCES addresses(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);

-- Tax/invoice snapshot — captured at order time so historical invoices
-- don't change if the store's tax settings are edited later.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_label TEXT DEFAULT 'Sales Tax';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cod';

CREATE TABLE IF NOT EXISTS order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  color       TEXT,
  size        TEXT,
  qty         INTEGER NOT NULL,
  price       NUMERIC(10,2) NOT NULL
);

-- ---------- SHIPMENTS ----------
CREATE TABLE IF NOT EXISTS shipments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_no TEXT UNIQUE NOT NULL,
  type        TEXT NOT NULL DEFAULT 'outbound' CHECK (type IN ('outbound','inbound')),
  order_id    UUID REFERENCES orders(id) ON DELETE SET NULL,
  reference   TEXT,
  items_count INTEGER NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'ready_to_pack',
  warehouse   TEXT DEFAULT 'WH-NewYork',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- SUPPORT TICKETS ----------
CREATE TABLE IF NOT EXISTS tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_no   TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  subject     TEXT NOT NULL,
  description TEXT DEFAULT '',
  priority    TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sla_due_at  TIMESTAMPTZ,
  escalated   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS escalated BOOLEAN NOT NULL DEFAULT false;

-- ---------- CRM ----------
CREATE TABLE IF NOT EXISTS crm_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  note        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_notes_customer ON crm_notes(customer_id);

-- ---------- BLOG ----------
CREATE TABLE IF NOT EXISTS blog_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  content     TEXT DEFAULT '',
  cover_image TEXT,
  images      TEXT[] DEFAULT '{}',
  author_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  views       INTEGER NOT NULL DEFAULT 0,
  likes       INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

CREATE TABLE IF NOT EXISTS blog_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- REVIEWS ----------
CREATE TABLE IF NOT EXISTS reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);

-- ---------- NOTIFICATIONS ----------
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT DEFAULT '',
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- ---------- OTP CODES (email/password change confirmation) ----------
CREATE TABLE IF NOT EXISTS otp_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose     TEXT NOT NULL CHECK (purpose IN ('change_email','change_password','login_verify')),
  code_hash   TEXT NOT NULL,
  new_value   TEXT, -- e.g. the new email address being confirmed, if any
  expires_at  TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  attempts    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_codes_user ON otp_codes(user_id, purpose);

-- ---------- SITE CONTENT (admin-customizable storefront content) ----------
-- Singleton row (id = 1) holding everything an Admin can edit about the
-- public storefront's navbar, hero/banner section, and top announcement bar
-- without a code deploy.
CREATE TABLE IF NOT EXISTS site_content (
  id              INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nav_links       JSONB NOT NULL DEFAULT '[]',   -- [{ "label": "Shop", "url": "/shop" }, ...]
  top_bar_text    TEXT DEFAULT 'Free shipping on all orders',
  top_bar_enabled BOOLEAN NOT NULL DEFAULT true,
  hero_title      TEXT DEFAULT 'Welcome to The Kour',
  hero_subtitle   TEXT DEFAULT '',
  hero_cta_text   TEXT DEFAULT 'Shop Now',
  hero_cta_url    TEXT DEFAULT '/shop',
  hero_image_url  TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO site_content (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ---------- AUDIT LOGS ----------
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_name  TEXT,
  actor_role  TEXT,
  action      TEXT NOT NULL,        -- e.g. 'settings.update', 'staff.create', 'order.status_change'
  entity_type TEXT,                 -- e.g. 'order', 'product', 'user'
  entity_id   TEXT,
  details     JSONB DEFAULT '{}',
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);

-- ---------- BACKUP RUNS (history shown on Admin dashboard) ----------
CREATE TABLE IF NOT EXISTS backup_runs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by TEXT NOT NULL DEFAULT 'auto' CHECK (triggered_by IN ('auto','manual')),
  file_name   TEXT NOT NULL,
  orders_count INTEGER NOT NULL DEFAULT 0,
  products_count INTEGER NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success','failed')),
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at trigger helper
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','products','orders','shipments','tickets','blog_posts','company_settings','site_content'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON %I', t);
    EXECUTE format('CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t);
  END LOOP;
END $$;

-- ---------- PRODUCT IMAGES (binary storage in DB) ----------
-- Replaces file-system URL storage. Images stored as BYTEA so they
-- can be served independently of the upload directory.
CREATE TABLE IF NOT EXISTS product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_data  BYTEA NOT NULL,
  mime_type   TEXT NOT NULL DEFAULT 'image/jpeg',
  color       TEXT,            -- optional: link image to a product colour
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

-- ---------- SITE CONTENT IMAGES (binary storage) ----------
-- Stores hero/banner images as BYTEA so GIFs and other formats work
-- without relying on a public file-system URL.
CREATE TABLE IF NOT EXISTS site_content_images (
  purpose     TEXT PRIMARY KEY,           -- e.g. 'hero'
  image_data  BYTEA NOT NULL,
  mime_type   TEXT NOT NULL DEFAULT 'image/jpeg',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
