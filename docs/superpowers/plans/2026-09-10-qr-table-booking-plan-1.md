# QR Table Booking — Plan 1: Booking Core Backend

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the booking data model plus validated create/list/cancel APIs with passing overlap, seat-fit, and rate-limit tests.

**Architecture:** Pure booking rules live in `src/lib/booking.ts` (fully unit-tested, no DB); a new Supabase migration adds `table_reservations` plus additive columns; thin API routes (`POST`/`GET`/`PATCH /api/bookings`) reuse the lib and the existing `rateLimit` helper.

**Tech Stack:** Next.js 16.3.3 App Router, React 19, TypeScript strict, Supabase Postgres + RLS, zod, vitest 4.

**Spec:** `docs/superpowers/specs/2026-09-10-qr-table-booking-design.md`

## Global Constraints

- Additive changes only; do not touch deleted `src/wa/*` or old migrations.
- Never rename `cafe_profiles`, `qrcafe_auth_role()`, `qrcafe_auth_restaurant_id()`.
- Apply SQL via Supabase dashboard SQL editor, then run `NOTIFY pgrst, 'reload schema';` there.
- Bookings are same-day only; default hold 90 min; 15-min cleanup buffer is check-only, never stored.
- Phone required; max 5 bookings per phone per day; walk-in QR always wins.
- `npx tsc --noEmit` must pass after every task.

---

## File Structure

- `vitest.config.ts` (create): enables `vitest run` with `@/*` alias to `./src/*`.
- `src/lib/booking.ts` (create): pure rules — overlap with buffer, seat auto-match + unlimited combine, 6-char code gen, hours-window check, constants.
- `src/lib/booking.test.ts` (create): unit probes for every rule above.
- `supabase/migrations/20260910000000_table_reservations.sql` (create): table + indexes + RLS + additive `restaurants.open_time/close_time` + additive `orders.reservation_id`.
- `src/app/api/bookings/route.ts` (create): `POST` create (zod, hours, overlap, seats, rate limit) and `GET` list (scoped to caller café).
- `src/app/api/bookings/[id]/route.ts` (create): `PATCH` cancel / no-show / seat (owner + staff of that café only).

---

### Task 1: Vitest setup + pure booking rules with tests

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/booking.ts`
- Test: `src/lib/booking.test.ts`

**Interfaces:**
- Consumes: nothing (pure logic).
- Produces: `overlaps()`, `pickTables()`, `genBookingCode()`, `withinHours()`, `bookingDayKey()`, constants `BOOKING_BUFFER_MIN=15`, `BOOKING_DEFAULT_MIN=90`, `BOOKING_GRACE_MIN=30`, `BOOKING_MAX_PER_PHONE_PER_DAY=5` — exact names/signatures below, reused by Tasks 3–4.

- [ ] **Step 1: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```

- [ ] **Step 2: Write the failing test file `src/lib/booking.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { overlaps, pickTables, genBookingCode, withinHours } from "./booking";

describe("overlaps (15-min buffer, check-only)", () => {
  it("flags touching slots as overlapping because of buffer", () => {
    const aS = new Date("2026-09-10T12:00:00");
    const aE = new Date("2026-09-10T13:30:00");
    const bS = new Date("2026-09-10T13:30:00");
    const bE = new Date("2026-09-10T15:00:00");
    expect(overlaps(aS, aE, bS, bE, 15)).toBe(true);
  });
  it("passes slots 20 min apart", () => {
    const aS = new Date("2026-09-10T12:00:00");
    const aE = new Date("2026-09-10T13:30:00");
    const bS = new Date("2026-09-10T13:50:00");
    const bE = new Date("2026-09-10T15:00:00");
    expect(overlaps(aS, aE, bS, bE, 15)).toBe(false);
  });
});

describe("pickTables (smallest fit, unlimited combine)", () => {
  const tables = [
    { id: "t2", seats: 2 },
    { id: "t4", seats: 4 },
    { id: "t6", seats: 6 },
  ];
  it("picks smallest single fitting table", () => {
    expect(pickTables(tables, 3)).toEqual(["t4"]);
  });
  it("combines smallest-first when no single fits", () => {
    expect(pickTables(tables, 8)).toEqual(["t2", "t4", "t6"]);
  });
  it("returns null when seats insufficient", () => {
    expect(pickTables(tables, 99)).toBeNull();
  });
});

describe("genBookingCode", () => {
  it("returns 6 unambiguous chars", () => {
    expect(genBookingCode()).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  });
});

describe("withinHours", () => {
  it("accepts inside hours, rejects outside", () => {
    const s = new Date("2026-09-10T13:00:00");
    const e = new Date("2026-09-10T14:30:00");
    expect(withinHours(s, e, "11:00", "23:00")).toBe(true);
    expect(withinHours(s, e, "14:00", "23:00")).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/booking.test.ts`
Expected: FAIL with "Failed to resolve import ./booking".

- [ ] **Step 4: Write minimal implementation `src/lib/booking.ts`**

```ts
export const BOOKING_BUFFER_MIN = 15;
export const BOOKING_DEFAULT_MIN = 90;
export const BOOKING_GRACE_MIN = 30;
export const BOOKING_MAX_PER_PHONE_PER_DAY = 5;

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function genBookingCode(): string {
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

export function overlaps(aS: Date, aE: Date, bS: Date, bE: Date, bufferMin = BOOKING_BUFFER_MIN): boolean {
  const buf = bufferMin * 60000;
  return aS.getTime() < bE.getTime() + buf && bS.getTime() < aE.getTime() + buf;
}

export function pickTables(tables: { id: string; seats: number }[], party: number): string[] | null {
  const sorted = [...tables].sort((x, y) => x.seats - y.seats);
  const single = sorted.find((t) => t.seats >= party);
  if (single) return [single.id];
  const picked: string[] = [];
  let sum = 0;
  for (const t of sorted) {
    picked.push(t.id);
    sum += t.seats;
    if (sum >= party) return picked;
  }
  return null;
}

function hm(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

function parseHM(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

export function withinHours(starts: Date, ends: Date, open: string, close: string): boolean {
  return hm(starts) >= parseHM(open) && hm(ends) <= parseHM(close) && ends.getTime() > starts.getTime();
}

export function bookingDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/booking.test.ts`
Expected: 4 passed (8 tests).

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean, no output.

### Task 2: Migration SQL for reservations

**Files:**
- Create: `supabase/migrations/20260910000000_table_reservations.sql`

**Interfaces:**
- Consumes: nothing.
- Produces: `table_reservations` table, unique `(restaurant_id, code, day)`, RLS policies, additive `restaurants.open_time/close_time` (default `11:00`/`23:00`), additive `orders.reservation_id`.

- [ ] **Step 1: Write the migration file**

```sql
alter table restaurants
  add column if not exists open_time text not null default '11:00',
  add column if not exists close_time text not null default '23:00';

alter table orders
  add column if not exists reservation_id uuid references table_reservations(id) on delete set null;

create table if not exists table_reservations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_ids uuid[] not null default '{}',
  name text not null,
  phone text not null,
  party_size int not null check (party_size > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  code text not null,
  day date not null,
  status text not null default 'confirmed'
    check (status in ('confirmed','seated','cancelled','expired','no_show')),
  created_at timestamptz not null default now()
);

create unique index if not exists table_reservations_code_day_idx
  on table_reservations (restaurant_id, code, day);
create index if not exists table_reservations_slot_idx
  on table_reservations (restaurant_id, starts_at, ends_at)
  where status = 'confirmed';

alter table table_reservations enable row level security;

drop policy if exists "sa_reservations" on table_reservations;
create policy "sa_reservations" on table_reservations
  for all using (qrcafe_auth_role() = 'super_admin')
  with check (qrcafe_auth_role() = 'super_admin');

drop policy if exists "scoped_reservations" on table_reservations;
create policy "scoped_reservations" on table_reservations
  for all using (restaurant_id = qrcafe_auth_restaurant_id())
  with check (restaurant_id = qrcafe_auth_restaurant_id());

drop policy if exists "anon_insert_reservations" on table_reservations;
create policy "anon_insert_reservations" on table_reservations
  for insert with check (true);
```

- [ ] **Step 2: Apply via dashboard and reload schema**

Run in Supabase dashboard SQL editor (not via any MCP): paste the file, run, then run `NOTIFY pgrst, 'reload schema';`
Expected: success, no rows returned for NOTIFY.

- [ ] **Step 3: Verify tables exist**

Run in dashboard: `select column_name from information_schema.columns where table_name = 'table_reservations';`
Expected: id, restaurant_id, table_ids, name, phone, party_size, starts_at, ends_at, code, day, status, created_at.

### Task 3: POST /api/bookings — create reservation

**Files:**
- Create: `src/app/api/bookings/route.ts` (POST + GET)

**Interfaces:**
- Consumes: `overlaps`, `pickTables`, `genBookingCode`, `withinHours`, `bookingDayKey`, `BOOKING_DEFAULT_MIN`, `BOOKING_MAX_PER_PHONE_PER_DAY` from `@/lib/booking`; `rateLimit` from `@/lib/rate-limit`; `createSupabaseAdmin` from `@/lib/supabase/admin`; zod.
- Produces: `POST /api/bookings` → `{ id, code, table_ids, starts_at, ends_at }` (201) or `{ error }` (409 overlap / 429 rate-limit / 422 validation).

- [ ] **Step 1: Write the route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import {
  overlaps, pickTables, genBookingCode, withinHours, bookingDayKey,
  BOOKING_DEFAULT_MIN, BOOKING_MAX_PER_PHONE_PER_DAY,
} from "@/lib/booking";

const schema = z.object({
  slug: z.string().min(2),
  name: z.string().min(2).max(100),
  phone: z.string().min(7).max(20),
  party_size: z.number().int().min(1).max(60),
  starts_at: z.string().datetime(),
  duration_min: z.number().int().min(30).max(240).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }
  const input = parsed.data;
  const starts = new Date(input.starts_at);
  const now = new Date();
  if (starts.toDateString() !== now.toDateString()) {
    return NextResponse.json({ error: "Same-day bookings only" }, { status: 422 });
  }
  const rl = rateLimit(`booking:${input.phone}:${bookingDayKey(now)}`, BOOKING_MAX_PER_PHONE_PER_DAY, 86400);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many bookings for this number today" }, { status: 429 });
  }

  const db = createSupabaseAdmin();
  const { data: restaurant } = await db
    .from("restaurants")
    .select("id, open_time, close_time")
    .eq("slug", input.slug)
    .maybeSingle();
  if (!restaurant) return NextResponse.json({ error: "Café not found" }, { status: 404 });

  const ends = new Date(starts.getTime() + (input.duration_min ?? BOOKING_DEFAULT_MIN) * 60000);
  if (!withinHours(starts, ends, restaurant.open_time ?? "11:00", restaurant.close_time ?? "23:00")) {
    return NextResponse.json({ error: "Outside opening hours" }, { status: 422 });
  }

  const { data: tables } = await db
    .from("restaurant_tables")
    .select("id, seats")
    .eq("restaurant_id", restaurant.id)
    .eq("active", true);
  const picked = pickTables(tables ?? [], input.party_size);
  if (!picked) return NextResponse.json({ error: "No table fits this party size" }, { status: 409 });

  const { data: existing } = await db
    .from("table_reservations")
    .select("table_ids, starts_at, ends_at")
    .eq("restaurant_id", restaurant.id)
    .eq("status", "confirmed")
    .gte("starts_at", new Date(now.setHours(0, 0, 0, 0)).toISOString());
  for (const r of existing ?? []) {
    if (!r.table_ids.some((t: string) => picked.includes(t))) continue;
    if (overlaps(starts, ends, new Date(r.starts_at), new Date(r.ends_at))) {
      return NextResponse.json({ error: "Tables busy in that slot" }, { status: 409 });
    }
  }

  const day = bookingDayKey(starts);
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = genBookingCode();
    const { data, error } = await db
      .from("table_reservations")
      .insert({
        restaurant_id: restaurant.id, table_ids: picked, name: input.name.trim(),
        phone: input.phone.replace(/[^0-9+]/g, ""), party_size: input.party_size,
        starts_at: starts.toISOString(), ends_at: ends.toISOString(), code, day, status: "confirmed",
      })
      .select("id, code, table_ids, starts_at, ends_at")
      .single();
    if (!error && data) return NextResponse.json(data, { status: 201 });
    if (error && error.code !== "23505") {
      return NextResponse.json({ error: "Booking failed: " + error.message }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "Could not issue booking code" }, { status: 500 });
}

export async function GET(req: NextRequest) {
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();
  if (!user?.restaurantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from("table_reservations")
    .select("*")
    .eq("restaurant_id", user.restaurantId)
    .gte("starts_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
    .order("starts_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Smoke-test POST validation (no DB write)**

Run: `node -e "fetch('http://localhost:3000/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(r=>r.json().then(j=>console.log(r.status,j)))"` with dev server running.
Expected: `422 { error: 'Validation failed' }`.

### Task 4: PATCH /api/bookings/[id] — cancel / no-show / seat

**Files:**
- Create: `src/app/api/bookings/[id]/route.ts`

**Interfaces:**
- Consumes: `getSessionUser` from `@/lib/auth`; `createSupabaseAdmin`.
- Produces: `PATCH /api/bookings/[id]` with `{ action: "cancel" | "no_show" | "seat" }` → updated row; customer self-cancel handled in Plan 2 via code lookup (out of scope here).

- [ ] **Step 1: Write the route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";

const schema = z.object({ action: z.enum(["cancel", "no_show", "seat"]) });

const STATUS: Record<string, string> = { cancel: "cancelled", no_show: "no_show", seat: "seated" };

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user?.restaurantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 422 });
  const { id } = await params;
  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from("table_reservations")
    .update({ status: STATUS[parsed.data.action] })
    .eq("id", id)
    .eq("restaurant_id", user.restaurantId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await db.from("audit_events").insert({
    restaurant_id: user.restaurantId, actor_id: user.userId,
    entity: "reservation", entity_id: id, action: parsed.data.action, metadata: {},
  });
  return NextResponse.json(data);
}
```

- [ ] **Step 2: Typecheck + full test run**

Run: `npx tsc --noEmit`
Expected: clean.
Run: `npx vitest run`
Expected: all pass.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: success, 42+ routes.
