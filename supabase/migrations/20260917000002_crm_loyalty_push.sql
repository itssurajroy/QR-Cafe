-- QRslice — CRM, Loyalty & Push Notification Campaigns
-- Migration: 20260917000002_crm_loyalty_push.sql
-- Idempotent: safe to re-run.

-- 1. Loyalty Transactions Ledger
create table if not exists loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  customer_id uuid not null references restaurant_customers(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  points integer not null,
  balance_after integer not null default 0,
  type text not null default 'order_earned', -- 'order_earned', 'signup_bonus', 'birthday_bonus', 'reward_redeemed', 'manual_adjustment', 'order_refunded'
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_loyalty_tx_customer
  on loyalty_transactions(customer_id, created_at desc);
create index if not exists idx_loyalty_tx_restaurant
  on loyalty_transactions(restaurant_id, created_at desc);

alter table loyalty_transactions enable row level security;

drop policy if exists "owner_staff_read_loyalty_tx" on loyalty_transactions;
create policy "owner_staff_read_loyalty_tx" on loyalty_transactions
  for select using (
    restaurant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

drop policy if exists "owner_staff_manage_loyalty_tx" on loyalty_transactions;
create policy "owner_staff_manage_loyalty_tx" on loyalty_transactions
  for all using (
    restaurant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

-- 2. Loyalty Rewards Catalog
create table if not exists loyalty_rewards (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  reward_type text not null default 'fixed_discount', -- 'fixed_discount', 'percent_discount', 'free_item', 'free_addon', 'custom'
  value_paise bigint not null default 0,
  points_required integer not null,
  min_order_paise bigint not null default 0,
  validity_days integer not null default 30,
  usage_limit integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_loyalty_rewards_restaurant
  on loyalty_rewards(restaurant_id);

alter table loyalty_rewards enable row level security;

drop policy if exists "owner_staff_manage_loyalty_rewards" on loyalty_rewards;
create policy "owner_staff_manage_loyalty_rewards" on loyalty_rewards
  for all using (
    restaurant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

-- 3. Push Notification Campaigns
create table if not exists notification_campaigns (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  campaign_type text not null default 'promotion', -- 'promotion', 'new_item', 'discount', 'loyalty', 'birthday', 'win_back', 'announcement'
  title text not null,
  message text not null,
  image_url text,
  cta_button text not null default 'Order Now',
  deep_link text not null default '/menu',
  audience_segment text not null default 'all', -- 'all', 'new', 'returning', 'vip', 'inactive', 'active', 'high_spenders', 'loyalty_members'
  status text not null default 'draft', -- 'draft', 'scheduled', 'sent', 'archived'
  scheduled_at timestamptz,
  sent_at timestamptz,
  sent_count integer not null default 0,
  delivered_count integer not null default 0,
  opened_count integer not null default 0,
  clicked_count integer not null default 0,
  orders_count integer not null default 0,
  revenue_paise bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_notification_campaigns_restaurant
  on notification_campaigns(restaurant_id, created_at desc);

alter table notification_campaigns enable row level security;

drop policy if exists "owner_staff_manage_notification_campaigns" on notification_campaigns;
create policy "owner_staff_manage_notification_campaigns" on notification_campaigns
  for all using (
    restaurant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

-- 4. CRM Automations
create table if not exists crm_automations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  trigger_type text not null, -- 'inactive_30d', 'first_order', 'birthday', 'reward_available', 'vip_tier'
  action_type text not null default 'push_notification',
  template_title text not null,
  template_message text not null,
  coupon_code text,
  bonus_points integer not null default 0,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_crm_automations_restaurant
  on crm_automations(restaurant_id);

alter table crm_automations enable row level security;

drop policy if exists "owner_staff_manage_crm_automations" on crm_automations;
create policy "owner_staff_manage_crm_automations" on crm_automations
  for all using (
    restaurant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );

-- 5. CRM Customer Notes
create table if not exists crm_customer_notes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  customer_id uuid not null references restaurant_customers(id) on delete cascade,
  author_name text,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_crm_customer_notes_customer
  on crm_customer_notes(customer_id, created_at desc);

alter table crm_customer_notes enable row level security;

drop policy if exists "owner_staff_manage_crm_notes" on crm_customer_notes;
create policy "owner_staff_manage_crm_notes" on crm_customer_notes
  for all using (
    restaurant_id = qrcafe_auth_restaurant_id()
    or qrcafe_auth_role() = 'super_admin'
  );
