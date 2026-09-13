-- QRslice flag rollout columns (idempotent)
alter table feature_flags
  add column if not exists rollout_pct integer not null default 100,
  add column if not exists allow_list text[] not null default '{}';
