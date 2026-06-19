-- ============================================================
-- PROFILES COMPATIBILITY LAYER
--
-- Les migrations association/bénévolat utilisent les colonnes
-- username, display_name, city sur profiles.
-- La table existante utilise pseudo, prenom/nom, ville.
--
-- Cette migration ajoute les colonnes alias et les synchronise.
-- ============================================================

-- ── Ajouter les colonnes alias ──
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN username text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN display_name text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN city text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN phone text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN first_name text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN last_name text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN bio text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ── Backfill depuis les colonnes existantes ──
UPDATE public.profiles
SET
  username     = COALESCE(username, pseudo),
  display_name = COALESCE(display_name, NULLIF(TRIM(COALESCE(prenom, '') || ' ' || COALESCE(nom, '')), ''), pseudo),
  city         = COALESCE(city, ville),
  phone        = COALESCE(phone, telephone),
  first_name   = COALESCE(first_name, prenom),
  last_name    = COALESCE(last_name, nom)
WHERE username IS NULL
   OR display_name IS NULL
   OR city IS NULL;

-- ── Trigger de synchronisation bidirectionnelle ──
CREATE OR REPLACE FUNCTION public.sync_profile_aliases()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- pseudo → username
  IF NEW.pseudo IS DISTINCT FROM OLD.pseudo THEN
    NEW.username = NEW.pseudo;
  ELSIF NEW.username IS DISTINCT FROM OLD.username THEN
    NEW.pseudo = NEW.username;
  END IF;

  -- prenom/nom → display_name
  IF NEW.prenom IS DISTINCT FROM OLD.prenom OR NEW.nom IS DISTINCT FROM OLD.nom THEN
    NEW.display_name = NULLIF(TRIM(COALESCE(NEW.prenom, '') || ' ' || COALESCE(NEW.nom, '')), '');
    NEW.first_name = NEW.prenom;
    NEW.last_name = NEW.nom;
  END IF;

  -- ville → city
  IF NEW.ville IS DISTINCT FROM OLD.ville THEN
    NEW.city = NEW.ville;
  ELSIF NEW.city IS DISTINCT FROM OLD.city THEN
    NEW.ville = NEW.city;
  END IF;

  -- telephone → phone
  IF NEW.telephone IS DISTINCT FROM OLD.telephone THEN
    NEW.phone = NEW.telephone;
  ELSIF NEW.phone IS DISTINCT FROM OLD.phone THEN
    NEW.telephone = NEW.phone;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_aliases ON public.profiles;
CREATE TRIGGER trg_sync_profile_aliases
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_aliases();

-- ── Trigger pour les INSERT aussi ──
CREATE OR REPLACE FUNCTION public.sync_profile_aliases_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.username     = COALESCE(NEW.username, NEW.pseudo);
  NEW.display_name = COALESCE(NEW.display_name, NULLIF(TRIM(COALESCE(NEW.prenom, '') || ' ' || COALESCE(NEW.nom, '')), ''), NEW.pseudo);
  NEW.city         = COALESCE(NEW.city, NEW.ville);
  NEW.phone        = COALESCE(NEW.phone, NEW.telephone);
  NEW.first_name   = COALESCE(NEW.first_name, NEW.prenom);
  NEW.last_name    = COALESCE(NEW.last_name, NEW.nom);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_aliases_insert ON public.profiles;
CREATE TRIGGER trg_sync_profile_aliases_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_aliases_insert();

-- Index sur les nouvelles colonnes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
