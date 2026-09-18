-- Task 9: WhatsApp auto-bill trigger test (Task 1 schema is authoritative)
-- Run: psql -d qrslice_test -f test/migrations/trigger.test.sql
-- Requires: one restaurant row (seeded). Rolls back everything it does.
-- Keep test/migrations/whatsapp_tables.test.sql intact; this file only adds
-- trigger behaviour coverage (fire on paid, idempotent re-fire, settings gate,
-- missing-phone gate, created-event audit).

BEGIN;

-- Arrange: resolve a tenant from seed data
SELECT id AS tid FROM restaurants LIMIT 1 \gset

-- Arrange: auto-send ON for this tenant
INSERT INTO whatsapp_settings (tenant_id, enabled, auto_send_bill, default_template, default_language)
VALUES (:'tid', true, true, 'bill_receipt', 'en')
ON CONFLICT (tenant_id) DO UPDATE
  SET enabled = true, auto_send_bill = true, default_template = 'bill_receipt', default_language = 'en';

-- Arrange: unpaid order with a customer phone (uuid-safe columns)
INSERT INTO orders (id, restaurant_id, order_number, subtotal_paise, total_paise, payment_method, payment_status, status, customer_name, customer_phone, idempotency_key, table_label, status_token)
VALUES (gen_random_uuid(), :'tid', 'WAT-' || substr(gen_random_uuid()::text, 1, 8), 50000, 50000, 'counter', 'unpaid', 'confirmed', 'Trigger Test', '+919999999999', gen_random_uuid(), 'T1', gen_random_uuid())
RETURNING id AS oid \gset

-- Act: transition into paid
UPDATE orders SET payment_status = 'paid' WHERE id = :'oid';

-- Assert: exactly 1 pending bill_receipt row for the order
SELECT order_id, message_type, status, template_name, recipient_phone
FROM whatsapp_messages WHERE order_id = :'oid';
-- Expect: 1 row | bill_receipt | pending | bill_receipt | +919999999999

-- Assert: exactly 1 created audit event for the message
SELECT e.event_type
FROM whatsapp_message_events e
JOIN whatsapp_messages m ON m.id = e.message_id
WHERE m.order_id = :'oid';
-- Expect: 1 row | created

-- Idempotency: re-fire (paid -> paid) must NOT insert a duplicate
UPDATE orders SET payment_status = 'paid' WHERE id = :'oid';
SELECT count(*) AS msg_count_after_refire FROM whatsapp_messages WHERE order_id = :'oid';
-- Expect: 1

-- Gate: auto_send_bill = false must NOT queue a new order
UPDATE whatsapp_settings SET auto_send_bill = false WHERE tenant_id = :'tid';
INSERT INTO orders (id, restaurant_id, order_number, subtotal_paise, total_paise, payment_method, payment_status, status, customer_name, customer_phone, idempotency_key, table_label, status_token)
VALUES (gen_random_uuid(), :'tid', 'WAT-' || substr(gen_random_uuid()::text, 1, 8), 20000, 20000, 'counter', 'unpaid', 'confirmed', 'Gated Test', '+918888888888', gen_random_uuid(), 'T2', gen_random_uuid())
RETURNING id AS oid_gated \gset
UPDATE orders SET payment_status = 'paid' WHERE id = :'oid_gated';
SELECT count(*) AS gated_msg_count FROM whatsapp_messages WHERE order_id = :'oid_gated';
-- Expect: 0
UPDATE whatsapp_settings SET auto_send_bill = true WHERE tenant_id = :'tid';

-- Gate: missing phone must NOT queue (orders link customers by phone)
INSERT INTO orders (id, restaurant_id, order_number, subtotal_paise, total_paise, payment_method, payment_status, status, customer_name, customer_phone, idempotency_key, table_label, status_token)
VALUES (gen_random_uuid(), :'tid', 'WAT-' || substr(gen_random_uuid()::text, 1, 8), 20000, 20000, 'counter', 'unpaid', 'confirmed', 'No Phone', '', gen_random_uuid(), 'T3', gen_random_uuid())
RETURNING id AS oid_nophone \gset
UPDATE orders SET payment_status = 'paid' WHERE id = :'oid_nophone';
SELECT count(*) AS nophone_msg_count FROM whatsapp_messages WHERE order_id = :'oid_nophone';
-- Expect: 0

ROLLBACK;
