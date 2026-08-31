-- ============================================================
-- QR Café — Migration 0001: schema + RLS + seed (multi-tenant, super-admin)
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------------- TABLES ----------------

create table if not exists restaurants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  currency    text not null default 'INR',
  logo_url    text,
  timezone    text not null default 'Asia/Kolkata',
  created_at  timestamptz not null default now()
);

create table if not exists cafe_profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  restaurant_id  uuid references restaurants(id) on delete cascade,
  role           text not null check (role in ('super_admin','owner','staff')),
  display_name   text,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

create table if not exists restaurant_tables (
  id          uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  label       text not null,
  seats       int not null default 2 check (seats between 1 and 50),
  qr_token    uuid not null unique default gen_random_uuid(),
  active      boolean not null default true,
  unique (restaurant_id, label)
);

create table if not exists menu_categories (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name          text not null,
  sort_order    int not null default 0,
  active        boolean not null default true
);

create table if not exists menu_items (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  category_id   uuid not null references menu_categories(id) on delete cascade,
  name          text not null,
  description   text default '',
  price_paise   int not null check (price_paise >= 0),
  image_url     text,
  is_veg        boolean not null default true,
  available     boolean not null default true
);

create table if not exists modifier_groups (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name          text not null,
  min_select    int not null default 0,
  max_select    int not null default 1,
  required      boolean not null default false
);

create table if not exists modifier_options (
  id                uuid primary key default gen_random_uuid(),
  modifier_group_id uuid not null references modifier_groups(id) on delete cascade,
  name              text not null,
  price_delta_paise int not null default 0,
  active            boolean not null default true
);

create table if not exists menu_item_modifier_groups (
  menu_item_id      uuid not null references menu_items(id) on delete cascade,
  modifier_group_id uuid not null references modifier_groups(id) on delete cascade,
  sort_order        int not null default 0,
  primary key (menu_item_id, modifier_group_id)
);

create table if not exists orders (
  id                uuid primary key default gen_random_uuid(),
  restaurant_id     uuid not null references restaurants(id) on delete cascade,
  table_id          uuid not null references restaurant_tables(id) on delete cascade,
  order_number      text not null,
  status            text not null default 'pending'
                      check (status in ('pending','confirmed','preparing','ready','served','cancelled','rejected')),
  subtotal_paise    int not null check (subtotal_paise >= 0),
  total_paise       int not null check (total_paise >= 0),
  payment_status    text not null default 'unpaid'
                      check (payment_status in ('unpaid','paid','refunded')),
  payment_method    text not null default 'counter' check (payment_method in ('counter','online')),
  customer_name     text,
  customer_phone    text,
  status_token      uuid not null unique default gen_random_uuid(),
  idempotency_key   uuid not null unique,
  created_at        timestamptz not null default now(),
  unique (restaurant_id, order_number)
);

create table if not exists order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references orders(id) on delete cascade,
  menu_item_id      uuid not null,
  item_name         text not null,
  unit_price_paise  int not null check (unit_price_paise >= 0),
  quantity          int not null check (quantity between 1 and 50),
  line_total_paise  int not null check (line_total_paise >= 0),
  notes             text default ''
);

create table if not exists order_item_modifiers (
  id                uuid primary key default gen_random_uuid(),
  order_item_id     uuid not null references order_items(id) on delete cascade,
  option_name       text not null,
  price_delta_paise int not null default 0
);

create table if not exists payments (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references orders(id) on delete cascade,
  provider            text not null,
  provider_order_id   text,
  provider_payment_id text,
  status              text not null,
  amount_paise       int not null,
  raw_event_ref       text,
  created_at          timestamptz not null default now()
);
create index if not exists payments_provider_order_id_idx on payments(provider_order_id);

create table if not exists audit_events (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid references auth.users(id) on delete set null,
  restaurant_id uuid references restaurants(id) on delete cascade,
  entity        text not null,
  entity_id     text not null,
  action        text not null,
  metadata      jsonb,
  created_at    timestamptz not null default now()
);

-- ---------------- INDEXES ----------------
create index if not exists orders_restaurant_status_idx on orders(restaurant_id, status, created_at desc);
create index if not exists orders_table_idx on orders(table_id, created_at desc);
create index if not exists menu_items_restaurant_cat_avail_idx on menu_items(restaurant_id, category_id, available);

-- ---------------- HELPERS ----------------
create or replace function qrcafe_auth_restaurant_id() returns uuid
language sql stable as $$
  select restaurant_id from cafe_profiles where id = auth.uid();
$$;

create or replace function qrcafe_auth_role() returns text
language sql stable as $$
  select role from cafe_profiles where id = auth.uid();
$$;

-- ---------------- RLS ----------------
alter table restaurants enable row level security;
alter table cafe_profiles enable row level security;
alter table restaurant_tables enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table modifier_groups enable row level security;
alter table modifier_options enable row level security;
alter table menu_item_modifier_groups enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_item_modifiers enable row level security;
alter table payments enable row level security;
alter table audit_events enable row level security;

-- TEMPLATE: super_admin sees all; owner/staff scoped to their restaurant.
-- Applied per table below.

-- restaurants
create policy sa_restaurants on restaurants for all to authenticated
  using (qrcafe_auth_role() = 'super_admin') with check (qrcafe_auth_role() = 'super_admin');
create policy scoped_restaurants on restaurants for all to authenticated
  using (id = qrcafe_auth_restaurant_id()) with check (id = qrcafe_auth_restaurant_id());

-- profiles (super_admin can manage all; owner can manage staff in own café)
create policy sa_profiles on cafe_profiles for all to authenticated
  using (qrcafe_auth_role() = 'super_admin') with check (qrcafe_auth_role() = 'super_admin');
create policy owner_profiles on cafe_profiles for all to authenticated
  using (restaurant_id = qrcafe_auth_restaurant_id()
         and (qrcafe_auth_role() = 'owner' or id = auth.uid()))
  with check (restaurant_id = qrcafe_auth_restaurant_id() and qrcafe_auth_role() = 'owner');

-- restaurant_tables
create policy sa_tables on restaurant_tables for all to authenticated
  using (qrcafe_auth_role() = 'super_admin') with check (qrcafe_auth_role() = 'super_admin');
create policy scoped_tables on restaurant_tables for all to authenticated
  using (restaurant_id = qrcafe_auth_restaurant_id()) with check (restaurant_id = qrcafe_auth_restaurant_id());

-- menu_categories
create policy sa_cats on menu_categories for all to authenticated
  using (qrcafe_auth_role() = 'super_admin') with check (qrcafe_auth_role() = 'super_admin');
create policy scoped_cats on menu_categories for all to authenticated
  using (restaurant_id = qrcafe_auth_restaurant_id()) with check (restaurant_id = qrcafe_auth_restaurant_id());

-- menu_items
create policy sa_items on menu_items for all to authenticated
  using (qrcafe_auth_role() = 'super_admin') with check (qrcafe_auth_role() = 'super_admin');
create policy scoped_items on menu_items for all to authenticated
  using (restaurant_id = qrcafe_auth_restaurant_id()) with check (restaurant_id = qrcafe_auth_restaurant_id());

-- modifier_groups
create policy sa_mg on modifier_groups for all to authenticated
  using (qrcafe_auth_role() = 'super_admin') with check (qrcafe_auth_role() = 'super_admin');
create policy scoped_mg on modifier_groups for all to authenticated
  using (restaurant_id = qrcafe_auth_restaurant_id()) with check (restaurant_id = qrcafe_auth_restaurant_id());

-- modifier_options
create policy sa_mo on modifier_options for all to authenticated
  using (qrcafe_auth_role() = 'super_admin') with check (qrcafe_auth_role() = 'super_admin');
create policy scoped_mo on modifier_options for all to authenticated
  using (exists (select 1 from modifier_groups g where g.id = modifier_group_id
                and g.restaurant_id = qrcafe_auth_restaurant_id()))
  with check (exists (select 1 from modifier_groups g where g.id = modifier_group_id
                and g.restaurant_id = qrcafe_auth_restaurant_id()));

-- menu_item_modifier_groups
create policy sa_mimg on menu_item_modifier_groups for all to authenticated
  using (qrcafe_auth_role() = 'super_admin') with check (qrcafe_auth_role() = 'super_admin');
create policy scoped_mimg on menu_item_modifier_groups for all to authenticated
  using (exists (select 1 from menu_items i where i.id = menu_item_id
                and i.restaurant_id = qrcafe_auth_restaurant_id()))
  with check (exists (select 1 from menu_items i where i.id = menu_item_id
                and i.restaurant_id = qrcafe_auth_restaurant_id()));

-- orders
create policy sa_orders on orders for all to authenticated
  using (qrcafe_auth_role() = 'super_admin') with check (qrcafe_auth_role() = 'super_admin');
create policy scoped_orders on orders for all to authenticated
  using (restaurant_id = qrcafe_auth_restaurant_id()) with check (restaurant_id = qrcafe_auth_restaurant_id());

-- order_items
create policy sa_oi on order_items for all to authenticated
  using (qrcafe_auth_role() = 'super_admin') with check (qrcafe_auth_role() = 'super_admin');
create policy scoped_oi on order_items for all to authenticated
  using (exists (select 1 from orders o where o.id = order_id
                and o.restaurant_id = qrcafe_auth_restaurant_id()))
  with check (exists (select 1 from orders o where o.id = order_id
                and o.restaurant_id = qrcafe_auth_restaurant_id()));

-- order_item_modifiers
create policy sa_oim on order_item_modifiers for all to authenticated
  using (qrcafe_auth_role() = 'super_admin') with check (qrcafe_auth_role() = 'super_admin');
create policy scoped_oim on order_item_modifiers for all to authenticated
  using (exists (select 1 from order_items oi join orders o on o.id = oi.order_id
                where oi.id = order_item_id and o.restaurant_id = qrcafe_auth_restaurant_id()))
  with check (exists (select 1 from order_items oi join orders o on o.id = oi.order_id
                where oi.id = order_item_id and o.restaurant_id = qrcafe_auth_restaurant_id()));

-- payments
create policy sa_pay on payments for all to authenticated
  using (qrcafe_auth_role() = 'super_admin') with check (qrcafe_auth_role() = 'super_admin');
create policy scoped_pay on payments for all to authenticated
  using (exists (select 1 from orders o where o.id = order_id
                and o.restaurant_id = qrcafe_auth_restaurant_id()))
  with check (exists (select 1 from orders o where o.id = order_id
                and o.restaurant_id = qrcafe_auth_restaurant_id()));

-- audit_events (read-only to non-super; super_admin full)
create policy sa_audit on audit_events for all to authenticated
  using (qrcafe_auth_role() = 'super_admin') with check (qrcafe_auth_role() = 'super_admin');
create policy scoped_audit on audit_events for select to authenticated
  using (restaurant_id = qrcafe_auth_restaurant_id());

-- ============================================================
-- SEED: 2 demo cafés (rows for super_admin/owner must be
-- created via Supabase Auth, then insert into cafe_profiles manually).
-- ============================================================

insert into restaurants (name, slug) values
  ('Curry Leaf Café', 'curry-leaf'),
  ('Brews & Bytes', 'brews-bytes');

-- Curry Leaf
insert into menu_categories (restaurant_id, name, sort_order)
select r.id, 'Starters', 1 from restaurants r where r.slug='curry-leaf';
insert into menu_categories (restaurant_id, name, sort_order)
select r.id, 'Mains', 2 from restaurants r where r.slug='curry-leaf';
insert into menu_categories (restaurant_id, name, sort_order)
select r.id, 'Beverages', 3 from restaurants r where r.slug='curry-leaf';

insert into menu_items (restaurant_id, category_id, name, description, price_paise, is_veg)
select r.id, c.id, 'Paneer Tikka', 'Grilled cottage cheese', 22000, true
from restaurants r, menu_categories c
where r.slug='curry-leaf' and c.name='Starters' and c.restaurant_id=r.id;

insert into menu_items (restaurant_id, category_id, name, description, price_paise, is_veg)
select r.id, c.id, 'Chicken Biryani', 'Basmati rice with chicken', 28000, false
from restaurants r, menu_categories c
where r.slug='curry-leaf' and c.name='Mains' and c.restaurant_id=r.id;

insert into menu_items (restaurant_id, category_id, name, description, price_paise, is_veg)
select r.id, c.id, 'Masala Chai', 'Spiced tea', 6000, true
from restaurants r, menu_categories c
where r.slug='curry-leaf' and c.name='Beverages' and c.restaurant_id=r.id;

insert into restaurant_tables (restaurant_id, label, seats)
select id, 'T1', 2 from restaurants where slug='curry-leaf';
insert into restaurant_tables (restaurant_id, label, seats)
select id, 'T2', 4 from restaurants where slug='curry-leaf';
insert into restaurant_tables (restaurant_id, label, seats)
select id, 'T3', 4 from restaurants where slug='curry-leaf';

-- Brews & Bytes
insert into menu_categories (restaurant_id, name, sort_order)
select r.id, 'Coffee', 1 from restaurants r where r.slug='brews-bytes';
insert into menu_categories (restaurant_id, name, sort_order)
select r.id, 'Snacks', 2 from restaurants r where r.slug='brews-bytes';

insert into menu_items (restaurant_id, category_id, name, description, price_paise, is_veg)
select r.id, c.id, 'Cappuccino', 'Espresso with foam', 18000, true
from restaurants r, menu_categories c
where r.slug='brews-bytes' and c.name='Coffee' and c.restaurant_id=r.id;

insert into menu_items (restaurant_id, category_id, name, description, price_paise, is_veg)
select r.id, c.id, 'Veg Sandwich', 'Grilled veg sandwich', 12000, true
from restaurants r, menu_categories c
where r.slug='brews-bytes' and c.name='Snacks' and c.restaurant_id=r.id;

insert into restaurant_tables (restaurant_id, label, seats)
select id, 'T1', 2 from restaurants where slug='brews-bytes';
insert into restaurant_tables (restaurant_id, label, seats)
select id, 'T2', 2 from restaurants where slug='brews-bytes';
