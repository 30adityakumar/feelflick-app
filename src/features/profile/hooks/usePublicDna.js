// Fetches another user's identity + Cinematic DNA detail via SECURITY DEFINER RPCs (no direct
// owner-only table reads). Powers the full read-only portrait on /DNA/:userId.
//
//   status: 'loading' | 'ok' | 'private' | 'error'
//     ok       — DNA shared; render the full portrait
//     private  — user exists but keeps their Cinematic DNA private (showOnLeaderboards off)
//     error    — user not found or the fetch failed
//
//   profile   — identity row (name, avatar_url, share flags) — present whenever the user exists
//   raw       — DNA row (archetype, editorial, fingerprint, counts) — null when private
//   tasteRows — history + per-film rating rows (no review_text / Diary) — [] when private
//
// review_text (the Diary) is never requested.

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

export function usePublicDna(targetUserId) {
  const [state, setState] = useState({ status: 'loading', profile: null, raw: null, tasteRows: [] })

  const load = useCallback(async () => {
    if (!targetUserId) return
    setState({ status: 'loading', profile: null, raw: null, tasteRows: [] })
    try {
      const [profileRes, dnaRes, tasteRes] = await Promise.all([
        supabase.rpc('get_person_public_profile', { target_user_id: targetUserId }),
        supabase.rpc('get_person_public_dna', { target_user_id: targetUserId }),
        supabase.rpc('get_person_public_taste', { target_user_id: targetUserId }),
      ])
      if (profileRes.error) throw profileRes.error
      const profile = (Array.isArray(profileRes.data) ? profileRes.data[0] : profileRes.data) ?? null
      if (!profile) { setState({ status: 'error', profile: null, raw: null, tasteRows: [] }); return }
      const raw = (Array.isArray(dnaRes.data) ? dnaRes.data[0] : dnaRes.data) ?? null
      const tasteRows = Array.isArray(tasteRes.data) ? tasteRes.data : []
      setState({ status: raw ? 'ok' : 'private', profile, raw, tasteRows })
    } catch {
      setState({ status: 'error', profile: null, raw: null, tasteRows: [] })
    }
  }, [targetUserId])

  useEffect(() => { load() }, [load])

  return { ...state, retry: load }
}
