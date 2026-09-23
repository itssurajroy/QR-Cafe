-- QRslice — WhatsApp Baileys Sessions (Encrypted Auth State)
-- Migration: 20260918000003_whatsapp_sessions.sql
-- Idempotent: safe to re-run.
--
-- Stores encrypted Baileys authentication state for session persistence.
-- Survives worker restarts.
--
-- NOTE: The legacy table (from 0006_whatsapp_sessions.sql) used `restaurant_id`.
-- This migration renames it to `tenant_id` and adds the missing columns.

-- Step 1: Create fresh table if it does not exist at all
create table if not exists whatsapp_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references restaurants(id) on delete cascade,
  session_data bytea not null default ''::bytea,
  encryption_key_id text not null default 'default',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id)
);

-- Step 2: If the table existed with the old `restaurant_id` column, rename it
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'whatsapp_sessions'
      and column_name  = 'restaurant_id'
  ) then
    -- Rename the old unique constraint on restaurant_id if it exists
    begin
      alter table whatsapp_sessions rename constraint whatsapp_sessions_restaurant_id_key to whatsapp_sessions_tenant_id_key;
    exception when others then null;
    end;
    -- Rename the old index if it exists
    begin
      alter index if exists idx_whatsapp_sessions_restaurant rename to idx_wa_sessions_tenant;
    exception when others then null;
    end;
    -- Rename the column
    alter table whatsapp_sessions rename column restaurant_id to tenant_id;
  end if;
end;
$$;

-- Step 3: Add missing columns (safe to run even if they already exist)
alter table whatsapp_sessions
  add column if not exists session_data bytea not null default ''::bytea,
  add column if not exists encryption_key_id text not null default 'default',
  add column if not exists updated_at timestamptz not null default now();

-- Step 4: Drop legacy boolean / text columns that no longer apply
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'whatsapp_sessions'
      and column_name  = 'connected'
  ) then
    alter table whatsapp_sessions drop column connected;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'whatsapp_sessions'
      and column_name  = 'phone_number'
  ) then
    alter table whatsapp_sessions drop column phone_number;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'whatsapp_sessions'
      and column_name  = 'last_connected_at'
  ) then
    alter table whatsapp_sessions drop column last_connected_at;
  end if;
end;
$$;

-- Step 5: Ensure index exists
create index if not exists idx_wa_sessions_tenant on whatsapp_sessions(tenant_id);

-- Step 6: Enable RLS (idempotent)
alter table whatsapp_sessions enable row level security;

-- Step 7: Drop all legacy policies before recreating
drop policy if exists "sa_whatsapp_sessions_all" on whatsapp_sessions;
drop policy if exists "owner_whatsapp_sessions_read" on whatsapp_sessions;
drop policy if exists "wa_sessions_read" on whatsapp_sessions;
drop policy if exists "wa_sessions_write" on whatsapp_sessions;

create policy "wa_sessions_read" on whatsapp_sessions
  for select using (
    tenant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'super_admin')
  );

create policy "wa_sessions_write" on whatsapp_sessions
  for all using (
    tenant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'super_admin')
  )
  with check (
    tenant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'super_admin')
  );

-- Step 8: Updated_at trigger
drop trigger if exists update_whatsapp_sessions_updated_at on whatsapp_sessions;
create trigger update_whatsapp_sessions_updated_at
  before update on whatsapp_sessions
  for each row execute function update_updated_at_column();