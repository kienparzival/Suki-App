-- Update events_explore RPC function to support multi-category filtering
-- This allows filtering by both the legacy category field and the new categories array

CREATE OR REPLACE FUNCTION public.events_explore(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION DEFAULT 50,
  p_start_from TIMESTAMPTZ DEFAULT NOW(),
  p_q TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_price_min INTEGER DEFAULT NULL,
  p_price_max INTEGER DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  categories TEXT[],
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  cover_url TEXT,
  status TEXT,
  creator_id UUID,
  venue_id UUID,
  venue_name TEXT,
  venue_address TEXT,
  venue_latitude DOUBLE PRECISION,
  venue_longitude DOUBLE PRECISION,
  distance_m DOUBLE PRECISION,
  min_price INTEGER,
  max_price INTEGER,
  capacity INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      e.*,
      v.name AS venue_name,
      v.address AS venue_address,
      CASE WHEN v.location IS NOT NULL THEN ST_Y(v.location::geometry) END AS venue_latitude,
      CASE WHEN v.location IS NOT NULL THEN ST_X(v.location::geometry) END AS venue_longitude,
      CASE WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL AND v.location IS NOT NULL
           THEN ST_Distance(v.location, ST_MakePoint(p_lng, p_lat)::geography)
           ELSE NULL::DOUBLE PRECISION END AS distance_m
    FROM public.events e
    LEFT JOIN public.venues v ON v.id = e.venue_id
    WHERE e.status = 'published'
      AND e.start_at >= p_start_from
      AND (
        p_category IS NULL OR 
        e.category = p_category OR 
        e.categories && ARRAY[p_category]
      )
      AND (p_price_min IS NULL OR e.max_price >= p_price_min)
      AND (p_price_max IS NULL OR e.min_price <= p_price_max)
      AND (
        p_q IS NULL OR
        to_tsvector('simple', COALESCE(e.title,'')||' '||COALESCE(e.description,'')||' '||COALESCE(v.name,''))
          @@ plainto_tsquery('simple', p_q)
      )
  )
  SELECT * FROM base
  WHERE (p_lat IS NULL OR p_lng IS NULL OR distance_m <= p_radius_km * 1000)
  ORDER BY start_at ASC, distance_m NULLS LAST
  LIMIT 100;
$$;

GRANT EXECUTE ON FUNCTION public.events_explore(
  DOUBLE PRECISION,DOUBLE PRECISION,DOUBLE PRECISION,TIMESTAMPTZ,TEXT,TEXT,INTEGER,INTEGER
) TO anon, authenticated;

-- Backfill existing events to populate categories array from category field
-- This ensures all existing events have their categories array populated
UPDATE public.events 
SET categories = ARRAY[category] 
WHERE category IS NOT NULL 
  AND (categories = '{}'::text[] OR categories IS NULL);
