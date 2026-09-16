-- QRslice — Staff PIN quick sign-in + kitchen/waiter roles
-- Migration: 20260916000003_staff_pin_roles.sql
-- Idempotent: safe to re-run. Uses ADD COLUMN IF NOT EXISTS.
--
-- PINs are 4-digit quick sign-in codes for shared terminals (kitchen, waiter).
-- Only the PIN *hash* is stored (HMAC-SHA256, peppered with APP_CRYPTO_SECRET,
-- bound to restaurant + profile). Never store or log raw PINs.
-- Auth helpers qrcafe_auth_role() / qrcafe_auth_restaurant_id() unchanged.

alter table cafe_profiles
  add column if not exists pin_hash text,
  add column if not exists pin_updated_at timestamptz,
  add column if not exists pin_failed_attempts integer not null default 0,
  add column if not exists pin_locked_until timestamptz;

-- Fast lookup of PIN-enabled staff per restaurant (PIN verification itself
-- is done server-side by comparing hashes; this index speeds the candidate scan).
create index if not exists idx_cafe_profiles_pin_lookup
  on cafe_profiles(restaurant_id, active)
  where pin_hash is not null;
