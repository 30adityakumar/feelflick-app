// src/shared/lib/supabase/client.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Helps catch misconfig in dev
  // eslint-disable-next-line no-console
  console.warn('⚠️ Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

// Default client (persistent via localStorage)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Ephemeral client (sessionStorage) used when Remember Me is OFF
export const supabaseEphemeral = typeof window !== 'undefined'
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.sessionStorage
      }
    })
  : null

export function getSupabase(rememberMe) {
  return rememberMe ? supabase : (supabaseEphemeral ?? supabase)
}