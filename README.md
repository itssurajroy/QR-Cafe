# QRslice — Next-Gen QR Table Ordering, Kitchen KDS & Cloud POS

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Production Status](https://img.shields.io/badge/Production-Live-success?style=for-the-badge)](https://www.qrslice.com)

> **QR Ordering Without the Chaos.**  
> A calm, real-time operating system built specifically for independent cafés, diners, bistros, and restaurants in India. Combines contactless guest QR ordering, multi-station Kitchen Display Systems (KDS), counter POS billing with GST, raw inventory & gravy batch yield tracking, staff PIN access, table reservations, and automated WhatsApp digital receipts.

---

## 🌐 Live Platform & Demos

| Resource | URL | Description |
|---|---|---|
| **Official Website** | [https://www.qrslice.com](https://www.qrslice.com) | Brand homepage, feature breakdown, and pricing |
| **Interactive Demo Store** | [https://qrslice.com/c/table-and-grain](https://qrslice.com/c/table-and-grain) | Live guest menu for **Table & Grain Cafe** (test ordering on phone) |
| **Instant Onboarding** | [https://qrslice.com/onboarding](https://qrslice.com/onboarding) | 4-step self-serve merchant signup (14-day free trial, no card) |
| **Book a Demo & Support** | [https://www.qrslice.com/contact](https://www.qrslice.com/contact) | 1-on-1 walkthrough scheduling & team enquiry |
| **Direct WhatsApp Concierge** | [https://wa.me/918595101297](https://wa.me/918595101297) | Instant WhatsApp chat support: **`+91 85951 01297`** |

---

## 📑 Table of Contents

1. [What is QRslice?](#what-is-qrslice)
2. [Core Architecture & Capabilities](#core-architecture--capabilities)
   - [1. Guest Dining Experience](#1-guest-dining-experience)
   - [2. Cloud POS Register (`/pos`)](#2-cloud-pos-register-pos)
   - [3. Kitchen Display System (KDS)](#3-kitchen-display-system-kds)
   - [4. Staff Management & PIN Authorization](#4-staff-management--pin-authorization)
   - [5. Raw Inventory & Gravy Batch Engine (BOM OS)](#5-raw-inventory--gravy-batch-engine-bom-os)
   - [6. Dynamic Menu Engineering & Catalog](#6-dynamic-menu-engineering--catalog)
   - [7. Table Standee Designer & High-DPI QR Tokens](#7-table-standee-designer--high-dpi-qr-tokens)
   - [8. CRM, Loyalty & WhatsApp Automations](#8-crm-loyalty--whatsapp-automations)
   - [9. Table Reservations & Visual Floor Status](#9-table-reservations--visual-floor-status)
   - [10. Hardware Integration (ESC/POS Thermal Printing)](#10-hardware-integration-escpos-thermal-printing)
   - [11. Super-Admin Multi-Tenant Control Center (`/super`)](#11-super-admin-multi-tenant-control-center-super)
3. [Technology Stack](#technology-stack)
4. [URL Structure & Subdomain Multi-Tenancy](#url-structure--subdomain-multi-tenancy)
5. [Database Architecture & Security](#database-architecture--security)
6. [Pricing & Business Model](#pricing--business-model)
7. [Local Development Setup](#local-development-setup)
8. [Production Deployment](#production-deployment)
9. [License & Copyright](#license--copyright)

---

## 🚀 What is QRslice?

Traditional restaurant operations are plagued by handwritten paper kitchen order tickets (KOTs), waiter delays during peak rushes, cashier bottlenecks, and 30%+ aggregator commissions.

**QRslice** replaces this chaos with a unified, browser-based operating system:
- **Zero App Downloads**: Guests scan a table QR standee with their phone's native camera; the menu opens instantly in Safari/Chrome.
- **Lightning-Fast Orders**: Guests customize dishes with cooking notes, select variants, and place orders directly to the kitchen in under 10 seconds.
- **Kitchen Clarity**: The kitchen team receives live audio chimes and clear visual cards on any tablet or screen, eliminating lost or illegible tickets.
- **Counter POS**: Cashiers settle tabs via Cash, Card, or direct UPI QR, print 58mm/80mm thermal bills, and send WhatsApp receipts with automated Google Review prompts.

---

## ⚡ Core Architecture & Capabilities

### 1. Guest Dining Experience
- **Instant Scan & Load**: Table standee QR resolves via `/t/[token]` or `/c/[slug]/t/[tableLabel]`.
- **Zero-Friction Cart**: Supports modifiers, portion sizes (Half/Full), dietary indicators (Veg/Non-Veg/Vegan), and custom cooking instructions (e.g. *"Less Spicy"*, *"No Onion"*).
- **Contactless Table Ordering**: Guests can place multiple order rounds under a single continuous table session.
- **Live Order Status Tracker (`/order/[statusToken]`)**: Real-time progress tracker: `Received` $\to$ `Preparing` $\to$ `Ready` $\to$ `Served`.
- **Digital WhatsApp Bill & Review Funnel**: Upon settlement, guests receive a branded WhatsApp receipt with a 5-star Google Review prompt.

### 2. Cloud POS Register (`/pos`)
- **Interactive Floor Grid**: Visual table cards displaying live occupancy, active ticket items, bill totals, and dining duration.
- **Quick Counter-Billing Mode**: Rapid order entry for walk-in takeaway customers with 1-click catalog search.
- **Split & Partial Payments**: Support for splitting bills evenly across guests or dividing between Cash + UPI.
- **Customer Khata (Store Credit)**: Phone-number-based store credit ledger for trusted regular customers.
- **Offline Resilient**: Local IndexedDB caching ensures cashiers can continue taking orders even if broadband drops temporarily.

### 3. Kitchen Display System (KDS)
- **Live Ticket Board (`/pos?view=kitchen`)**: Real-time ticket updates powered by Supabase WebSockets.
- **Audio Chime System**: Web Audio synthesizer alert plays automatically whenever a new order is received.
- **Timer Thresholds & Overdue Alerts**:
  - `0 - 8 mins`: Green (Normal)
  - `8 - 15 mins`: Amber (Approaching target prep time)
  - `15+ mins`: Rose Red Pulsing (Overdue ticket alert)
- **Item Strikethrough Fulfillment**: Chefs can check off individual items as they leave the pass before completing the entire ticket.

### 4. Staff Management & PIN Authorization
- **Terminal Lockscreen**: Shared POS terminals lock automatically to prevent unauthorized access.
- **4-Digit PIN Authentication**: Fast 1-second sign-in for waiters and chefs using SHA-256 encrypted PINs.
- **Role-Based Access Control (RBAC)**:
  - `owner`: Full platform access, revenue dashboards, tax configuration, billing.
  - `manager`: Shift closeouts, voids, refunds, customer balance adjustments.
  - `waiter`: Order punching, table assignment, bill printing.
  - `kitchen`: Read-only access restricted strictly to the KDS kitchen board.

### 5. Raw Inventory & Gravy Batch Engine (BOM OS)
- **Ingredient Master**: Track raw stock (flour, oil, dairy, spices, meats) with standard unit conversions (`kg`, `g`, `L`, `ml`, `pcs`).
- **Prep Batch / Gravy BOM Engine**: Track bulk kitchen preparations (e.g. 40 Litres of *Makhani Gravy* yielding 100 dish portions) with yield loss shrinkage factors.
- **Automated Stock Depletion**: Every fulfilled dish on the KDS automatically decrements mapped raw ingredients and gravy portions.
- **Low-Stock Alerts**: Threshold alerts trigger WhatsApp notifications to managers before critical ingredients run out.

### 6. Dynamic Menu Engineering & Catalog
- **Category Sequencing**: Drag-and-drop sort order for starters, mains, beverages, and desserts.
- **Instant 86 Toggle**: 1-click out-of-stock toggle immediately removes unavailable items from all customer table phones.
- **Rich Media**: High-resolution dish photography optimized with automatic WebP conversion and responsive aspect ratios.

### 7. Table Standee Designer & High-DPI QR Tokens
- **Built-in Standee Designer (`/admin` $\to$ Tables Tab)**: Design branded acrylic tent cards directly in the browser.
- **5 Curated Color Themes**: `Violet Classic`, `Emerald Fresh`, `Sunset Amber`, `Midnight Dark`, and `Ruby Luxury`.
- **Customizable QR Patterns**: Dot matrix shapes (`dots`, `rounded`, `square`) with center utensil or coffee icon badges.
- **Token Invalidation & Regeneration**: If a table QR is lost or tampered with, regenerate a new cryptographically signed token instantly.

### 8. CRM, Loyalty & WhatsApp Automations
- **Zero-Form Customer Capture**: Profiles auto-created from customer phone numbers during bill requests or table reservations.
- **Loyalty Points Engine**: Automated reward accumulation (e.g. 1 point for every ₹100 spent) redeemable against future dining tabs.
- **Automated WhatsApp Notifications**: Dispatch transaction receipts, reservation confirmations, and low-stock reports.

### 9. Table Reservations & Visual Floor Status
- **Public Booking Widget (`/bookings/[code]`)**: Guests reserve tables online for specified party sizes and time slots.
- **Auto-Expiring Holds**: Unconfirmed holds release back to the reservation pool after 15 minutes.
- **Live Floor Allocation**: Floor managers seat confirmed reservations directly from the POS table map.

### 10. Hardware Integration (ESC/POS Thermal Printing)
- **Universal ESC/POS Driver**: Direct compatibility with standard 58mm (2-inch) and 80mm (3-inch) thermal receipt printers.
- **Driverless Web Bluetooth & USB**: Print KOTs and tax invoices directly from Android/iPad tablets without external print servers.
- **Compliant GST Tax Invoices**: Automated CGST/SGST calculations, HSN codes, café GSTIN, and reverse charge notes.

### 11. Super-Admin Multi-Tenant Control Center (`/super`)
- **Executive Platform Analytics**: Platform-wide Gross Order Value (GOV), Annual Run Rate (ARR), Monthly Recurring Revenue (MRR), and churn metrics.
- **Tenant Management**: Provision new restaurants, inspect active tables, pause non-paying tenants, or execute manual plan overrides.
- **Subscription Lifecycle State Machine**: Automated lifecycle management handling `trial` (14 days) $\to$ `active` $\to$ `past_due` $\to$ `canceled`.
- **Tenant Impersonation**: Senior support engineers can securely view an outlet's dashboard for troubleshooting.
- **Global Broadcast Banner**: Dispatch real-time platform maintenance announcements to all connected merchant portals.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16.3](https://nextjs.org/) (App Router, Server Components, Server Actions, Turbopack) |
| **Runtime** | [React 19](https://react.dev/) + [Node.js 24](https://nodejs.org/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict Type Checking) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + [Framer Motion](https://www.framer-motion.com/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL 15, Row Level Security, Edge Realtime) |
| **Edge Gateway** | Next.js Middleware (Subdomain routing, session validation, subscription gating, in-memory Edge cache) |
| **Payments** | [Razorpay](https://razorpay.com/) (Subscriptions API + One-Time Checkout) |
| **Icons & UI** | [Lucide React](https://lucide.dev/) + [Radix UI Primitives](https://www.radix-ui.com/) |
| **PDF & Hardware** | [jsPDF](https://github.com/parallax/jsPDF) + Custom Web Bluetooth ESC/POS Engine |
| **Testing** | [Vitest](https://vitest.dev/) (Unit, Integration, and Architecture test suites) |
| **Hosting** | [Vercel](https://vercel.com/) (Edge Network & Serverless Compute) |

---

## 🌐 URL Structure & Subdomain Multi-Tenancy

QRslice uses intelligent edge-based subdomain and path resolution in `middleware.ts`:

- **Apex Domain (`https://qrslice.com`)**: Marketing landing page, pricing, documentation, login, and onboarding wizard.
- **Café Subdomain (`https://<slug>.qrslice.com/`)**: Customer storefront menu (e.g. `https://table-and-grain.qrslice.com`).
- **Path-Based Alternative (`https://qrslice.com/c/<slug>`)**: Reverse-proxy path fallback for social media links and mobile browsers (e.g. `https://qrslice.com/c/table-and-grain`).
- **Deep-Link Table QR (`https://qrslice.com/t/<qr_token>`)**: Table-specific token routing direct to active order sessions.
- **Cloud POS Register (`https://qrslice.com/pos`)**: Cashier counter register with switch for kitchen display (`/pos?view=kitchen`).
- **Merchant Management (`https://qrslice.com/admin`)**: Owner portal for menus, inventory, tables, billing, and analytics.
- **Super-Admin Console (`https://qrslice.com/super`)**: Platform operator dashboard.

> **Local Development DNS**: During local testing, **`*.localhost`** resolves to `127.0.0.1` automatically without editing your hosts file (e.g. `http://table-and-grain.localhost:3000/`).

---

## 🔒 Database Architecture & Security

- **Row Level Security (RLS)**: Enforced across all tables. Tenants can never access or query other tenants' data.
- **Edge Header Sanitization**: Incoming client headers (`x-tenant-id`, `x-user-role`, `x-restaurant-id`) are stripped at the edge by `middleware.ts` to prevent header spoofing.
- **Server-Side Pricing**: Prices are always fetched and computed on the server during order creation to prevent client-side cart tampering.
- **Rate-Limiting & Idempotency**: Order submission endpoints enforce token-based rate limits and cryptographic UUID idempotency keys to prevent duplicate billing.
- **Encrypted Staff PINs**: PINs are hashed using salted cryptographic digests (`crypto.subtle`) before persistence.

---

## 💎 Pricing & Business Model

QRslice offers **1 Unified, Crystal-Clear Plan** with zero per-order commissions:

| Plan | Price | Billing Frequency | Features |
|---|---|---|---|
| **Monthly Full Access** | **₹999 / mo** | Billed Monthly | Unlimited tables, unlimited orders, KDS, POS, Inventory, WhatsApp bills |
| **Annual Full Access** | **₹833 / mo** (₹9,999 / yr) | Billed Annually (Save 17%) | All features included + priority phone & WhatsApp support |

> **14-Day Full Access Free Trial**: No credit card required. Merchants can onboard and print standees in 15 minutes.

---

## 💻 Local Development Setup

### 1. Prerequisites
- **Node.js**: v20.x or v24.x
- **Package Manager**: npm (or pnpm)
- **Supabase Account**: A Supabase project with database migrations applied
- **Razorpay Account**: Test mode API keys

### 2. Clone & Install
```bash
git clone https://github.com/itssurajroy/QR-Cafe.git
cd qrslice
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in the following required variables:
```env
# Public Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-only secrets (Never expose to client code)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# WhatsApp Support
NEXT_PUBLIC_SUPPORT_WHATSAPP=+918595101297

# Razorpay (Test mode)
RAZORPAY_KEY_ID=rzp_test_xxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 4. Seed Demo Restaurant Data & Default Credentials
To seed the official demo store **Table & Grain Cafe**:
```bash
# Start development server
npm run dev

# In another terminal, trigger the seeder
curl http://localhost:3000/api/admin/seed-wah-ji-wah?slug=table-and-grain
```

#### Pre-Configured Test Credentials:
| Account Type | Email | Password | Access Level |
|---|---|---|---|
| **Super-Admin** | `super@qrslice.test` | `QrSliceDev123!` | `/super` Platform Console |
| **Café Owner** | `owner@curryleaf.test` | `QrSliceDev123!` | `/admin` Backoffice & `/pos` |
| **Demo Café Staff** | Quick PIN: `1234` | — | Waiter / POS Terminal |

---

## 📂 Repository & Codebase Structure

```
qrslice/
├── src/
│   ├── app/                      # Next.js 16 App Router pages and API routes
│   │   ├── (auth)/               # Authentication routes (/login, /register, /forgot-password)
│   │   ├── admin/                # Café backoffice tabs (Menu, Inventory, Tables, Staff, Billing)
│   │   ├── api/                  # REST APIs (Orders, Payments, Webhooks, Inventory, Print)
│   │   ├── bookings/             # Table reservation client routes
│   │   ├── c/[slug]/             # Path-based café storefront fallback (/c/table-and-grain)
│   │   ├── contact/              # Sales, demo booking & WhatsApp concierge
│   │   ├── onboarding/           # 4-step self-serve merchant onboarding wizard
│   │   ├── order/[token]/        # Real-time guest order tracking screen
│   │   ├── pos/                  # Cloud POS register & Kitchen Display Board (?view=kitchen)
│   │   ├── super/                # Multi-tenant platform super-admin control center
│   │   └── t/[token]/            # QR standee deep-link landing & session resolver
│   ├── components/               # Shared design system components (buttons, modals, cards)
│   ├── features/                 # Domain-driven feature modules
│   │   ├── admin/                # Backoffice tab implementations
│   │   ├── booking/              # Reservation widgets and scheduling
│   │   ├── menu/                 # Guest ordering menu, cart, dish modals, modifiers
│   │   ├── pos/                  # POS floor grid, counter mode, KDS ticket queue
│   │   └── super-admin/          # Platform metrics, tenant inspector, MRR charts
│   ├── hooks/                    # Reusable React hooks (useCart, useKDS, useAudio)
│   ├── lib/                      # Core business logic & platform services
│   │   ├── bill-pdf.ts           # GST tax invoice PDF generator
│   │   ├── bluetooth-printer.ts  # Web Bluetooth ESC/POS hardware printer driver
│   │   ├── inventory.ts          # Raw ingredient depletion & Gravy BOM yield engine
│   │   ├── middleware/           # Subdomain tenant resolution & session gates
│   │   ├── offline-queue.ts      # IndexedDB offline order sync queue
│   │   ├── pin-auth.ts           # 4-digit staff PIN cryptographic hashing
│   │   ├── qr-designer.ts        # Table acrylic standee canvas and PDF rendering
│   │   ├── razorpay.ts           # Subscription & payment processing
│   │   ├── thermal-printer.ts    # ESC/POS byte generator (58mm / 80mm)
│   │   ├── tts.ts                # Audio chime synthesizer & kitchen speech announcer
│   │   └── whatsapp-templates.ts # WhatsApp receipt & notification templates
│   └── types/                    # TypeScript interfaces and Supabase schema types
├── supabase/
│   └── migrations/               # PostgreSQL schema definitions & RLS security policies
└── public/                       # Static brand assets, fonts, icons, standee templates
```

---

## 🗄️ Database Architecture & Key Entities

QRslice runs on **PostgreSQL (Supabase)** with strict **Row Level Security (RLS)**:

- **`restaurants`**: Core tenant table storing café name, custom subdomain slug, GSTIN, currency, tax rates, and subscription state (`trial`, `active`, `past_due`, `canceled`).
- **`cafe_profiles`**: Staff credentials and authorization mapped to restaurants (`owner`, `manager`, `waiter`, `kitchen`) with SHA-256 hashed PINs.
- **`menu_categories` & `menu_items`**: Hierarchical dish catalog supporting price variants, dietary tags, kitchen prep stations, and 86 availability toggles.
- **`restaurant_tables`**: Physical floor tables with custom labels, capacities, section zoning, and active cryptographically signed QR tokens.
- **`orders` & `order_items`**: Live order lifecycle tracking statuses (`pending`, `preparing`, `ready`, `served`, `paid`, `cancelled`) with payment method breakdown and cooking notes.
- **`restaurant_inventory` & `prep_batches`**: Raw ingredient stock levels, unit definitions, reorder thresholds, and Gravy BOM (Bill of Materials) batch shrinkage factors.
- **`platform_settings`**: Global platform configurations, feature flags, super-admin credentials, and maintenance broadcast banners.

---

## 🧪 Testing & Verification

QRslice includes extensive unit and integration test coverage using **Vitest**:

```bash
# Run the entire test suite
npx vitest run

# Run specific domain test suites
npx vitest run src/lib/inventory.test.ts
npx vitest run src/lib/pin-auth.test.ts
npx vitest run src/lib/qr-designer.test.ts
npx vitest run src/lib/subscription-machine.test.ts
```

### Production Build Validation
```bash
# Verify zero TypeScript errors and Next.js 16 App Router build
npm run build
```

---

## 🚢 Production Deployment

QRslice is optimized for deployment on **Vercel**:

```bash
# Deploy to Vercel production
npx vercel --prod
```

Ensure all environment variables from `.env.local` are mirrored in your **Vercel Project Settings $\to$ Environment Variables**.

---

## 📄 License & Copyright

Copyright © 2026 **QRslice** ([https://qrslice.com](https://qrslice.com)). All rights reserved.  
Unauthorized copying, modification, distribution, or commercial hosting of this software via any medium is strictly prohibited without explicit written permission from QRslice.

---

### 💬 Need Help or Want to Book a Live Demo?
- **Website**: [https://www.qrslice.com/contact](https://www.qrslice.com/contact)
- **WhatsApp Concierge**: [+91 85951 01297](https://wa.me/918595101297)
- **Email**: [support@qrslice.com](mailto:support@qrslice.com)
