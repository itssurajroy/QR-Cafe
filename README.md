# QR Café — Dine-in Ordering Platform

Secure, multi-tenant (super-admin managed) QR table-ordering system for small cafés.
Built with Next.js 16 (App Router) + TypeScript + Tailwind + Supabase.

## Features (full SaaS)
- **Multi-tenant by subdomain:** each café gets its own address `<slug>.qrcafe.app`
  (locally `<slug>.localhost`). Customer menu is served at the café subdomain root.
- **Customer:** open the café subdomain (or scan a table QR) → pick a table → browse menu
  → cart → place order (pay at counter) → live status page.
- **KDS:** real-time kitchen board (realtime + offline cache), status transitions, UNPAID badge.
  Accessible to **owner** and **staff** (staff = kitchen control only).
- **Admin:** menu availability toggle, table management, printable QR, daily report.
- **Super-admin console (`/super`):** full CRUD across the entire platform —
  - **Cafés:** create / edit / delete any café, plus branding & settings (currency, timezone, logo).
  - **Staff:** invite owners & staff (email + temp password), change role, suspend/activate, delete.
  - **Menu:** categories, items (price/veg/availability/description), and modifier groups + options.
  - **Tables:** create / edit / delete tables and regenerate QR tokens.
- **Security:** RLS on all tables (super-admin bypass policy `sa_*` on every table), server-only
  secrets, rate-limited order endpoint, server-recomputed prices, idempotent orders, staff
  permission matrix enforced server-side (staff cannot change payments).

## Setup
1. Create a Supabase project. Copy `.env.example` → `.env.local` and fill:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser-safe)
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only — never prefix with `NEXT_PUBLIC_`)
   - `NEXT_PUBLIC_APP_URL` (used for QR URLs)
2. Run the migration in the Supabase SQL editor (or via CLI):
   `supabase/migrations/0001_init.sql`
 3. Create users via Supabase Auth, then insert `cafe_profiles` rows
    (note: the table is named `cafe_profiles`, **not** `profiles` — this project
    shares its Supabase instance with another app that already owns a `public.profiles`
    table, so ours was isolated under a distinct name):
    - super-admin: `role='super_admin'`, `restaurant_id=NULL`
    - owner/staff: `role`, `restaurant_id` = one of the seeded cafés
  4. `npm install && npm run dev` → open `http://localhost:3000`.

### Local subdomain dev (localhost)
Subdomains need DNS to resolve in production, but for local development use
**`*.localhost`**, which resolves to `127.0.0.1` with zero configuration:
- Apex / super-admin console: `http://localhost:3000/`
- Curry Leaf menu: `http://curry-leaf.localhost:3000/`
- Brews & Bytes menu: `http://brews-bytes.localhost:3000/`
- Table deep-link still works: `http://curry-leaf.localhost:3000/t/<qr_token>`

The host is parsed in `src/proxy.ts` (Next 16 renamed `middleware` → `proxy`) which sets
the `x-cafe-slug` request header; Server Components read it to scope data.

## Routes
- `/` — marketing at apex; **café menu at a café subdomain** (table picker → order)
- `/t/[token]` — customer menu (resolved by table QR token)
- `/order/[statusToken]` — live order status
- `/login`, `/kds` — staff kitchen display (login routes by role: super→/super, owner→/admin, staff→/kds)
- `/admin` — owner café management
- `/super` — super-admin console (cafés / staff / menu / tables)

## API
- `POST /api/orders` — create order (rate-limited, idempotent, server-priced)
- `GET /api/order-status/[token]` — public order status
- `PATCH /api/orders/[id]` — status/payment update (RLS-scoped, validated transitions; staff = status only)
- `POST|PATCH|DELETE /api/super/staff` — super-admin staff lifecycle (service-role Auth admin)

## Demo credentials
- `super@qrcafe.test` / `QrCafeDev123!` → super-admin (`/super`)
- `owner@curryleaf.test` / `QrCafeDev123!` → Curry Leaf owner (`/admin`, `/kds`)
- Staff logins can be created from the super-admin console; the temp password is shown once.

## Notes
- Razorpay is deferred (clean seam left for later).
- Per-token/IP rate limiting is in-memory; swap for Redis/Upstash in production.
- Realtime for KDS uses the authenticated browser client (RLS scopes to the café).

## Shared-project caveats (important)
This app is deployed against a Supabase project that also hosts a separate,
unrelated application. To avoid colliding with that app's schema, the migration:
- names our staff table `cafe_profiles` (instead of `profiles`), and
- prefixes our RLS helper functions `qrcafe_auth_role()` / `qrcafe_auth_restaurant_id()`
  (instead of `auth_role()` / `auth_restaurant_id()`).

Keep these names if you edit the migration or the app code
(`src/lib/auth.ts` queries `cafe_profiles`).

### Applying the migration / schema-cache reload
When you create tables via raw SQL (the Supabase SQL editor or `apply_migration`),
PostgREST's API **schema cache is not refreshed automatically** from external
connections. After any schema change, reload it from the dashboard SQL editor:
```sql
NOTIFY pgrst, 'reload schema';
```
Otherwise the REST API returns `PGRST205 — Could not find the table in the schema cache`
for the new tables. (The MCP `execute_sql` tool talks to a different database than the
REST API, so verify changes against the live API, not just `execute_sql`.)
