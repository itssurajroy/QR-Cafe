-- QRslice — WhatsApp Order Status Templates
-- Migration: 20260918000009_status_templates.sql
-- Idempotent: safe to re-run.

-- 1. Extend the message_type check idempotently (DROP IF EXISTS + ADD superset).
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

-- 2. Seed order status transactional templates for existing restaurants.
insert into whatsapp_templates (tenant_id, name, language, category, components, status)
select
  r.id as tenant_id,
  t.name as name,
  'en' as language,
  'transactional' as category,
  t.components as components,
  'approved' as status
from restaurants r
cross join (values
  ('order_accepted', '[
    {"type": "body", "parameters": [
      {"type": "text"}, {"type": "text"}, {"type": "text"}, {"type": "text"}
    ]}
  ]'::jsonb),
  ('preparing', '[
    {"type": "body", "parameters": [
      {"type": "text"}, {"type": "text"}, {"type": "text"}
    ]}
  ]'::jsonb),
  ('ready', '[
    {"type": "body", "parameters": [
      {"type": "text"}, {"type": "text"}
    ]}
  ]'::jsonb),
  ('served', '[
    {"type": "body", "parameters": [
      {"type": "text"}, {"type": "text"}
    ]}
  ]'::jsonb)
) as t(name, components)
where not exists (
  select 1 from whatsapp_templates wt
  where wt.tenant_id = r.id and wt.name = t.name and wt.language = 'en'
)
on conflict (tenant_id, name, language) do nothing;
