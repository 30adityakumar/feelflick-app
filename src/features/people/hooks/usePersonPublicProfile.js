// src/features/people/hooks/usePersonPublicProfile.js
// Fetches a public person profile for /people/:userId.
// Phase 1 (parallel): profile metadata + public lists + taste-twin similarity pair.
// Phase 2 (conditional): history and watchlist only when the target has enabled sharing.
// Returns { status, profile, lists, history, watchlist, similarity }.

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

const INITIAL = { status: 'loading', profile: null, lists: [], history: [], watchlist: [], similarity: null }

export function usePersonPublicProfile(targetId, viewerId) {
  const [state, setState] = useState(INITIAL)

  const load = useCallback(async () => {
    if (!targetId || !viewerId) return
    setState(INITIAL)

    // Phase 1: profile + public lists + similarity pair (all in parallel).
    const [profileRes, listsRes, simRes] = await Promise.all([
      supabase.rpc('get_person_public_profile', { target_user_id: targetId }),
      supabase
        .from('lists')
        .select('id, title, description, updated_at')
        .eq('user_id', targetId)
        .eq('is_public', true)
        .order('updated_at', { ascending: false }),
      supabase
        .from('user_similarity')
        .select('overall_similarity, movies_in_common')
        .or(
          `and(user_a_id.eq.${viewerId},user_b_id.eq.${targetId}),and(user_a_id.eq.${targetId},user_b_id.eq.${viewerId})`
        )
        .limit(1),
    ])

    if (profileRes.error) {
      if (import.meta.env?.DEV) console.error('[usePersonPublicProfile] profile', profileRes.error)
      setState({ ...INITIAL, status: 'error' })
      return
    }

    const profile = profileRes.data?.[0] ?? null
    const lists = listsRes.data || []
    const similarity = simRes.data?.[0] ?? null

    // Phase 2: history and watchlist — only fetch when the target has sharing enabled.
    const [historyRes, watchlistRes] = await Promise.all([
      profile?.share_history
        ? supabase.rpc('get_person_public_history', { target_user_id: targetId })
        : Promise.resolve({ data: [] }),
      profile?.share_watchlist
        ? supabase.rpc('get_person_public_watchlist', { target_user_id: targetId })
        : Promise.resolve({ data: [] }),
    ])

    setState({
      status: 'ready',
      profile,
      lists,
      history: historyRes.data || [],
      watchlist: watchlistRes.data || [],
      similarity,
    })
  }, [targetId, viewerId])

  useEffect(() => { load() }, [load])

  return { ...state, retry: load }
}
