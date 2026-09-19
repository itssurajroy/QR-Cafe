-- Copyright (c) 2026 QRslice. All rights reserved.
-- Migration: Create notification_campaigns and crm_automations tables

-- Note: These tables may already exist in the live database (seeded by the respective routes).
-- The migration is written with IF NOT EXISTS for idempotency across deployments.

-- Create crm_automations table (if not already created by migration 15)
CREATE TABLE IF NOT EXISTS crm_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL, -- e.g. 'win_back_30d', 'first_order', 'birthday', 'reward_available', 'vip_threshold'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  coupon_code TEXT,
  bonus_points INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  run_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE crm_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage crm automations" ON crm_automations FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_crm_automations_restaurant_id ON crm_automations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_crm_automations_trigger_active ON crm_automations(trigger_type, is_active);
CREATE INDEX IF NOT EXISTS idx_crm_automations_is_active ON crm_automations(is_active);

-- Create notification_campaigns table
CREATE TABLE IF NOT EXISTS notification_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  campaign_type TEXT NOT NULL, -- e.g. 'promotion', 'new_menu', 'discount', 'loyalty', 'win_back', 'announcement'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  cta_button TEXT,
  deep_link TEXT,
  audience_segment TEXT NOT NULL DEFAULT 'all',
  sent_count INTEGER NOT NULL DEFAULT 0,
  opened_count INTEGER NOT NULL DEFAULT 0,
  clicked_count INTEGER NOT NULL DEFAULT 0,
  orders_count INTEGER NOT NULL DEFAULT 0,
  revenue_paise NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, completed
  subscriber_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE notification_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notification campaigns" ON notification_campaigns FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_notification_campaigns_restaurant_id ON notification_campaigns(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_notification_campaigns_status ON notification_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_notification_campaigns_segment ON notification_campaigns(audience_segment);

COMMENT ON TABLE notification_campaigns IS 'Push/WhatsApp campaign records with audience tracking';
COMMENT ON COLUMN notification_campaigns.campaign_type type of campaign;
COMMENT ON COLUMN notification_campaigns.status current status of the campaign;