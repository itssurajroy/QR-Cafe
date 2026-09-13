-- Customer Loyalty & CRM table
create table if not exists restaurant_customers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  phone text not null,
  name text,
  loyalty_points integer not null default 0,
  total_spent_paise bigint not null default 0,
  visit_count integer not null default 1,
  created_at timestamptz not null default now(),
  last_visit_at timestamptz not null default now(),
  unique(restaurant_id, phone)
);

create index if not exists idx_restaurant_customers_restaurant on restaurant_customers(restaurant_id);
create index if not exists idx_restaurant_customers_phone on restaurant_customers(phone);

-- RLS
alter table restaurant_customers enable row level security;

drop policy if exists "customers_read" on restaurant_customers;
create policy "customers_read" on restaurant_customers
  for select using (
    restaurant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

drop policy if exists "customers_insert" on restaurant_customers;
create policy "customers_insert" on restaurant_customers
  for insert with check (
    restaurant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

drop policy if exists "customers_update" on restaurant_customers;
create policy "customers_update" on restaurant_customers
  for update using (
    restaurant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

drop policy if exists "customers_delete" on restaurant_customers;
create policy "customers_delete" on restaurant_customers
  for delete using (
    restaurant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );
