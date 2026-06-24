// src/features/movie/hooks/useTasteTwin.js
// Top taste-twin who has rated THIS movie. Returns the highest-similarity user
// (from user_similarity) who left a user_ratings row for the film. user_history
// is owner-only RLS so we can't filter on "watched"; a rating implies a watch.

import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

const AVATAR_PALETTE = ['#A78BFA', '#F59FA8', '#7DD3FC', '#34D399', '#FBBF24', '#F472B6']

const tintFor = (uuid, fallback = 0) => {
  if (!uuid) return AVATAR_PALETTE[fallback % AVATAR_PALETTE.length]
  let hash = 0
  for (let i = 0; i < uuid.length; i++) hash = (hash * 31 + uuid.charCodeAt(i)) | 0
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

const formatWatchedDate = (iso) => {
  if (!iso) return 'recently'
  const d = new Date(iso)
  const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 1) return 'today'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/**
 * @param {string|null} currentUserId
 * @param {number|null} internalMovieId
 * @returns {{ twin: object|null, loading: boolean }}
 */
export function useTasteTwin(currentUserId, internalMovieId, enabled = true) {
  const [state, setState] = useState({ twin: null, loading: Boolean(enabled && currentUserId && internalMovieId) })

  useEffect(() => {
    // Spoiler gating (§18): the twin's note TEXT must not be fetched before the
    // current user has watched the film.
    if (!enabled || !currentUserId || !internalMovieId) {
      setState({ twin: null, loading: false })
      return
    }
    let abort = false
    setState(s => ({ ...s, loading: true }))

    ;(async () => {
      try {
        const { data: similar, error: simErr } = await supabase
          .from('user_similarity')
          .select('user_b_id, overall_similarity')
          .eq('user_a_id', currentUserId)
          .order('overall_similarity', { ascending: false })
          .limit(20)
        if (abort) return
        if (simErr) throw simErr
        const candidateIds = (similar || []).map(r => r.user_b_id).filter(Boolean)
        if (candidateIds.length === 0) {
          setState({ twin: null, loading: false })
          return
        }
        const simMap = new Map(similar.map(r => [r.user_b_id, r.overall_similarity]))

        const { data: ratings, error: ratingsErr } = await supabase
          .from('user_ratings')
          .select('user_id, rating, review_text, rated_at, users!inner(id, name, avatar_url)')
          .eq('movie_id', internalMovieId)
          .in('user_id', candidateIds)
        if (abort) return
        if (ratingsErr) throw ratingsErr
        if (!ratings || ratings.length === 0) {
          setState({ twin: null, loading: false })
          return
        }

        // Of users who rated, pick the highest-similarity one.
        const ranked = [...ratings].sort((a, b) =>
          (simMap.get(b.user_id) || 0) - (simMap.get(a.user_id) || 0)
        )
        const top = ranked[0]

        // similarity is used ONLY to RANK candidates; the exact value is NOT
        // returned (§20 — no exact taste-similarity % anywhere on the Film File).
        const twin = {
          id: top.users?.id || top.user_id,
          name: top.users?.name || 'A taste twin',
          avatarBg: tintFor(top.user_id),
          avatarUrl: top.users?.avatar_url || null,
          rating: top.rating,        // 1-10 scale
          note: top.review_text || null,
          watchedDate: formatWatchedDate(top.rated_at),
        }
        setState({ twin, loading: false })
      } catch (err) {
        if (abort) return
        console.warn('[useTasteTwin]', err)
        setState({ twin: null, loading: false })
      }
    })()

    return () => { abort = true }
  }, [currentUserId, internalMovieId, enabled])

  return state
}
