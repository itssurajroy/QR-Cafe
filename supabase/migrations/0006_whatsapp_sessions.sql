-- supabase/migrations/0006_whatsapp_sessions.sql

-- Track per-café WhatsApp connections
CREATE TABLE whatsapp_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE UNIQUE,
  phone_number text,
  connected boolean DEFAULT false,
  last_connected_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable WhatsApp feature flag per café
ALTER TABLE restaurants ADD COLUMN whatsapp_enabled boolean DEFAULT false;

-- RLS: same pattern as other tables (super-admin bypass)
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sa_whatsapp_sessions_all ON whatsapp_sessions
  FOR ALL
  USING (qrcafe_auth_role() = 'super_admin');

CREATE POLICY owner_whatsapp_sessions_read ON whatsapp_sessions
  FOR SELECT
  USING (qrcafe_auth_restaurant_id() = restaurant_id);

-- Index for lookup by restaurant
CREATE INDEX idx_whatsapp_sessions_restaurant ON whatsapp_sessions (restaurant_id);
