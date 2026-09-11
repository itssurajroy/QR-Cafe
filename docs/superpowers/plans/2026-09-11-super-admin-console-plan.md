# Super Admin Console Phases 1–4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden and complete the existing Super Admin console (auth helper, subscription columns, tenants routes, audit page, impersonation buttons, subscriptions, platform settings) without duplicating what already works.

**Architecture:** Additive deltas only. New `requireSuperAdmin()` centralizes six inline auth checks; new columns extend `restaurants`; new routes/pages reuse the verified `super/page.tsx` server-component + `createSupabaseAdmin` patterns; all mutations write `audit_events`.

**Tech Stack:** Next.js 16.3.3 App Router, React 19, TypeScript strict, Supabase Postgres + RLS, Tailwind 4, zod, vitest 4.

**Spec:** The 4-phase brief in the requesting message (Phase 1: auth + foundation + dashboard + tenants list/create; Phase 2: tenant detail + lifecycle actions; Phase 3: audit page + impersonation buttons + subscriptions; Phase 4: platform settings + flags + polish). Design doc: none — this plan IS the spec; conflicts resolve toward existing code conventions.

## Global Constraints

- Additive changes only; never rename `cafe_profiles`, `qrcafe_auth_role()`, `qrcafe_auth_restaurant_id()`.
- No `platform_users` table — `cafe_profiles` + Supabase Auth is identity (super_admin rows carry `restaurant_id NULL`).
- Apply ALL SQL via Supabase dashboard SQL editor, then run `NOTIFY pgrst, 'reload schema';` there. Never run schema SQL from code or CLI.
- Operational reads keep using `plan` / `canOrder()` — do not rewrite consumers. Super-admin writes update `plan` + `subscription_status` together via the Task 1 mapping helper.
- Trial default is 14 days, overridable via `platform_config` key `trial_days`.
- Every mutation writes `audit_events` with `{ actor_id, restaurant_id, entity, entity_id, action, metadata }`.
- Light theme only: white/slate/indigo. `npx tsc --noEmit` clean after every task.

---

## File Structure

- `supabase/migrations/20260911000002_super_admin_foundation.sql` (create): subscription columns + `feature_flags` table + RLS.
- `src/lib/auth.ts` (modify): add `requireSuperAdmin()`.
- `src/lib/subscription.ts` (create): `SubscriptionStatus` + `planToSubscriptionStatus()` as a zero-import pure module (tenant.ts pulls the server-only Supabase chain, which vitest cannot collect).
- `src/lib/tenant.test.ts` (create): mapping tests importing from `./subscription`.
- 6 existing call sites (modify): `src/app/super/page.tsx`, `src/app/super/cafe/[id]/page.tsx`, `src/app/api/super/tenant/route.ts`, `src/app/api/super/staff/route.ts`, `src/app/api/super/audit/route.ts`, `src/app/api/super/crud/route.ts`.
- `src/app/api/super/tenants/route.ts` (create): GET list + POST create.
- `src/app/super/tenants/page.tsx` (create) + `src/app/super/tenants/[id]/page.tsx` (create).
- `src/app/api/super/tenants/[id]/route.ts` (create): PATCH lifecycle actions.
- `src/app/super/audit/page.tsx` (create).
- `src/app/super/subscriptions/page.tsx` (create).
- `src/app/super/platform/page.tsx` (create) + `src/app/api/super/platform/route.ts` (create) + `src/app/api/super/flags/route.ts` (create).
- `src/lib/flags.ts` (create): `isFeatureEnabled()`.
- `src/components/SuperClient.tsx` (modify): two KPI cards only.

---

### Task 1: Migration + auth helper + subscription mapping

**Files:**
- Create: `supabase/migrations/20260911000002_super_admin_foundation.sql`
- Modify: `src/lib/auth.ts` (append helper)
- Modify: `src/lib/tenant.ts` (append mapping + test file)
- Create: `src/lib/tenant.test.ts`

**Interfaces:**
- Consumes: `SessionUser` type, `getSessionUser()` (both exist in `src/lib/auth.ts`).
- Produces: `requireSuperAdmin(): Promise<SessionUser | null>`; `planToSubscriptionStatus(plan: string, trialEndsAt: string | null): "trial" | "active" | "expired" | "cancelled" | "suspended"` — Tasks 2–6 consume both exact names.

- [ ] **Step 1: Write the migration file**

```sql
alter table restaurants
  add column if not exists subscription_status text not null default 'trial'
    check (subscription_status in ('trial','active','expired','cancelled','suspended')),
  add column if not exists is_suspended boolean not null default false,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_reason text,
  add column if not exists created_by uuid;

-- Backfill: derive subscription_status from existing plan values.
update restaurants set subscription_status = plan
  where plan in ('trial','active','expired','cancelled','suspended');
update restaurants set is_suspended = true, suspended_at = now()
  where plan = 'suspended' and suspended_at is null;

create table if not exists feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text not null default '',
  updated_at timestamptz not null default now()
);

alter table feature_flags enable row level security;

drop policy if exists "sa_flags" on feature_flags;
create policy "sa_flags" on feature_flags
  for all using (qrcafe_auth_role() = 'super_admin')
  with check (qrcafe_auth_role() = 'super_admin');

drop policy if exists "auth_read_flags" on feature_flags;
create policy "auth_read_flags" on feature_flags
  for select using (auth.uid() is not null);
```

- [ ] **Step 2: Apply via dashboard + verify**

Run the file in Supabase dashboard SQL editor, then `NOTIFY pgrst, 'reload schema';`. Verify: `select column_name from information_schema.columns where table_name in ('restaurants','feature_flags') and column_name in ('subscription_status','is_suspended','suspended_at','suspended_reason','created_by','enabled');` — expect 6 rows (5 + enabled).
Expected: success, no errors.

- [ ] **Step 3: Append `requireSuperAdmin()` to `src/lib/auth.ts`**

```ts
// Server-only: returns the session user iff super_admin, else null.
// Pages: `const user = await requireSuperAdmin(); if (!user) redirect("/login")`.
// API routes: `const user = await requireSuperAdmin(); if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })`.
export async function requireSuperAdmin(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || user.role !== "super_admin") return null;
  return user;
}
```

- [ ] **Step 4: Write failing mapping test `src/lib/tenant.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { planToSubscriptionStatus } from "./tenant";

describe("planToSubscriptionStatus", () => {
  it("maps active/suspended/cancelled directly", () => {
    expect(planToSubscriptionStatus("active", null)).toBe("active");
    expect(planToSubscriptionStatus("suspended", null)).toBe("suspended");
    expect(planToSubscriptionStatus("cancelled", null)).toBe("cancelled");
  });
  it("maps trial by expiry", () => {
    const future = new Date(Date.now() + 864e5).toISOString();
    const past = new Date(Date.now() - 864e5).toISOString();
    expect(planToSubscriptionStatus("trial", future)).toBe("trial");
    expect(planToSubscriptionStatus("trial", past)).toBe("expired");
    expect(planToSubscriptionStatus("trial", null)).toBe("trial");
  });
  it("falls back to expired for unknown", () => {
    expect(planToSubscriptionStatus("weird", null)).toBe("expired");
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npx vitest run src/lib/tenant.test.ts`
Expected: FAIL with "Failed to resolve import" or "planToSubscriptionStatus is not a function".

- [ ] **Step 6: Append mapping to `src/lib/tenant.ts`**

```ts
export type SubscriptionStatus = "trial" | "active" | "expired" | "cancelled" | "suspended";

// Maps operational plan (+ trial expiry) to the subscription_status column.
// Super-admin writes set both columns from this single function — never set one without the other.
export function planToSubscriptionStatus(plan: string, trialEndsAt: string | null): SubscriptionStatus {
  if (plan === "active" || plan === "suspended" || plan === "cancelled") return plan;
  if (plan === "trial") {
    if (!trialEndsAt) return "trial";
    return new Date(trialEndsAt).getTime() > Date.now() ? "trial" : "expired";
  }
  return "expired";
}
```

- [ ] **Step 7: Run tests + typecheck**

Run: `npx vitest run src/lib/tenant.test.ts` — expect 3 passed. Run: `npx tsc --noEmit` — expect clean.

### Task 2: Migrate the six auth call sites

**Files:**
- Modify: `src/app/super/page.tsx:13-16`, `src/app/super/cafe/[id]/page.tsx:14-17`, `src/app/api/super/tenant/route.ts` (~line 7), `src/app/api/super/staff/route.ts` (~lines 8/25), `src/app/api/super/audit/route.ts` (~line 7), `src/app/api/super/crud/route.ts` (~lines 8/25).

**Interfaces:**
- Consumes: `requireSuperAdmin()` from Task 1.
- Produces: identical behavior, single auth path. No behavior change — verify by tsc + build only.

- [ ] **Step 1: Read each call site (30 lines each, confirm exact text)**

Read the top 30 lines of all six files. Confirm each matches one of these two shapes: (A) `const x = await getSessionUser(); if (!x || x.role !== "super_admin")` → replace with `const x = await requireSuperAdmin(); if (!x)`; (B) helper returning `{ ok: false }` on non-super-admin → replace its internal `getSessionUser()` + role check with `requireSuperAdmin()` and map null to the existing failure return. Keep every redirect target (`/login`) and every 403 body byte-identical.

- [ ] **Step 2: Apply the replacements, update imports**

Each file: change `import { getSessionUser }` to `import { requireSuperAdmin }` (keep `getSessionUser` import too if the file uses it elsewhere — check before deleting). Do not touch any other line.

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit` (clean). Run: `npm run build` (success).

### Task 3: Tenants API + routes + dashboard KPI gaps

**Files:**
- Create: `src/app/api/super/tenants/route.ts` (GET list + POST create)
- Create: `src/app/super/tenants/page.tsx`
- Modify: `src/app/super/page.tsx` (pass two extra KPI numbers)
- Modify: `src/components/SuperClient.tsx` (two KPI cards)

**Interfaces:**
- Consumes: `requireSuperAdmin()`, `createSupabaseAdmin()`, `planToSubscriptionStatus()`, existing `extend_trial` action shape `{ action: "extend_trial", id, days }` (do not touch it).
- Produces: `GET /api/super/tenants?q&status&page` → `{ ok, rows, total }`; `POST /api/super/tenants` → `{ ok, id, slug }`.

- [ ] **Step 1: Write `src/app/api/super/tenants/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const TRIAL_DAYS_FALLBACK = 14;

async function trialDays(db: ReturnType<typeof createSupabaseAdmin>): Promise<number> {
  const { data } = await db.from("platform_config").select("value").eq("key", "trial_days").maybeSingle();
  const n = Number((data?.value as any)?.days);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : TRIAL_DAYS_FALLBACK;
}

export async function GET(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const q = new URL(req.url).searchParams;
  const search = (q.get("q") || "").trim();
  const status = (q.get("status") || "").trim();
  const page = Math.max(1, parseInt(q.get("page") || "1", 10));
  const limit = 15;
  const db = createSupabaseAdmin();
  let query = db.from("restaurants").select("id, name, slug, plan, tier, trial_ends_at, created_at", { count: "exact" }).order("created_at", { ascending: false });
  if (search) query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
  if (status) query = query.eq("plan", status);
  const { data, count, error } = await query.range((page - 1) * limit, page * limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (data ?? []).map((r) => r.id);
  let owners: Record<string, string> = {};
  if (ids.length > 0) {
    const { data: profiles } = await db.from("cafe_profiles").select("id, restaurant_id").eq("role", "owner").in("restaurant_id", ids);
    for (const p of profiles ?? []) {
      const { data: u } = await db.auth.admin.getUserById(p.id);
      if (u?.user?.email && p.restaurant_id) owners[p.restaurant_id] = u.user.email;
    }
  }
  return NextResponse.json({
    ok: true,
    rows: (data ?? []).map((r) => ({ ...r, owner_email: owners[r.id] ?? null })),
    total: count ?? 0,
  });
}

const createSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  owner_name: z.string().min(2).max(100),
  owner_email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  const input = parsed.data;
  const db = createSupabaseAdmin();
  const days = await trialDays(db);
  const now = new Date();

  const { data: existing } = await db.from("restaurants").select("id").eq("slug", input.slug).maybeSingle();
  if (existing) return NextResponse.json({ error: "Slug already taken" }, { status: 409 });

  const { data: rest, error: rErr } = await db.from("restaurants").insert({
    name: input.name.trim(), slug: input.slug, plan: "trial", tier: "pro",
    subscription_status: "trial", trial_starts_at: now.toISOString(),
    trial_ends_at: new Date(now.getTime() + days * 864e5).toISOString(),
    created_by: user.userId,
  }).select("id, slug").single();
  if (rErr || !rest) return NextResponse.json({ error: rErr?.message || "Create failed" }, { status: 500 });

  const { data: authUser, error: uErr } = await db.auth.admin.createUser({
    email: input.owner_email.toLowerCase().trim(), email_confirm: true,
    user_metadata: { display_name: input.owner_name.trim() },
  });
  if (uErr || !authUser?.user) {
    await db.from("restaurants").delete().eq("id", rest.id);
    return NextResponse.json({ error: uErr?.message || "Owner creation failed" }, { status: 500 });
  }
  const { error: pErr } = await db.from("cafe_profiles").upsert({
    id: authUser.user.id, restaurant_id: rest.id, role: "owner",
    display_name: input.owner_name.trim(), active: true,
  });
  if (pErr) {
    await db.from("restaurants").delete().eq("id", rest.id);
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }
  await db.from("audit_events").insert({
    actor_id: user.userId, restaurant_id: rest.id, entity: "tenant", entity_id: rest.id,
    action: "super_create_tenant", metadata: { name: input.name, slug: input.slug, owner_email: input.owner_email, trial_days: days },
  });
  return NextResponse.json({ ok: true, id: rest.id, slug: rest.slug }, { status: 201 });
}
```

- [ ] **Step 2: Write `src/app/super/tenants/page.tsx`**

Server component (copy the auth + dynamic pattern from `src/app/super/page.tsx:1-16` verbatim, replacing the component): `requireSuperAdmin`, redirect `/login` on null; fetch first page via direct DB query mirroring the GET route (select + search/status from `searchParams`); render a light-theme table (Café, Slug, Owner email via `SuperTenantsTable` client? No — keep server-rendered table + a client `CreateTenantForm` island). Owner emails: resolve exactly like the GET route above. Create form posts to `/api/super/tenants` with name/slug/owner_name/owner_email fields, loading + error states, `router.refresh()` on success. Status filter: links `?status=trial|active|suspended`, search input via GET form. Status badges: Trial=amber, Active=green, Expired=red, Suspended=dark (exact classes: `bg-amber-100 text-amber-800`, `bg-emerald-100 text-emerald-700`, `bg-red-100 text-red-700`, `bg-slate-800 text-white`).

- [ ] **Step 3: Dashboard KPI gaps in `src/app/super/page.tsx` + `SuperClient.tsx`**

In `super/page.tsx` after the existing aggregates, compute `trialsEnding7d` (plan=trial, trial_ends_at within 7d) and `new7d` (created_at within 7d) from the already-fetched `allRestaurants`, pass as props. In `SuperClient.tsx`, duplicate the nearest existing KPI card block twice with those values labeled "Trials Ending 7d" and "New Sign-ups (7d)". Verify by grepping the new labels render.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit` (clean). Run: `npm run build` (success, `/super/tenants` in routes). Curl (dev server): `GET /api/super/tenants` without session → expect 403.

### Task 4: Tenant detail + lifecycle actions (Phase 2)

**Files:**
- Create: `src/app/super/tenants/[id]/page.tsx`
- Create: `src/app/api/super/tenants/[id]/route.ts` (PATCH suspend/activate/force-expire + PUT subscription edit)

**Interfaces:**
- Consumes: `requireSuperAdmin()`, `planToSubscriptionStatus()`, existing `extend_trial` action (call it, don't duplicate it).
- Produces: tabbed detail; `PATCH` with `{ op: "suspend" | "activate" | "force_expire" | "extend_trial", days?, reason? }`.

- [ ] **Step 1: Write the PATCH route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const schema = z.object({
  op: z.enum(["suspend", "activate", "force_expire", "extend_trial"]),
  days: z.number().int().min(1).max(90).optional(),
  reason: z.string().max(300).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid op" }, { status: 422 });
  const { id } = await params;
  const db = createSupabaseAdmin();
  const now = new Date().toISOString();
  let update: Record<string, unknown>;
  if (parsed.data.op === "suspend") {
    update = { plan: "suspended", subscription_status: "suspended", is_suspended: true, suspended_at: now, suspended_reason: parsed.data.reason ?? null };
  } else if (parsed.data.op === "activate") {
    update = { plan: "active", subscription_status: "active", is_suspended: false, suspended_at: null, suspended_reason: null };
  } else if (parsed.data.op === "force_expire") {
    update = { plan: "trial", subscription_status: "expired", trial_ends_at: new Date(Date.now() - 1000).toISOString() };
  } else {
    const days = parsed.data.days ?? 14;
    update = { plan: "trial", subscription_status: "trial", trial_ends_at: new Date(Date.now() + days * 864e5).toISOString(), is_suspended: false, suspended_at: null, suspended_reason: null };
  }
  const { data, error } = await db.from("restaurants").update(update).eq("id", id).select("id, plan, subscription_status, trial_ends_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await db.from("audit_events").insert({
    actor_id: user.userId, restaurant_id: id, entity: "tenant", entity_id: id,
    action: `super_${parsed.data.op}`, metadata: { reason: parsed.data.reason ?? null, days: parsed.data.days ?? null },
  });
  return NextResponse.json({ ok: true, tenant: data });
}
```

- [ ] **Step 2: Write the detail page `src/app/super/tenants/[id]/page.tsx`**

Server component: `requireSuperAdmin` + redirect; fetch restaurant by id, owner (cafe_profiles role=owner + auth email, same pattern as Task 3), staff list (cafe_profiles by restaurant_id), usage counts (orders count + paid revenue, same select pattern as `super/page.tsx:53-55`). Render light-theme tabbed UI with `?tab=` searchParam switching (overview | subscription | users): Overview (status badge with Phase-2 colors, plan, trial dates, owner info, usage), Subscription (PUT-equivalent form posting PATCH + trial_ends_at date input + plan select trial/active, reusing the PATCH route with an added `set_fields` op — see Step 3), Users (read-only staff table), Danger Zone (Suspend / Activate / Force Expire buttons with `window.confirm()` dialogs posting PATCH, `router.refresh()` after).

- [ ] **Step 3: Extend PATCH with `set_fields` op for the Subscription tab**

Add `"set_fields"` to the zod enum; accept optional `plan` (trial|active), `trial_ends_at` (datetime string), `tier`. Build update from provided fields only, then set `subscription_status` via `planToSubscriptionStatus(update.plan ?? current.plan, update.trial_ends_at ?? current.trial_ends_at)` — fetch current row first. Audit action `super_subscription_edit` with the changed fields in metadata. Import `planToSubscriptionStatus` from `@/lib/tenant`.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit` (clean). Run: `npm run build` (success, `/super/tenants/[id]` in routes). Curl unauthenticated `PATCH /api/super/tenants/x` → expect 403.

### Task 5: Audit page + impersonation buttons + subscriptions (Phase 3)

**Files:**
- Create: `src/app/super/audit/page.tsx`
- Create: `src/app/super/subscriptions/page.tsx`
- Modify: tenants list page (Task 3) + tenants detail page (Task 4): add Impersonate links.

**Interfaces:**
- Consumes: `audit_events` table shape (verified: actor_id, restaurant_id, entity, entity_id, action, metadata, created_at; see `super/page.tsx:57` join pattern with restaurants), existing `extend_trial` semantics, existing impersonation entry `/super/cafe/[id]` (banner + `super_impersonate` audit already built — link to it, do not rebuild).
- Produces: filterable audit table; subscriptions board with bulk extend; impersonate entry points.

- [ ] **Step 1: Write `src/app/super/audit/page.tsx`**

Server component (`requireSuperAdmin` + redirect; `dynamic = "force-dynamic"`). Read filters from `searchParams`: `action`, `actor` (actor_id substring — use ilike on actor_id? actor_id is uuid; use eq when provided), `entity`, `from`, `to` (date strings → gte/lte on created_at), page (15/page). Query `audit_events` with restaurants(name, slug) join, newest first. Render light filter bar (GET form: action select with options "", "super_impersonate", "super_extend_trial", "super_mark_paid", "self_onboarding", "super_create_tenant", "super_suspend", "super_activate", "super_force_expire", "super_accept", "super_subscription_edit"; entity text input; from/to date inputs) + table (Time, Actor, Action, Target, Restaurant, expandable metadata via `<details>`). Empty state when no rows.

- [ ] **Step 2: Impersonation entry points**

Tenants list rows + detail header: add `<Link href={`/super/cafe/${id}`}>Impersonate</Link>` styled as a slate button. Then verify (read-only): open `/super/cafe/[id]` file lines 74-108 — confirm the amber banner + Exit link + `super_impersonate` audit insert all still present. No code change if confirmed; record confirmation in the commit message body.

- [ ] **Step 3: Write `src/app/super/subscriptions/page.tsx`**

Server component (`requireSuperAdmin` + redirect). Fetch id/name/slug/plan/subscription_status/trial_ends_at/billing_status for all restaurants. Group client-side in a client island? No — render three sections server-side by status filter links (`?status=` reusing the `plan` eq pattern): Trial (with days-left + Extend +14 button posting to the existing super/crud `extend_trial` shape `{ action: "extend_trial", id, days: 14 }`), Active, Expired/Suspended (with Activate button posting Task 4 PATCH `activate`). Bulk extend: checkboxes + one button posting sequential PATCH `extend_trial` calls, then `router.refresh()`. Keep to a small client island component in the same file (file must then be client? No — page stays server, island is a separate `"use client"` component defined in the same file is illegal for exported page... define the island in `src/components/SuperBulkExtend.tsx` (create) and import it).

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit` (clean). Run: `npm run build` (success, `/super/audit` + `/super/subscriptions` in routes).

### Task 6: Platform settings + flags + polish (Phase 4)

**Files:**
- Create: `src/app/super/platform/page.tsx`
- Create: `src/app/api/super/platform/route.ts` (GET+PUT config)
- Create: `src/app/api/super/flags/route.ts` (GET+POST flags)
- Create: `src/lib/flags.ts`
- Modify: tenants page (Task 3): CSV export button.

**Interfaces:**
- Consumes: `platform_config` upsert pattern (select-then-insert/update; update pattern verified at super/crud line 143), `feature_flags` table (Task 1 migration).
- Produces: `GET /api/super/platform` → `{ ok, config }`; `PUT` with `{ trial_days, price_monthly, price_yearly, maintenance_mode }`; `GET /api/super/flags` → `{ ok, flags }`; `POST` with `{ key, enabled, description? }`; `isFeatureEnabled(key)` for app use.

- [ ] **Step 1: Write `src/lib/flags.ts` + test**

```ts
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const cache = new Map<string, { v: boolean; at: number }>();
const TTL = 60_000;

export async function isFeatureEnabled(key: string): Promise<boolean> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.v;
  const db = createSupabaseAdmin();
  const { data } = await db.from("feature_flags").select("enabled").eq("key", key).maybeSingle();
  const v = data?.enabled === true;
  cache.set(key, { v, at: Date.now() });
  return v;
}
```

Test in `src/lib/flags.test.ts`? It hits DB — instead test the TTL logic is untestable without DB. Skip test file; verification is tsc + route curls. (No placeholder: the verification steps below cover it.)

- [ ] **Step 2: Write platform + flags routes**

`GET /api/super/platform`: requireSuperAdmin (403 otherwise); select all platform_config rows; return `{ ok: true, config }`. `PUT`: zod `{ trial_days?: int 1..90, price_monthly?: int >=0, price_yearly?: int >=0, maintenance_mode?: boolean }`; for each provided key, select-then-update-or-insert into platform_config with `{ value, updated_at }` where value is `{ days }` / `{ amount }` / `{ enabled }` respectively (match existing value shapes: trial_days→`{days}`, prices→merge into existing `prices` key `{...old, monthly, yearly}` — read the prices row first); audit each change (`super_platform_config`, metadata {key}); return `{ ok: true }`.
`GET /api/super/flags`: list all flags ordered by key. `POST`: zod `{ key: slug-regex, enabled: boolean, description?: max 200 }`; upsert on key + updated_at; audit (`super_flag_change`, metadata {key, enabled}); return `{ ok: true, flag }`.

- [ ] **Step 3: Write `src/app/super/platform/page.tsx`**

Server component (requireSuperAdmin + redirect): read platform_config + feature_flags; render light form (trial days number, monthly/yearly price numbers, maintenance toggle, flags table with per-row enable toggle + new-flag form) posting to the two routes with loading/error states; empty state for zero flags ("No feature flags yet — create the first one above").

- [ ] **Step 4: CSV export + empty states + mobile**

Tenants page: add Export CSV button generating client-side Blob download of currently filtered rows (columns: name, slug, owner_email, plan, trial_ends_at, created_at). Audit page: loading skeleton — wrap table in `<Suspense fallback={...}>`? Pages are server components; add `loading.tsx` files: `src/app/super/audit/loading.tsx`, `src/app/super/tenants/loading.tsx`, `src/app/super/subscriptions/loading.tsx`, `src/app/super/platform/loading.tsx`, each an exact skeleton:
```tsx
export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-xl bg-slate-200" />
        <div className="h-12 rounded-2xl bg-white border border-slate-200" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-white border border-slate-200" />
        ))}
      </div>
    </main>
  );
}
```
Mobile: tables get `overflow-x-auto` wrappers + `min-w-[640px]` inner tables (specify on each new table).

- [ ] **Step 5: Verify everything**

Run: `npx tsc --noEmit` (clean). Run: `npx vitest run` (all pass). Run: `npm run build` (success; `/super/tenants`, `/super/tenants/[id]`, `/super/audit`, `/super/subscriptions`, `/super/platform` in routes). Curl: unauthenticated GET on each new API route → 403. Authenticated spot-check (logged-in super session): POST create tenant with test slug → 201, then DELETE? No delete route — use dashboard to remove the test row, or keep a clearly-named `test-` slug and report it for manual cleanup.
