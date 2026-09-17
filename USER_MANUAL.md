# 📖 QRslice — Complete Website & Operations Manual

> **Product Version**: 1.2.0 (App Router, React 19, Supabase Realtime)  
> **Target Audience**: Restaurant Owners, General Managers, Cashiers, Chefs, Waitstaff, and Platform Administrators.  
> **Official Web App**: `https://qrslice.com` (or local development: `http://localhost:3000`)

---

## 📑 Table of Contents

1. [Architecture & System Ecosystem](#1-architecture--system-ecosystem)
2. [Quick-Start: 7-Step Café Onboarding Wizard (`/onboarding`)](#2-quick-start-7-step-café-onboarding-wizard-onboarding)
3. [Guest Dining & Contactless Table Ordering (`/c/[slug]`)](#3-guest-dining--contactless-table-ordering-cslug)
4. [Counter POS Register & Cashier Terminal (`/pos`)](#4-counter-pos-register--cashier-terminal-pos)
5. [Kitchen Display System — KDS (`/pos?view=kitchen`)](#5-kitchen-display-system--kds-posviewkitchen)
6. [Staff PIN Authentication & Role-Based Access Control (RBAC)](#6-staff-pin-authentication--role-based-access-control-rbac)
7. [Inventory & Recipe Gravy BOM OS (`/admin/inventory` & `/admin/recipes`)](#7-inventory--recipe-gravy-bom-os-admininventory--adminrecipes)
8. [Menu Engineering & Modifier Add-ons (`/admin` → Menu & Modifiers)](#8-menu-engineering--modifier-add-ons-admin--menu--modifiers)
9. [Table Layout & Custom QR Standee Designer (`/admin` → Tables)](#9-table-layout--custom-qr-standee-designer-admin--tables)
10. [Customer CRM, Loyalty Points & WhatsApp Review Funnel](#10-customer-crm-loyalty-points--whatsapp-review-funnel)
11. [Table Reservations & Booking Engine (`/bookings`)](#11-table-reservations--booking-engine-bookings)
12. [Thermal Hardware & Printer Integration Guide](#12-thermal-hardware--printer-integration-guide)
13. [Super Admin Multi-Tenant Console (`/super`)](#13-super-admin-multi-tenant-console-super)
14. [Troubleshooting & Frequently Asked Questions (FAQ)](#14-troubleshooting--frequently-asked-questions-faq)

---

## 1. Architecture & System Ecosystem

QRslice connects front-of-house guest ordering, back-of-house kitchen prep, and counter billing into one single synchronized event loop.

```
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│      GUEST PHONE       │      │   SUPABASE REALTIME    │      │    RESTAURANT FLOOR    │
│  (No App Download)     │      │   & EDGE CLOUD ENGINE  │      │  (Hardware & Screens)  │
├────────────────────────┤      ├────────────────────────┤      ├────────────────────────┤
│ 1. Scans Table QR Code │─────>│ Next.js 16 App Router  │      │                        │
│ 2. Live Digital Menu   │      │ JWT Session & Edge RLS │      │                        │
│ 3. Custom Food Notes   │      │ Lazy Token Resolver    │      │                        │
│ 4. Places Table Order  │─────>│ Realtime DB Broadcast  │─────>│ Kitchen KDS Screen 🔔   │
│ 5. UPI / Bill Request  │      │ PostgREST + Zod Schema │      │ Audio Order Chime 🔊   │
│ 6. WhatsApp E-Receipt  │<─────│ Razorpay Webhook Hook  │─────>│ POS Counter Terminal 💻│
│ 7. 5-Star Google Review│      │ Telemetry Event Stream │      │ 80mm ESC/POS KOT Print │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
```

### URL Structure & Subdomain Resolution
- **Marketing & Super Admin**: `qrslice.com/` (or `localhost:3000/`)
- **Café Public Storefront**: `qrslice.com/c/[slug]` or `[slug].qrslice.com/` (e.g. `table-and-grain.localhost:3000/` or `https://qrslice.com/c/table-and-grain`)
- **Direct Table Link**: `qrslice.com/c/[slug]/t/[tableLabel]`
- **POS Billing & KDS**: `qrslice.com/pos` (Kitchen switch: `?view=kitchen`)
- **Management Console**: `qrslice.com/admin`
- **Super-Admin Operator**: `qrslice.com/super`

---

## 2. Quick-Start: 7-Step Café Onboarding Wizard (`/onboarding`)

New restaurants can register and launch in under 3 minutes with zero technical assistance:

1. **Step 1: Restaurant Basics**
   - Enter **Café Name** (e.g., *Saffron & Sage Bistro*).
   - System auto-generates a clean URL slug (e.g., `saffron-and-sage`).
   - Enter Phone Number, Physical Address, and Default Currency (`INR - ₹`).
2. **Step 2: Category Setup**
   - Create first department (e.g., *Beverages & Artisan Roasts*, *Thin Crust Pizzas*).
3. **Step 3: Initial Dish Setup**
   - Input dish name, selling price in ₹, brief culinary description, and toggle Vegetarian / Non-Vegetarian.
4. **Step 4: Dining Table Capacity**
   - Specify number of tables (e.g., 6 to 30).
   - QRslice auto-provisions tables (`T01`, `T02`, etc.) with unique cryptographic tokens.
5. **Step 5: Standee Preview & QR Generator**
   - Live visual preview of the branded acrylic table tent-card with embedded QR code.
6. **Step 6: Interactive Order Simulation**
   - Experience a simulated customer order flow to understand real-time kitchen notification.
7. **Step 7: Owner Account & Instant Launch**
   - Enter Owner Name, Email, and Password.
   - Click **"Launch My Café & Start Free Trial"**.
   - System automatically provisions:
     - 14-day full access trial (`plan: 'trial'`).
     - Auto-logs in the owner session.
     - Directs to `/admin` dashboard.

---

## 3. Guest Dining & Contactless Table Ordering (`/c/[slug]`)

Guests order instantly from their mobile browsers without downloading any third-party app.

### Key Guest Features:
- **Instant Camera Scan**: Point phone camera at table QR card $\to$ opens `/c/[slug]/t/04`.
- **Zero-Token Privacy Architecture**: Table security tokens (`qr_token`) are never leaked in public page source code; they are resolved lazily via `/api/public/resolve-table` when ordering.
- **Visual Food Menu**: High-res dish photographs, clear Veg (`🟢`) / Non-Veg (`🔴`) markers.
- **Category Filter Tabs**: Quick horizontal scrolling across Appetizers, Main Course, Drinks, Desserts.
- **Dietary & Special Notes**: Guests can specify instructions (e.g., *"Make it spicy"*, *"No dairy"*, *"Pack extra napkins"*).
- **Service Calling Buttons**:
  - `🙋 Call Server`: Notifies floor staff that Table X requires assistance.
  - `🧾 Request Bill`: Sends instant notification to POS counter to prepare check.
- **Contactless UPI Pay**: Dynamic UPI QR generated directly for table total with sound confirmation upon settlement.

---

## 4. Counter POS Register & Cashier Terminal (`/pos`)

The POS interface is engineered for ultra-fast, high-volume counter operations with full touch and keyboard navigation.

### Primary Screen Regions:
1. **Left Panel: Dish Catalog**:
   - Quick search input (`item name`, `SKU`, `category`).
   - Category navigation pills.
   - Dish tiles with veg indicator and price.
   - `+ Custom Item` button: Adds open/ad-hoc items for custom catering or special off-menu requests.
2. **Right Panel: Order Cart & Bill Builder**:
   - Quantity modifiers (`+` / `-`).
   - Item-level cooking instructions.
   - Table selector drop-down.
   - Customer phone number input (auto-fetches CRM loyalty points).
3. **Billing & Settlement Controls**:
   - **Discount**: Apply Percentage discount (`10%`, `20%`) or Flat Rupee amount (`₹50`, `₹100`).
   - **Payment Modes**:
     - 💵 **Cash**: Quick denomination pills (`₹100`, `₹200`, `₹500`, `₹2000`) with instant change calculation.
     - 📱 **UPI**: Displays restaurant UPI QR on cashier screen or prints UPI payment slip.
     - 💳 **Card**: Logs POS swipe reference.
     - 🔄 **Split**: Split bill across cash and UPI simultaneously.
   - **Settlement Actions**:
     - `Settle & Print`: Closes bill, logs transaction, and triggers thermal receipt.
     - `Send WhatsApp Receipt`: Dispatches itemized invoice with review link to customer phone.

### Cash Drawer & EOD Closing (Z-Report):
- **Opening Float**: Set morning counter cash balance (default: ₹2,000).
- **Payouts**: Record mid-day cash disbursements (ice delivery, milk purchase, tips).
- **End-of-Day Z-Report**:
  - Automatically reconciles: `Opening Float + Cash Sales - Payouts = Expected Drawer Cash`.
  - Cashier enters actual physical count; system calculates drawer overage/shortage.
  - Printable Z-Report audit slip for owner records.

### Keyboard Shortcuts:
| Key | Function |
| :--- | :--- |
| **`W`** | Send WhatsApp Bill to customer phone |
| **`P`** | Print Thermal Receipt / Invoice |
| **`Esc`** | Close open modal / dialog |
| **`Tab`** | Move between search and cart |

---

## 5. Kitchen Display System — KDS (`/pos?view=kitchen`)

The KDS replaces paper kitchen order tickets (KOT) with high-visibility, real-time prep cards.

### KDS Workflow:
1. **Instant Ticket Notification**:
   - Web Audio synthesizer chimes loudly: *"New Order on Table 03!"*
   - Flashing visual border alerts the chef.
2. **Color-Coded Aging & Urgency**:
   - 🟢 **Green (< 5 mins)**: Normal queue, fresh order.
   - 🟡 **Amber (5–12 mins)**: In preparation, prioritize.
   - 🔴 **Red (> 12 mins)**: Expedited ticket, alert station lead.
3. **Ticket Lifecycle Progressions**:
   - `Accept Order` $\to$ Order acknowledged by kitchen.
   - `Start Prep` $\to$ Timer tracks active preparation time.
   - `Mark Ready` $\to$ Chef marks food prepared; waiter receives alert.
   - `Served` $\to$ Ticket archived from kitchen screen.
4. **Special Instructions**:
   - Customer notes appear in bold yellow callout boxes.
   - Veg items are explicitly badged to prevent cross-contamination.
5. **Recall Station**:
   - Tap `Served Tickets` to view and restore recently bumped orders if items need remaking.

---

## 6. Staff PIN Authentication & Role-Based Access Control (RBAC)

To safeguard sensitive financials while enabling rapid terminal switching during rush hours, QRslice implements a 4-digit numeric PIN lock.

### Role Hierarchy & Permissions Matrix:

| Feature / Admin Tab | Owner (`👑`) | Manager (`🛡️`) | Kitchen (`👨‍🍳`) | Waiter (`🧾`) | Staff (`👤`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Live POS Register (`/pos`)** | ✅ Full | ✅ Full | ❌ | ✅ Order Only | ✅ Order Only |
| **Kitchen KDS (`/pos?view=kitchen`)** | ✅ Full | ✅ Full | ✅ Full | ❌ | ✅ View |
| **Orders & Table Service** | ✅ Full | ✅ Full | ❌ | ✅ Full | ✅ Full |
| **Menu & Modifiers** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Inventory & Recipes (BOM)** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Staff Directory & PINs** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Customer CRM & Loyalty** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Sales Analytics & Hourly Heatmap**| ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **Revenue & P&L Reports** | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **GST Settings & Outlet Config** | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **Subscription & Billing Portal** | ✅ Full | ❌ | ❌ | ❌ | ❌ |

### Quick PIN Operations:
- Tap **Lock Terminal** on the top right of POS.
- Fast 4-digit keypad unlocks in under 1 second.
- Automatic inactivity lock timer protects cashier desk.

---

## 7. Inventory & Recipe Gravy BOM OS (`/admin/inventory` & `/admin/recipes`)

QRslice features a specialized inventory engine designed specifically for Indian commercial kitchens handling pre-batched gravies and raw commodities.

### Key Concepts:
1. **Raw Ingredients (`/admin/inventory`)**:
   - Track items in commercial units (`kg`, `grams`, `litres`, `pieces`, `packets`).
   - Reorder threshold alerts: Warning badges display when stock falls below safety buffer.
   - Purchase logs: Record incoming supplier deliveries with purchase cost.
2. **Pre-Batched Gravies & Bases (`/admin/inventory/gravies`)**:
   - Restaurants cook large batches of core bases (e.g., *Makhani Gravy (15 Litres)*, *Brown Onion Paste (10 kg)*, *Sugar Syrup (5 Litres)*).
   - Input raw materials consumed during batch preparation $\to$ raw ingredients deplete $\to$ batch gravy quantity increases.
3. **Dish Bill of Materials (BOM Recipes)**:
   - Link menu dishes to raw ingredients and gravies.
   - *Example: 1x Paneer Butter Masala auto-depletes*:
     - `200g` Fresh Paneer
     - `150ml` Makhani Gravy
     - `20g` Amul Butter
     - `15ml` Fresh Cream
4. **Live Auto-Depletion**:
   - Every time a customer or cashier punches an order, the exact recipe quantities are decremented in real time.
   - Eliminates end-of-month stock variance and undetected kitchen wastage.

---

## 8. Menu Engineering & Modifier Add-ons (`/admin` → Menu & Modifiers)

### Managing Categories & Dishes:
- **Bulk CSV / Text Importer**:
  - Paste comma-separated dishes: `Dish Name, Price, Category, Veg/Non-Veg, Description`.
  - Imports 100+ dishes in a single click.
- **Stock Availability Toggles**:
  - Instantly toggle "Out of Stock" if ingredients run out mid-shift; dish immediately disappears from customer QR menu.
- **Tax Classification**:
  - Set individual GST rates or HSN codes per category (e.g., 5% on food, 18% on merchandise).

### Modifier Groups:
- **Single-choice**: *Size (Small / Medium / Large)*, *Crust (Thin / Pan / Stuffed)*.
- **Multi-choice**: *Extra Toppings (Jalapenos, Olives, Extra Cheese)*.
- **Rules**: Define minimum and maximum selectable options.

---

## 9. Table Layout & Custom QR Standee Designer (`/admin` → Tables)

### Table Management:
- Configure table count, labels (`Table 01`, `Patio A`, `Bar 02`), and seating capacity.
- Regenerate individual security tokens if an acrylic standee is compromised.

### In-App QR Standee Designer:
- **Themes**: Modern Minimalist, Dark Luxury, Vibrant Purple, Café Warmth.
- **Branding**: Automatically embeds restaurant logo and custom accent hex color.
- **Call to Action**: *"Scan to Order & Pay"*, *"Freshly Prepared to Table"*.
- **Direct PDF Export**:
  - Generates print-ready A4 tent-card sheets (2 tables per sheet) with cut-marks.
  - Compatible with standard acrylic table stands and wooden blocks.

---

## 10. Customer CRM, Loyalty Points & WhatsApp Review Funnel

### WhatsApp E-Receipts:
- Every bill settlement can generate an itemized WhatsApp receipt dispatched to the guest's mobile number.
- Includes café address, GSTIN, item summary, total paid, and digital invoice link.

### Smart Review Funnel:
- When guests open their digital receipt (`/receipt/[statusToken]`), they are invited to rate their dining experience:
  - ⭐⭐⭐⭐⭐ **(4 or 5 Stars)**: Prompt immediately redirects guest to the restaurant's **Google Maps Review Page** to build public reputation.
  - ⭐⭐ **(1 to 3 Stars)**: Directs guest to a private, constructive internal feedback form, alerting management and preventing negative public reviews on Google / Zomato.

### Loyalty Ledger:
- Automatic cashback / points accrual based on settled bill amounts.
- Cashier can redeem points against upcoming visits during POS checkout.

---

## 11. Table Reservations & Booking Engine (`/bookings`)

### Features:
- Public table booking widget (`/bookings`) embeddable on Instagram bio, website, or Google Business profile.
- Guest selects party size (1–20 guests), date, and preferred seating window (Lunch / Dinner).
- Floor status management: Automatic hold on table slots, preventing double-bookings.
- SMS & WhatsApp booking confirmation alerts.

---

## 12. Thermal Hardware & Printer Integration Guide

QRslice works with industry-standard POS hardware without requiring proprietary drivers.

### Supported Configurations:
1. **Thermal Printers (58mm & 80mm)**:
   - USB, Bluetooth, or LAN Network Thermal Printers (Epson, TVS, Citizen, Rugtek, Everycom, NGX).
   - Standard browser print dialog or raw ESC/POS network socket integration.
2. **Printer Formats**:
   - **KOT Ticket**: Large table number, order time, item names, cooking notes (prints direct to kitchen).
   - **Customer GST Tax Invoice**: Café name, address, GSTIN, CGST %, SGST %, FSSAI license number, itemized totals, amount in words, QR payment code.
3. **Cash Drawers**:
   - RJ11 connector triggers drawer kick automatically upon cash bill settlement.

---

## 13. Super Admin Multi-Tenant Console (`/super`)

For platform operators and multi-chain franchise owners managing multiple outlets:

- **Executive KPI Dashboard**: Total platform ARR/MRR, active paying tenants, trial conversion rates, live gross order volume.
- **Tenant Directory**: Search, inspect, suspend, or reactivate restaurant outlets.
- **Subscription Management**: Monitor Razorpay recurring subscription IDs and manual billing overrides.
- **Global Broadcast Banner**: Dispatch system-wide maintenance or feature notices to all café dashboards.
- **Audit Logs**: Cryptographic audit trail recording tenant onboarding, role updates, and billing transactions.

---

## 14. Troubleshooting & Frequently Asked Questions (FAQ)

### Q1: The KDS screen does not make any sound when a new order arrives.
- **Solution**: Modern browsers (Chrome/Edge/Safari) enforce an autoplay audio policy. When you first open `/pos?view=kitchen` in the morning, **click anywhere on the screen once**. This grants the browser permission to play the order chime and voice synthesizer.

### Q2: How do I change my restaurant's GSTIN or Tax Rate?
- **Solution**: Navigate to `/admin` $\to$ **Settings Tab**. Update your GSTIN, Business Legal Name, and Tax Percentage (e.g., 5% composite or 18% standard). Save changes; all subsequent bills will reflect updated tax math immediately.

### Q3: What happens when the 14-day free trial expires?
- **Solution**: The café dashboard remains accessible so owners can view historical sales and export accounting data. However, customer QR menus and live order punching are paused until a subscription is activated via `/admin/billing` (₹999/mo or ₹9,999/yr).

### Q4: An acrylic standee went missing or someone tampered with the QR code.
- **Solution**: Open `/admin` $\to$ **Tables Tab**. Locate the table, click **"Regenerate QR Token"**, and print the replacement standee. The old QR token is permanently invalidated instantly.

### Q5: Can we run QRslice offline if our broadband drops?
- **Solution**: Yes. The POS caching layer allows cashiers to continue browsing catalog items. Transactions buffer in local IndexedDB storage and sync with the Supabase realtime cloud backend the moment internet connectivity restores.

---

*Copyright © 2026 QRslice. All rights reserved.*
