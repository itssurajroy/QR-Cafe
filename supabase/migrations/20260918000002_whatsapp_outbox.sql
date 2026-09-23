-- QRslice — WhatsApp Outbox Messages (Async Queue)
-- Migration: 20260918000002_whatsapp_outbox.sql
-- Idempotent: safe to re-run. Uses CREATE TABLE IF NOT EXISTS and
-- DROP POLICY IF EXISTS before each CREATE.
--
-- Outbox pattern for async WhatsApp message sending.
-- Idempotency: UNIQUE constraint on (order_id, message_type) prevents duplicate bills.

create table if not exists whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references restaurants(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  message_type text not null check (message_type in ('bill_receipt', 'order_confirmation', 'order_accepted', 'preparing', 'ready', 'served', 'payment_received', 'refund_processed', 'review_request', 'marketing')),
  recipient_phone text not null,
  template_name text,
  template_language text default 'en',
  template_variables jsonb default '{}'::jsonb,
  document_url text,
  document_filename text,
  document_mime_type text,
  status text not null default 'pending' check (status in ('pending', 'queued', 'sending', 'sent', 'delivered', 'read', 'failed', 'bounced')),
  provider_message_id text,
  error_message text,
  error_code text,
  retry_count int not null default 0,
  max_retries int not null default 3,
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, message_type)
);

create index if not exists idx_wa_messages_tenant_status on whatsapp_messages(tenant_id, status);
create index if not exists idx_wa_messages_tenant_created on whatsapp_messages(tenant_id, created_at desc);
create index if not exists idx_wa_messages_order on whatsapp_messages(order_id);
create index if not exists idx_wa_messages_scheduled on whatsapp_messages(scheduled_at) where status = 'pending';
create index if not exists idx_wa_messages_provider_id on whatsapp_messages(provider_message_id);

-- Row Level Security
alter table whatsapp_messages enable row level security;

drop policy if exists "wa_messages_read" on whatsapp_messages;
create policy "wa_messages_read" on whatsapp_messages
  for select using (
    tenant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

drop policy if exists "wa_messages_insert" on whatsapp_messages;
create policy "wa_messages_insert" on whatsapp_messages
  for insert with check (
    tenant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

drop policy if exists "wa_messages_update" on whatsapp_messages;
create policy "wa_messages_update" on whatsapp_messages
  for update using (
    tenant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

-- Updated at trigger
drop trigger if exists update_whatsapp_messages_updated_at on whatsapp_messages;
create trigger update_whatsapp_messages_updated_at
  before update on whatsapp_messages
  for each row execute function update_updated_at_column();