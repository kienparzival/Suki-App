-- Fix tickets table constraint to allow NULL tier_id for free events
-- Run this in your Supabase SQL Editor

-- First, let's check the current constraint
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.is_deferrable,
    tc.initially_deferred
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='tickets'
  AND kcu.column_name='tier_id';

-- Check if tier_id column allows NULL
SELECT 
    column_name, 
    is_nullable, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
  AND column_name = 'tier_id';

-- If tier_id is NOT NULL, we need to make it nullable
-- This will allow free events to have NULL tier_id
ALTER TABLE tickets 
ALTER COLUMN tier_id DROP NOT NULL;

-- Verify the change
SELECT 
    column_name, 
    is_nullable, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
  AND column_name = 'tier_id';
