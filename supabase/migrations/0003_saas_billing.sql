-- Migration: 0003_saas_billing.sql
-- Description: Add SaaS multi-tenant subscription columns, tier enforcement, and Razorpay billing fields

alter table restaurants
  add column if not exists plan text not null default 'trial'
        check (plan in ('trial','active','suspended','cancelled')),
  add column if not exists tier text not null default 'pro'
        check (tier in ('basic','pro')),
  add column if not exists trial_ends_at timestamptz default (now() + interval '30 days'),
  add column if not exists subscription_ends_at timestamptz,
  add column if not exists razorpay_customer_id text,
  add column if not exists razorpay_subscription_id text,
  add column if not exists billing_status text default 'trial',
  add column if not exists accent_color text default '#f59e0b',
  add column if not exists tagline text;

create index if not exists restaurants_slug_plan_idx on restaurants(slug, plan);

-- Grandfather existing demo cafés as active/pro
update restaurants
   set plan = 'active',
       tier = 'pro',
       subscription_ends_at = now() + interval '10 years',
       billing_status = 'active'
 where slug in ('curry-leaf','brews-bytes');
