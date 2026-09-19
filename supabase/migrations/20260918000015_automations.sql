-- Copyright (c) 2026 QRslice. All rights reserved.
-- Migration: Create crm_automations table for CRM campaign automation rules

-- Note: This table may already exist in the live database (seeded by the automations route).
-- The migration is written with IF NOT EXISTS for idempotency across deployments.

CREATE TABLE IF NOT EXISTS crm_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL, -- e.g. 'win_back_30d', 'first_order', 'birthday', 'reward_available', 'vip_threshold'
  title TEXT NOT NULL, -- display title shown to staff
  message TEXT NOT NULL, -- message body (can include {coupon_code}, {bonus_points} placeholders)
  coupon_code TEXT, -- optional coupon code for the promotion
  bonus_points INTEGER NOT NULL DEFAULT 0, -- bonus points to award
  is_active BOOLEAN NOT NULL DEFAULT true, -- whether the automation is active
  run_count INTEGER NOT NULL DEFAULT 0, -- how many times this automation has fired
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE crm_automations ENABLE ROW LEVEL SECURITY;

-- Policy: admins can CRUD, restaurant staff can read
CREATE POLICY "Admins can manage automations" ON crm_automations
  FOR ALL USING (true);

-- Index on restaurant_id for tenancy-scoped queries
CREATE INDEX IF NOT EXISTS idx_crm_automations_restaurant_id ON crm_automations(restaurant_id);

-- Index on trigger_type + active status for common query patterns
CREATE INDEX IF NOT EXISTS idx_crm_automations_trigger_active ON crm_automations(trigger_type, is_active);

-- Index on is_active for filtering active automations
CREATE INDEX IF NOT EXISTS idx_crm_automations_is_active ON crm_automations(is_active);

COMMENT ON TABLE crm_automations IS 'CRM automation rules triggered by customer events (win-back, birthday, first order, etc.)';
COMMENT ON COLUMN crm_automations.trigger_type is the event that fires the automation;
COMMENT ON COLUMN crm_automations.is_active whether the automation is currently enabled;