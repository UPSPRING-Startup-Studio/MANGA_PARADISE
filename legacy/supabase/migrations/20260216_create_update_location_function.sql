-- Create function to update user location
CREATE OR REPLACE FUNCTION update_user_location(
  user_id uuid,
  longitude double precision,
  latitude double precision,
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
    location_geo = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
    location_city = city,
    location_country = country,
    is_location_public = true
  WHERE id = user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_location TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION update_user_location IS 'Updates user location with geographic point and city/country information';
