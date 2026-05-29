// src/features/movie/hooks/useFriendsLoved.js
// People I follow who rated THIS movie ≥ 8/10. Sourced purely from
// user_ratings (which is intentionally cross-user readable — see RLS comment
// in supabase/migrations/20260514000000_enable_rls_owner_policies_user_data.sql).
// user_history is owner-only, so a high rating is our cleanest "loved it" signal.

import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

const AVATAR_PALETTE = ['#A78BFA', '#F59FA8', '#7DD3FC', '#34D399', '#FBBF24', '#F472B6']

const tintFor = (uuid, fallback = 0) => {
  if (!uuid) return AVATAR_PALETTE[fallback % AVATAR_PALETTE.length]
  let hash = 0
  for (let i = 0; i < uuid.length; i++) hash = (hash * 31 + uuid.charCodeAt(i)) | 0
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

/**
 * @param {string|null} currentUserId
 * @param {number|null} internalMovieId
 * @returns {{ friends: Array<{ id, name, avatarBg, avatarUrl, rating, reviewText }>, loading: boolean }}
 */
export function useFriendsLoved(currentUserId, internalMovieId) {
  const [state, setState] = useState({ friends: [], loading: Boolean(currentUserId && internalMovieId) })

  useEffect(() => {
    if (!currentUserId || !internalMovieId) {
      setState({ friends: [], loading: false })
      return
    }
    let abort = false
    setState(s => ({ ...s, loading: true }))

    ;(async () => {
      try {
        const { data: follows, error: followsErr } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', currentUserId)
        if (abort) return
        if (followsErr) throw followsErr
        const followingIds = (follows || []).map(r => r.following_id).filter(Boolean)
        if (followingIds.length === 0) {
          setState({ friends: [], loading: false })
          return
        }

        const { data: ratings, error: ratingsErr } = await supabase
          .from('user_ratings')
          .select('user_id, rating, review_text, users!inner(id, name, avatar_url)')
          .eq('movie_id', internalMovieId)
          .in('user_id', followingIds)
          .gte('rating', 8)
          .order('rating', { ascending: false })
          .limit(6)
        if (abort) return
        if (ratingsErr) throw ratingsErr

        const friends = (ratings || []).map((r, i) => ({
          id: r.users?.id || r.user_id,
          name: r.users?.name || 'Someone',
          avatarBg: tintFor(r.user_id, i),
          avatarUrl: r.users?.avatar_url || null,
          rating: r.rating,
          reviewText: r.review_text || null,
        }))
        setState({ friends, loading: false })
      } catch (err) {
        if (abort) return
        console.warn('[useFriendsLoved]', err)
        setState({ friends: [], loading: false })
      }
    })()

    return () => { abort = true }
  }, [currentUserId, internalMovieId])

  return state
}
