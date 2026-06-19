-- Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add location columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS location_geo geography(Point, 4326),
ADD COLUMN IF NOT EXISTS is_location_public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS location_city text,
ADD COLUMN IF NOT EXISTS location_country text,
ADD COLUMN IF NOT EXISTS is_cosplayer boolean GENERATED ALWAYS AS (
  cosplayer_name IS NOT NULL AND cosplayer_name != ''
) STORED;

-- Create index for geographic queries
CREATE INDEX IF NOT EXISTS idx_profiles_location_geo 
ON profiles USING GIST (location_geo);

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_location_public 
ON profiles (is_location_public) 
WHERE is_location_public = true;

-- Create index for otaku class filtering
CREATE INDEX IF NOT EXISTS idx_profiles_otaku_class 
ON profiles (otaku_class) 
WHERE otaku_class IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.location_geo IS 'Geographic point (latitude, longitude) for user location with fuzzy offset for privacy';
COMMENT ON COLUMN profiles.is_location_public IS 'Whether the user wants their location to be visible on the community map';
COMMENT ON COLUMN profiles.is_cosplayer IS 'Computed field: true if user has filled cosplayer profile';
