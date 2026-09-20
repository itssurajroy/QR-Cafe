// Copyright (c) 2026 QRslice. All rights reserved.
// Add exclusion constraint to prevent double-booking of tables
// Blocks overlapping time ranges for the same table when status is confirmed/pending

-- Enable btree_gist extension for tsrange support
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add exclusion constraint on table_reservations
-- Uses gist index with:
--   restaurant_id WITH =  (same restaurant)
--   table_ids WITH &&     (overlapping table IDs array)
--   tsrange(starts_at, ends_at) WITH &&  (overlapping time ranges)
-- WHERE clause restricts to active booking statuses
ALTER TABLE public.table_reservations
ADD CONSTRAINT no_overlapping_bookings
EXCLUDE USING gist (
  restaurant_id WITH =,
  table_ids WITH &&,
  tsrange(starts_at, ends_at) WITH &&
) WHERE (status IN ('confirmed', 'pending'));

-- Add comment for documentation
COMMENT ON CONSTRAINT no_overlapping_bookings ON public.table_reservations
IS 'Prevents double-booking: same restaurant + overlapping table_ids + overlapping time range for confirmed/pending reservations';