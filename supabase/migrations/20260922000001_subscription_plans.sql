// Copyright (c) 2026 QRslice. All rights reserved.
// Subscription Plans - Dynamic plans managed by Super Admin
// Replaces hardcoded Razorpay Plan IDs with flexible plan management

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

-- Super Admin full access
create policy "Super Admin full access subscription_plans"
  on public.subscription_plans
  for all
  using (auth.role() = 'service_role' or exists (
    select 1 from public.cafe_profiles cp
    where cp.id = auth.uid() and cp.role = 'super_admin' and cp.active = true
  ));

-- Owner/Staff read active plans (for billing page)
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

-- Grant permissions
grant select on public.subscription_plans to anon, authenticated;
grant all on public.subscription_plans to service_role;