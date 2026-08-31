-- ============================================================
-- QR Café — Migration 0004: super-admin platform + SaaS controls
-- ============================================================

-- Global platform configuration (key/value), editable from the super panel.
create table if not exists platform_config (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null
);

-- Support/refund notes attached to a tenant by super admin.
alter table restaurants
  add column if not exists admin_notes text;

-- Seed sensible defaults (idempotent).
insert into platform_config (key, value) values
  ('signups_open',     '{"enabled": true}'::jsonb),
  ('maintenance_mode', '{"enabled": false, "message": "Scheduled maintenance. Back shortly."}'::jsonb),
  ('trial_days',       '{"days": 30}'::jsonb),
  ('prices',           '{"basic": 399, "pro": 799}'::jsonb),
  ('default_tax_rate', '{"rate": 5}'::jsonb)
on conflict (key) do nothing;

-- Reload PostgREST schema cache after DDL:
-- notify pgrst, 'reload schema';
