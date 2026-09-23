-- Migration for DPDP Act Compliance Tables

-- 1. dpdp_consent_logs
CREATE TABLE IF NOT EXISTS public.dpdp_consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_version TEXT NOT NULL,
    consent_given BOOLEAN NOT NULL DEFAULT false,
    channels_authorized TEXT[] DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dpdp_consent_logs_user_id ON public.dpdp_consent_logs(user_id);

-- 2. dpdp_nominees
CREATE TABLE IF NOT EXISTS public.dpdp_nominees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nominee_name TEXT NOT NULL,
    nominee_contact TEXT NOT NULL,
    nominee_relationship TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, nominee_contact)
);

CREATE INDEX IF NOT EXISTS idx_dpdp_nominees_user_id ON public.dpdp_nominees(user_id);

-- 3. dpdp_privacy_profiles
CREATE TABLE IF NOT EXISTS public.dpdp_privacy_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_minor BOOLEAN NOT NULL DEFAULT false,
    parent_consent_verified BOOLEAN NOT NULL DEFAULT false,
    parent_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    data_erasure_requested_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_dpdp_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_dpdp_nominees_updated_at
BEFORE UPDATE ON public.dpdp_nominees
FOR EACH ROW
EXECUTE FUNCTION public.update_dpdp_timestamp();

CREATE TRIGGER tr_dpdp_privacy_profiles_updated_at
BEFORE UPDATE ON public.dpdp_privacy_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_dpdp_timestamp();

-- Enable Row Level Security (RLS)
ALTER TABLE public.dpdp_consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dpdp_nominees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dpdp_privacy_profiles ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policies
CREATE POLICY "Users can view their own consent logs"
    ON public.dpdp_consent_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consent logs"
    ON public.dpdp_consent_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own nominees"
    ON public.dpdp_nominees FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own nominees"
    ON public.dpdp_nominees FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nominees"
    ON public.dpdp_nominees FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nominees"
    ON public.dpdp_nominees FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own privacy profile"
    ON public.dpdp_privacy_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own privacy profile"
    ON public.dpdp_privacy_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own privacy profile"
    ON public.dpdp_privacy_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);
