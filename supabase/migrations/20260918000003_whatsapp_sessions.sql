-- QRslice — WhatsApp Baileys Sessions (Encrypted Auth State)
-- Migration: 20260918000003_whatsapp_sessions.sql
-- Idempotent: safe to re-run. Uses CREATE TABLE IF NOT EXISTS and
-- DROP POLICY IF EXISTS before each CREATE.
--
-- Stores encrypted Baileys authentication state for session persistence.
-- Survives worker restarts. Encrypted at rest using per-tenant key.

create table if not exists whatsapp_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references restaurants(id) on delete cascade,
  session_data bytea not null,
  encryption_key_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id)
);

create index if not exists idx_wa_sessions_tenant on whatsapp_sessions(tenant_id);

-- Row Level Security
alter table whatsapp_sessions enable row level security;

drop policy if exists "wa_sessions_read" on whatsapp_sessions;
create policy "wa_sessions_read" on whatsapp_sessions
  for select using (
    tenant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'super_admin')
  );

drop policy if exists "wa_sessions_write" on whatsapp_sessions;
create policy "wa_sessions_write" on whatsapp_sessions
  for all using (
    tenant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'super_admin')
  )
  with check (
    tenant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'super_admin')
  );

-- Updated at trigger
drop trigger if exists update_whatsapp_sessions_updated_at on whatsapp_sessions;
create trigger update_whatsapp_sessions_updated_at
  before update on whatsapp_sessions
  for each row execute function update_updated_at_column();