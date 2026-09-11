# 📖 QRslice: Comprehensive Operations & User Manual

Welcome to **QRslice**, the cloud-native contactless dining and kitchen operating system built for modern restaurants, cafés, and bistros.

---

## 🏛️ System Architecture Overview

```
[ GUEST TABLE ]                    [ CLOUD BACKEND ]                  [ RESTAURANT FLOOR ]
Smartphone Camera                 Next.js 16 + Supabase               Kitchen & Cashier
  |                                        |                                 |
  +--> Scan QR (/c/slug/t/01) -----------> + Serverless API                  |
  |    Select Dishes & Notes               | Rates & Taxes Computed          |
  |    Submit Order                        + Realtime Postgres Broadcast --> + Kitchen KDS (/kds)
  |                                                                          | Spoken Voice Alert 🔊
  +<-- Live Order Tracker -------------------------------------------------+ + POS Register (/pos)
       (Kitchen / Ready / Served)                                              Cash Tender / WhatsApp 💬
```

---

## 🚀 Daily Operations Checklist

### 1. 🌅 Morning Opening Checklist (Manager / Cashier)
1. **Power On Terminal**: Open Google Chrome / Edge on the Cashier tablet or desktop at **[`/pos`](https://qrslice-blond.vercel.app/pos)**.
2. **Launch Kitchen Display**: Open tablet or kitchen wall-mount screen at **[`/kds`](https://qrslice-blond.vercel.app/kds)**.
3. **Verify Audio Synth**: Tap anywhere on the KDS screen once to enable the browser Web Speech audio engine.
4. **Self-Diagnostic Test**: Navigate to `/admin` $\to$ **Help & Governance** and run the 1-click self-tests (*Voice Synth, WhatsApp, GST Math, Latency*).

---

## ⚡ POS Register Ergonomics (`/pos`)

| Key / Action | Function | Description |
| :--- | :--- | :--- |
| **`W`** | WhatsApp Bill | Instantly launches WhatsApp with itemized receipt & review link |
| **`P`** | Print Invoice | Triggers 80mm thermal receipt / PDF print dialog |
| **`Esc`** | Close Modal | Dismisses current bill settlement dialog |
| **`₹500 / ₹1000`** | Quick Cash Pills | Auto-computes customer change return |

---

## 👨‍🍳 Kitchen Display (KDS) Operating Procedures (`/pos` → Kitchen Tab)

- **Access**: Open `/pos` and switch to the **🔥 Kitchen** tab (or navigate to `/kds` which automatically redirects to `/pos`).
- **New Ticket**: Appears instantly with audio announcement (*"New Order at Table 03!"*).
- **Urgency Visuals**:
  - `🟢 Green`: Ordered < 5 mins ago.
  - `🟡 Amber`: Ordered 5–15 mins ago (High priority).
  - `🔴 Red`: Ordered > 15 mins ago (Urgent expediting).
- **Status Progression**: Tap **"Accept Order"** $\to$ Tap **"Start Cooking"** $\to$ Tap **"Mark Ready"** $\to$ Tap **"Served"**.

---

## 🏷️ Table QR Standee Generation (`/admin` $\to$ Tables)

1. Open `/admin` $\to$ **Tables Tab**.
2. Add tables (e.g. `T01`, `T02`, `Patio 01`).
3. Click **"Print All Tent Cards 🖨️"**.
4. Print on A4 heavy cardstock or 80mm acrylic inserts.
5. Place tent cards on corresponding dining tables.

---

## 📥 Bulk Menu Spreadsheet Import (`/admin` $\to$ Menu)

- Format: `Dish Name, Price, Category, Veg/Non-Veg, Description`
- Example:
  ```csv
  Hazelnut Cold Brew, 220, Coffee, Veg, Espresso with toasted hazelnut
  Artisan Truffle Pizza, 380, Mains, Veg, Sourdough crust with truffle oil
  Avocado Toast, 240, Breakfast, Veg, Smashed hass avocado on sourdough
  ```
- Click **"📥 Bulk Import CSV / Text"**, paste the text, and click **"Import Dishes"**.

---

## 🆘 Troubleshooting Guide

| Issue | Root Cause | Resolution |
| :--- | :--- | :--- |
| **No Voice Announcement on KDS** | Browser autoplay policy blocked audio | Click anywhere on the KDS screen once to allow browser audio synthesis. |
| **Table Not Found** | Table deleted from admin or incorrect URL | Re-generate table in `/admin` $\to$ Tables and scan new tent card. |
| **Network Reconnecting Status** | Floor WiFi dropped intermittently | System will automatically buffer and re-sync once WiFi reconnects. |
