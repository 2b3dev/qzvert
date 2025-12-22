import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseApiKey = import.meta.env.VITE_SUPABASE_API_KEY

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseApiKey || ''
)
