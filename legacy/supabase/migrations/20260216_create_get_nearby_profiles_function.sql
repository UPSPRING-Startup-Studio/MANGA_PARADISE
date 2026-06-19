-- Create function to get nearby profiles with filters
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_nearby_profiles TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_nearby_profiles IS 'Returns nearby profiles within a radius, filtered by otaku/cosplayer status';
