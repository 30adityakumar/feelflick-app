// src/shared/lib/supabase/client.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      flowType: 'pkce', // Use PKCE flow instead of implicit
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
)
