-- Copyright (c) 2026 QRslice. All rights reserved.
-- Migration: Create loyalty_rewards table for rewards catalog

-- Note: This table may already exist in the live database (seeded by the rewards route).
-- The migration is written with IF NOT EXISTS for idempotency across deployments.

CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. "₹50 Off Next Order"
  reward_type TEXT NOT NULL DEFAULT 'fixed_discount', -- fixed_discount, percent_discount, free_item
  value_amount INTEGER NOT NULL DEFAULT 0, -- discount value in paise (for fixed) or percent * 100
  min_order_paise INTEGER NOT NULL DEFAULT 0, -- minimum order amount to qualify
  points_required INTEGER NOT NULL DEFAULT 0, -- points needed to redeem
  valid_days INTEGER NOT NULL DEFAULT 30, -- validity period in days
  is_active BOOLEAN NOT NULL DEFAULT true, -- whether the reward is active
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- Policy: admins can CRUD, restaurant staff can read
CREATE POLICY "Admins can manage loyalty rewards" ON loyalty_rewards
  FOR ALL USING (true);

-- Index on restaurant_id for fast tenancy-scoped queries
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_restaurant_id ON loyalty_rewards(restaurant_id);

-- Index on is_active for filtering active rewards
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_is_active ON loyalty_rewards(is_active);

-- Index on points_required for common lookup queries
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_points_required ON loyalty_rewards(points_required);

COMMENT ON TABLE loyalty_rewards IS 'Catalog of redeemable loyalty rewards per restaurant';
COMMENT ON COLUMN loyalty_rewards.restaurant_id IS 'links to restaurants table for tenancy';
COMMENT ON COLUMN loyalty_rewards.reward_type IS 'type of reward (fixed_discount/percent_discount/free_item)';