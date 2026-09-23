-- Copyright (c) 2026 QRslice. All rights reserved.
-- Migration: Restrict anon policies on orders table for tenancy security

-- Fix anon_select_orders: restrict to restaurant owner/staff only
DROP POLICY IF EXISTS anon_select_orders ON orders;
CREATE POLICY "anon_select_orders_scoped" ON orders
  FOR SELECT USING (restaurant_id = qrcafe_auth_restaurant_id());

-- Fix anon_insert_orders: require restaurant_id matching the authenticated user's restaurant
DROP POLICY IF EXISTS anon_insert_orders ON orders;
CREATE POLICY "anon_insert_orders_scoped" ON orders
  FOR INSERT WITH CHECK (restaurant_id = qrcafe_auth_restaurant_id());

-- Fix anon_update_orders: restrict to owner/staff only (remove broad anon update)
DROP POLICY IF EXISTS anon_update_orders ON orders;
-- Note: Updates should go through authenticated APIs only.
-- If anon update is needed for specific cases, uncomment and adjust below:
-- CREATE POLICY "anon_update_orders_scoped" ON orders
--   FOR UPDATE USING (restaurant_id = qrcafe_auth_restaurant_id());

-- Add comment documenting the security change
COMMENT ON TABLE orders IS 'Orders table with tenancy-scoped RLS. Anon access restricted to restaurant-owned records via qrcafe_auth_restaurant_id().';