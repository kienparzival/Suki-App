-- Step 4: Ensure we save coordinates correctly
-- Create the upsert_custom_venue RPC function

DROP POLICY IF EXISTS "venues auth insert" ON public.venues;
CREATE POLICY "venues auth insert" ON public.venues
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

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

-- Step 5: Fix the 404 by creating events_explore RPC function

CREATE OR REPLACE FUNCTION public.events_explore(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 50,
  category_filter TEXT DEFAULT NULL,
  keyword_filter TEXT DEFAULT NULL,
  min_price_filter INTEGER DEFAULT NULL,
  max_price_filter INTEGER DEFAULT NULL
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
      CASE WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL AND v.location IS NOT NULL
           THEN ST_Distance(v.location, ST_MakePoint(user_lng, user_lat)::geography)
           ELSE NULL::DOUBLE PRECISION END AS distance_m
    FROM public.events e
    LEFT JOIN public.venues v ON v.id = e.venue_id
    WHERE e.status = 'published'
      AND e.end_at >= NOW()
      AND (category_filter IS NULL OR e.category = category_filter)
      AND (min_price_filter IS NULL OR e.max_price >= min_price_filter)
      AND (max_price_filter IS NULL OR e.min_price <= max_price_filter)
      AND (
        keyword_filter IS NULL OR
        to_tsvector('simple', COALESCE(e.title,'')||' '||COALESCE(e.description,'')||' '||COALESCE(v.name,''))
          @@ plainto_tsquery('simple', keyword_filter)
      )
  )
  SELECT * FROM base
  WHERE (user_lat IS NULL OR user_lng IS NULL OR distance_m <= radius_km * 1000)
  ORDER BY start_at ASC, distance_m NULLS LAST
  LIMIT 100;
$$;

GRANT EXECUTE ON FUNCTION public.events_explore(
  DOUBLE PRECISION,DOUBLE PRECISION,DOUBLE PRECISION,TEXT,TEXT,INTEGER,INTEGER
) TO anon, authenticated;

-- Step 6: Create RPC function to extract coordinates from venue PostGIS location

CREATE OR REPLACE FUNCTION public.get_venue_coordinates(
  venue_id UUID
) RETURNS TABLE (
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ST_Y(v.location::geometry) AS latitude,
    ST_X(v.location::geometry) AS longitude
  FROM public.venues v
  WHERE v.id = venue_id
    AND v.location IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_venue_coordinates(UUID)
TO anon, authenticated;

-- Step 7: Create RPC function to get ticket tier inventory with sold counts

CREATE OR REPLACE FUNCTION public.tier_inventory(
  p_event UUID
) RETURNS TABLE (
  id UUID,
  name TEXT,
  price INTEGER,
  quota INTEGER,
  sold BIGINT,
  remaining BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH event_info AS (
    SELECT capacity FROM public.events WHERE id = p_event
  ),
  tier_data AS (
    SELECT 
      tt.id,
      tt.name,
      tt.price,
      tt.quota,
      COALESCE(ticket_counts.sold, 0) AS sold,
      GREATEST(tt.quota - COALESCE(ticket_counts.sold, 0), 0) AS remaining
    FROM public.ticket_tiers tt
    LEFT JOIN (
      SELECT 
        tier_id,
        COUNT(*) AS sold
      FROM public.tickets t
      WHERE t.event_id = p_event
      GROUP BY tier_id
    ) ticket_counts ON tt.id = ticket_counts.tier_id
    WHERE tt.event_id = p_event
  ),
  free_ticket_data AS (
    SELECT 
      p_event::UUID as id,
      'Free Tickets'::TEXT as name,
      0::INTEGER as price,
      COALESCE(ei.capacity, 0)::INTEGER as quota,
      COUNT(t.id)::BIGINT as sold,
      GREATEST(COALESCE(ei.capacity, 0) - COUNT(t.id), 0)::BIGINT as remaining
    FROM event_info ei
    LEFT JOIN public.tickets t ON t.event_id = p_event AND t.tier_id IS NULL
    WHERE NOT EXISTS (SELECT 1 FROM public.ticket_tiers WHERE event_id = p_event)
    GROUP BY ei.capacity
  )
  SELECT * FROM tier_data
  UNION ALL
  SELECT * FROM free_ticket_data
  ORDER BY price ASC;
$$;

GRANT EXECUTE ON FUNCTION public.tier_inventory(UUID)
TO anon, authenticated;
