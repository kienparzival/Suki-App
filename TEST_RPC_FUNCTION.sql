-- Test script to check if events_explore RPC function exists and works
-- Run this in Supabase SQL Editor

-- First, check if the function exists
SELECT 
    routine_name, 
    routine_type, 
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'events_explore' 
AND routine_schema = 'public';

-- Test the function with Hanoi coordinates (21.0285, 105.8542)
SELECT * FROM public.events_explore(
    21.0285,  -- user_lat (Hanoi)
    105.8542, -- user_lng (Hanoi)
    50,       -- radius_km
    NULL,     -- category_filter
    NULL,     -- keyword_filter
    NULL,     -- min_price_filter
    NULL      -- max_price_filter
);

-- Check if venues have coordinates
SELECT 
    v.id,
    v.name,
    v.latitude,
    v.longitude,
    v.address,
    v.location
FROM public.venues v
WHERE v.latitude IS NOT NULL 
AND v.longitude IS NOT NULL
LIMIT 10;

-- Check events with venues
SELECT 
    e.id,
    e.title,
    e.status,
    v.name as venue_name,
    v.latitude,
    v.longitude,
    v.address
FROM public.events e
LEFT JOIN public.venues v ON e.venue_id = v.id
WHERE e.status = 'published'
LIMIT 10;
