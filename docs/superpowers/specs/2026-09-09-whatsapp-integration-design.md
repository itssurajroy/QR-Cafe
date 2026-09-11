# WhatsApp Integration for QR Café

## Overview

Add WhatsApp as a communication channel for QR Café. Three capabilities, tiered across plans:

- **Status notifications** (Starter ₹499+): Customer places web order → gets WhatsApp updates on status changes
- **Bill PDF** (Starter ₹499+): After order is served → bill sent as PDF on WhatsApp
- **WhatsApp ordering** (Growth ₹799+): Customer messages café's WhatsApp → gets menu link → orders on web

## Architecture

Standalone Node.js process using `@whiskeysockets/baileys`. Runs separately from Next.js.

### Directory structure

```
src/wa/
├── index.ts          # Entry point — connects all cafés, starts message handler
├── socket.ts         # Per-café Baileys socket management (connect, reconnect, auth)
├── notifications.ts  # Outbound: status updates + bill PDF
├── messages.ts       # Inbound: auto-reply with menu link or order status
└── types.ts          # Shared types
```

### Multi-tenant design

- Each café links their own WhatsApp number via QR scan (first time) or pairing code
- Baileys auth state stored per café: `whatsapp_auth/{cafe_id}/`
- New DB table `whatsapp_sessions` tracks connected cafés
- Reverse lookup map (in-memory, rebuilt on startup): phone number → café ID

## Database changes

### New table: `whatsapp_sessions`

```sql
CREATE TABLE whatsapp_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) UNIQUE,
  phone_number text,
  connected boolean DEFAULT false,
  last_connected_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

### Alter: `restaurants` table

```sql
ALTER TABLE restaurants ADD COLUMN whatsapp_enabled boolean DEFAULT false;
```

## Outbound flow: status notifications

Triggered by `PATCH /api/orders/[id]` after status update.

1. After DB write, fire non-blocking `emitWhatsAppNotification(orderId, newStatus)`
2. Load order + restaurant + items from DB
3. Check `whatsapp_sessions.connected` AND `restaurants.plan` tier
4. If eligible: format message, send via café's Baileys socket

### Message templates

| Status | Message |
|--------|---------|
| confirmed | `✅ Order #{number} confirmed! Preparing your food.` |
| preparing | `👨‍🍳 Order #{number} is being prepared.` |
| ready | `🔔 Order #{number} is ready! Please collect from the counter.` |
| served | `Thank you for dining with us! Here's your bill.` + PDF attachment |

### Bill PDF delivery

- Uses existing `generateBillPdf()` from `src/lib/bill-pdf.ts`
- Must be updated to return `Buffer` (not just serve HTTP response)
- Sent as WhatsApp document with caption: `Your bill for Order #{number} — ₹{total}`
- File name: `bill-{order_number}.pdf`

## Inbound flow: WhatsApp ordering

When a customer messages the café's WhatsApp number:

1. Look up café by sender's phone → recipient's number (reverse map)
2. **Ordering disabled** (Free/Starter): reply with generic thank you or status lookup
3. **Ordering enabled** (Growth+):
   - First message → reply with menu link: `Browse our menu and order: {APP_URL}/t/{qr_token}`
   - "status" / "order status" → look up most recent order by phone number, reply with status
   - Anything else → reply with menu link

## Tier gating

```ts
function isWhatsAppEnabled(restaurant: Restaurant, feature: 'notifications' | 'ordering'): boolean {
  if (!restaurant.whatsapp_enabled) return false
  if (feature === 'notifications') return ['starter', 'growth', 'pro'].includes(restaurant.plan)
  if (feature === 'ordering') return ['growth', 'pro'].includes(restaurant.plan)
  return false
}
```

## Error handling

- Baileys disconnect → auto-reconnect with exponential backoff
- Café's WhatsApp logged out → mark `connected = false` in DB, notify admin
- Message send fails → log error, don't retry (status page is the fallback)
- Rate limiting → Baileys handles internally

## Files modified

| File | Change |
|------|--------|
| `src/wa/*` | New — WhatsApp bot process |
| `src/lib/bill-pdf.ts` | Export `Buffer` return alongside HTTP response |
| `src/app/api/orders/[id]/route.ts` | Call `emitWhatsAppNotification()` after status update |
| `supabase/migrations/` | Add `whatsapp_sessions` table, `whatsapp_enabled` to restaurants |
| `package.json` | Add `wa` script: `npx tsx src/wa/index.ts` |

## What this does NOT do

- No chatbot ordering flow (link to web menu instead)
- No WhatsApp payments (counter/online via Razorpay as today)
- No broadcast/marketing messages
- No multi-device per café (one number = one socket)
