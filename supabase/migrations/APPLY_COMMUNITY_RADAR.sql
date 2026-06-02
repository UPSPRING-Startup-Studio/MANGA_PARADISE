-- =====================================================
-- COMMUNITY RADAR - MIGRATION CONSOLIDÉE
-- =====================================================
-- Cette migration active PostGIS et crée toutes les fonctionnalités
-- nécessaires pour la carte interactive de la communauté
-- =====================================================

-- 1. Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add location columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS location_geo geography(Point, 4326),
ADD COLUMN IF NOT EXISTS is_location_public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS location_city text,
ADD COLUMN IF NOT EXISTS location_country text,
ADD COLUMN IF NOT EXISTS is_cosplayer boolean GENERATED ALWAYS AS (
  cosplayer_name IS NOT NULL AND cosplayer_name != ''
) STORED;

-- 3. Create indexes for geographic queries
CREATE INDEX IF NOT EXISTS idx_profiles_location_geo 
ON profiles USING GIST (location_geo);

CREATE INDEX IF NOT EXISTS idx_profiles_location_public 
ON profiles (is_location_public) 
WHERE is_location_public = true;

CREATE INDEX IF NOT EXISTS idx_profiles_otaku_class 
ON profiles (otaku_class) 
WHERE otaku_class IS NOT NULL;

-- 4. Add comments for documentation
COMMENT ON COLUMN profiles.location_geo IS 'Geographic point (latitude, longitude) for user location with fuzzy offset for privacy';
COMMENT ON COLUMN profiles.is_location_public IS 'Whether the user wants their location to be visible on the community map';
COMMENT ON COLUMN profiles.is_cosplayer IS 'Computed field: true if user has filled cosplayer profile';

-- 5. Create function to update user location
-- Uses auth.uid() for security (no user_id parameter needed)
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

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION update_user_location TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION update_user_location IS 'Updates user location with geographic point and city/country information';

-- 6. Create function to get nearby profiles with filters
CREATE OR REPLACE FUNCTION get_nearby_profiles(
  lat double precision,
  long double precision,
  radius_meters integer DEFAULT 50000, -- Default 50km
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
    p.is_cosplayer,
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
      (filter_cosplayer = true AND p.is_cosplayer = true)
    )
  ORDER BY distance_meters ASC
  LIMIT 500; -- Safety limit
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION get_nearby_profiles TO authenticated, anon;

-- Add comment for documentation
COMMENT ON FUNCTION get_nearby_profiles IS 'Returns nearby profiles within a radius, filtered by otaku/cosplayer status';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
