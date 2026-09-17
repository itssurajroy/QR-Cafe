-- QRslice — WhatsApp Customer Opt-ins (Marketing Consent)
-- Migration: 20260918000006_whatsapp_opt_ins.sql
-- Idempotent: safe to re-run. Uses CREATE TABLE IF NOT EXISTS and
-- DROP POLICY IF EXISTS before each CREATE.
--
-- Stores customer opt-in consent for WhatsApp marketing messages.
-- Required for compliance with WhatsApp Business Policy and local regulations.

create table if not exists whatsapp_opt_ins (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references restaurants(id) on delete cascade,
  customer_id uuid references restaurant_customers(id) on delete cascade,
  phone text not null,
  opt_in_type text not null check (opt_in_type in ('transactional', 'marketing', 'both')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'revoked', 'expired')),
  source text not null default 'manual' check (source in ('manual', 'qr_code', 'web_form', 'pos', 'import')),
  consent_text text,
  consent_version text default '1.0',
  confirmed_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, phone, opt_in_type)
);

create index if not exists idx_wa_opt_ins_tenant_status on whatsapp_opt_ins(tenant_id, status);
create index if not exists idx_wa_opt_ins_phone on whatsapp_opt_ins(phone);
create index if not exists idx_wa_opt_ins_customer on whatsapp_opt_ins(customer_id);

-- Row Level Security
alter table whatsapp_opt_ins enable row level security;

drop policy if exists "wa_opt_ins_read" on whatsapp_opt_ins;
create policy "wa_opt_ins_read" on whatsapp_opt_ins
  for select using (
    tenant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

drop policy if exists "wa_opt_ins_insert" on whatsapp_opt_ins;
create policy "wa_opt_ins_insert" on whatsapp_opt_ins
  for insert with check (
    tenant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

drop policy if exists "wa_opt_ins_update" on whatsapp_opt_ins;
create policy "wa_opt_ins_update" on whatsapp_opt_ins
  for update using (
    tenant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

-- Updated at trigger
drop trigger if exists update_whatsapp_opt_ins_updated_at on whatsapp_opt_ins;
create trigger update_whatsapp_opt_ins_updated_at
  before update on whatsapp_opt_ins
  for each row execute function update_updated_at_column();