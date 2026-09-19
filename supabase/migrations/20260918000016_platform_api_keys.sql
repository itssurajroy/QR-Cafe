-- Copyright (c) 2026 QRslice. All rights reserved.
-- Migration: Create platform_api_keys table and customers alias view

CREATE TABLE IF NOT EXISTS platform_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  created_by UUID,
  revoked_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE platform_api_keys ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'platform_api_keys' AND policyname = 'Admins can manage platform api keys'
  ) THEN
    CREATE POLICY "Admins can manage platform api keys" ON platform_api_keys FOR ALL USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_platform_api_keys_restaurant_id ON platform_api_keys(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_platform_api_keys_key_prefix ON platform_api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_platform_api_keys_revoked_at ON platform_api_keys(revoked_at);

-- Add email column to restaurant_customers
ALTER TABLE restaurant_customers ADD COLUMN IF NOT EXISTS email TEXT;

-- Create customers view for compatibility
CREATE OR REPLACE VIEW customers WITH (security_invoker = true) AS 
  SELECT id, restaurant_id, phone, name, email, loyalty_points, total_spent_paise, visit_count, created_at, last_visit_at, tier_id 
  FROM restaurant_customers;
