-- Add upi_qr_url to restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS upi_qr_url text;

-- Add payment_method to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text;
