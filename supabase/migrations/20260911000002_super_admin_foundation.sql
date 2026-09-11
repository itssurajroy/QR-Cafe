alter table restaurants
  add column if not exists subscription_status text not null default 'trial'
    check (subscription_status in ('trial','active','expired','cancelled','suspended')),
  add column if not exists is_suspended boolean not null default false,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_reason text,
  add column if not exists created_by uuid;

update restaurants set subscription_status = plan
  where plan in ('trial','active','expired','cancelled','suspended');
update restaurants set is_suspended = true, suspended_at = now()
  where plan = 'suspended' and suspended_at is null;

create table if not exists feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text not null default '',
  updated_at timestamptz not null default now()
);

alter table feature_flags enable row level security;

drop policy if exists "sa_flags" on feature_flags;
create policy "sa_flags" on feature_flags
  for all using (qrcafe_auth_role() = 'super_admin')
  with check (qrcafe_auth_role() = 'super_admin');

drop policy if exists "auth_read_flags" on feature_flags;
create policy "auth_read_flags" on feature_flags
  for select using (auth.uid() is not null);
