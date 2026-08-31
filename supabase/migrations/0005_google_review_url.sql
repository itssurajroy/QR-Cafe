-- ============================================================
-- QR Café — Migration 0005: Google Review URL support
-- ============================================================

-- Add google_review_url column to restaurants table
alter table restaurants
  add column if not exists google_review_url text;
