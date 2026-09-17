-- QRslice — WhatsApp Cloud API Credentials & Integration
-- Migration: 20260918000001_whatsapp_cloud_api.sql
--
-- Adds WhatsApp Cloud API credentials to restaurant_whatsapp_settings
-- and creates outbound message log table for tracking sent messages.

-- 1. Add WhatsApp Cloud API credentials columns to existing settings table
alter table if exists restaurant_whatsapp_settings
  add column if not exists phone_number_id text,
  add column if not exists access_token text,
  add column if not exists business_account_id text,
  add column if not exists verify_token text,
  add column if not exists webhook_url text,
  add column if not exists webhook_secret text;

-- 2. Outbound WhatsApp Message Log
create table if not exists whatsapp_outbound_messages (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  phone text not null,
  template_name text,
  template_language text default 'en',
  template_variables jsonb default '{}'::jsonb,
  message_text text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'delivered', 'read', 'failed', 'bounced')),
  meta_message_id text,
  error_message text,
  meta_response jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz
);

create index if not exists idx_wa_outbound_restaurant_created 
  on whatsapp_outbound_messages(restaurant_id, created_at desc);

create index if not exists idx_wa_outbound_order 
  on whatsapp_outbound_messages(order_id);

create index if not exists idx_wa_outbound_status 
  on whatsapp_outbound_messages(status);

create index if not exists idx_wa_outbound_meta_message_id 
  on whatsapp_outbound_messages(meta_message_id);

-- 3. Row Level Security for outbound messages
alter table whatsapp_outbound_messages enable row level security;

drop policy if exists "wa_outbound_read" on whatsapp_outbound_messages;
create policy "wa_outbound_read" on whatsapp_outbound_messages
  for select using (
    restaurant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

drop policy if exists "wa_outbound_insert" on whatsapp_outbound_messages;
create policy "wa_outbound_insert" on whatsapp_outbound_messages
  for insert with check (
    restaurant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

drop policy if exists "wa_outbound_update" on whatsapp_outbound_messages;
create policy "wa_outbound_update" on whatsapp_outbound_messages
  for update using (
    restaurant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

-- 3. Update existing restaurants with webhook URL defaults
update restaurant_whatsapp_settings
set 
  verify_token = 'qr_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
  webhook_url = 'https://www.qrslice.com/api/whatsapp/webhook',
  webhook_secret = 'whsec_' || substr(md5(random()::text || clock_timestamp()::text), 1, 24)
where verify_token is null;

-- 4. Create a database function to trigger WhatsApp bill send on order payment
-- This function will be called from the order update trigger
create or replace function trigger_whatsapp_bill_send()
returns trigger language plpgsql as $$
declare
  wa_settings record;
  customer_phone text;
  order_record record;
  message_text text;
  message_id uuid;
  rendered_message text;
  vars jsonb;
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
  from restaurant_whatsapp_settings
  where restaurant_id = NEW.restaurant_id;

  -- Check if WhatsApp is enabled and configured
  if not wa_settings.enabled then
    return NEW;
  end if;

  if wa_settings.phone_number_id is null or wa_settings.access_token is null then
    return NEW;
  end if;

  -- Get order details for rendering
  select * into order_record
  from orders
  where id = NEW.id;

  -- Get customer phone from order or customer table
  customer_phone := NEW.customer_phone;
  if customer_phone is null then
    select phone into customer_phone from customers where id = NEW.customer_id;
  end if;

  if customer_phone is null then
    return NEW;
  end if;

  -- Render the message template
  -- Note: We'll use a simplified approach here, the actual sending happens via API
  -- We just log the outbound message attempt
  insert into whatsapp_outbound_messages (
    restaurant_id,
    order_id,
    phone,
    template_name,
    template_language,
    template_variables,
    message_text,
    status
  ) values (
    NEW.restaurant_id,
    NEW.id,
    customer_phone,
    'bill_receipt',
    'en',
    jsonb_build_object(
      'restaurant_name', (select name from restaurants where id = NEW.restaurant_id),
      'order_number', NEW.order_number,
      'table_number', NEW.table_label,
      'total', to_char(NEW.total_paise / 100.0, 'FM999999990.00'),
      'payment_mode', COALESCE(NEW.payment_method, 'Unknown'),
      'receipt_url', 'https://www.qrslice.com/receipt/' || NEW.status_token
    ),
    'pending'
  ) returning id into message_id;

  return NEW;
end;
$$;

-- Create trigger on orders table
drop trigger if exists trigger_whatsapp_bill_send on orders;
create trigger trigger_whatsapp_bill_send
  after update of payment_status on orders
  for each row execute function trigger_whatsapp_bill_send();