-- QRslice — WhatsApp Message Templates
-- Migration: 20260918000004_whatsapp_templates.sql
-- Idempotent: safe to re-run. Uses CREATE TABLE IF NOT EXISTS and
-- DROP POLICY IF EXISTS before each CREATE.
--
-- Stores WhatsApp message templates for transactional and marketing messages.
-- Templates can be Meta Cloud API templates or custom Baileys templates.

create table if not exists whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  language text not null default 'en',
  category text not null check (category in ('transactional', 'marketing', 'utility')),
  components jsonb not null default '[]'::jsonb,
  meta_template_id text,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name, language)
);

create index if not exists idx_wa_templates_tenant on whatsapp_templates(tenant_id);
create index if not exists idx_wa_templates_meta_id on whatsapp_templates(meta_template_id);

-- Row Level Security
alter table whatsapp_templates enable row level security;

drop policy if exists "wa_templates_read" on whatsapp_templates;
create policy "wa_templates_read" on whatsapp_templates
  for select using (
    tenant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

drop policy if exists "wa_templates_write" on whatsapp_templates;
create policy "wa_templates_write" on whatsapp_templates
  for all using (
    tenant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'super_admin')
  )
  with check (
    tenant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'super_admin')
  );

-- Updated at trigger
drop trigger if exists update_whatsapp_templates_updated_at on whatsapp_templates;
create trigger update_whatsapp_templates_updated_at
  before update on whatsapp_templates
  for each row execute function update_updated_at_column();

-- Seed default transactional templates for existing restaurants
insert into whatsapp_templates (tenant_id, name, language, category, components, status)
select
  r.id as tenant_id,
  'bill_receipt' as name,
  'en' as language,
  'transactional' as category,
  '[
    {"type": "header", "parameters": [{"type": "document"}]},
    {"type": "body", "parameters": [
      {"type": "text"}, {"type": "text"}, {"type": "text"}, {"type": "text"},
      {"type": "text"}, {"type": "text"}
    ]}
  ]'::jsonb as components,
  'approved' as status
from restaurants r
where not exists (
  select 1 from whatsapp_templates wt
  where wt.tenant_id = r.id and wt.name = 'bill_receipt'
)
on conflict (tenant_id, name, language) do nothing;

insert into whatsapp_templates (tenant_id, name, language, category, components, status)
select
  r.id as tenant_id,
  'order_confirmation' as name,
  'en' as language,
  'transactional' as category,
  '[
    {"type": "body", "parameters": [
      {"type": "text"}, {"type": "text"}, {"type": "text"}, {"type": "text"}
    ]}
  ]'::jsonb as components,
  'approved' as status
from restaurants r
where not exists (
  select 1 from whatsapp_templates wt
  where wt.tenant_id = r.id and wt.name = 'order_confirmation'
)
on conflict (tenant_id, name, language) do nothing;