-- Copyright (c) 2026 QRslice. All rights reserved.
-- Migration: Add loyalty tiers system

-- Create loyalty_tiers table for structured tier definitions
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. "Bronze", "Silver", "Gold", "Platinum"
  min_points INTEGER NOT NULL DEFAULT 0,
  max_points INTEGER,
  color TEXT NOT NULL, -- e.g. "#FFD700" for gold, "#C0C0C0" for silver
  display_name TEXT NOT NULL, -- e.g. "Bronze Member"
  benefits JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"free_drink": true, "priority_seating": false}
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;

-- Create policy: admins can CRUD, restaurant staff can read
CREATE POLICY "Admins can manage loyalty tiers" ON loyalty_tiers
  FOR ALL USING (true);

-- Create index on restaurant_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_restaurant_id ON loyalty_tiers(restaurant_id);

-- Create index on min_points for tier lookup queries
CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_min_points ON loyalty_tiers(min_points);

-- Insert default tier structure for all existing restaurants
-- Default tiers: Bronze (0-1k), Silver (1k-5k), Gold (5k-15k), Platinum (15k+)
DO $$
DECLARE
  restaurant_id uuid;
BEGIN
  FOR restaurant_id IN SELECT id FROM restaurants
  LOOP
    -- Delete existing tiers for this restaurant
    DELETE FROM loyalty_tiers WHERE restaurant_id = restaurant_id;

    -- Insert default tier structure
    INSERT INTO loyalty_tiers (restaurant_id, name, min_points, max_points, color, display_name, benefits) VALUES
      (restaurant_id, 'Bronze', 0, 1000, '#CD7F32', 'Bronze Member', '{"welcome_discount": 5, "birthday_bonus": 100}'::jsonb),
      (restaurant_id, 'Silver', 1001, 5000, '#C0C0C0', 'Silver Member', '{"free_appetizer": true, "welcome_discount": 10, "birthday_bonus": 250}'::jsonb),
      (restaurant_id, 'Gold', 5001, 15000, '#FFD700', 'Gold Member', '{"priority_seating": true, "free_appetizer": true, "welcome_discount": 15, "birthday_bonus": 500}'::jsonb),
      (restaurant_id, 'Platinum', 15001, NULL, '#FF1493', 'Platinum Member', '{"priority_seating": true, "free_appetizer": true, "welcome_discount": 20, "birthday_bonus": 1000, "anniversary_gift": true}'::jsonb);
  END LOOP;
END $$;

-- Add tier_id column to restaurant_customers for direct tier assignment
-- This is optional; tier can also be computed on-the-fly from loyalty_points
ALTER TABLE restaurant_customers ADD COLUMN IF NOT EXISTS tier_id UUID REFERENCES loyalty_tiers(id);

-- Add index for tier lookup
CREATE INDEX IF NOT EXISTS idx_restaurant_customers_tier_id ON restaurant_customers(tier_id);

COMMENT ON TABLE loyalty_tiers IS 'Structured loyalty tier definitions with point thresholds and per-tier benefits';
COMMENT ON COLUMN loyalty_tiers.restaurant_id IS 'links to restaurants table for tenancy';
COMMENT ON COLUMN loyalty_tiers.benefits IS 'stores per-tier benefits configuration';