-- QRslice — Table Service Requests
-- Migration: 20260920000003_service_requests.sql
-- Idempotent: safe to re-run.

create table if not exists service_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_id uuid not null references restaurant_tables(id) on delete cascade,
  request_type text not null,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_service_requests_restaurant on service_requests(restaurant_id);
create index if not exists idx_service_requests_status on service_requests(status);

-- Row Level Security
alter table service_requests enable row level security;

drop policy if exists "service_requests_read" on service_requests;
create policy "service_requests_read" on service_requests
  for select using (
    restaurant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

drop policy if exists "service_requests_write" on service_requests;
create policy "service_requests_write" on service_requests
  for all using (
    restaurant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'super_admin', 'staff')
  )
  with check (
    restaurant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'super_admin', 'staff')
  );

-- Updated at trigger
drop trigger if exists update_service_requests_updated_at on service_requests;
create trigger update_service_requests_updated_at
  before update on service_requests
  for each row execute function update_updated_at_column();
