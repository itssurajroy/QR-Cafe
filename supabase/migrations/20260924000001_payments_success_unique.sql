-- POS hardening: payments tender idempotency (B1 / A2)
--
-- Data repair: live DB had 3 dup groups / 6 extra success rows from double-settle
-- clicks (active-orders PATCH inserted a payment row on every settle).
-- Keep the earliest success row per (order_id, provider); supersede the rest.
-- c58617ee had both rows at 29000 vs order total 49600 — correct survivor to
-- order total so Z-report (tender truth) matches the order.
-- Then enforce one success payment per (order, tender).
-- Refunds/voids must change status away from 'success' so a re-settle can record.

WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY order_id, provider
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM public.payments
  WHERE status = 'success'
)
UPDATE public.payments p
SET status = 'superseded'
FROM ranked r
WHERE p.id = r.id
  AND r.rn > 1
  AND p.status = 'success';

UPDATE public.payments p
SET amount_paise = o.total_paise
FROM public.orders o
WHERE p.order_id = o.id
  AND p.order_id = 'c58617ee-cc6d-4a95-8d61-42a45d3b8ce5'
  AND p.status = 'success'
  AND p.provider = 'cash'
  AND p.amount_paise IS DISTINCT FROM o.total_paise;

CREATE UNIQUE INDEX IF NOT EXISTS payments_success_order_provider_uniq
  ON public.payments (order_id, provider)
  WHERE status = 'success';

NOTIFY pgrst, 'reload schema';
