-- QRslice Platform Control Center foundation
-- Idempotent: safe to re-run. Never renames existing helpers/tables.

-- 1. audit_events (create only if missing; existing installs already have it)
create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_id uuid,
  restaurant_id uuid references restaurants(id) on delete set null,
  entity text not null,
  entity_id text not null default '',
  action text not null,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists idx_audit_events_created on audit_events(created_at desc);
create index if not exists idx_audit_events_action on audit_events(action);
create index if not exists idx_audit_events_restaurant on audit_events(restaurant_id);

alter table audit_events enable row level security;
drop policy if exists "sa_audit" on audit_events;
create policy "sa_audit" on audit_events
  for all using (qrcafe_auth_role() = 'super_admin')
  with check (qrcafe_auth_role() = 'super_admin');

-- 2. platform_users (super_admin + support roles)
create table if not exists platform_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role text not null default 'support' check (role in ('super_admin','support')),
  is_active boolean not null default true,
  permissions jsonb not null default '{}'::jsonb,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);
alter table platform_users enable row level security;
drop policy if exists "sa_platform_users" on platform_users;
create policy "sa_platform_users" on platform_users
  for all using (qrcafe_auth_role() = 'super_admin')
  with check (qrcafe_auth_role() = 'super_admin');

-- 3. platform_settings (single-row-per-key store)
create table if not exists platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table platform_settings enable row level security;
drop policy if exists "sa_settings" on platform_settings;
create policy "sa_settings" on platform_settings
  for all using (qrcafe_auth_role() = 'super_admin')
  with check (qrcafe_auth_role() = 'super_admin');

insert into platform_settings (key, value) values
  ('trial_days', '{"days": 14}'),
  ('pricing', '{"monthly_inr": 999, "annual_inr": 9999}'),
  ('signups_open', '{"enabled": true}'),
  ('maintenance', '{"enabled": false, "message": ""}')
on conflict (key) do nothing;

-- 4. platform_announcements
create table if not exists platform_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  target_plan text not null default 'all' check (target_plan in ('all','trial','active','suspended')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);
alter table platform_announcements enable row level security;
drop policy if exists "sa_announcements" on platform_announcements;
create policy "sa_announcements" on platform_announcements
  for all using (qrcafe_auth_role() = 'super_admin')
  with check (qrcafe_auth_role() = 'super_admin');
drop policy if exists "auth_read_announcements" on platform_announcements;
create policy "auth_read_announcements" on platform_announcements
  for select using (auth.uid() is not null);

-- 5. billing_events (webhook mirror)
create table if not exists billing_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  restaurant_id uuid references restaurants(id) on delete set null,
  provider text not null default 'razorpay',
  event_type text not null,
  status text not null default 'received',
  amount_paise integer,
  payload jsonb not null default '{}'::jsonb
);
create index if not exists idx_billing_events_restaurant on billing_events(restaurant_id);
create index if not exists idx_billing_events_created on billing_events(created_at desc);
alter table billing_events enable row level security;
drop policy if exists "sa_billing_events" on billing_events;
create policy "sa_billing_events" on billing_events
  for all using (qrcafe_auth_role() = 'super_admin')
  with check (qrcafe_auth_role() = 'super_admin');

-- 6. Restaurant billing columns
alter table restaurants
  add column if not exists trial_starts_at timestamptz,
  add column if not exists mrr_cents integer not null default 0,
  add column if not exists provider_customer_id text,
  add column if not exists provider_subscription_id text,
  add column if not exists onboarded_at timestamptz,
  add column if not exists last_active_at timestamptz,
  add column if not exists internal_notes text not null default '';

-- Backfill trial_starts_at: 14 days before trial_ends_at where present
update restaurants set trial_starts_at = trial_ends_at - interval '14 days'
  where trial_starts_at is null and trial_ends_at is not null;
update restaurants set onboarded_at = created_at
  where onboarded_at is null;
update restaurants set mrr_cents = 99900
  where plan = 'active' and mrr_cents = 0;
