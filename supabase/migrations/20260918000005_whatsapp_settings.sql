-- QRslice — WhatsApp Settings
-- Migration: 20260918000005_whatsapp_settings.sql
-- Idempotent: safe to re-run. Uses CREATE TABLE IF NOT EXISTS and
-- DROP POLICY IF EXISTS before each CREATE.
--
-- Per-tenant WhatsApp configuration settings.
-- Separate from whatsapp_accounts (credentials) - this is for behavioral settings.

create table if not exists whatsapp_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references restaurants(id) on delete cascade,
  enabled boolean not null default true,
  auto_send_bill boolean not null default true,
  auto_send_order_confirmation boolean not null default false,
  auto_send_status_updates boolean not null default false,
  default_template text default 'bill_receipt',
  default_language text default 'en',
  include_review_cta boolean not null default true,
  include_gstin_line boolean not null default true,
  thank_you_line text default 'Thank you for dining with us!',
  business_name_override text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id)
);

create index if not exists idx_wa_settings_tenant on whatsapp_settings(tenant_id);

-- Row Level Security
alter table whatsapp_settings enable row level security;

drop policy if exists "wa_settings_read" on whatsapp_settings;
create policy "wa_settings_read" on whatsapp_settings
  for select using (
    tenant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

drop policy if exists "wa_settings_write" on whatsapp_settings;
create policy "wa_settings_write" on whatsapp_settings
  for all using (
    tenant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'super_admin')
  )
  with check (
    tenant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'super_admin')
  );

-- Updated at trigger
drop trigger if exists update_whatsapp_settings_updated_at on whatsapp_settings;
create trigger update_whatsapp_settings_updated_at
  before update on whatsapp_settings
  for each row execute function update_updated_at_column();

-- Seed default settings for existing restaurants
insert into whatsapp_settings (tenant_id, enabled, auto_send_bill, default_template)
select id, true, true, 'bill_receipt'
from restaurants
where id not in (select tenant_id from whatsapp_settings)
on conflict (tenant_id) do nothing;