-- QRslice — WhatsApp Message Events & Auto-Send Trigger
-- Migration: 20260918000007_whatsapp_trigger.sql
-- Idempotent: safe to re-run. Uses CREATE TABLE IF NOT EXISTS and
-- DROP POLICY IF EXISTS before each CREATE.
--
-- 1. Message Events table for audit trail
-- 2. Trigger function for automatic bill send on payment

-- 1. WhatsApp Message Events (Audit Trail)
create table if not exists whatsapp_message_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references restaurants(id) on delete cascade,
  message_id uuid not null references whatsapp_messages(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'queued', 'sending', 'sent', 'delivered', 'read', 'failed', 'bounced', 'retry', 'webhook_received')),
  provider_event_id text,
  payload jsonb default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_wa_events_message on whatsapp_message_events(message_id);
create index if not exists idx_wa_events_tenant_created on whatsapp_message_events(tenant_id, created_at desc);
create index if not exists idx_wa_events_type on whatsapp_message_events(event_type);

-- Row Level Security
alter table whatsapp_message_events enable row level security;

drop policy if exists "wa_events_read" on whatsapp_message_events;
create policy "wa_events_read" on whatsapp_message_events
  for select using (
    tenant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

drop policy if exists "wa_events_insert" on whatsapp_message_events;
create policy "wa_events_insert" on whatsapp_message_events
  for insert with check (
    tenant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

-- 2. Trigger Function for Automatic Bill Send
create or replace function trigger_whatsapp_bill_send()
returns trigger language plpgsql as $$
declare
  wa_settings record;
  customer_phone text;
  order_record record;
  message_id uuid;
  restaurant_name text;
  template_name text;
  template_language text;
  template_vars jsonb;
begin
  -- Only trigger on payment status change to 'paid'
  if NEW.payment_status <> 'paid' then
    return NEW;
  end if;

  -- Check if old status was not paid
  if OLD.payment_status = 'paid' then
    return NEW;
  end if;

  -- Get WhatsApp settings for this restaurant
  select * into wa_settings
  from whatsapp_settings
  where tenant_id = NEW.restaurant_id;

  -- Check if WhatsApp is enabled and auto-send bill is configured
  if not wa_settings.enabled then
    return NEW;
  end if;

  if not wa_settings.auto_send_bill then
    return NEW;
  end if;

  -- Get restaurant name
  select name into restaurant_name from restaurants where id = NEW.restaurant_id;

  -- Get customer phone from order or customer table
  customer_phone := NEW.customer_phone;
  if customer_phone is null and NEW.customer_id is not null then
    select phone into customer_phone from restaurant_customers where id = NEW.customer_id;
  end if;

  if customer_phone is null then
    return NEW;
  end if;

  -- Get template settings
  template_name := wa_settings.default_template;
  template_language := wa_settings.default_language;

  -- Build template variables
  template_vars := jsonb_build_object(
    'restaurant_name', restaurant_name,
    'order_number', NEW.order_number,
    'table_number', NEW.table_label,
    'total', to_char(NEW.total_paise / 100.0, 'FM999999990.00'),
    'payment_mode', COALESCE(NEW.payment_method, 'Unknown'),
    'receipt_url', 'https://www.qrslice.com/receipt/' || NEW.status_token
  );

  -- Insert outbound message (idempotent via unique constraint on order_id, message_type)
  insert into whatsapp_messages (
    tenant_id,
    order_id,
    message_type,
    recipient_phone,
    template_name,
    template_language,
    template_variables,
    status
  ) values (
    NEW.restaurant_id,
    NEW.id,
    'bill_receipt',
    customer_phone,
    template_name,
    template_language,
    template_vars,
    'pending'
  ) on conflict (order_id, message_type) do nothing
  returning id into message_id;

  -- Log event
  if message_id is not null then
    insert into whatsapp_message_events (tenant_id, message_id, event_type, payload)
    values (NEW.restaurant_id, message_id, 'created', jsonb_build_object('trigger', 'payment_paid'));
  end if;

  return NEW;
end;
$$;

-- Create trigger on orders table
drop trigger if exists trigger_whatsapp_bill_send on orders;
create trigger trigger_whatsapp_bill_send
  after update of payment_status on orders
  for each row execute function trigger_whatsapp_bill_send();

-- Grant execute permissions
grant execute on function trigger_whatsapp_bill_send() to postgres, authenticated, service_role;