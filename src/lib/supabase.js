// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

// Debug: Log environment variables
console.log('[Supabase] VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('[Supabase] VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing')

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
