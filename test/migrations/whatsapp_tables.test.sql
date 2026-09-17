-- Test WhatsApp tables migration
-- This test verifies all WhatsApp tables exist with correct columns and constraints

BEGIN;

-- Test whatsapp_accounts table exists with correct columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'whatsapp_accounts'
ORDER BY ordinal_position;
-- Expect: id, tenant_id, phone_number_id, access_token, business_account_id, verify_token, webhook_url, webhook_secret, status, connected_at, last_seen_at, created_at, updated_at

-- Test whatsapp_sessions table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'whatsapp_sessions'
ORDER BY ordinal_position;
-- Expect: id, tenant_id, session_data, encryption_key_id, created_at, updated_at

-- Test whatsapp_messages table exists with unique constraint
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'whatsapp_messages'
ORDER BY ordinal_position;

SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'whatsapp_messages' AND constraint_type = 'UNIQUE';
-- Expect: unique constraint on (order_id, message_type)

-- Test whatsapp_message_events table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'whatsapp_message_events'
ORDER BY ordinal_position;

-- Test whatsapp_templates table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'whatsapp_templates'
ORDER BY ordinal_position;

-- Test whatsapp_settings table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'whatsapp_settings'
ORDER BY ordinal_position;

-- Test whatsapp_opt_ins table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'whatsapp_opt_ins'
ORDER BY ordinal_position;

-- Test trigger function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'trigger_whatsapp_bill_send';

-- Test trigger on orders table
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_whatsapp_bill_send';

ROLLBACK;