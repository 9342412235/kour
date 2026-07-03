# The Kour — Full-Stack E-commerce App

This project now has a real backend wired to your existing React frontend.

- **Backend**: Node.js + Express + PostgreSQL, Google OAuth login, JWT sessions (httpOnly cookie)
- **Frontend**: Your existing Vite + React + Tailwind UI, now calling the real API instead of mock data for auth, products, cart, wishlist, orders, and reviews

```
project/
├── backend/                ← Express API + PostgreSQL
├── frontend/                ← Storefront (customers)
├── admin-frontend/          ← Admin dashboard (users/staff, orders, warehouse, tickets,
│                                blog, catalog, finance, settings & company config, logs)
├── warehouse-frontend/      ← Warehouse dashboard
├── support-frontend/        ← Support dashboard
└── blogger-frontend/        ← Blog dashboard
```

## 1. Database setup

Install PostgreSQL locally (or use a hosted instance — Supabase, Neon, RDS, etc).

```bash
createdb thekour
createuser thekour_user --pwprompt   # set password to match DATABASE_URL below
```

## 2. Backend setup

```bash
cd backend
cp .env.example .env
npm install
```

Edit `.env`:
- `DATABASE_URL` — your Postgres connection string
- `JWT_SECRET` / `SESSION_SECRET` — long random strings (`openssl rand -hex 32`)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` — see step 4 below
- `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` — credentials for the very first Admin account (see step 3a)

Run the migration, seed the product catalog, and create the first Admin:

```bash
npm run migrate
npm run seed
npm run seed:admin   # creates/updates the one Admin account from .env
npm run dev          # starts on http://localhost:4000
```

### 3a. Creating the first Admin

There is **no email-based auto-promotion** anymore — registering or signing in
with Google never grants anyone a staff role. The only way to get an
Admin account is to run the seed script above with `ADMIN_EMAIL` /
`ADMIN_PASSWORD` set in `backend/.env`. Run it again any time to reset
that account's password or to re-promote it if its role ever changed.

Every other staff account — **warehouse, support, blogger** — is then
created by an Admin from the Admin dashboard's **Management** section
(step 3b), not by self-registration. Additional Admin logins can be created
there too — there is only one Admin role, so any Admin can create another.

### 3b. Admin dashboard — Management section

```bash
cd admin-frontend
cp .env.example .env
npm install
npm run dev          # starts on http://localhost:5175
```

Sign in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you seeded above, then go to
**Management** in the sidebar. From there you can:

- **Staff Accounts** — create the name/email/password/role for each Admin,
  Warehouse, Support, and Blogger login. That same email + password is what
  they use to sign into `admin-frontend`, `warehouse-frontend`,
  `support-frontend`, and `blogger-frontend` respectively.
- **Company Information / Contact Information / Address Details / Email &
  Notification Settings / Maintenance Mode / Backup Settings** — platform-wide
  configuration, stored in the `company_settings` table.

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env     # VITE_API_URL=http://localhost:4000
npm install
npm run dev               # starts on http://localhost:5173
```

## 4. Google OAuth setup (required for login)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → create a project (or pick one).
2. **OAuth consent screen**: set up as "External", add your email as a test user while in testing mode.
3. **Credentials → Create Credentials → OAuth client ID** → Application type: **Web application**.
4. Authorized redirect URI: `http://localhost:4000/api/auth/google/callback`
5. Authorized JavaScript origin: `http://localhost:5173`
6. Copy the generated **Client ID** and **Client Secret** into `backend/.env`.

When you deploy, add the production URLs too (e.g. `https://api.yourdomain.com/api/auth/google/callback`) and update `GOOGLE_CALLBACK_URL`, `CLIENT_URL`, and `API_URL` accordingly.

## 5. How login & roles work

- Clicking **"Continue with Google"** on `/login` redirects to Google, then back to `/api/auth/google/callback`, which creates/updates the user row and sets an httpOnly JWT cookie.
- Every new sign-up — Google or email/password — is created with role `customer`. There is no auto-promotion by email anymore.
- Staff roles (`admin`, `warehouse`, `support`, `blogger`) are never created by self-registration:
  - The **first** `admin` account comes from `npm run seed:admin` (step 3a).
  - Every `admin` / `warehouse` / `support` / `blogger` account after that is created by an existing Admin from the Admin dashboard's Management section (`POST /api/admin/management/staff`).
- A regular `admin` can still change a user's role between `warehouse`, `support`, `blogger`, and `customer` via `PATCH /api/users/:id/role` — but creating/editing `admin` accounts always goes through Management → Staff Accounts (`/api/admin/management/staff`), which also handles name/email/password.
- The frontend's dashboard gate (`App.jsx`) in each app reads the role from the real session (`useApp().role`) and only renders for its required role — `Login.jsx` no longer lets you click into any dashboard for free.

## 6. What's fully wired to the real backend

- Google OAuth login / logout / session (`/api/auth/*`)
- Product catalog, categories, single product page (`/api/products`, `/api/products/categories`)
- Cart (add/update/remove, persisted per user) (`/api/cart`)
- Wishlist (`/api/wishlist`)
- Checkout → real order creation with stock decrement (`/api/orders/checkout`)
- Product reviews (`/api/reviews`)

## 7. What's stubbed with mock data (API already built — needs final UI wiring)

To keep this delivery focused, the five role dashboards (`src/pages/dashboards/*.jsx`) still render the original mock arrays (`orders`, `users`, `tickets`, `blogPosts`, `shipments`, `stockAlerts`) for their tables/charts. The **backend already has full CRUD for all of these**:

| Resource | Endpoints |
|---|---|
| Orders | `GET/PATCH /api/orders`, `/api/orders/:id/status`, `/api/orders/:id/payment`, `/api/orders/my` |
| Users (admin) | `GET /api/users`, `PATCH /api/users/:id/role`, `PATCH /api/users/:id/status` |
| Support tickets | `GET/POST/PATCH /api/tickets`, `/api/tickets/:id/messages` |
| Blog posts | `GET/POST/PATCH/DELETE /api/blog`, `/api/blog/:id/comments`, `/api/blog/:id/like` |
| Shipments / stock | `GET/POST/PATCH /api/shipments`, `GET /api/products/low-stock`, `PATCH /api/products/:id/stock` |
| Admin overview stats | `GET /api/admin/overview` |
| Admin: staff accounts | `GET/POST /api/admin/management/staff`, `PATCH/DELETE /api/admin/management/staff/:id` |
| Admin: company settings | `GET/PUT /api/admin/management/settings`, `POST /api/admin/management/settings/backup-now` |
| Addresses | `GET/POST/DELETE /api/addresses` |
| Notifications | `GET /api/notifications`, `/unread-count`, `/:id/read` |

Swap each dashboard's mock-data import for an `api.get(...)` call in a `useEffect`, the same pattern already used in `Shop.jsx`, `Home.jsx`, and `ProductDetail.jsx` — this keeps every dashboard's existing JSX/styling untouched, just backed by real data.

## 8. Production notes

- All write endpoints validate input and use parameterized queries (no SQL injection surface).
- Passwords are never stored — auth is 100% Google OAuth + JWT.
- `helmet`, `cors` (locked to `CLIENT_URL`), and rate limiting are enabled by default.
- Checkout runs inside a DB transaction with `FOR UPDATE` row locks so concurrent checkouts can't oversell stock.
- For production, set `NODE_ENV=production`, serve over HTTPS, and set real secrets — never commit `.env`.
