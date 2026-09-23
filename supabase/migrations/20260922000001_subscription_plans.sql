-- Copyright (c) 2026 QRslice. All rights reserved.
-- Subscription Plans - Dynamic plans managed by Super Admin
-- Replaces hardcoded Razorpay Plan IDs with flexible plan management.
--
-- After applying, run in the Supabase dashboard SQL editor:
--   NOTIFY pgrst, 'reload schema';
--
-- Depends on: update_updated_at_column() from 20260918000001_whatsapp_cloud_api.sql
-- and qrcafe_auth_role() RLS helper (must exist in the target database).

-- Subscription Plans table
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  price_paise integer not null check (price_paise >= 100),
  billing_cycle text not null check (billing_cycle in ('monthly', 'yearly')),
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  sort_order integer not null default 0,
  razorpay_plan_id text, -- Optional: for Razorpay Subscriptions API (not used in Standard Checkout)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_subscription_plans_active on public.subscription_plans(active);
create index if not exists idx_subscription_plans_billing_cycle on public.subscription_plans(billing_cycle);

-- RLS
alter table public.subscription_plans enable row level security;

-- Super Admin full access (uses mandated RLS helper per AGENTS.md)
drop policy if exists "Super Admin full access subscription_plans" on public.subscription_plans;
create policy "Super Admin full access subscription_plans"
  on public.subscription_plans
  for all
  using (auth.role() = 'service_role' or qrcafe_auth_role() = 'super_admin')
  with check (auth.role() = 'service_role' or qrcafe_auth_role() = 'super_admin');

-- Owner/Staff read active plans (for billing page)
drop policy if exists "Authenticated read active subscription_plans" on public.subscription_plans;
create policy "Authenticated read active subscription_plans"
  on public.subscription_plans
  for select
  using (active = true and (auth.role() = 'service_role' or exists (
    select 1 from public.cafe_profiles cp
    where cp.id = auth.uid() and cp.active = true
  )));

-- Trigger for updated_at
create trigger update_subscription_plans_updated_at
  before update on public.subscription_plans
  for each row
  execute function public.update_updated_at_column();

-- Seed initial plans (Monthly ₹999, Yearly ₹9999)
insert into public.subscription_plans (name, slug, price_paise, billing_cycle, features, active, sort_order)
values
  ('QRslice Complete Monthly', 'complete_monthly', 99900, 'monthly',
   '["QR Digital Menu & Table Ordering", "Multi-Station KDS & Prep Workflow", "POS Register & Bluetooth Thermal Printing", "Live Order Dashboard with Sound Chimes", "GST Invoicing & Financial Analytics", "Unlimited Tables, Dishes & Staff Seats"]'::jsonb,
   true, 1),
  ('QRslice Complete Yearly', 'complete_yearly', 999900, 'yearly',
   '["QR Digital Menu & Table Ordering", "Multi-Station KDS & Prep Workflow", "POS Register & Bluetooth Thermal Printing", "Live Order Dashboard with Sound Chimes", "GST Invoicing & Financial Analytics", "Unlimited Tables, Dishes & Staff Seats", "Saves ₹1,989/year (~2 months free)"]'::jsonb,
   true, 2)
on conflict (slug) do nothing;

-- Grant permissions (authenticated users read via RLS; anon gets nothing)
grant select on public.subscription_plans to authenticated;
grant all on public.subscription_plans to service_role;

-- Plan linkage on restaurants: used by super-admin plan delete guard
alter table public.restaurants
  add column if not exists subscription_plan_id uuid
  references public.subscription_plans(id) on delete set null;

-- Billing events: provider webhook feed for the Super Admin dashboard.
-- The webhook writes here as best-effort; audit_events remains the durable record.
create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete set null,
  provider text not null default 'razorpay',
  event_type text not null,
  status text not null default 'processed',
  amount_paise integer,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_billing_events_created_at on public.billing_events(created_at desc);
create index if not exists idx_billing_events_restaurant_id on public.billing_events(restaurant_id);
create index if not exists idx_billing_events_status on public.billing_events(status);

alter table public.billing_events enable row level security;

drop policy if exists "Super Admin read billing_events" on public.billing_events;
create policy "Super Admin read billing_events"
  on public.billing_events
  for select
  using (auth.role() = 'service_role' or qrcafe_auth_role() = 'super_admin');

drop policy if exists "Service role full access billing_events" on public.billing_events;
create policy "Service role full access billing_events"
  on public.billing_events
  for all
  using (auth.role() = 'service_role');

grant select on public.billing_events to authenticated;
grant all on public.billing_events to service_role;
