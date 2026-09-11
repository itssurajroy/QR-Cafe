# QR Table Booking — Plan 3: Floor Map + Admin Reservations + Copy Audit

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Staff see live table states on POS and manage reservations from admin; a copy-audit doc lists every filler string for approval (no deletions yet).

**Architecture:** Pure `floorStatus` helper (tested) maps tables + today's confirmed reservations + active-order counts to Free/Held/Occupied/Reserved; POS and admin consume it; `ReservationsTab` reuses Plan 1's `GET`/`PATCH /api/bookings`; copy audit is a doc deliverable.

**Tech Stack:** Next.js 16.3.3 App Router, React 19, TypeScript strict, Supabase (admin client server-side), vitest 4.

**Spec:** `docs/superpowers/specs/2026-09-10-qr-table-booking-design.md`

## Global Constraints

- Additive changes only; never rename `cafe_profiles`, `qrcafe_auth_role()`, `qrcafe_auth_restaurant_id()`.
- Light theme only: white/slate/indigo. No dark/stone/amber in new or touched UI.
- Owner + staff manage reservations; walk-in priority and grace rules unchanged.
- Copy audit deletes NOTHING — deliverable is the candidate list doc.
- `npx tsc --noEmit` must pass after every task.

---

## File Structure

- `src/features/booking/floorStatus.ts` (create) + `src/features/booking/floorStatus.test.ts` (create): pure table-state rules.
- `src/app/pos/page.tsx` (modify): also fetch today's confirmed reservations.
- `src/components/PosClient.tsx` (modify): accept + pass `reservations` prop.
- `src/features/pos/RegisterView.tsx` (modify): badges on table buttons via helper.
- `src/features/admin/tabs/ReservationsTab.tsx` (create): list + actions.
- `src/features/admin/AdminTopNav.tsx` (modify): add bookings tab entry.
- `src/components/AdminClient.tsx` (modify): import + render block.
- `docs/superpowers/specs/2026-09-10-copy-audit.md` (create): candidate-removal list.

---

### Task 1: floorStatus helper + tests

**Files:**
- Create: `src/features/booking/floorStatus.ts`
- Test: `src/features/booking/floorStatus.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `FloorState`, `tableFloorState()` — exact signatures below; Tasks 2–3 reuse them.

- [ ] **Step 1: Write `src/features/booking/floorStatus.ts`**

```ts
export type FloorState = "free" | "held" | "occupied" | "reserved";

export type FloorReservation = {
  table_ids: string[];
  starts_at: string;
  ends_at: string;
};

export function tableFloorState(
  tableId: string,
  now: Date,
  reservations: FloorReservation[],
  occupiedIds: Set<string> | string[],
): { state: FloorState; detail: string | null } {
  const occupied = occupiedIds instanceof Set ? occupiedIds.has(tableId) : occupiedIds.includes(tableId);
  if (occupied) return { state: "occupied", detail: "Active order" };
  const t = now.getTime();
  const covering = reservations.find(
    (r) => r.table_ids.includes(tableId) && new Date(r.starts_at).getTime() <= t && t < new Date(r.ends_at).getTime(),
  );
  if (covering) {
    const s = new Date(covering.starts_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    return { state: "held", detail: `Booked ${s}` };
  }
  const upcoming = reservations
    .filter((r) => r.table_ids.includes(tableId) && new Date(r.starts_at).getTime() > t)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0];
  if (upcoming && new Date(upcoming.starts_at).getTime() - t <= 60 * 60000) {
    const s = new Date(upcoming.starts_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    return { state: "reserved", detail: `Reserved ${s}` };
  }
  return { state: "free", detail: null };
}
```

- [ ] **Step 2: Write `src/features/booking/floorStatus.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { tableFloorState } from "./floorStatus";

const now = new Date("2026-09-10T13:00:00+05:30");
const iso = (s: string) => new Date(s).toISOString();

describe("tableFloorState", () => {
  it("occupied wins over everything", () => {
    const r = [{ table_ids: ["t1"], starts_at: iso("2026-09-10T12:00:00+05:30"), ends_at: iso("2026-09-10T14:00:00+05:30") }];
    expect(tableFloorState("t1", now, r, new Set(["t1"])).state).toBe("occupied");
  });
  it("held when covering now", () => {
    const r = [{ table_ids: ["t1"], starts_at: iso("2026-09-10T12:00:00+05:30"), ends_at: iso("2026-09-10T14:00:00+05:30") }];
    const out = tableFloorState("t1", now, r, new Set());
    expect(out.state).toBe("held");
    expect(out.detail).toContain("Booked");
  });
  it("reserved when starting within 60 min", () => {
    const r = [{ table_ids: ["t1"], starts_at: iso("2026-09-10T13:45:00+05:30"), ends_at: iso("2026-09-10T15:00:00+05:30") }];
    expect(tableFloorState("t1", now, r, new Set()).state).toBe("reserved");
  });
  it("free otherwise", () => {
    expect(tableFloorState("t9", now, [], new Set())).toEqual({ state: "free", detail: null });
  });
  it("ignores other tables", () => {
    const r = [{ table_ids: ["t2"], starts_at: iso("2026-09-10T12:00:00+05:30"), ends_at: iso("2026-09-10T14:00:00+05:30") }];
    expect(tableFloorState("t1", now, r, new Set()).state).toBe("free");
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/features/booking/floorStatus.test.ts`
Expected: 5 passed.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

### Task 2: POS floor badges

**Files:**
- Modify: `src/app/pos/page.tsx` (add reservations query + prop)
- Modify: `src/components/PosClient.tsx` (accept + forward prop)
- Modify: `src/features/pos/RegisterView.tsx` (badges on desktop + mobile table buttons)

**Interfaces:**
- Consumes: `tableFloorState` from Task 1; `tableOrderCounts` (occupied = count > 0).
- Produces: table buttons show Held (indigo) / Reserved (amber) / Occupied (existing red count) badges.

- [ ] **Step 1: pos/page.tsx — fetch + pass**

Add to the `Promise.all` array:
```ts
db
  .from("table_reservations")
  .select("table_ids, starts_at, ends_at")
  .eq("restaurant_id", user.restaurantId)
  .eq("status", "confirmed")
  .gte("starts_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
```
Destructure as `{ data: reservations }`, pass `reservations={reservations ?? []}` to `<PosClient>`.

- [ ] **Step 2: PosClient — accept + forward**

Add `reservations: { table_ids: string[]; starts_at: string; ends_at: string }[]` to props type and destructure; forward `reservations={reservations}` to `<RegisterView>`.

- [ ] **Step 3: RegisterView — badges**

Add `reservations: { table_ids: string[]; starts_at: string; ends_at: string }[]` to `RegisterViewProps` and destructure. Import `tableFloorState` from `@/features/booking/floorStatus`. In both desktop and mobile table buttons, compute:
```ts
const fs = tableFloorState(t.id, new Date(), props.reservations, new Set(Object.keys(props.tableOrderCounts)));
```
Render under the seats line when `fs.state === "held"` or `"reserved"`:
```tsx
{fs.detail && fs.state !== "occupied" && fs.state !== "free" && (
  <div className={`text-[10px] font-bold ${fs.state === "held" ? "text-indigo-600" : "text-amber-600"}`}>{fs.detail}</div>
)}
```
Selected-table text color branches must still work (keep existing conditional classes; badge div is additive).

- [ ] **Step 4: Typecheck + build**

Run: `npx tsc --noEmit` (clean). Run: `npm run build` (success).

### Task 3: Admin Reservations tab

**Files:**
- Create: `src/features/admin/tabs/ReservationsTab.tsx`
- Modify: `src/features/admin/AdminTopNav.tsx` (add `{ id: "bookings", label: "Bookings", icon: "📅" }` to tabs array + `"bookings"` to `AdminTabId`)
- Modify: `src/components/AdminClient.tsx` (import + `{tab === "bookings" && (...)}` block rendering `<ReservationsTab />`)

**Interfaces:**
- Consumes: `GET`/`PATCH /api/bookings` + `/api/bookings/[id]` (Plans 1–2).
- Produces: self-fetching tab; no new props needed on AdminClient.

- [ ] **Step 1: Write `src/features/admin/tabs/ReservationsTab.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string; name: string; phone: string; party_size: number;
  starts_at: string; ends_at: string; code: string; status: string; table_ids: string[];
};

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-indigo-50 border-indigo-200 text-indigo-700",
  seated: "bg-emerald-50 border-emerald-200 text-emerald-700",
  cancelled: "bg-slate-100 border-slate-200 text-slate-500",
  expired: "bg-slate-100 border-slate-200 text-slate-500",
  no_show: "bg-red-50 border-red-200 text-red-700",
};

export function ReservationsTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", { cache: "no-store" });
      setRows(res.ok ? await res.json() : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function act(id: string, action: "cancel" | "no_show" | "seat") {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) load();
  }

  const filtered = rows.filter((r) =>
    !q.trim() ||
    r.name.toLowerCase().includes(q.toLowerCase()) ||
    r.phone.includes(q.trim()) ||
    r.code.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">📅 Today's Reservations</h2>
          <p className="text-xs text-slate-500">{filtered.length} bookings • walk-in QR always wins on conflict</p>
        </div>
        <button type="button" onClick={load} className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer">🔄 Refresh</button>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Search name, phone, or code…"
        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500" />
      {loading ? (
        <p className="text-xs text-slate-500 font-mono py-8 text-center">Loading reservations…</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-slate-500 py-8 text-center">No reservations today yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{r.name} <span className="text-slate-500 font-mono text-xs">×{r.party_size}</span></span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${STATUS_STYLE[r.status] ?? STATUS_STYLE.cancelled}`}>{r.status.replace("_", " ")}</span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {new Date(r.starts_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} – {new Date(r.ends_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} • {r.phone} • Code {r.code}
              </p>
              {r.status === "confirmed" && (
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => act(r.id, "seat")} className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer">Seat ✓</button>
                  <button type="button" onClick={() => act(r.id, "no_show")} className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer">No-show</button>
                  <button type="button" onClick={() => act(r.id, "cancel")} className="flex-1 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 cursor-pointer">Cancel</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire tab (TopNav + AdminClient)**

TopNav: add `"bookings"` to `AdminTabId` union and `{ id: "bookings", label: "Bookings", icon: "📅" }` after the tables entry. AdminClient: import `ReservationsTab`, add block after the tables block:
```tsx
{tab === "bookings" && (
  <div className="animate-fade-in-up">
    <ReservationsTab />
  </div>
)}
```

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit` (clean). Run: `npm run build` (success).

### Task 4: Copy-audit doc (no deletions)

**Files:**
- Create: `docs/superpowers/specs/2026-09-10-copy-audit.md`

**Interfaces:**
- Consumes: grep evidence only.
- Produces: per-page table (page, file:line, string, verdict keep/cut, reason). Zero code changes.

- [ ] **Step 1: Audit surfaces via grep**

Run and record evidence for each: `Café Launch Checklist`, `Test Guest Menu`, `Chef's Pick`, `Customers also ordered`, `Pay at Counter`, `Live Kitchen Sync`, `Switch Table`, landing leftover CTAs, onboarding trial copy. For each hit record file:line + keep/cut with one-line reason. Cut candidates must be placeholder, duplicated, or internal-jargon strings only; every instruction, confirmation, price, and error string is keep.

- [ ] **Step 2: Write the doc with one row per string**

Format: `| Page | file:line | String | Verdict | Reason |`. End with a tick-off checklist (`- [ ]`) so the user approves each cut before any deletion plan.

- [ ] **Step 3: Verify every row has evidence**

Run: pick 5 rows at random, re-grep each string, confirm file:line still matches.
Expected: all 5 match.
