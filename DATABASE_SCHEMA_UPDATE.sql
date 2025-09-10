-- Database Schema Update for Location-Based Event Filtering
-- Run this in your Supabase SQL Editor

-- Add coordinate columns to venues table
ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add indexes for better performance on location queries
CREATE INDEX IF NOT EXISTS idx_venues_coordinates ON venues(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_venues_latitude ON venues(latitude);
CREATE INDEX IF NOT EXISTS idx_venues_longitude ON venues(longitude);

-- Create a function to calculate distance between two points (in kilometers)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL(10, 8),
    lon1 DECIMAL(11, 8),
    lat2 DECIMAL(10, 8),
    lon2 DECIMAL(11, 8)
) RETURNS DECIMAL AS $$
BEGIN
    RETURN 6371 * acos(
        cos(radians(lat1)) * cos(radians(lat2)) * 
        cos(radians(lon2) - radians(lon1)) + 
        sin(radians(lat1)) * sin(radians(lat2))
    );
END;
$$ LANGUAGE plpgsql;

-- Update the events_explore function to use coordinates for location filtering
CREATE OR REPLACE FUNCTION events_explore(
    user_lat DECIMAL(10, 8) DEFAULT NULL,
    user_lng DECIMAL(11, 8) DEFAULT NULL,
    radius_km INTEGER DEFAULT 50,
    category_filter TEXT DEFAULT NULL,
    keyword_filter TEXT DEFAULT NULL,
    min_price_filter DECIMAL DEFAULT NULL,
    max_price_filter DECIMAL DEFAULT NULL
) RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    category TEXT,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    cover_url TEXT,
    status TEXT,
    creator_id UUID,
    venue_id UUID,
    venue_name TEXT,
    venue_latitude DECIMAL(10, 8),
    venue_longitude DECIMAL(11, 8),
    venue_address TEXT,
    min_price DECIMAL,
    max_price DECIMAL,
    capacity INTEGER,
    distance_m DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
        e.category,
        e.start_at,
        e.end_at,
        e.cover_url,
        e.status,
        e.creator_id,
        e.venue_id,
        v.name as venue_name,
        v.latitude as venue_latitude,
        v.longitude as venue_longitude,
        v.address as venue_address,
        e.min_price,
        e.max_price,
        e.capacity,
        CASE 
            WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL AND v.latitude IS NOT NULL AND v.longitude IS NOT NULL THEN
                calculate_distance(user_lat, user_lng, v.latitude, v.longitude) * 1000
            ELSE NULL
        END as distance_m
    FROM events e
    LEFT JOIN venues v ON e.venue_id = v.id
    WHERE e.status = 'published'
        AND (category_filter IS NULL OR e.category = category_filter)
        AND (keyword_filter IS NULL OR 
             e.title ILIKE '%' || keyword_filter || '%' OR 
             e.description ILIKE '%' || keyword_filter || '%')
        AND (min_price_filter IS NULL OR e.min_price >= min_price_filter)
        AND (max_price_filter IS NULL OR e.max_price <= max_price_filter)
        AND (
            -- If no location filter, show all events
            (user_lat IS NULL OR user_lng IS NULL) OR
            -- If venue has coordinates, check distance
            (v.latitude IS NOT NULL AND v.longitude IS NOT NULL AND 
             calculate_distance(user_lat, user_lng, v.latitude, v.longitude) <= radius_km) OR
            -- If venue is online or TBA, always include
            (v.name = 'Online' OR v.name = 'To be announced')
        )
    ORDER BY 
        CASE 
            WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL AND v.latitude IS NOT NULL AND v.longitude IS NOT NULL THEN
                calculate_distance(user_lat, user_lng, v.latitude, v.longitude)
            ELSE 999999
        END,
        e.start_at;
END;
$$ LANGUAGE plpgsql;

-- Add some sample venues with coordinates for testing
INSERT INTO venues (name, latitude, longitude, address) VALUES
('Hanoi Opera House', 21.0285, 105.8542, '1 Trang Tien, Hoan Kiem, Hanoi, Vietnam'),
('Ho Chi Minh City Opera House', 10.7769, 106.7009, '7 Lam Son Square, District 1, Ho Chi Minh City, Vietnam'),
('Da Nang International Airport', 16.0439, 108.1994, 'Da Nang International Airport, Da Nang, Vietnam'),
('Hue Imperial City', 16.4637, 107.5909, 'Hue Imperial City, Thua Thien Hue, Vietnam')
ON CONFLICT (name) DO NOTHING;

-- Update existing venues that might have coordinates
UPDATE venues SET 
    latitude = 21.0285, 
    longitude = 105.8542, 
    address = '1 Trang Tien, Hoan Kiem, Hanoi, Vietnam'
WHERE name ILIKE '%hanoi%' AND latitude IS NULL;

UPDATE venues SET 
    latitude = 10.7769, 
    longitude = 106.7009, 
    address = '7 Lam Son Square, District 1, Ho Chi Minh City, Vietnam'
WHERE name ILIKE '%ho chi minh%' OR name ILIKE '%hcmc%' AND latitude IS NULL;

-- Add PostGIS location column for better geographic queries
ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);

-- Create index for geographic queries
CREATE INDEX IF NOT EXISTS idx_venues_location ON venues USING GIST (location);

-- Anyone signed-in can create a venue row
DROP POLICY IF EXISTS "venues auth insert" ON public.venues;
CREATE POLICY "venues auth insert" ON public.venues
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Insert a venue with coordinates and return the new id
CREATE OR REPLACE FUNCTION public.upsert_custom_venue(
  p_name TEXT,
  p_address TEXT,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION
) RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.venues (name, address, location)
  VALUES (p_name, p_address, ST_MakePoint(p_lng, p_lat)::geography)
  RETURNING id;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_custom_venue(TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION)
TO authenticated;
