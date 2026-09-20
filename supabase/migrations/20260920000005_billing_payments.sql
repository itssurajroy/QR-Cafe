// Copyright (c) 2026 QRslice. All rights reserved.
-- Billing payments table for subscription payment tracking
-- Separates SaaS subscription payments from restaurant order payments

create table if not exists public.billing_payments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  amount_paise integer not null,
  currency text not null default 'INR',
  billing_cycle text not null check (billing_cycle in ('monthly', 'yearly')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  metadata jsonb,
  created_at timestamptz not null default now(),
  verified_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Index for fast lookups by restaurant and order
create index if not exists idx_billing_payments_restaurant_id on public.billing_payments(restaurant_id);
create index if not exists idx_billing_payments_razorpay_order_id on public.billing_payments(razorpay_order_id);
create index if not exists idx_billing_payments_status on public.billing_payments(status);

-- RLS policies
alter table public.billing_payments enable row level security;

-- Owners can view their restaurant's billing payments
create policy "Owners can view own billing payments"
  on public.billing_payments
  for select
  using (
    exists (
      select 1 from public.cafe_profiles
      where id = auth.uid()
      and restaurant_id = billing_payments.restaurant_id
      and role = 'owner'
      and active = true
    )
  );

-- Service role can manage all (for webhooks and server-side operations)
create policy "Service role full access"
  on public.billing_payments
  for all
  using (auth.role() = 'service_role');

-- Trigger for updated_at
create trigger update_billing_payments_updated_at
  before update on public.billing_payments
  for each row
  execute function public.update_updated_at_column();