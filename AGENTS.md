<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Quick Start

```bash
npm run dev    # dev server (http://localhost:3000)
npm run build  # production build
npm run lint   # eslint (flat config)
npx tsc --noEmit  # typecheck (no output = clean)
```

No test runner config exists yet. `vitest` and `playwright` are installed but unused.

## Architecture

- **Framework:** Next.js 16.3.3 App Router, React 19, TypeScript (strict), Tailwind 4
- **Backend:** Supabase (Postgres + Auth + Realtime + RLS)
- **Deploy:** Vercel (`qr-cafe-blond.vercel.app`)
- **Proxy:** `src/proxy.ts` — Next 16 renamed `middleware` → `proxy`. Parses subdomain from host, sets `x-cafe-slug` header for Server Components.
- **Multi-tenant:** Each café gets a subdomain (`<slug>.qrcafe.app`, locally `<slug>.localhost`)
- **Roles:** `super_admin`, `owner`, `staff` — stored in `cafe_profiles` table, enforced server-side in `src/lib/auth.ts`
- **WhatsApp:** Baileys-based bot in `src/wa/` for order notifications, bill PDF delivery, and menu-link ordering

## Critical: Shared Supabase Project

This app shares its Supabase instance with another app. Consequences:
- Staff table is `cafe_profiles` (not `profiles`)
- RLS helpers are prefixed: `qrcafe_auth_role()`, `qrcafe_auth_restaurant_id()`
- **Never rename these** in code or migrations
- After any schema change via SQL: run `NOTIFY pgrst, 'reload schema';` in the Supabase dashboard SQL editor (not via `execute_sql` MCP, which hits a different connection)

## Routes

### Public
| Route | Purpose |
|-------|---------|
| `/` | Marketing landing page (apex) or café menu (subdomain) |
| `/t/[token]` | Customer menu via QR token |
| `/c/[slug]` | Public café menu by slug |
| `/c/[slug]/t/[tableLabel]` | Menu by slug + table label |
| `/order/[statusToken]` | Live order status tracking |
| `/onboarding` | Self-service café setup (creates tenant, owner, tables, starter menu) |

### Staff
| Route | Purpose |
|-------|---------|
| `/login` | Staff login (routes by role: super→/super, owner→/admin, staff→/pos) |
| `/pos` | Point of sale |
| `/kds` | Kitchen display system |

### Owner
| Route | Purpose |
|-------|---------|
| `/admin` | Owner dashboard (Dashboard, Menu, Tables, Branding, Settings, Analytics tabs) |
| `/admin/billing` | Subscription management (Razorpay) |

### Super Admin
| Route | Purpose |
|-------|---------|
| `/super` | Super-admin console (all tenants, staff, plans, audit) |
| `/super/cafe/[id]` | Single café detail view |

## API Endpoints

### Core
- `POST /api/orders` — customer order creation (rate-limited, idempotent, server-recomputed prices)
- `GET /api/order-status/[token]` — public order status lookup
- `PATCH /api/orders/[id]` — status/payment update (staff = status only)
- `POST /api/feedback` — customer rating + compliments
- `POST /api/table-service` — call waiter, etc. (dispatched as audit event)

### POS
- `POST /api/pos/order` — POS order creation (staff-facing, dine-in/takeaway/delivery)
- `GET /api/pos/active-orders` — active POS orders

### KDS
- `GET /api/kds/tickets` — kitchen display active tickets

### Admin
- `POST /api/admin/crud` — owner CRUD (menu items, categories, tables, settings, order status, WhatsApp bill, shift/Z-report)
- `GET /api/analytics` — dashboard analytics (revenue, top items, payment breakdown)

### Billing
- `POST /api/billing/checkout` — initiate Razorpay subscription
- `POST /api/billing/cancel` — cancel subscription
- `POST /api/billing/webhook` — Razorpay webhook (subscription lifecycle)

### Super Admin
- `POST|PATCH|DELETE /api/super/staff` — staff lifecycle (service-role Auth admin)
- `POST /api/super/crud` — café/menu/table CRUD, plan management, platform config
- `GET /api/super/tenant` — single tenant detail (restaurant, categories, items, tables, orders, audit)
- `GET /api/super/audit` — paginated audit log with filters

### Auth
- `POST /api/auth/login` — email/password login, returns role-based destination

## Environment

`.env.local` requires:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser-safe)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only — never prefix with `NEXT_PUBLIC_`)
- `NEXT_PUBLIC_APP_URL` (used for QR URLs)

See `.env.example` for the full list including Razorpay test keys.

## Local Dev: Subdomains

Use `*.localhost` (resolves to 127.0.0.1) for multi-tenant testing:
- `http://curry-leaf.localhost:3000/` — Curry Leaf menu
- `http://brews-bytes.localhost:3000/` — Brews & Bytes menu
- `http://localhost:3000/` — apex / super-admin console

## Landing Page

11 sections composed in `src/app/page.tsx` (server component with JSON-LD structured data):

1. **Navbar** — sticky white, glassmorphism on scroll, mobile hamburger
2. **Hero** — dark bg, animated stat counters (28 businesses, 1000+ orders, ₹5 Lakh+, 4.8/5 rating), trust badges
3. **BusinessTypes** — auto-scrolling ticker of 12 F&B types
4. **Features** — 6 category tabs × 3 sub-features = 18 feature cards
5. **HowItWorks** — 3-step flow with phone-frame mock visuals
6. **Pricing** — 4 tiers with 23-row comparison table
7. **Testimonials** — 3 cards with metric badges
8. **FAQ** — 8-question accordion (aria-expanded, smooth transitions)
9. **PWAInstall** — dark CTA for app installation
10. **CTA** — final conversion section
11. **Footer** — 4-column grid with social links

**Theme:** Light landing (slate-50 bg, white cards, indigo-600 accent) via `.landing-page` class in `globals.css`. Dark hero/footer only. Existing dark admin/KDS/POS/menu theme is untouched.

**Fonts:** Plus Jakarta Sans (headings), Inter (body), Geist Mono (data/prices). Loaded via `next/font/google`.

## Code Conventions

- **Path alias:** `@/*` → `./src/*`
- **Prettier:** double quotes, 100 width, trailing commas, 2-semicolon indent
- **ESLint:** flat config (`eslint.config.mjs`), `no-explicit-any` warn, unused vars warn (ignore `_` prefix)
- **Design system:** Read `DESIGN.md` before visual/UI decisions. Dark luxury theme (#0c0a09 stone 950, #f59e0b amber accent) for admin/KDS/POS. Landing page uses separate light theme.

## Directory Structure

```
src/
├── app/              # Next.js App Router pages + API routes
├── components/       # Shared React components
│   └── landing/      # Landing page sections (Navbar, Hero, Features, etc.)
├── features/         # Domain features (admin, menu, pos)
├── hooks/            # Custom React hooks (useCart, useAudioTone, useOrderPolling, etc.)
├── lib/              # Core logic (auth, supabase, validation, crypto, razorpay, bill-pdf, etc.)
├── proxy.ts          # Next 16 middleware (subdomain parsing)
├── tests/            # Vitest tests (minimal)
├── types/            # Shared TypeScript types
└── wa/               # WhatsApp bot (Baileys: socket, notifications, messages)
supabase/
└── migrations/       # SQL migration files (apply in order)
```

## SaaS Pricing Tiers (Landing Page)

| Feature | Basic ₹699/mo | Pro ₹999/mo |
|---------|---------------|-------------|
| QR Digital Menu | ✓ | ✓ |
| Live Order Viewing | ✓ | ✓ |
| Table Management | ✓ | ✓ |
| Basic Dashboard | ✓ | ✓ |
| KOT & Bill Printing (BT) | ✓ | ✓ |
| Email Support | ✓ | ✓ |
| Kitchen Display System (KDS) | | ✓ |
| Stock Control & Alerts | | ✓ |
| Gravy & Recipe Mgmt | | ✓ |
| Multi-outlet Dashboard | | ✓ |
| Menu Sync & API/Webhooks | | ✓ |
| Advanced Analytics | | ✓ |
| Priority Support | | ✓ |

## Gotchas

- Razorpay integration is wired (checkout/cancel/webhook routes exist) but uses mock mode in dev
- Rate limiting is in-memory per token/IP — needs Redis/Upstash for production
- Supabase Realtime for KDS uses authenticated browser client (RLS scopes to café)
- WhatsApp bot (`npm run wa`) requires Baileys pairing on first run
- `TrustBar.tsx` exists in `src/components/landing/` but is not rendered on the landing page
- After schema changes via SQL: run `NOTIFY pgrst, 'reload schema';` in Supabase dashboard
- Demo creds: `super@qrcafe.test` / `QrCafeDev123!`, `owner@curryleaf.test` / `QrCafeDev123!`
