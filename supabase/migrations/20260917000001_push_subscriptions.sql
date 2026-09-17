-- QRslice — Web Push subscriptions (PWA push notifications)
-- Migration: 20260917000001_push_subscriptions.sql
-- Idempotent: safe to re-run. Uses CREATE TABLE IF NOT EXISTS and
-- DROP POLICY IF EXISTS before each CREATE.
--
-- Trust model:
--   Writes go through the service-role client from /api/push/subscribe
--   (session-gated via getSessionUser, scoped to the caller's restaurant).
--   RLS policies are restrictive: owner/staff read + manage only their own
--   restaurant's rows; anon has no access.
-- Never log subscription endpoints or keys — they are bearer-capable secrets.

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null,
  endpoint text unique not null,
  keys jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_restaurant
  on push_subscriptions(restaurant_id);

alter table push_subscriptions enable row level security;

drop policy if exists "owner_staff_read_push_subscriptions" on push_subscriptions;
create policy "owner_staff_read_push_subscriptions" on push_subscriptions
  for select using (
    restaurant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'staff')
  );

drop policy if exists "owner_staff_manage_push_subscriptions" on push_subscriptions;
create policy "owner_staff_manage_push_subscriptions" on push_subscriptions
  for all using (
    restaurant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'staff')
  )
  with check (
    restaurant_id = qrcafe_auth_restaurant_id()
    and qrcafe_auth_role() in ('owner', 'staff')
  );
