# WhatsApp Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add WhatsApp as a communication channel for order status notifications, bill delivery, and menu-link ordering via Baileys.

**Architecture:** Standalone Node.js process (`src/wa/`) using `@whiskeysockets/baileys`. One socket per café, auth state on disk, in-memory reverse map for inbound routing. Hooks into existing `PATCH /api/orders/[id]` for outbound notifications. Existing `generateBillPdf()` updated to return Buffer for WhatsApp document sending.

**Tech Stack:** TypeScript, `@whiskeysockets/baileys`, `@hapi/boom`, `qrcode-terminal`, `tsx` (runtime), Supabase (existing), jsPDF (existing)

**Spec:** `docs/superpowers/specs/2026-09-09-whatsapp-integration-design.md`

## Global Constraints

- Node.js 20.0.0+ (Baileys requirement)
- Baileys auth state must be saved on every `creds.update` event — lose it and the café must re-scan QR
- WhatsApp phone numbers: digits only, include country code, no `+`/`-`/spaces
- JIDs must use Baileys helper functions (`jidDecode`, `areJidsSameUser`), never string split/compare
- `@import url(...)` must precede `@import "tailwindcss"` in CSS (PostCSS requirement)
- Path alias: `@/*` → `./src/*`
- Prettier: double quotes, 100 width, trailing commas

---

## File Structure

| File | Responsibility |
|------|---------------|
| `supabase/migrations/0006_whatsapp_sessions.sql` | New table + column |
| `src/lib/bill-pdf.ts` | Modify: export `generateBillPdfBuffer()` returning `Buffer` |
| `src/wa/types.ts` | Shared types for the WhatsApp subsystem |
| `src/wa/socket.ts` | Per-café Baileys socket lifecycle (connect, reconnect, auth) |
| `src/wa/notifications.ts` | Outbound: format + send status messages and bill PDFs |
| `src/wa/messages.ts` | Inbound: auto-reply handler (menu link, order status lookup) |
| `src/wa/index.ts` | Entry point: connect all cafés, start inbound handler |
| `src/app/api/orders/[id]/route.ts` | Modify: call `emitWhatsAppNotification()` after status update |
| `package.json` | Add `wa` script |

---

### Task 1: Database migration

**Files:**
- Create: `supabase/migrations/0006_whatsapp_sessions.sql`

**Interfaces:**
- Produces: `whatsapp_sessions` table, `restaurants.whatsapp_enabled` column

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/0006_whatsapp_sessions.sql

-- Track per-café WhatsApp connections
CREATE TABLE whatsapp_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE UNIQUE,
  phone_number text,
  connected boolean DEFAULT false,
  last_connected_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable WhatsApp feature flag per café
ALTER TABLE restaurants ADD COLUMN whatsapp_enabled boolean DEFAULT false;

-- RLS: same pattern as other tables (super-admin bypass)
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sa_whatsapp_sessions_all ON whatsapp_sessions
  FOR ALL
  USING (qrcafe_auth_role() = 'super_admin');

CREATE POLICY owner_whatsapp_sessions_read ON whatsapp_sessions
  FOR SELECT
  USING (qrcafe_auth_restaurant_id() = restaurant_id);

-- Index for lookup by restaurant
CREATE INDEX idx_whatsapp_sessions_restaurant ON whatsapp_sessions (restaurant_id);
```

- [ ] **Step 2: Apply migration**

Run in Supabase SQL editor, then run:
```sql
NOTIFY pgrst, 'reload schema';
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0006_whatsapp_sessions.sql
git commit -m "feat(db): add whatsapp_sessions table and whatsapp_enabled column"
```

---

### Task 2: Update bill-pdf.ts to export Buffer

**Files:**
- Modify: `src/lib/bill-pdf.ts`

**Interfaces:**
- Produces: `generateBillPdfBuffer(input: BillInput): Promise<Buffer>` — same input shape as existing function, returns raw PDF bytes

- [ ] **Step 1: Read current bill-pdf.ts**

Read `src/lib/bill-pdf.ts` to understand the existing `generateBillPdf()` function signature and internal structure.

- [ ] **Step 2: Extract Buffer generation into separate function**

The existing function likely creates a jsPDF instance, adds content, and returns/serves it. Extract the jsPDF build logic into `generateBillPdfBuffer()` that returns `Buffer`:

```ts
// Add alongside existing function, do NOT remove the existing one
export async function generateBillPdfBuffer(input: BillInput): Promise<Buffer> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: [80, 297] });

  // ... existing content-building logic (header, items, totals, footer) ...

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
```

Keep the existing HTTP-serving function intact — it's used by the web receipt page.

- [ ] **Step 3: Verify existing tests still pass**

Run: `npm run build`
Expected: PASS (no type errors)

- [ ] **Step 4: Commit**

```bash
git add src/lib/bill-pdf.ts
git commit -m "feat(bill): export generateBillPdfBuffer returning raw Buffer"
```

---

### Task 3: WhatsApp types

**Files:**
- Create: `src/wa/types.ts`

**Interfaces:**
- Produces: types consumed by socket.ts, notifications.ts, messages.ts

- [ ] **Step 1: Write types file**

```ts
// src/wa/types.ts
import type { WASocket } from "@whiskeysockets/baileys";

export type CafeSocket = {
  restaurantId: string;
  phoneNumber: string;
  socket: WASocket;
  connected: boolean;
};

export type WhatsAppNotification = {
  orderId: string;
  restaurantId: string;
  orderNumber: string;
  status: string;
  totalPaise: number;
  customerPhone: string;
};

export type BillPayload = {
  restaurant: {
    name: string;
    address?: string;
    phone?: string;
    gstin?: string;
  };
  order: {
    order_number: string;
    table_label: string;
    created_at?: string;
    total_paise: number;
    subtotal_paise?: number;
    discount_paise?: number;
    payment_status: string;
    payment_method?: string;
  };
  items: Array<{
    item_name: string;
    quantity: number;
    unit_price_paise: number;
  }>;
};
```

- [ ] **Step 2: Commit**

```bash
git add src/wa/types.ts
git commit -m "feat(wa): add shared types for WhatsApp subsystem"
```

---

### Task 4: Socket manager

**Files:**
- Create: `src/wa/socket.ts`

**Interfaces:**
- Consumes: `CafeSocket` from types.ts
- Produces: `connectAllCafes(): Promise<Map<string, CafeSocket>>`, `getSocket(restaurantId: string): CafeSocket | undefined`

- [ ] **Step 1: Write socket manager**

```ts
// src/wa/socket.ts
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  Browsers,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import P from "pino";
import path from "path";
import fs from "fs";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { CafeSocket } from "./types";

const logger = P({ level: "silent" });
const sockets = new Map<string, CafeSocket>();

const AUTH_BASE_DIR = path.join(process.cwd(), "whatsapp_auth");

export function getSocket(restaurantId: string): CafeSocket | undefined {
  return sockets.get(restaurantId);
}

export async function connectAllCafes(): Promise<Map<string, CafeSocket>> {
  const db = createSupabaseAdmin();
  const { data: sessions } = await db
    .from("whatsapp_sessions")
    .select("restaurant_id, phone_number, connected");

  if (!sessions) return sockets;

  for (const session of sessions) {
    if (!session.phone_number) continue;
    try {
      await connectCafe(session.restaurant_id, session.phone_number);
    } catch (err) {
      console.error(`[WA] Failed to connect café ${session.restaurant_id}:`, err);
    }
  }

  return sockets;
}

async function connectCafe(restaurantId: string, phoneNumber: string): Promise<CafeSocket> {
  const authDir = path.join(AUTH_BASE_DIR, restaurantId);
  fs.mkdirSync(authDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await import("@whiskeysockets/baileys").then((m) =>
    m.fetchLatestBaileysVersion()
  );

  const socket = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: Browsers.macOS("QR Café"),
    markOnlineOnConnect: false,
    syncFullHistory: false,
  });

  const cafeSocket: CafeSocket = {
    restaurantId,
    phoneNumber,
    socket,
    connected: false,
  };

  socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log(`[WA] QR code for café ${restaurantId} — scan with WhatsApp`);
    }

    if (connection === "close") {
      const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;

      cafeSocket.connected = false;
      await updateSessionStatus(restaurantId, false);

      if (shouldReconnect) {
        console.log(`[WA] Reconnecting café ${restaurantId}...`);
        setTimeout(() => connectCafe(restaurantId, phoneNumber), 3000);
      } else {
        console.log(`[WA] Café ${restaurantId} logged out — needs re-scan`);
      }
    } else if (connection === "open") {
      cafeSocket.connected = true;
      await updateSessionStatus(restaurantId, true);
      console.log(`[WA] Connected: café ${restaurantId}`);
    }
  });

  socket.ev.on("creds.update", saveCreds);

  sockets.set(restaurantId, cafeSocket);
  return cafeSocket;
}

async function updateSessionStatus(restaurantId: string, connected: boolean): Promise<void> {
  const db = createSupabaseAdmin();
  await db
    .from("whatsapp_sessions")
    .update({
      connected,
      last_connected_at: connected ? new Date().toISOString() : null,
    })
    .eq("restaurant_id", restaurantId);
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit src/wa/socket.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/wa/socket.ts
git commit -m "feat(wa): add per-café Baileys socket manager"
```

---

### Task 5: Outbound notifications

**Files:**
- Create: `src/wa/notifications.ts`

**Interfaces:**
- Consumes: `getSocket()` from socket.ts, `generateBillPdfBuffer()` from bill-pdf.ts, `WhatsAppNotification` and `BillPayload` from types.ts
- Produces: `emitWhatsAppNotification(orderId: string, status: string): Promise<void>`

- [ ] **Step 1: Write notifications module**

```ts
// src/wa/notifications.ts
import { getSocket } from "./socket";
import { generateBillPdfBuffer } from "@/lib/bill-pdf";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { BillPayload } from "./types";

const STATUS_MESSAGES: Record<string, (orderNumber: string) => string> = {
  confirmed: (n) => `\u2705 Order #${n} confirmed! Preparing your food.`,
  preparing: (n) => `\ud83d\udc68\u200d\ud83c\udf73 Order #${n} is being prepared.`,
  ready: (n) => `\ud83d\udd14 Order #${n} is ready! Please collect from the counter.`,
};

export async function emitWhatsAppNotification(
  orderId: string,
  status: string
): Promise<void> {
  try {
    const db = createSupabaseAdmin();

    // Load order with restaurant and items
    const { data: order } = await db
      .from("orders")
      .select(`
        id, order_number, status, total_paise, subtotal_paise, discount_paise,
        payment_status, payment_method, customer_phone, created_at,
        restaurant:restaurants(id, name, address, phone, gstin, whatsapp_enabled, plan),
        table:restaurant_tables(label),
        items:order_items(item_name, quantity, unit_price_paise)
      `)
      .eq("id", orderId)
      .single();

    if (!order) return;

    const restaurant = order.restaurant as any;
    if (!restaurant?.whatsapp_enabled) return;

    // Tier gating: notifications require starter+
    const allowedPlans = ["starter", "growth", "pro"];
    if (!allowedPlans.includes(restaurant.plan)) return;

    // Need customer phone to send
    if (!order.customer_phone) return;

    const cafeSocket = getSocket(restaurant.id);
    if (!cafeSocket?.connected) return;

    const phoneJid = normalizePhoneJid(order.customer_phone);

    // Status text message
    const messageFn = STATUS_MESSAGES[status];
    if (messageFn) {
      await cafeSocket.socket.sendMessage(phoneJid, {
        text: messageFn(order.order_number),
      });
    }

    // Bill PDF on served
    if (status === "served") {
      const billPayload: BillPayload = {
        restaurant: {
          name: restaurant.name,
          address: restaurant.address,
          phone: restaurant.phone,
          gstin: restaurant.gstin,
        },
        order: {
          order_number: order.order_number,
          table_label: order.table?.label || "",
          created_at: order.created_at,
          total_paise: order.total_paise,
          subtotal_paise: order.subtotal_paise,
          discount_paise: order.discount_paise,
          payment_status: order.payment_status,
          payment_method: order.payment_method,
        },
        items: order.items || [],
      };

      const pdfBuffer = await generateBillPdfBuffer(billPayload);
      const totalRupees = (order.total_paise / 100).toFixed(0);

      await cafeSocket.socket.sendMessage(phoneJid, {
        document: pdfBuffer,
        mimetype: "application/pdf",
        fileName: `bill-${order.order_number}.pdf`,
        caption: `Your bill for Order #${order.order_number} \u2014 \u20b9${totalRupees}`,
      });
    }
  } catch (err) {
    console.error(`[WA] Notification failed for order ${orderId}:`, err);
  }
}

function normalizePhoneJid(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `${digits}@s.whatsapp.net`;
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit src/wa/notifications.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/wa/notifications.ts
git commit -m "feat(wa): add outbound status notifications and bill PDF delivery"
```

---

### Task 6: Inbound message handler

**Files:**
- Create: `src/wa/messages.ts`

**Interfaces:**
- Consumes: `getSocket()` from socket.ts, `CafeSocket` from types.ts
- Produces: `setupInboundHandler(cafeSockets: Map<string, CafeSocket>): void`

- [ ] **Step 1: Write inbound handler**

```ts
// src/wa/messages.ts
import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { isLidUser } from "@whiskeysockets/baileys";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { CafeSocket } from "./types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://qr-cafe-blond.vercel.app";

export function setupInboundHandler(
  cafeSockets: Map<string, CafeSocket>
): void {
  for (const [restaurantId, cafeSocket] of cafeSockets) {
    const { socket } = cafeSocket;

    socket.ev.on("messages.upsert", async (event) => {
      if (event.type !== "notify") return;

      for (const msg of event.messages) {
        if (msg.key.fromMe) continue;
        await handleMessage(socket, restaurantId, msg);
      }
    });
  }
}

async function handleMessage(
  socket: WASocket,
  restaurantId: string,
  msg: WAMessage
): Promise<void> {
  const text =
    msg.message?.conversation?.toLowerCase() ||
    msg.message?.extendedTextMessage?.text?.toLowerCase() ||
    "";

  if (!text) return;

  const db = createSupabaseAdmin();

  // Check if restaurant has ordering enabled (growth+)
  const { data: restaurant } = await db
    .from("restaurants")
    .select("plan, whatsapp_enabled")
    .eq("id", restaurantId)
    .single();

  if (!restaurant?.whatsapp_enabled) return;

  const senderJid = msg.key.remoteJid;
  if (!senderJid) return;

  // Status lookup
  if (text.includes("status") || text.includes("order")) {
    await handleStatusLookup(socket, senderJid, restaurantId, msg);
    return;
  }

  // Menu link (growth+ only)
  const orderingPlans = ["growth", "pro"];
  if (orderingPlans.includes(restaurant.plan)) {
    await sendMenuLink(socket, senderJid, restaurantId);
    return;
  }

  // Free/starter: generic reply
  await socket.sendMessage(senderJid, {
    text: "Thank you for reaching out! For ordering, please visit our QR menu at the table.",
  });
}

async function sendMenuLink(
  socket: WASocket,
  senderJid: string,
  restaurantId: string
): Promise<void> {
  const db = createSupabaseAdmin();

  // Get the first active table's QR token for the menu link
  const { data: table } = await db
    .from("restaurant_tables")
    .select("qr_token")
    .eq("restaurant_id", restaurantId)
    .eq("active", true)
    .limit(1)
    .single();

  if (!table) {
    await socket.sendMessage(senderJid, {
      text: "Our menu is currently being updated. Please try again shortly!",
    });
    return;
  }

  const menuUrl = `${APP_URL}/t/${table.qr_token}`;
  await socket.sendMessage(senderJid, {
    text: `Browse our menu and place your order:\n${menuUrl}`,
  });
}

async function handleStatusLookup(
  socket: WASocket,
  senderJid: string,
  restaurantId: string,
  msg: WAMessage
): Promise<void> {
  const db = createSupabaseAdmin();

  // Extract phone number from sender JID
  const senderPhone = senderJid.split("@")[0];

  // Find most recent order for this phone number at this restaurant
  const { data: order } = await db
    .from("orders")
    .select("order_number, status, total_paise, created_at")
    .eq("restaurant_id", restaurantId)
    .eq("customer_phone", senderPhone)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!order) {
    await socket.sendMessage(senderJid, {
      text: "We couldn't find an order linked to your number. Please check your order number or place a new order via our QR menu.",
    });
    return;
  }

  const statusEmoji: Record<string, string> = {
    pending: "\u23f3",
    confirmed: "\u2705",
    preparing: "\ud83d\udc68\u200d\ud83c\udf73",
    ready: "\ud83d\udd14",
    served: "\u2714\ufe0f",
    cancelled: "\u274c",
    rejected: "\u274c",
  };

  const emoji = statusEmoji[order.status] || "\u2753";
  const totalRupees = (order.total_paise / 100).toFixed(0);

  await socket.sendMessage(senderJid, {
    text: `${emoji} Order #${order.order_number}\nStatus: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}\nTotal: \u20b9${totalRupees}`,
  });
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit src/wa/messages.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/wa/messages.ts
git commit -m "feat(wa): add inbound message handler with menu link and status lookup"
```

---

### Task 7: Entry point

**Files:**
- Create: `src/wa/index.ts`

**Interfaces:**
- Consumes: `connectAllCafes()` from socket.ts, `setupInboundHandler()` from messages.ts

- [ ] **Step 1: Write entry point**

```ts
// src/wa/index.ts
import { connectAllCafes } from "./socket";
import { setupInboundHandler } from "./messages";

async function main() {
  console.log("[WA] Starting WhatsApp bot...");

  const cafeSockets = await connectAllCafes();
  console.log(`[WA] Connected to ${cafeSockets.size} café(s)`);

  setupInboundHandler(cafeSockets);
  console.log("[WA] Inbound handler active. Waiting for messages...");

  // Keep process alive
  process.on("SIGINT", () => {
    console.log("[WA] Shutting down...");
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("[WA] Fatal error:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Add wa script to package.json**

Add to `scripts` in `package.json`:
```json
"wa": "npx tsx src/wa/index.ts"
```

- [ ] **Step 3: Verify entry point compiles**

Run: `npx tsc --noEmit src/wa/index.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/wa/index.ts package.json
git commit -m "feat(wa): add entry point and npm wa script"
```

---

### Task 8: Hook into order status updates

**Files:**
- Modify: `src/app/api/orders/[id]/route.ts`

**Interfaces:**
- Consumes: `emitWhatsAppNotification()` from notifications.ts

- [ ] **Step 1: Add WhatsApp notification call**

In `src/app/api/orders/[id]/route.ts`, after the status is updated in the database and before the response is returned, add:

```ts
import { emitWhatsAppNotification } from "@/wa/notifications";

// After the DB update succeeds, fire and forget (non-blocking)
emitWhatsAppNotification(orderId, newStatus).catch((err) =>
  console.error("[WA] Notification error:", err)
);
```

The call is intentionally non-blocking — the API response should not wait for WhatsApp delivery.

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/api/orders/[id]/route.ts
git commit -m "feat(api): trigger WhatsApp notification on order status update"
```

---

### Task 9: End-to-end smoke test

**Files:**
- None (manual verification)

- [ ] **Step 1: Apply migration**

Run the SQL from Task 1 in Supabase dashboard, then `NOTIFY pgrst, 'reload schema';`

- [ ] **Step 2: Insert a test café's WhatsApp session**

```sql
INSERT INTO whatsapp_sessions (restaurant_id, phone_number, connected)
VALUES ('<curry-leaf-restaurant-id>', '919999999999', false);
UPDATE restaurants SET whatsapp_enabled = true WHERE slug = 'curry-leaf';
```

- [ ] **Step 3: Start the WhatsApp bot**

Run: `npm run wa`
Expected: QR code appears in terminal for the café's number. Scan with WhatsApp → Linked Devices → Link a Device.

- [ ] **Step 4: Test outbound notification**

Via KDS or admin, update an order status to "confirmed". Check WhatsApp for the customer phone — should receive the status message.

- [ ] **Step 5: Test bill PDF delivery**

Update order status to "served". Check WhatsApp — should receive the bill PDF.

- [ ] **Step 6: Test inbound menu link**

From a different phone, message the café's WhatsApp number. Should receive a menu link reply.

- [ ] **Step 7: Test inbound status lookup**

Reply "status" to the café's WhatsApp. Should receive order status if a recent order exists for that phone number.

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "feat: WhatsApp integration complete — notifications, bill PDF, menu link"
```
