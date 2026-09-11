alter table restaurants
  add column if not exists trial_starts_at timestamptz;
