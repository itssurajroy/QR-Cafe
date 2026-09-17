-- QRslice — WhatsApp Accounts (Baileys Transport)
-- Migration: 20260918000001_whatsapp_cloud_api.sql
-- Idempotent: safe to re-run. Uses CREATE TABLE IF NOT EXISTS and
-- DROP POLICY IF EXISTS before each CREATE.
--
-- Stores WhatsApp account credentials and connection info for Baileys transport.
-- Each tenant (restaurant) has one WhatsApp account.

-- Helper function for updated_at triggers (idempotent)
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

create table if not exists whatsapp_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references restaurants(id) on delete cascade,
  phone_number_id text,
  access_token text,
  business_account_id text,
  verify_token text,
  webhook_url text,
  webhook_secret text,
  status text not null default 'disconnected' check (status in ('disconnected', 'connecting', 'connected', 'failed')),
  connected_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id)
);

create index if not exists idx_wa_accounts_tenant on whatsapp_accounts(tenant_id);
create index if not exists idx_wa_accounts_status on whatsapp_accounts(status);

-- Row Level Security
alter table whatsapp_accounts enable row level security;

drop policy if exists "wa_accounts_read" on whatsapp_accounts;
create policy "wa_accounts_read" on whatsapp_accounts
  for select using (
    tenant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

drop policy if exists "wa_accounts_write" on whatsapp_accounts;
create policy "wa_accounts_write" on whatsapp_accounts
  for all using (
    tenant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'super_admin')
  )
  with check (
    tenant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'super_admin')
  );

-- Updated at trigger
drop trigger if exists update_whatsapp_accounts_updated_at on whatsapp_accounts;
create trigger update_whatsapp_accounts_updated_at
  before update on whatsapp_accounts
  for each row execute function update_updated_at_column();