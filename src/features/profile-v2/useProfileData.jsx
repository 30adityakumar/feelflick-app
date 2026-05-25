// src/features/profile-v2/useProfileData.jsx
// FeelFlick — Profile v2 data layer. Single hook that fetches everything
// (user_history with joined movies + user_ratings + taste_fingerprint + users
// row + editorial cache) in parallel and returns derived shapes that the
// section components consume. Each section hides when its data source is
// empty.

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { getTasteFingerprint } from '@/shared/services/tasteCache'

import {
  deriveUser, deriveStats, deriveMoods, deriveDirectors, deriveMotifs,
  deriveMixtape, deriveTrajectory, deriveTrajectoryAllTime,
  deriveDecades, deriveRuntime, deriveDaypart,
  deriveFriends, deriveSkews, deriveYIR,
} from './derive'
import { archetypeForFingerprint } from './archetype'
import { aggregateWatchHistorySignals, buildSummaryRequestBody } from './buildSummaryRequest'

const ProfileDataContext = createContext(null)

const HISTORY_COLS = `
  movie_id,
  watched_at,
  movies!inner (
    id,
    tmdb_id,
    title,
    director_name,
    release_date,
    runtime,
    mood_tags,
    tone_tags,
    fit_profile,
    poster_path
  )
`

const EDITORIAL_TTL_MS = 24 * 60 * 60 * 1000  // 24 h

const INITIAL_STATE = {
  user: null,
  stats: null,
  moods: [],
  directors: [],
  motifs: [],
  mixtape: [],
  trajectory: [],
  trajectoryAllTime: [],
  decades: [],
  runtime: null,
  daypart: [],
  editorial: null,
  friends: [],
  skews: [],
  yir: null,
  loading: true,
  error: null,
}

export function useProfileDataFetch({ userId, authUser, isSelf = false }) {
  const [state, setState] = useState(INITIAL_STATE)

  useEffect(() => {
    if (!userId) return
    let abort = false
    setState(INITIAL_STATE)

    ;(async () => {
      try {
        const [historyRes, ratingsRes, fingerprint, userRes, editorialRes, simARes, simBRes, ffStatsRes] = await Promise.all([
          supabase
            .from('user_history')
            .select(HISTORY_COLS)
            .eq('user_id', userId),
          supabase
            .from('user_ratings')
            .select('movie_id, rating, review_text, rated_at')
            .eq('user_id', userId),
          getTasteFingerprint(userId).catch(() => null),
          supabase
            .from('users')
            .select('id, name, avatar_url, joined_at, total_movies_watched')
            .eq('id', userId)
            .maybeSingle(),
          supabase
            .from('user_profiles_computed')
            .select('editorial_summary, editorial_signature, editorial_archetype, editorial_generated_at')
            .eq('user_id', userId)
            .maybeSingle(),
          supabase
            .from('user_similarity')
            .select('user_b_id, overall_similarity, users!user_similarity_user_b_fkey(id, name)')
            .eq('user_a_id', userId)
            .order('overall_similarity', { ascending: false })
            .limit(4),
          supabase
            .from('user_similarity')
            .select('user_a_id, overall_similarity, users!user_similarity_user_a_fkey(id, name)')
            .eq('user_b_id', userId)
            .order('overall_similarity', { ascending: false })
            .limit(4),
          supabase
            .from('feelflick_stats')
            .select('stat_key, stat_value, computed_at'),
        ])
        if (abort) return

        if (historyRes.error) throw historyRes.error

        const history = historyRes.data || []
        const ratings = ratingsRes.data || []
        const ratingsByMovieId = new Map(ratings.map(r => [r.movie_id, r]))
        const dbUser = userRes.data || null
        const feelflickStats = ffStatsRes?.data || []

        const archetypeFromFp = archetypeForFingerprint(fingerprint)
        const storedEditorial = editorialRes?.data || null
        const editorial = {
          summary:   storedEditorial?.editorial_summary   || null,
          signature: storedEditorial?.editorial_signature || null,
          archetype: Array.isArray(storedEditorial?.editorial_archetype) && storedEditorial.editorial_archetype.length === 3
            ? storedEditorial.editorial_archetype
            : archetypeFromFp,
          generatedAt: storedEditorial?.editorial_generated_at || null,
        }

        // === Friend films count =================================
        // Need per-friend totals for the "X films logged" caption — one
        // grouped query after the similarity results resolve.
        const friendIds = [
          ...(simARes?.data || []).map(r => r.user_b_id),
          ...(simBRes?.data || []).map(r => r.user_a_id),
        ].filter(Boolean)

        const filmsByFriendId = new Map()
        if (friendIds.length > 0) {
          const { data: friendHistory } = await supabase
            .from('user_history')
            .select('user_id')
            .in('user_id', friendIds)
          if (abort) return
          for (const row of friendHistory || []) {
            filmsByFriendId.set(row.user_id, (filmsByFriendId.get(row.user_id) || 0) + 1)
          }
        }

        const statsDerived = deriveStats({ history, ratings })
        setState({
          user: deriveUser({ authUser, dbUser, history }),
          stats: statsDerived,
          moods: deriveMoods(fingerprint),
          directors: deriveDirectors({ history, ratingsByMovieId }),
          motifs: deriveMotifs({ history }),
          mixtape: deriveMixtape({ history, ratingsByMovieId }),
          trajectory: deriveTrajectory({ history }),
          trajectoryAllTime: deriveTrajectoryAllTime({ history }),
          decades: deriveDecades({ history }),
          runtime: deriveRuntime({ history }),
          daypart: deriveDaypart({ history }),
          editorial,
          friends: deriveFriends({
            simARows: simARes?.data || [],
            simBRows: simBRes?.data || [],
            filmsByFriendId,
          }),
          skews: deriveSkews({ stats: statsDerived, history, ratings, feelflickStats }),
          yir: deriveYIR({ history }),
          loading: false,
          error: null,
        })

        // Self-view: regenerate editorial summary + signature when missing or
        // stale (>24 h). Archetype is deterministic so it's always live; we
        // persist it alongside for resilience when viewing other users.
        if (isSelf && shouldRegenerateEditorial(editorial) && history.length > 0) {
          regenerateEditorial({ userId, history, archetypeFromFp })
            .then((updated) => {
              if (abort || !updated) return
              setState((s) => ({ ...s, editorial: { ...s.editorial, ...updated } }))
            })
            .catch((err) => {
              // Never break the page on a regen failure — the stored/fallback
              // copy keeps rendering.
              console.warn('[useProfileData] editorial regen failed:', err)
            })
        }
      } catch (e) {
        if (abort) return
        console.error('[useProfileDataFetch]', e)
        setState(s => ({ ...s, loading: false, error: e?.message || 'Failed to load' }))
      }
    })()

    return () => { abort = true }
  }, [userId, authUser, isSelf])

  return state
}

export function ProfileDataProvider({ value, children }) {
  return <ProfileDataContext.Provider value={value}>{children}</ProfileDataContext.Provider>
}

export function useProfileData() {
  const ctx = useContext(ProfileDataContext)
  if (!ctx) throw new Error('useProfileData must be used inside ProfileDataProvider')
  return ctx
}

// === INTERNAL ===

function shouldRegenerateEditorial(editorial) {
  if (!editorial?.summary || !editorial?.signature) return true
  if (!editorial.generatedAt) return true
  const age = Date.now() - new Date(editorial.generatedAt).getTime()
  return age > EDITORIAL_TTL_MS
}

async function regenerateEditorial({ userId, history, archetypeFromFp }) {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null

  const { watchedFilms, taggedTasteSignature } = aggregateWatchHistorySignals(history)
  if (!watchedFilms.length) return null

  const body = buildSummaryRequestBody({
    stats: {},  // profile-v2 doesn't derive v1-style top-genres; watchedFilms is primary signal.
    watchedFilms,
    taggedTasteSignature,
  })

  const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-taste-summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) return null
  const data = await res.json().catch(() => null)
  const summary = (data?.summary || '').trim() || null
  const signature = (data?.signature || '').trim() || null
  if (!summary && !signature) return null

  const generatedAt = new Date().toISOString()
  const fields = {
    editorial_summary: summary,
    editorial_signature: signature,
    editorial_archetype: archetypeFromFp,
    editorial_generated_at: generatedAt,
  }

  // Preserve any existing user_profiles_computed.profile row (NOT NULL with
  // no default — bare upsert 400s when no recommendation profile has been
  // built yet). Same guard pattern as tasteCache.js.
  const { data: existing } = await supabase
    .from('user_profiles_computed')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    await supabase.from('user_profiles_computed').update(fields).eq('user_id', userId)
  } else {
    await supabase.from('user_profiles_computed').insert({ user_id: userId, profile: {}, ...fields })
  }

  return { summary, signature, archetype: archetypeFromFp, generatedAt }
}
