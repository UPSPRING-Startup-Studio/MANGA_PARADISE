-- =====================================================
-- EXÉCUTER CE SQL DANS L'ÉDITEUR SQL DE SUPABASE
-- Dashboard > SQL Editor > New Query > Coller > Run
-- =====================================================

-- 1. Activer PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Ajouter les colonnes de localisation à profiles
-- (Ignorer les erreurs si les colonnes existent déjà)
DO $$
BEGIN
  BEGIN
    ALTER TABLE profiles ADD COLUMN location_geo geography(Point, 4326);
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE profiles ADD COLUMN is_location_public boolean DEFAULT false;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE profiles ADD COLUMN location_city text;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE profiles ADD COLUMN location_country text;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
END $$;

-- 3. Créer les index
CREATE INDEX IF NOT EXISTS idx_profiles_location_geo 
ON profiles USING GIST (location_geo);

CREATE INDEX IF NOT EXISTS idx_profiles_location_public 
ON profiles (is_location_public) 
WHERE is_location_public = true;

-- 4. Fonction pour mettre à jour la localisation d'un utilisateur
-- Utilise auth.uid() pour identifier l'utilisateur (plus sécurisé)
CREATE OR REPLACE FUNCTION update_user_location(
  lat double precision,
  long double precision,
  city text,
  country text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET
    location_geo = ST_SetSRID(ST_MakePoint(long, lat), 4326)::geography,
    location_city = city,
    location_country = country,
    is_location_public = true
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION update_user_location TO authenticated;

-- 5. Fonction pour récupérer les profils à proximité
CREATE OR REPLACE FUNCTION get_nearby_profiles(
  lat double precision,
  long double precision,
  radius_meters integer DEFAULT 50000,
  filter_otaku boolean DEFAULT true,
  filter_cosplayer boolean DEFAULT true
)
RETURNS TABLE (
  id uuid,
  username text,
  avatar_url text,
  otaku_class text,
  is_cosplayer boolean,
  cosplayer_name text,
  title text,
  badges jsonb,
  distance_meters double precision,
  latitude double precision,
  longitude double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.otaku_class,
    -- Calculer is_cosplayer dynamiquement
    (p.cosplayer_name IS NOT NULL AND p.cosplayer_name != '') as is_cosplayer,
    p.cosplayer_name,
    p.title,
    p.badges,
    ST_Distance(
      p.location_geo::geography,
      ST_SetSRID(ST_MakePoint(long, lat), 4326)::geography
    ) as distance_meters,
    ST_Y(p.location_geo::geometry) as latitude,
    ST_X(p.location_geo::geometry) as longitude
  FROM profiles p
  WHERE 
    p.is_location_public = true
    AND p.location_geo IS NOT NULL
    AND ST_DWithin(
      p.location_geo::geography,
      ST_SetSRID(ST_MakePoint(long, lat), 4326)::geography,
      radius_meters
    )
    AND (
      (filter_otaku = true AND p.otaku_class IS NOT NULL)
      OR
      (filter_cosplayer = true AND p.cosplayer_name IS NOT NULL AND p.cosplayer_name != '')
    )
  ORDER BY distance_meters ASC
  LIMIT 500;
END;
$$;

GRANT EXECUTE ON FUNCTION get_nearby_profiles TO authenticated, anon;

-- =====================================================
-- VÉRIFICATION : Exécuter cette requête pour tester
-- =====================================================
-- SELECT * FROM get_nearby_profiles(48.8566, 2.3522, 100000, true, true);
-- Devrait retourner un résultat vide (pas d'erreur)
