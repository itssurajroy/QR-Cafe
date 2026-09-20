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
-- Failure isolation: the body is exception-safe (EXCEPTION WHEN OTHERS =>
-- RETURN NEW) so a trigger error can NEVER block the orders payment update.
-- No external calls are made here; the row is only queued into
-- whatsapp_messages (async outbox) for the worker to consume.
create or replace function trigger_whatsapp_bill_send()
returns trigger language plpgsql as $$
declare
  wa_enabled boolean;
  wa_auto_send boolean;
  wa_template text;
  wa_language text;
  customer_phone text;
  restaurant_name text;
  template_vars jsonb;
  message_id uuid;
begin
  -- 1. Fire ONLY on transition INTO 'paid' (NULL-safe on both sides).
  if NEW.payment_status is distinct from 'paid' then
    return NEW;
  end if;
  if OLD.payment_status is not distinct from 'paid' then
    return NEW;
  end if;

  begin
    -- 2. Tenant settings gate: enabled AND auto_send_bill (missing row = off).
    select s.enabled, s.auto_send_bill, s.default_template, s.default_language
      into wa_enabled, wa_auto_send, wa_template, wa_language
      from whatsapp_settings s
      where s.tenant_id = NEW.restaurant_id;
    if not found then
      return NEW;
    end if;
    if not coalesce(wa_enabled, false) then
      return NEW;
    end if;
    if not coalesce(wa_auto_send, false) then
      return NEW;
    end if;

    -- 3. Resolve recipient phone: order phone (customer_phone on orders table).
    customer_phone := nullif(btrim(coalesce(NEW.customer_phone, '')), '');
    if customer_phone is null then
      customer_phone := null;
    end if;
    if customer_phone is null then
      return NEW;
    end if;

    -- 4. Restaurant name for template vars (missing restaurant leaves null).
    select r.name into restaurant_name from restaurants r where r.id = NEW.restaurant_id;

    -- 5. Build template variables. status_token is uuid in orders, so cast to
    -- text before concatenation; coalesce keeps every field NULL-safe.
    template_vars := jsonb_build_object(
      'restaurant_name', restaurant_name,
      'order_number', NEW.order_number,
      'table_number', coalesce(NEW.table_label, 'Dine-in'),
      'total', to_char(coalesce(NEW.total_paise, 0) / 100.0, 'FM999999990.00'),
      'payment_mode', coalesce(NEW.payment_method, 'Unknown'),
      'receipt_url', 'https://www.qrslice.com/receipt/' || coalesce(NEW.status_token::text, '')
    );

    -- 6. Queue into the async outbox (idempotent: one bill row per order).
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
      coalesce(wa_template, 'bill_receipt'),
      coalesce(wa_language, 'en'),
      template_vars,
      'pending'
    ) on conflict (order_id, message_type) do nothing
    returning id into message_id;

    -- 7. Audit event only when a row was actually inserted.
    if message_id is not null then
      insert into whatsapp_message_events (tenant_id, message_id, event_type, payload)
      values (NEW.restaurant_id, message_id, 'created', jsonb_build_object('trigger', 'payment_paid'));
    end if;
  exception when others then
    -- Failure isolation: never block the payment update.
    return NEW;
  end;

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