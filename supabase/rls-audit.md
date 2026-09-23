# QRslice RLS Audit (B10)

Generated: 2026-09-23 · Source: live Supabase via MCP (`pg_policies`, `pg_class`, `pg_constraint`, `information_schema`).

## Scope

- Schema: `public`, tables only (`relkind = 'r'`).
- Roles considered: `anon`, `authenticated`, `service_role`. Policies grant to `PUBLIC` (Supabase convention); effective access is still gated by table GRANTs for `anon`/`authenticated`.
- Permissive policies are OR'd — a single `qual = true` on ALL makes every other policy on that table a no-op for matching rows.

## Inventory — RLS enabled

All **53** `public` tables have `relrowsecurity = true`. `relforcerowsecurity = false` for all (table owner bypasses RLS; acceptable because app uses `service_role` for admin paths).

| Table | RLS | Force |
|---|---|---|
| analytics | on | off |
| audit_events | on | off |
| billing_events | on | off |
| billing_payments | on | off |
| cafe_profiles | on | off |
| crm_automations | on | off |
| crm_customer_notes | on | off |
| feature_flags | on | off |
| gravy_ingredients | on | off |
| gravy_recipes | on | off |
| ingredients | on | off |
| locations | on | off |
| loyalty_rewards | on | off |
| loyalty_tiers | on | off |
| loyalty_transactions | on | off |
| menu_categories | on | off |
| menu_item_gravies | on | off |
| menu_item_modifier_groups | on | off |
| menu_items | on | off |
| modifier_groups | on | off |
| modifier_options | on | off |
| notification_campaigns | on | off |
| order_item_modifiers | on | off |
| order_items | on | off |
| orders | on | off |
| payments | on | off |
| platform_announcements | on | off |
| platform_api_keys | on | off |
| platform_config | on | off |
| platform_settings | on | off |
| platform_users | on | off |
| push_subscriptions | on | off |
| razorpay_accounts | on | off |
| recipe_instructions | on | off |
| recipe_items | on | off |
| restaurant_customers | on | off |
| restaurant_tables | on | off |
| restaurant_whatsapp_settings | on | off |
| restaurants | on | off |
| service_requests | on | off |
| split_bill_items | on | off |
| split_bills | on | off |
| stock_levels | on | off |
| stock_transactions | on | off |
| subscription_plans | on | off |
| table_reservations | on | off |
| whatsapp_accounts | on | off |
| whatsapp_bill_events | on | off |
| whatsapp_message_events | on | off |
| whatsapp_messages | on | off |
| whatsapp_opt_ins | on | off |
| whatsapp_sessions | on | off |
| whatsapp_settings | on | off |
| whatsapp_templates | on | off |

**No table has RLS off.** Gaps below are policy-quality issues, not missing-RLS issues.

---

## Critical findings

Policies with `cmd = ALL` and `qual/with_check = true` grant **any anon/authenticated caller full read-write** on the table. Because policies are permissive (OR), scoped/sa policies on the same table do not compensate.

| # | Table | Policy | Impact | Recommendation |
|---|---|---|---|---|
| C1 | **payments** | `anon_all_pay` ALL true/true | Insert/update/delete any payment row (forgery of settlement evidence). | DROP. Rely on `owner_staff_manage_payments` + `sa_pay` + `service_role` (server routes use admin client). |
| C2 | **order_items** | `anon_all_oi` ALL true/true | Mutate any line item (price/qty). Has redundant `anon_read_order_items` SELECT true. | DROP `anon_all_oi` + `anon_read_order_items`. Keep `scoped_oi` / `owner_staff_manage_order_items` / `sa_oi`. Guest carts go through API with `service_role`. |
| C3 | **order_item_modifiers** | `anon_all_oim` ALL true/true | Mutate any modifier rows. Redundant SELECT true too. | DROP `anon_all_oim` + `anon_read_order_item_modifiers`. Keep scoped/sa/manage policies. |
| C4 | **split_bills** | `anon_all_split` ALL true/true | Forge split-bill headers. | DROP. Keep `sa_split` only (or add scoped split policies if POS writes via anon — verify before drop). |
| C5 | **split_bill_items** | `anon_all_sbi` ALL true/true | Forge split lines. | DROP as C4. |
| C6 | **stock_levels** | `anon_all_stock` ALL true/true | Mutate inventory. | DROP. Keep `sa_stock` + add owner/staff scoped if POS stock writes need anon. |
| C7 | **stock_transactions** | `anon_all_stock_tx` ALL true/true | Forge stock movements. | DROP as C6. |
| C8 | **recipe_items** | `anon_all_recipe` ALL true/true | Mutate recipes. | DROP. Keep `sa_recipe`; add scoped policy if owners edit recipes. |
| C9 | **recipe_instructions** | `anon_all_recipe_inst` ALL true/true | Mutate instructions. | DROP as C8. |
| C10 | **gravy_ingredients** | `anon_all_gravy_ing` ALL true/true | Mutate gravy BOM. | DROP. Keep `sa_gravy_ing` + `scoped_gravy`-style policy if needed. |
| C11 | **menu_item_gravies** | `anon_all_mig` ALL true/true | Mutate menu↔gravy links. | DROP. Keep `sa_mig` + scoped via `menu_items`. |
| C12 | **platform_api_keys** | `Admins can manage platform api keys` ALL qual=true (no with_check) | **Any caller can SELECT key_hash and UPDATE/DELETE API keys.** | DROP. Replace with super_admin-only policy (`qrcafe_auth_role() = 'super_admin'`). Columns include `key_hash`. |
| C13 | **loyalty_rewards** | `Admins can manage loyalty rewards` ALL qual=true | Any caller can insert/update/delete rewards across tenants. Scoped `owner_staff_manage_loyalty_rewards` exists but is OR'd with true. | DROP the `true` policy. |
| C14 | **loyalty_tiers** | `Admins can manage loyalty tiers` ALL qual=true | Same as C13 for tiers (no scoped policy present). | DROP + add `restaurant_id = qrcafe_auth_restaurant_id() OR super_admin`. |
| C15 | **analytics** | `public_insert_analytics` / `public_read_analytics` true | Unauthenticated write/read of analytics rows (spam + data leak). | Restrict INSERT to `auth.uid() IS NOT NULL` or service_role; scope SELECT to tenant/super_admin if rows contain restaurant_id. |

### Orders SELECT surface (watch item, not necessarily broken)

| Policy | Effect |
|---|---|
| `anon_read_order_by_status_token` SELECT qual `true` | **Any anon can SELECT all order columns** if the query doesn't further filter — policy does not restrict to token match. |

**Risk:** PostgREST `/orders?select=*` as anon returns every row (policy allows the SELECT; column/table GRANTs permitting). Status token uniqueness (`orders_status_token_key`) is not enforced by this policy.

**Recommendation:** Replace with a CHECK-style qual that only allows rows the caller can prove, e.g. bound the query server-side only (API uses `service_role`) and drop `anon_read_order_by_status_token`, or rewrite as a SECURITY DEFINER function `get_order_by_status_token(token)` with `REVOKE` from anon on the table SELECT. Minimal fix: drop the `true` SELECT and keep `anon_select_orders_scoped` (tenant JWT) for any browser-side reads.

Related: `anon_insert_orders_scoped` with_check `restaurant_id = qrcafe_auth_restaurant_id()` is fine for scoped inserts.

---

## High findings

| # | Table | Issue | Recommendation |
|---|---|---|---|
| H1 | **whatsapp_bill_events** | `wa_events_insert` INSERT with_check `true` — anyone can spam bill event rows. Read is scoped. | Restrict INSERT to tenant/super_admin (mirror `whatsapp_message_events`). |
| H2 | **restaurants** | `anon_read_restaurants` SELECT qual `true` — full row read for anon (PII/settings risk depending on columns). | Scope to columns via a view, or limit to `slug`, `name`, `timezone`, branding fields; drop full-table true SELECT. |
| H3 | **audit_events** | Only `sa_audit` (ALL) + `scoped_audit` (SELECT tenant). **No INSERT policy for authenticated service paths using anon key.** Server uses `service_role` (bypasses RLS) so writes work; anon cannot write audit (good). Gap: no deny-by-default issue, but no owner INSERT either. | Document: audit writes must use admin client. Optional: add INSERT policy `qrcafe_auth_role() IN ('owner','super_admin')` if ever needed. |
| H4 | **billing_events** | Mix of `auth.role() = 'service_role'` (deprecated helper) and `qrcafe_auth_*`. Owner SELECT via EXISTS cafe_profiles. Super Admin ALL lacks with_check on one policy (`Super Admin full access billing_events`). | Prefer `qrcafe_auth_role()` consistently; add with_check where cmd=ALL inserts matter (service_role bypasses anyway). |
| H5 | **subscription_plans** | Uses `auth.role()` + EXISTS cafe_profiles (active) for read; super_admin/service for write. Inconsistent with `qrcafe_*` helpers. | Migrate helpers when touching billing again; not a hole. |
| H6 | **feature_flags / platform_announcements** | SELECT for any `auth.uid() IS NOT NULL`. Acceptable for flags; announcements OK. | No change. |
| H7 | **table_reservations** | `anon_insert_reservations` with_check only `status = 'confirmed'` — anon can insert for **any** restaurant_id. | Add `restaurant_id` validation (match active table's restaurant) via with_check expression or keep insert in API with service_role and drop anon INSERT. |
| H8 | **locations** | `public_read_location` SELECT true. | Verify no sensitive columns; likely OK for public codes. |

---

## Medium / consistency

| # | Item | Note |
|---|---|---|
| M1 | `orders` has BOTH `owner_staff_manage_orders` (owner\|staff only) and `scoped_orders` (any tenant role via helper). Effective = union → waiters/kitchen in tenant can ALL via `scoped_orders`. Intended? Floor staff need read; kitchen may need limited UPDATE. | Tighten `scoped_orders` or drop manage overlap; align with POS_ORDER_ROLES. |
| M2 | `menu_items` / `menu_categories` / `restaurant_tables` / `modifier_*` / `gravy_recipes` / `ingredients` each have both `scoped_*` (ALL by restaurant_id) and role-narrowed `owner_staff_*` (owner\|staff). Union = any tenant role (kitchen/waiter/manager) can ALL those tables via scoped policies. | Confirm intentional (shared tenant trust) vs restrict scoped to owner/staff/super_admin. |
| M3 | `restaurant_customers` has 4 per-cmd policies + `owner_staff_manage` ALL. Union OK for tenant staff. | No action if staff may edit customers. |
| M4 | `cafe_profiles`: `owner_profiles` ALL for owner in tenant (can edit other staff pins? qual only checks role=owner + restaurant match — owner can UPDATE any profile in own restaurant including setting pin_hash). Intended. `user_own_profile` SELECT id=auth.uid(). | OK. |
| M5 | `platform_api_keys.restaurant_id` nullable; after C12 fix, scope by restaurant_id OR null for super_admin. | Covered in C12. |
| M6 | Dual loyalty tables: `customers` vs `restaurant_customers` — RPCs use `restaurant_customers`. RLS present on `restaurant_customers` only (no `customers` table in this schema list). | Dead table if `customers` absent — ignore. |
| M7 | `billing_payments`: service_role ALL + owner SELECT + no per-tenant staff read. | OK for money. |
| M8 | `push_subscriptions`: owner\|staff ALL+SELECT via scoped role check; no super_admin policy visible (may rely on service_role). | Add sa policy if super_admin console reads them. |

---

## Positive controls (verified)

- **RLS enabled on every public table** — no unguarded table.
- **No FORCE ROW LEVEL SECURITY** — service_role and table owner bypass as designed for API routes using admin client.
- **cafe_profiles PIN columns** exist: `pin_hash`, `pin_failed_attempts`, `pin_locked_until`, `pin_updated_at` — attempt lockout is server-side (R2-4).
- **orders**: `customer_gstin_format` CHECK matches app `GSTIN_RE`; `idempotency_key` present; unique `(restaurant_id, order_number)` and partial idempotency index from migrations; `status_token` UNIQUE.
- **restaurant_customers**: UNIQUE `(restaurant_id, phone)`.
- **payments**: no CHECK on status (app + settle path validates); amount integer paise.
- **Good scoped patterns** exist and should be the template: `qrcafe_auth_restaurant_id()`, `qrcafe_auth_role()`, role arrays for owner/staff, sa_* for super_admin.
- **subscription_plans.price_paise >= 100**; status CHECKs on billing_payments, whatsapp_*, razorpay_accounts, etc.

---

## Priority remediation order

1. **C12 platform_api_keys** (secret material readable/writable by any authed user).
2. **C1–C5 payments / order_items / order_item_modifiers / split_*** (financial integrity).
3. **Orders anon SELECT true** + **C6–C11 stock/recipe/gravy** (data integrity + inventory).
4. **C13–C14 loyalty + C15 analytics**.
5. **H1–H2, H7** (spam + PII).
6. **M1–M2** policy union review (role model alignment with POS_*_ROLES).

After any policy change: `NOTIFY pgrst, 'reload schema';` is not required for policy-only changes (policies are checked per query), but restart caches if testing via PostgREST immediately.

---

## Query log (reproducible)

```sql
-- Policies
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname;

-- RLS flags
SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='r' ORDER BY 1;

-- Constraints (CHECK/UNIQUE)
SELECT conname, conrelid::regclass, pg_get_constraintdef(oid)
FROM pg_constraint WHERE connamespace='public'::regnamespace
  AND contype IN ('c','u') ORDER BY 2, 1;
```
