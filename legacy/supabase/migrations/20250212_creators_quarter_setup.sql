-- =====================================================
-- MIGRATION: SETUP COMPLET (FONDATIONS + EXPOSANTS)
-- =====================================================

-- 1. FONDATIONS : On s'assure que la table PROFILES existe
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT,
    avatar_url TEXT,
    role_function TEXT DEFAULT 'user', -- Important pour la suite
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FONDATIONS : On s'assure que la table EVENTS existe
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMPTZ,
    location TEXT,
    image_url TEXT,
    organizer_id UUID REFERENCES public.profiles(id),
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PARTIE 1: Création ou Mise à jour des rôles
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'moderator', 'creator', 'pro');
    ELSE
        ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'creator';
        ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pro';
    END IF;
END$$;

-- =====================================================
-- PARTIE 2: Création de la table event_exhibitors
-- =====================================================

CREATE TABLE IF NOT EXISTS public.event_exhibitors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    stand_name TEXT,
    stand_description TEXT,
    requirements TEXT, -- On l'ajoute direct ici
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN public.event_exhibitors.requirements 
IS 'Besoins techniques de l exposant (électricité, etc.)';

-- =====================================================
-- PARTIE 3: Row Level Security (RLS)
-- =====================================================

-- Activer RLS sur TOUTES les tables créées
ALTER TABLE public.event_exhibitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Nettoyage des anciennes politiques
DROP POLICY IF EXISTS "exhibitors_public_read_approved" ON public.event_exhibitors;
DROP POLICY IF EXISTS "exhibitors_user_insert_own" ON public.event_exhibitors;
DROP POLICY IF EXISTS "exhibitors_user_read_own" ON public.event_exhibitors;
DROP POLICY IF EXISTS "exhibitors_admin_all" ON public.event_exhibitors;
DROP POLICY IF EXISTS "exhibitors_moderator_read" ON public.event_exhibitors;
DROP POLICY IF EXISTS "exhibitors_moderator_update" ON public.event_exhibitors;

-- Politiques EXPOSANTS
CREATE POLICY "exhibitors_public_read_approved" ON public.event_exhibitors
FOR SELECT TO public USING (status = 'approved');

CREATE POLICY "exhibitors_user_insert_own" ON public.event_exhibitors
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "exhibitors_user_read_own" ON public.event_exhibitors
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "exhibitors_admin_all" ON public.event_exhibitors
FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_function = 'admin')
);

-- =====================================================
-- PARTIE 4: Index & Triggers
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_event_exhibitors_event_id ON public.event_exhibitors(event_id);
CREATE INDEX IF NOT EXISTS idx_event_exhibitors_user_id ON public.event_exhibitors(user_id);

-- Fonction update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_event_exhibitors_updated_at ON public.event_exhibitors;
CREATE TRIGGER update_event_exhibitors_updated_at
    BEFORE UPDATE ON public.event_exhibitors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PARTIE 5: Fonction Éligibilité
-- =====================================================

CREATE OR REPLACE FUNCTION is_exhibitor_eligible(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- On vérifie que la table profiles existe et a la colonne role_function
    SELECT role_function INTO user_role
    FROM public.profiles
    WHERE id = user_uuid;
    
    RETURN user_role IN ('creator', 'pro', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;