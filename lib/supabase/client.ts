import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/supabase/types/database.types'

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co'
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )
}
