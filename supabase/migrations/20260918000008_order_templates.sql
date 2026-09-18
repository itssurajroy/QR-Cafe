-- QRslice — WhatsApp Order Confirmation Template
-- Migration: 20260918000008_order_templates.sql
-- Idempotent: safe to re-run.

-- 1. Allow 'order_confirmed' message type (idempotent check rebuild).
alter table if exists whatsapp_messages
  drop constraint if exists whatsapp_messages_message_type_check;

alter table if exists whatsapp_messages
  add constraint whatsapp_messages_message_type_check
  check (message_type in (
    'bill_receipt',
    'order_confirmation',
    'order_confirmed',
    'order_accepted',
    'preparing',
    'ready',
    'served',
    'payment_received',
    'refund_processed',
    'review_request',
    'marketing'
  ));

-- 2. Seed the order_confirmed transactional template for existing restaurants.
insert into whatsapp_templates (tenant_id, name, language, category, components, status)
select
  r.id as tenant_id,
  'order_confirmed' as name,
  'en' as language,
  'transactional' as category,
  '[
    {"type": "body", "parameters": [
      {"type": "text"}, {"type": "text"}, {"type": "text"}, {"type": "text"}, {"type": "text"}
    ]}
  ]'::jsonb as components,
  'approved' as status
from restaurants r
where not exists (
  select 1 from whatsapp_templates wt
  where wt.tenant_id = r.id and wt.name = 'order_confirmed' and wt.language = 'en'
)
on conflict (tenant_id, name, language) do nothing;
