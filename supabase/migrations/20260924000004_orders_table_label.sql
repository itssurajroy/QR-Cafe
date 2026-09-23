-- QRslice — restore denormalized orders.table_label
-- Code + WhatsApp bill trigger expect this column; live schema only has table_id.
-- Idempotent: safe to re-run.

alter table public.orders
  add column if not exists table_label text;

-- Backfill from current table labels (historical rows keep NULL if table deleted)
update public.orders o
  set table_label = rt.label
  from public.restaurant_tables rt
  where o.table_id = rt.id
    and o.table_label is null;

notify pgrst, 'reload schema';
