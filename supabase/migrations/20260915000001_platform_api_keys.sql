-- QRslice platform API keys (idempotent; apply via dashboard SQL editor, then NOTIFY pgrst, 'reload schema';)
create table if not exists platform_api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  restaurant_id uuid references restaurants(id) on delete set null,
  created_by uuid,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_platform_api_keys_hash on platform_api_keys(key_hash);
create index if not exists idx_platform_api_keys_restaurant on platform_api_keys(restaurant_id);

alter table platform_api_keys enable row level security;
drop policy if exists "sa_api_keys" on platform_api_keys;
create policy "sa_api_keys" on platform_api_keys
  for all using (qrcafe_auth_role() = 'super_admin')
  with check (qrcafe_auth_role() = 'super_admin');
