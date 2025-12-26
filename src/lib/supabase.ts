import { createBrowserClient, createServerClient } from '@supabase/ssr'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_API_KEY || process.env.VITE_SUPABASE_API_KEY || ''

// Browser client - ใช้ใน client-side code
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Server client - ใช้ใน server functions
// ใช้ร่วมกับ getCookies/setCookie จาก @tanstack/react-start/server
export function createSupabaseServerClient(
  getCookies: () => Record<string, string>,
  setCookie: (name: string, value: string, options?: object) => void
) {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const cookies = getCookies()
        return Object.entries(cookies).map(([name, value]) => ({ name, value }))
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          setCookie(name, value, options)
        })
      },
    },
  })
}

// Legacy export สำหรับ backward compatibility (browser only)
export const supabase = createSupabaseBrowserClient()
