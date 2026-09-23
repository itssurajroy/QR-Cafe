-- Copyright (c) 2026 QRslice. All rights reserved.
-- Migration: 20260920000001_pricing_snapshot.sql
-- Add immutable pricing snapshot to orders table

ALTER TABLE orders ADD COLUMN IF NOT EXISTS pricing_snapshot JSONB DEFAULT NULL;
COMMENT ON COLUMN orders.pricing_snapshot IS 'Authoritative immutable pricing snapshot capturing base, portion, modifiers, quantities, discounts, tax, and rounding';

NOTIFY pgrst, 'reload schema';
