// Fetches editorial + computed DNA data for another user via SECURITY DEFINER RPC.
// Used by PublicDnaProfile to render the archetype hero and passport.

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

export function usePublicDna(targetUserId) {
  const [state, setState] = useState({ status: 'loading', raw: null })

  const load = useCallback(async () => {
    if (!targetUserId) return
    setState({ status: 'loading', raw: null })
    try {
      const { data, error } = await supabase.rpc('get_person_public_dna', { target_user_id: targetUserId })
      if (error) throw error
      const row = Array.isArray(data) ? data[0] : data
      setState({ status: row ? 'ok' : 'error', raw: row ?? null })
    } catch {
      setState({ status: 'error', raw: null })
    }
  }, [targetUserId])

  useEffect(() => { load() }, [load])

  return { ...state, retry: load }
}
