-- ============================================================
-- QR Café — Migration 0002: receipt / GST fields
-- ============================================================

-- Restaurant legal + tax details (for GST receipts)
alter table restaurants
  add column if not exists address text,
  add column if not exists gstin text,
  add column if not exists phone text,
  add column if not exists tax_rate numeric not null default 5;

-- HSN code per menu item (GST receipt line)
alter table menu_items
  add column if not exists hsn text;

-- Persist HSN on each ordered line so historical receipts stay accurate
alter table order_items
  add column if not exists hsn text;

-- Store the discount applied at billing time
alter table orders
  add column if not exists discount_paise int not null default 0;
