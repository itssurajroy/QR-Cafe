-- QRslice — Razorpay Accounts
-- Migration: 20260920000002_razorpay_accounts.sql
-- Idempotent: safe to re-run.

create table if not exists razorpay_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references restaurants(id) on delete cascade,
  key_id text not null,
  key_secret text not null,
  status text not null default 'connected' check (status in ('connected', 'failed', 'disconnected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id)
);

create index if not exists idx_rp_accounts_tenant on razorpay_accounts(tenant_id);

-- Row Level Security
alter table razorpay_accounts enable row level security;

drop policy if exists "rp_accounts_read" on razorpay_accounts;
create policy "rp_accounts_read" on razorpay_accounts
  for select using (
    tenant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

drop policy if exists "rp_accounts_write" on razorpay_accounts;
create policy "rp_accounts_write" on razorpay_accounts
  for all using (
    tenant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'super_admin')
  )
  with check (
    tenant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'super_admin')
  );

-- Updated at trigger
drop trigger if exists update_razorpay_accounts_updated_at on razorpay_accounts;
create trigger update_razorpay_accounts_updated_at
  before update on razorpay_accounts
  for each row execute function update_updated_at_column();
