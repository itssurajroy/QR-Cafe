-- QRslice — WhatsApp Bill Telemetry & Settings
-- Migration: 20260916000002_whatsapp_bills.sql
--
-- RLS Security & Trust Model:
--   - restaurant_whatsapp_settings:
--       SELECT: restaurant staff, owners, and super_admins.
--       UPDATE/INSERT: restaurant owner and super_admins only.
--   - whatsapp_bill_events:
--       SELECT: restaurant staff, owners, and super_admins.
--       INSERT: public (receipt page views & review telemetry) and staff (POS send events).

-- 1. Per-Restaurant WhatsApp Settings
create table if not exists restaurant_whatsapp_settings (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid unique references restaurants(id) on delete cascade not null,
  enabled boolean not null default true,
  message_template text not null,
  include_review_cta boolean not null default true,
  include_gstin_line boolean not null default true,
  thank_you_line text default 'Thank you for dining with us!',
  updated_at timestamptz not null default now()
);

create index if not exists idx_restaurant_wa_settings_restaurant on restaurant_whatsapp_settings(restaurant_id);

-- 2. WhatsApp Bill Events Telemetry
create table if not exists whatsapp_bill_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  tenant_id uuid references restaurants(id) on delete cascade,
  event_type text not null check (event_type in ('sent', 'receipt_viewed', 'review_clicked', 'feedback_submitted')),
  phone text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Optimized compound indexes for fast analytics queries
create index if not exists idx_wa_events_restaurant_event_created 
  on whatsapp_bill_events(restaurant_id, event_type, created_at desc);

create index if not exists idx_wa_events_tenant_event_created 
  on whatsapp_bill_events(tenant_id, event_type, created_at desc);

create index if not exists idx_wa_events_order 
  on whatsapp_bill_events(order_id);

-- 3. Row Level Security
alter table restaurant_whatsapp_settings enable row level security;
alter table whatsapp_bill_events enable row level security;

-- Settings RLS
drop policy if exists "wa_settings_read" on restaurant_whatsapp_settings;
create policy "wa_settings_read" on restaurant_whatsapp_settings
  for select using (
    restaurant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() in ('owner', 'manager', 'staff', 'super_admin')
  );

drop policy if exists "wa_settings_write" on restaurant_whatsapp_settings;
create policy "wa_settings_write" on restaurant_whatsapp_settings
  for all using (
    restaurant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'super_admin')
  );

-- Events RLS
drop policy if exists "wa_events_read" on whatsapp_bill_events;
create policy "wa_events_read" on whatsapp_bill_events
  for select using (
    restaurant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

drop policy if exists "wa_events_insert" on whatsapp_bill_events;
create policy "wa_events_insert" on whatsapp_bill_events
  for insert with check (true);

-- 4. Seed Default WhatsApp Template for Existing Restaurants
insert into restaurant_whatsapp_settings (
  restaurant_id,
  enabled,
  message_template,
  include_review_cta,
  include_gstin_line,
  thank_you_line
)
select
  id as restaurant_id,
  true as enabled,
  'Thanks for visiting {restaurant.name} 🧾' || E'\n\n' ||
  'Order #{orderNumber} • Table {tableNumber}' || E'\n' ||
  'Total: ₹{total} {paymentModeLine}' || E'\n\n' ||
  'View your receipt & leave a review:' || E'\n' ||
  '{receiptUrl}' as message_template,
  true as include_review_cta,
  true as include_gstin_line,
  'Thank you for dining with us!' as thank_you_line
from restaurants
where id not in (select restaurant_id from restaurant_whatsapp_settings)
on conflict (restaurant_id) do nothing;
