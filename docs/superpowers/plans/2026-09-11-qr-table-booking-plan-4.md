# QR Table Booking — Plan 4: Grill Fixes (stale holds, check-in link, pending flow)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the five grilling holes: self-healing expiry, ticket deep-link check-in with code fallback, big-party pending flow with visible queues.

**Architecture:** Expire-on-read inside `POST /api/bookings`; ticket links to the booked table's menu URL with `?booking=CODE`; `MenuClient` attaches the code (URL or manual) to the order; `pending` status (new migration) blocks overlap and surfaces in admin + POS.

**Tech Stack:** Next.js 16.3.3 App Router, React 19, TypeScript strict, Supabase, vitest 4.

**Spec:** `docs/superpowers/specs/2026-09-10-qr-table-booking-design.md` (grill rulings in SDD ledger `2026-09-10-qr-table-booking-plan-2/progress.md` are binding where they differ).

## Global Constraints

- Additive changes only; never rename `cafe_profiles`, `qrcafe_auth_role()`, `qrcafe_auth_restaurant_id()`.
- Dashboard applies ALL SQL + `NOTIFY pgrst, 'reload schema';` (engineer never runs schema SQL directly).
- Light theme only. `npx tsc --noEmit` clean after every task.
- Pending holds block overlap exactly like confirmed.

---

## File Structure

- `supabase/migrations/20260911000000_booking_pending.sql` (create): `pending` status + index tweak.
- `src/app/api/bookings/route.ts` (modify): expire-on-read, pending statuses, party>=9 → pending, suggestion unchanged.
- `src/app/api/bookings/lookup/route.ts` (modify): return `qr_token` per table.
- `src/app/api/bookings/[id]/route.ts` (modify): `accept` action.
- `src/features/booking/TicketCard.tsx` (modify): check-in button.
- `src/features/menu/MenuClient.tsx` (modify): read `?booking=`, code state, payload.
- `src/features/menu/MenuCartDrawer.tsx` (modify): optional code input.
- `src/lib/api.ts` (modify if needed): pass `reservation_code` through.
- `src/features/admin/tabs/ReservationsTab.tsx` (modify): pending section.
- `src/app/pos/page.tsx` + `src/components/PosClient.tsx` + `src/features/pos/RegisterView.tsx` (modify): pending-aware query + badge.

---

### Task 1: Pending status migration + POST hardening

**Files:**
- Create: `supabase/migrations/20260911000000_booking_pending.sql`
- Modify: `src/app/api/bookings/route.ts`

**Interfaces:**
- Consumes: `isGraceExpired`, `BOOKING_GRACE_MIN` from `@/lib/booking`.
- Produces: `pending` status; POST returns `{ ..., status }` with 201 for both confirmed and pending.

- [ ] **Step 1: Confirm the check-constraint name, then write the migration**

Run in dashboard (read-only check first): `select conname from pg_constraint where conrelid = 'table_reservations'::regclass and contype = 'c';`
Expected: `table_reservations_status_check` (if different, use the returned name in the file below).

Write `supabase/migrations/20260911000000_booking_pending.sql`:
```sql
alter table table_reservations drop constraint if exists table_reservations_status_check;
alter table table_reservations add constraint table_reservations_status_check
  check (status in ('confirmed','seated','cancelled','expired','no_show','pending'));
```

- [ ] **Step 2: POST — expire-on-read + pending (exact edits)**

In `src/app/api/bookings/route.ts`:
1. Import: add `isGraceExpired, BOOKING_GRACE_MIN` to the existing `@/lib/booking` import.
2. After the restaurant lookup, before the overlap query, insert:
```ts
const graceCutoff = new Date(Date.now() - BOOKING_GRACE_MIN * 60000).toISOString();
await db.from("table_reservations").update({ status: "expired" })
  .eq("restaurant_id", restaurant.id).eq("status", "confirmed").lt("ends_at", graceCutoff);
```
3. Overlap query: change `.eq("status", "confirmed")` to `.in("status", ["confirmed", "pending"])`.
4. Insert: `status: input.party_size >= 9 ? "pending" : "confirmed"`.
5. Success response: include status — change `.select("id, code, table_ids, starts_at, ends_at")` to `.select("id, code, table_ids, starts_at, ends_at, status")`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` (clean). Run: `npx vitest run` (all pass). Dashboard: apply migration + NOTIFY, then `select status, count(*) from table_reservations group by status;` runs without error.

### Task 2: Ticket deep link + MenuClient check-in + code fallback

**Files:**
- Modify: `src/app/api/bookings/lookup/route.ts` (add `qr_token` to table selects in GET; page query unchanged — page reuses lookup shape? No: page queries directly. Update BOTH selects)
- Modify: `src/app/bookings/[code]/page.tsx` (pass `qr_token` through to TicketCard)
- Modify: `src/features/booking/TicketCard.tsx` (check-in button)
- Modify: `src/features/menu/MenuClient.tsx` (code state + payload)
- Modify: `src/features/menu/MenuCartDrawer.tsx` (code input)
- Modify: `src/lib/api.ts` ONLY if `placeOrder` strips unknown fields (read first)

**Interfaces:**
- Consumes: `reservation_code` already accepted by validation + `/api/orders` (Plan 2).
- Produces: effective code = manual input else `?booking=` URL param; sent as `reservation_code`.

- [ ] **Step 1: Read-first (no guessing)**

Read `src/lib/api.ts` `placeOrder` (does it forward extra fields or whitelist?), `MenuClient` submit block (payload construction), `MenuCartDrawer` props + its single usage inside `MenuClient`. Record findings in the task report.

- [ ] **Step 2: Lookup + page carry qr_token**

In lookup GET table query change select to `"id, label, qr_token"`; same in `src/app/bookings/[code]/page.tsx`. Extend `Ticket` type with `qr_token` on the table-label objects — simplest: change `table_labels: string[]` flow to also pass `table_qr: string | null` (first table's token). Update page to compute it, TicketCard to accept it.

- [ ] **Step 3: TicketCard check-in button**

Above the JPEG button, add (only when `table_qr`):
```tsx
<a href={`/t/${ticket.table_qr}?booking=${ticket.code}`}
  className="block w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm text-center cursor-pointer">
  Open My Table Menu →
</a>
```

- [ ] **Step 4: MenuClient code state + payload**

In `MenuClient`: `const [codeInput, setCodeInput] = useState("");` Pass `bookingCode={codeInput} setBookingCode={setCodeInput}` to `MenuCartDrawer` (add optional props there with the input UI below the phone field: label "Booking Code (if reserved)", maxLength 6, uppercase transform, mono font). At submit: `const urlCode = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("booking") : null;` effective = `(codeInput.trim() || urlCode || "")`; include `reservation_code: /^[A-Za-z0-9]{6}$/.test(eff) ? eff.toUpperCase() : undefined`. Ensure `api.placeOrder` forwards it (extend its input type if whitelisted).

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit` (clean). Run: `npm run build` (success, `/bookings/[code]` present).

### Task 3: Pending queues in admin + POS

**Files:**
- Modify: `src/app/api/bookings/[id]/route.ts` (accept action)
- Modify: `src/features/admin/tabs/ReservationsTab.tsx` (pending section)
- Modify: `src/app/pos/page.tsx`, `src/components/PosClient.tsx`, `src/features/pos/RegisterView.tsx` (pending-aware)

**Interfaces:**
- Consumes: Plan 1 PATCH route; Plan 3 floorStatus (unchanged — pending never reaches it).

- [ ] **Step 1: PATCH accept action**

Schema enum: `["cancel", "no_show", "seat", "accept"]`; STATUS map add `accept: "confirmed"`. Only allow accept when current status is `pending` (fetch row first; 409 otherwise).

- [ ] **Step 2: ReservationsTab pending section**

Above the confirmed grid, render pending rows (same card, amber `Pending approval` badge) with Accept (→ accept) / Decline (→ cancel) buttons reusing `act()`. Filter pending out of the main grid (main grid = non-pending).

- [ ] **Step 3: POS pending badge**

pos/page query: change `.eq("status", "confirmed")` to `.in("status", ["confirmed", "pending"])` and add `status` to the select. Extend the threaded prop type with `status: string`. In RegisterView compute `const pendingCount = props.reservations.filter((r) => r.status === "pending").length;` pass only confirmed to `tableFloorState` (`props.reservations.filter((r) => r.status === "confirmed")`); render badge near Active Tables header when `pendingCount > 0`: `⏳ {pendingCount} pending approval` (amber pill linking to nothing — display only).

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit` (clean). Run: `npx vitest run` (all pass). Run: `npm run build` (success).
