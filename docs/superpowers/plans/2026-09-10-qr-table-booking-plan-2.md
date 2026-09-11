# QR Table Booking — Plan 2: Widget + Ticket + Check-in

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Customers can book a table from `/c/[slug]`, get a movie-ticket page with QR + JPEG download, and check in by scanning the table QR which links the order to the reservation.

**Architecture:** `BookingWidget` posts to Plan 1's `POST /api/bookings` and opens the ticket tab; new public `GET /api/bookings/lookup` serves ticket data by code; server-rendered `/bookings/[code]` shows `TicketCard` (QR via `qrcode`, JPEG via canvas); `/api/orders` accepts optional `reservation_code` to link + seat, else walk-in override expires overlapping holds.

**Tech Stack:** Next.js 16.3.3 App Router, React 19, TypeScript strict, Supabase (admin client server-side), `qrcode` 1.5.4, canvas JPEG download (no new deps).

**Spec:** `docs/superpowers/specs/2026-09-10-qr-table-booking-design.md`

## Global Constraints

- Additive changes only; never rename `cafe_profiles`, `qrcafe_auth_role()`, `qrcafe_auth_restaurant_id()`.
- Light theme only: `bg-slate-50`/`bg-white`, `text-slate-900`, `indigo-600` accents.
- Same-day only, 30-min grace, walk-in QR always wins, phone required.
- `npx tsc --noEmit` must pass after every task.

---

## File Structure

- `src/features/booking/BookingWidget.tsx` (create): booking form for `/c/[slug]`.
- `src/components/PublicCafeClient.tsx` (modify): render widget section.
- `src/app/api/bookings/lookup/route.ts` (create): public code lookup, IP rate-limited.
- `src/app/bookings/[code]/page.tsx` (create): server ticket page.
- `src/features/booking/TicketCard.tsx` (create): QR + JPEG download client component.
- `src/lib/validation.ts` (modify): add optional `reservation_code`.
- `src/app/api/orders/route.ts` (modify): check-in link + walk-in override.

---

### Task 1: BookingWidget form

**Files:**
- Create: `src/features/booking/BookingWidget.tsx`

**Interfaces:**
- Consumes: `POST /api/bookings` (Plan 1).
- Produces: `BookingWidget({ slug }: { slug: string })` — on success calls `window.open('/bookings/' + code, '_blank')`.

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useState } from "react";

export function BookingWidget({ slug }: { slug: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [party, setParty] = useState("2");
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug, name: name.trim(), phone: phone.trim(),
          party_size: Number(party), starts_at: new Date(`${today}T${time}`).toISOString(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Booking failed");
        return;
      }
      window.open(`/bookings/${json.code}`, "_blank");
      setName(""); setPhone(""); setTime("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500";
  const label = "text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1";

  return (
    <section className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
      <div>
        <h2 className="text-base font-bold text-slate-900">📅 Reserve a Table</h2>
        <p className="text-xs text-slate-500">Same-day booking. Free — pay at the café.</p>
      </div>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={label}>Name</label>
          <input required value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={input} />
        </div>
        <div>
          <label className={label}>Phone</label>
          <input required type="tel" value={phone} maxLength={20} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" className={`${input} font-mono`} />
        </div>
        <div>
          <label className={label}>Guests</label>
          <input required type="number" min={1} max={60} value={party} onChange={(e) => setParty(e.target.value)} className={input} />
        </div>
        <div>
          <label className={label}>Time (today)</label>
          <input required type="time" value={time} onChange={(e) => setTime(e.target.value)} className={input} />
        </div>
      </form>
      {error && <p className="text-xs text-red-600 font-medium">⚠️ {error}</p>}
      <button type="button" onClick={submit} disabled={busy || !name.trim() || !phone.trim() || !time}
        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-sm shadow-md shadow-indigo-600/20 cursor-pointer">
        {busy ? "Reserving…" : "Reserve Table →"}
      </button>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

### Task 2: Mount widget on /c/[slug]

**Files:**
- Modify: `src/components/PublicCafeClient.tsx` (import + section)

**Interfaces:**
- Consumes: `BookingWidget` from Task 1.
- Produces: `/c/[slug]` shows Reserve section when `canOrder` and tables exist.

- [ ] **Step 1: Add import**

Old: `import { MenuClient } from "@/features/menu/MenuClient";`
New: `import { MenuClient } from "@/features/menu/MenuClient";\nimport { BookingWidget } from "@/features/booking/BookingWidget";`

- [ ] **Step 2: Render widget above Menu Showcase**

Insert before the `{/* Menu Showcase */}` section:

```tsx
{canOrder && tables.length > 0 && (
  <BookingWidget slug={restaurant.slug} />
)}
```

(`restaurant` is `Tenant` with `slug`; verified `PublicCafeClient.tsx:9-17`.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

### Task 3: Public lookup API + ticket page + JPEG

**Files:**
- Create: `src/app/api/bookings/lookup/route.ts`
- Create: `src/app/bookings/[code]/page.tsx`
- Create: `src/features/booking/TicketCard.tsx`

**Interfaces:**
- Consumes: `table_reservations` (Plan 1 migration); `qrcode` package.
- Produces: `GET /api/bookings/lookup?code=XXXXXX` → reservation + café + table labels; `/bookings/[code]` ticket with JPEG download.

- [ ] **Step 1: Write lookup route `src/app/api/bookings/lookup/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rl = rateLimit(`booking-lookup:${ip}`, 30, 60);
  if (!rl.ok) return NextResponse.json({ error: "Too many lookups" }, { status: 429 });
  const code = (new URL(req.url).searchParams.get("code") || "").toUpperCase().trim();
  if (!/^[A-Z0-9]{6}$/.test(code)) return NextResponse.json({ error: "Invalid code" }, { status: 422 });

  const db = createSupabaseAdmin();
  const { data: r } = await db
    .from("table_reservations")
    .select("id, table_ids, name, party_size, starts_at, ends_at, code, status, restaurant_id, restaurants(name, slug)")
    .eq("code", code)
    .gte("starts_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!r) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const { data: tables } = await db
    .from("restaurant_tables")
    .select("id, label")
    .in("id", r.table_ids.length ? r.table_ids : ["00000000-0000-0000-0000-000000000000"]);
  return NextResponse.json({ ...r, table_labels: (tables ?? []).map((t) => t.label) });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const code = String(body?.code || "").toUpperCase().trim();
  const phone = String(body?.phone || "").replace(/[^0-9+]/g, "");
  if (!/^[A-Z0-9]{6}$/.test(code) || phone.length < 7) {
    return NextResponse.json({ error: "Code and phone required" }, { status: 422 });
  }
  const db = createSupabaseAdmin();
  const { data: r } = await db
    .from("table_reservations")
    .select("id, status, starts_at")
    .eq("code", code)
    .eq("phone", phone)
    .gte("starts_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!r || r.status !== "confirmed") {
    return NextResponse.json({ error: "Active booking not found" }, { status: 404 });
  }
  if (new Date(r.starts_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: "Too late to cancel online — please call the café" }, { status: 409 });
  }
  const { error } = await db.from("table_reservations").update({ status: "cancelled" }).eq("id", r.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Write `src/features/booking/TicketCard.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export type Ticket = {
  code: string; name: string; party_size: number;
  starts_at: string; ends_at: string; status: string;
  table_labels: string[];
  restaurants: { name: string; slug: string } | { name: string; slug: string }[];
};

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const cafe = Array.isArray(ticket.restaurants) ? ticket.restaurants[0] : ticket.restaurants;
  const [qr, setQr] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const url = typeof window !== "undefined" ? `${window.location.origin}/bookings/${ticket.code}` : "";

  useEffect(() => {
    QRCode.toDataURL(url, { width: 220, margin: 1 }).then(setQr).catch(() => {});
  }, [url]);

  function downloadJpeg() {
    const c = canvasRef.current;
    if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/jpeg", 0.92);
    a.download = `booking-${ticket.code}.jpg`;
    a.click();
  }

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !qr) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 640, 760);
      ctx.fillStyle = "#4f46e5";
      ctx.fillRect(0, 0, 640, 120);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 40px sans-serif";
      ctx.fillText(cafe?.name ?? "Café", 32, 70);
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 30px sans-serif";
      const slot = `${new Date(ticket.starts_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} – ${new Date(ticket.ends_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
      ctx.fillText(`Tables: ${ticket.table_labels.join(", ")}`, 32, 180);
      ctx.fillText(slot, 32, 225);
      ctx.fillText(`${ticket.party_size} guests • ${ticket.name}`, 32, 270);
      ctx.font = "bold 44px monospace";
      ctx.fillText(ticket.code, 32, 330);
      ctx.drawImage(img, 200, 380, 240, 240);
      ctx.font = "20px sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText("Show this at the counter", 32, 680);
    };
    img.src = qr;
  }, [qr, ticket, cafe]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4 text-center">
      <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Table Reservation</p>
      <h1 className="text-2xl font-bold text-slate-900">{cafe?.name}</h1>
      <p className="text-sm text-slate-600">Tables {ticket.table_labels.join(", ")} • {ticket.party_size} guests</p>
      <p className="text-sm text-slate-600">
        {new Date(ticket.starts_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} –{" "}
        {new Date(ticket.ends_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
      </p>
      <p className="text-3xl font-black font-mono tracking-widest text-slate-900">{ticket.code}</p>
      {qr && <img src={qr} alt="Booking QR" className="w-44 h-44 mx-auto rounded-xl border border-slate-200" />}
      <canvas ref={canvasRef} width={640} height={760} className="hidden" />
      <button type="button" onClick={downloadJpeg} disabled={!qr}
        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-sm cursor-pointer">
        Download Ticket (JPEG)
      </button>
      <p className="text-xs text-slate-500">Status: {ticket.status}</p>
    </div>
  );
}
```

- [ ] **Step 3: Write server page `src/app/bookings/[code]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { TicketCard } from "@/features/booking/TicketCard";

export const dynamic = "force-dynamic";

export default async function BookingTicketPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^[A-Za-z0-9]{6}$/.test(code)) notFound();
  const db = createSupabaseAdmin();
  const { data: r } = await db
    .from("table_reservations")
    .select("id, table_ids, name, party_size, starts_at, ends_at, code, status, restaurants(name, slug)")
    .eq("code", code.toUpperCase())
    .gte("starts_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!r) notFound();
  const { data: tables } = await db
    .from("restaurant_tables")
    .select("id, label")
    .in("id", r.table_ids.length ? r.table_ids : ["00000000-0000-0000-0000-000000000000"]);
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <TicketCard ticket={{ ...r, table_labels: (tables ?? []).map((t) => t.label) }} />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

### Task 4: QR check-in link + walk-in override in /api/orders

**Files:**
- Modify: `src/lib/validation.ts` (add `reservation_code` optional)
- Modify: `src/app/api/orders/route.ts` (link + seat, else expire overlapping holds)

**Interfaces:**
- Consumes: `overlaps` from `@/lib/booking`; `BOOKING_GRACE_MIN` for expiry math.
- Produces: orders created with `reservation_id` when code presented; overlapping `confirmed` holds on that table flip to `seated`/`expired` + audit row.

- [ ] **Step 1: Extend validation schema**

In `src/lib/validation.ts`, inside `createOrderSchema`, add after `payment_method`:
`reservation_code: z.string().regex(/^[A-Za-z0-9]{6}$/).optional(),`

- [ ] **Step 2: Add import + check-in + override after table resolve**

Add at the top of `src/app/api/orders/route.ts`:
`import { overlaps } from "@/lib/booking";`

Insert after the subscription-gating block (after line 72 `}`) in `src/app/api/orders/route.ts`:

```ts
let linkedReservationId: string | null = null;
if (input.reservation_code) {
  const { data: res } = await db
    .from("table_reservations")
    .select("id, table_ids, status, starts_at, ends_at")
    .eq("restaurant_id", table.restaurant_id)
    .eq("code", input.reservation_code.toUpperCase())
    .gte("starts_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (res && res.status === "confirmed" && res.table_ids.includes(table.id)) {
    linkedReservationId = res.id;
    await db.from("table_reservations").update({ status: "seated" }).eq("id", res.id);
  }
}
if (!linkedReservationId) {
  const now = new Date();
  const { data: holds } = await db
    .from("table_reservations")
    .select("id, table_ids, starts_at, ends_at")
    .eq("restaurant_id", table.restaurant_id)
    .eq("status", "confirmed")
    .lte("starts_at", now.toISOString());
  for (const h of holds ?? []) {
    if (!h.table_ids.includes(table.id)) continue;
    if (!overlaps(now, new Date(now.getTime() + 60000), new Date(h.starts_at), new Date(h.ends_at))) continue;
    await db.from("table_reservations").update({ status: "expired" }).eq("id", h.id);
    await db.from("audit_events").insert({
      restaurant_id: table.restaurant_id, entity: "reservation",
      entity_id: h.id, action: "walkin_override", metadata: { table_id: table.id },
    });
  }
}
```

- [ ] **Step 3: Attach reservation_id to the order insert**

In the orders insert object, add `reservation_id: linkedReservationId,` after `idempotency_key: idempotencyKey,`.

- [ ] **Step 4: Typecheck + tests + build**

Run: `npx tsc --noEmit` (clean). Run: `npx vitest run` (all pass). Run: `npm run build` (success, `/bookings/[code]` in routes).
