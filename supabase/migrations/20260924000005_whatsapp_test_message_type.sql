-- QRslice — allow connection-test rows in whatsapp_messages
-- Live check (read from pg_constraint before writing) allows:
--   bill_receipt, order_confirmation, order_accepted, preparing, ready,
--   served, payment_received, refund_processed, review_request, marketing
-- Add 'test' only; preserve every live type as-is.
-- Idempotent: safe to re-run.

alter table if exists whatsapp_messages
  drop constraint if exists whatsapp_messages_message_type_check;

alter table if exists whatsapp_messages
  add constraint whatsapp_messages_message_type_check
  check (message_type in (
    'bill_receipt',
    'order_confirmation',
    'order_accepted',
    'preparing',
    'ready',
    'served',
    'payment_received',
    'refund_processed',
    'review_request',
    'marketing',
    'test'
  ));

notify pgrst, 'reload schema';
