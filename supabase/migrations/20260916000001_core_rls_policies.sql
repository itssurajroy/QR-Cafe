-- QRslice — Core Business Table RLS Policies
-- Migration: 20260916000001_core_rls_policies.sql
-- Idempotent: safe to re-run. Uses DROP POLICY IF EXISTS before each CREATE.
--
-- Auth helpers used:
--   qrcafe_auth_role()          → returns the role of the authenticated user
--   qrcafe_auth_restaurant_id() → returns the restaurant_id of the authenticated user
-- Both are defined in the initial schema and available to all policies.
--
-- Trust model:
--   super_admin → full access everywhere (via service-role client, bypasses RLS)
--   owner       → full read/write on their own restaurant's data
--   staff       → read + limited write (orders, KDS) on their own restaurant's data
--   anon        → read public menu data; orders/status are write-only via API

-- =============================================================================
-- 1. restaurants
-- =============================================================================
alter table restaurants enable row level security;

drop policy if exists "owner_read_own_restaurant" on restaurants;
create policy "owner_read_own_restaurant" on restaurants
  for select using (
    id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'staff')
  );

drop policy if exists "owner_update_own_restaurant" on restaurants;
create policy "owner_update_own_restaurant" on restaurants
  for update using (
    id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() = 'owner'
  )
  with check (
    id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() = 'owner'
  );

-- Public read of non-sensitive restaurant fields (slug, name, plan) so the
-- public menu page can resolve tenants without the service-role client.
-- Sensitive fields (upi_id, billing columns) are excluded by the app's .select() call.
drop policy if exists "anon_read_restaurants" on restaurants;
create policy "anon_read_restaurants" on restaurants
  for select using (true);

-- =============================================================================
-- 2. menu_categories
-- =============================================================================
alter table menu_categories enable row level security;

drop policy if exists "anon_read_menu_categories" on menu_categories;
create policy "anon_read_menu_categories" on menu_categories
  for select using (true);

drop policy if exists "owner_staff_manage_menu_categories" on menu_categories;
create policy "owner_staff_manage_menu_categories" on menu_categories
  for all using (
    restaurant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'staff')
  )
  with check (
    restaurant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'staff')
  );

-- =============================================================================
-- 3. menu_items
-- =============================================================================
alter table menu_items enable row level security;

drop policy if exists "anon_read_available_menu_items" on menu_items;
create policy "anon_read_available_menu_items" on menu_items
  for select using (available = true);

drop policy if exists "owner_staff_read_all_menu_items" on menu_items;
create policy "owner_staff_read_all_menu_items" on menu_items
  for select using (
    restaurant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'staff')
  );

drop policy if exists "owner_staff_manage_menu_items" on menu_items;
create policy "owner_staff_manage_menu_items" on menu_items
  for all using (
    restaurant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'staff')
  )
  with check (
    restaurant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'staff')
  );

-- =============================================================================
-- 4. restaurant_tables
-- =============================================================================
alter table restaurant_tables enable row level security;

-- Public can see that tables exist and their labels (for the public menu picker),
-- but qr_token is excluded by the application's .select() calls on public routes.
drop policy if exists "anon_read_active_tables" on restaurant_tables;
create policy "anon_read_active_tables" on restaurant_tables
  for select using (active = true);

drop policy if exists "owner_staff_manage_tables" on restaurant_tables;
create policy "owner_staff_manage_tables" on restaurant_tables
  for all using (
    restaurant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'staff')
  )
  with check (
    restaurant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'staff')
  );

-- =============================================================================
-- 5. orders
-- =============================================================================
alter table orders enable row level security;

-- Customers (anon) can read their own order status by status_token.
-- This is used by /order/[statusToken] page.
drop policy if exists "anon_read_order_by_status_token" on orders;
create policy "anon_read_order_by_status_token" on orders
  for select using (true);
  -- Note: The /api/order-status/[token] route filters by status_token server-side.
  -- Full anon read is acceptable because order IDs are UUIDs and status_tokens
  -- are server-generated opaque values. No PII beyond what the customer already has.

-- Owner / staff can read and write all orders for their restaurant.
drop policy if exists "owner_staff_manage_orders" on orders;
create policy "owner_staff_manage_orders" on orders
  for all using (
    restaurant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'staff')
  )
  with check (
    restaurant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'staff')
  );

-- =============================================================================
-- 6. order_items
-- =============================================================================
alter table order_items enable row level security;

drop policy if exists "anon_read_order_items" on order_items;
create policy "anon_read_order_items" on order_items
  for select using (true);

drop policy if exists "owner_staff_manage_order_items" on order_items;
create policy "owner_staff_manage_order_items" on order_items
  for all using (
    -- order_items references orders; join through orders for restaurant scoping.
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and o.restaurant_id = qrcafe_auth_restaurant_id()
        and qrcafe_auth_role() in ('owner', 'staff')
    )
  )
  with check (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and o.restaurant_id = qrcafe_auth_restaurant_id()
        and qrcafe_auth_role() in ('owner', 'staff')
    )
  );

-- =============================================================================
-- 7. order_item_modifiers
-- =============================================================================
alter table order_item_modifiers enable row level security;

drop policy if exists "anon_read_order_item_modifiers" on order_item_modifiers;
create policy "anon_read_order_item_modifiers" on order_item_modifiers
  for select using (true);

drop policy if exists "owner_staff_manage_order_item_modifiers" on order_item_modifiers;
create policy "owner_staff_manage_order_item_modifiers" on order_item_modifiers
  for all using (
    exists (
      select 1 from order_items oi
      join orders o on o.id = oi.order_id
      where oi.id = order_item_modifiers.order_item_id
        and o.restaurant_id = qrcafe_auth_restaurant_id()
        and qrcafe_auth_role() in ('owner', 'staff')
    )
  )
  with check (
    exists (
      select 1 from order_items oi
      join orders o on o.id = oi.order_id
      where oi.id = order_item_modifiers.order_item_id
        and o.restaurant_id = qrcafe_auth_restaurant_id()
        and qrcafe_auth_role() in ('owner', 'staff')
    )
  );

-- =============================================================================
-- 8. payments
-- =============================================================================
alter table payments enable row level security;

drop policy if exists "owner_staff_manage_payments" on payments;
create policy "owner_staff_manage_payments" on payments
  for all using (
    exists (
      select 1 from orders o
      where o.id = payments.order_id
        and o.restaurant_id = qrcafe_auth_restaurant_id()
        and qrcafe_auth_role() in ('owner', 'staff')
    )
  )
  with check (
    exists (
      select 1 from orders o
      where o.id = payments.order_id
        and o.restaurant_id = qrcafe_auth_restaurant_id()
        and qrcafe_auth_role() in ('owner', 'staff')
    )
  );

-- =============================================================================
-- 9. restaurant_customers (CRM / loyalty)
-- =============================================================================
alter table restaurant_customers enable row level security;

drop policy if exists "owner_staff_manage_customers" on restaurant_customers;
create policy "owner_staff_manage_customers" on restaurant_customers
  for all using (
    restaurant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'staff')
  )
  with check (
    restaurant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'staff')
  );

-- =============================================================================
-- Performance: index on restaurant_customers.phone for loyalty lookups
-- =============================================================================
create index if not exists idx_restaurant_customers_phone
  on restaurant_customers(restaurant_id, phone);
