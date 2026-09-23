-- POS hardening Phase 4/9:
-- A7: unique order_number per restaurant (+ retry in app on 23505)
-- A14: orders.priority (KDS rush flag)
-- A15: orders.customer_gstin (B2B buyer GSTIN on bill)

-- No live duplicates (verified pre-index); fail loudly if any appear later.
CREATE UNIQUE INDEX IF NOT EXISTS orders_restaurant_order_number_uniq
  ON public.orders (restaurant_id, order_number);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS priority boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_gstin text;

-- Optional: restrict format at DB level when value is present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_customer_gstin_format'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_customer_gstin_format
      CHECK (
        customer_gstin IS NULL
        OR customer_gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
      );
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
