# QRslice — Dine-in Ordering Platform (v1.2.0)

Secure, multi-tenant (super-admin managed) QR table-ordering system for small cafés.
Built with Next.js 16 (App Router) + TypeScript + Tailwind + Supabase.

> **Note:** This project has been legally proofed and is protected under a proprietary license. All source code contains copyright headers.

## Features (full SaaS)
- **Multi-tenant by subdomain:** each café gets its own address `<slug>.qrslice.app` (locally `<slug>.localhost`). Customer menu is served at the café subdomain root.
- **Production-grade Middleware:** `middleware.ts` dynamically handles tenant isolation, super-admin route protection, staff authorization, subscription gating, and fast in-memory Edge caching.
- **Customer:** open the café subdomain (or scan a table QR) → pick a table → browse menu → cart → place order (pay at counter or online) → live status page.
- **KDS:** real-time kitchen board (realtime + offline cache), status transitions, UNPAID badge. Accessible to **owner** and **staff** (staff = kitchen control only).
- **Admin:** menu availability toggle, table management, printable QR, daily report, billing dashboard.
- **Super-admin console (`/super`):** full CRUD across the entire platform.
- **Security:** RLS on all tables, server-only secrets, Edge route authorization, middleware security headers (CSP, X-Frame-Options), strict fallback removal for crypto/payment logic.

## Setup
1. Create a Supabase project. Copy `.env.example` → `.env.local` and fill:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser-safe)
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only — strictly required for cryptography/tenant isolation)
   - `NEXT_PUBLIC_APP_URL` (used for QR URLs)
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` (strictly required for payments)
2. Run the migration in the Supabase SQL editor (or via CLI):
   `supabase/migrations/0001_init.sql`
3. Create users via Supabase Auth, then insert `cafe_profiles` rows:
   - super-admin: `role='super_admin'`, `restaurant_id=NULL`
   - owner/staff: `role`, `restaurant_id` = one of the seeded cafés
4. `npm install && npm run dev` → open `http://localhost:3000`.

### Local subdomain dev (localhost)
Subdomains need DNS to resolve in production, but for local development use **`*.localhost`**, which resolves to `127.0.0.1` with zero configuration:
- Apex / super-admin console: `http://localhost:3000/`
- Curry Leaf menu: `http://curry-leaf.localhost:3000/`
- Brews & Bytes menu: `http://brews-bytes.localhost:3000/`
- Table deep-link still works: `http://curry-leaf.localhost:3000/t/<qr_token>`

The host and auth states are securely parsed in `middleware.ts` at the edge, injecting context headers (`x-tenant-id`, `x-user-role`, etc.) which are then securely consumed by Server Components.

## Routes
- `/` — marketing at apex; **café menu at a café subdomain** (table picker → order)
- `/c/[slug]` — path-based storefront alternative
- `/t/[token]` — customer menu (resolved by table QR token)
- `/order/[statusToken]` — live order status
- `/login`, `/kds` — staff kitchen display
- `/admin` — owner café management (protected by middleware & subscription gate)
- `/super` — super-admin console (strictly protected by middleware)

## API
- `POST /api/orders` — create order (rate-limited, idempotent, server-priced)
- `GET /api/order-status/[token]` — public order status
- `PATCH /api/orders/[id]` — status/payment update (RLS-scoped, validated transitions)
- `POST|PATCH|DELETE /api/super/staff` — super-admin staff lifecycle
- `POST /api/auth/login` — handles staff/owner sessions

## Demo credentials
- `super@qrslice.test` / `QrSliceDev123!` → super-admin (`/super`)
- `owner@tableandgrain.com` / `password123` → Table & Grain owner (`/admin`, `/pos`)
- Staff logins can be created from the super-admin console; the temp password is shown once.

## Shared-project caveats (important)
This app is deployed against a Supabase project that also hosts a separate, unrelated application. To avoid colliding with that app's schema, the migration:
- names our staff table `cafe_profiles` (instead of `profiles`), and
- prefixes our RLS helper functions `qrcafe_auth_role()` / `qrcafe_auth_restaurant_id()`

Keep these names if you edit the migration or the app code.

### Applying the migration / schema-cache reload
When you create tables via raw SQL, PostgREST's API **schema cache is not refreshed automatically**. After any schema change, reload it from the dashboard SQL editor:
```sql
NOTIFY pgrst, 'reload schema';
```
