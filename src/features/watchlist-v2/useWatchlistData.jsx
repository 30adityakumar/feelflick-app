// src/features/watchlist-v2/useWatchlistData.jsx
// FeelFlick — Watchlist v2 data layer. Fetches the signed-in user's
// user_watchlist (joined with movies) + their taste_fingerprint, then
// derives the shape the page expects: items[] with match/mood/perfect/
// stale/addedDaysAgo/hex/tmdbId/internalId, plus aggregate stats.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { getTasteFingerprint } from '@/shared/services/tasteCache'
import { computeUserProfile, scoreMovieForUser } from '@/shared/services/recommendations'
import { HP, MOOD_HEX, tmdbImg } from './data'

const WatchlistDataContext = createContext(null)

// Stale threshold matches the README: items added >60 days ago.
const STALE_DAYS = 60

const INITIAL = {
  items: [],
  stats: { watchlistTotal: 0, perfectForTonightCount: 0, gettingStaleCount: 0 },
  loading: true,
  error: null,
  removeFromWatchlist: async () => {},
  refresh: () => {},
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : ''
}

function pickPrimaryMood(moodTags) {
  if (!Array.isArray(moodTags) || moodTags.length === 0) return null
  // Pick the first non-empty tag; tags are populated in order of strength
  // by the LLM enrichment pipeline.
  return capitalize(moodTags[0])
}

function hexFor(mood) {
  if (!mood) return HP.textSoft
  return MOOD_HEX[mood] || MOOD_HEX[mood.toLowerCase()] || HP.purple
}

function daysAgo(iso) {
  if (!iso) return 0
  const ms = Date.now() - new Date(iso).getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

// Per-(user, film) match score. We don't run the full 7-dimension
// scoring engine here — that's expensive and tied to the recommendation
// pipeline. Instead we approximate from the signals we already have:
//   - 50 base
//   - +25 if the film's primary mood is one of the user's top 3
//   - +10 if it's also one of the user's top 5 fits
//   - +up to 15 from objective quality (ff_final_rating)
// Capped at 96, floored at 50. Deterministic given same inputs.
function approxMatch({ movie, fingerprint }) {
  const moodTags = movie.mood_tags || []
  const fitProfile = movie.fit_profile
  const userTopMoods = (fingerprint?.topMoodTags || []).slice(0, 3).map(t => t.key)
  const userTopFits = (fingerprint?.topFitProfiles || []).slice(0, 5).map(t => t.key)
  let score = 50
  if (moodTags.some(t => userTopMoods.includes(t))) score += 25
  if (fitProfile && userTopFits.includes(fitProfile)) score += 10
  const quality = Number(movie.ff_final_rating) || Number(movie.ff_rating) || 0
  if (quality > 0) {
    // ff_final_rating is 0–10; map 7.0–9.0 → 0–15 bonus
    const q = Math.max(0, Math.min(15, ((quality - 7) / 2) * 15))
    score += q
  }
  return Math.max(50, Math.min(96, Math.round(score)))
}

// Engine score (~0-150 raw) → display percent. Most films land 50-110;
// we clamp to 50-96 so the watchlist UI shows a confident-looking match
// without claiming perfection.
function engineToPercent(score) {
  if (!Number.isFinite(score)) return 50
  return Math.max(50, Math.min(96, Math.round(score)))
}

// A film is "perfect for tonight" when its primary mood matches the
// user's #1 mood AND it scored ≥ 80. Cap at top 5 — the page only
// surfaces the top 3 anyway.
function deriveItems({ rows, fingerprint, profile }) {
  const userTopMood = fingerprint?.topMoodTags?.[0]?.key || null
  const items = rows.map(r => {
    const m = r.movies || {}
    const mood = pickPrimaryMood(m.mood_tags)
    // Engine when we have a profile; cold-start fallback otherwise.
    const match = profile
      ? engineToPercent(scoreMovieForUser(m, profile, 'default').score)
      : approxMatch({ movie: m, fingerprint })
    const addedDaysAgo = daysAgo(r.added_at)
    const stale = addedDaysAgo > STALE_DAYS
    const moodKey = (m.mood_tags || [])[0] || null
    const matchesTopMood = userTopMood && moodKey && moodKey === userTopMood
    const perfect = Boolean(matchesTopMood && match >= 80 && !stale)
    return {
      id: r.movie_id,
      internalId: m.id,
      tmdbId: m.tmdb_id,
      title: m.title || 'Untitled',
      year: m.release_date ? new Date(m.release_date).getFullYear() : '',
      runtime: m.runtime || 0,
      dir: m.director_name || '—',
      mood: mood || 'Mixed',
      hex: hexFor(mood),
      match,
      perfect,
      stale,
      addedDaysAgo,
      poster: m.poster_path ? tmdbImg(m.poster_path, 'w500') : null,
      why: '',  // editorial overlay would set this — empty for now
    }
  })
  return items
}

export function WatchlistDataProvider({ children }) {
  const { user } = useAuthSession()
  const [state, setState] = useState(INITIAL)
  const [nonce, setNonce] = useState(0)

  const refresh = useCallback(() => setNonce(n => n + 1), [])

  const removeFromWatchlist = useCallback(async (movieId) => {
    if (!user?.id || !movieId) return
    // Optimistic: drop locally first; refresh re-syncs.
    setState(prev => {
      const items = prev.items.filter(it => it.id !== movieId)
      return { ...prev, items, stats: recomputeStats(items) }
    })
    try {
      await supabase
        .from('user_watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId)
    } catch (e) {
      console.warn('[removeFromWatchlist]', e)
      // Re-fetch to fix optimistic mismatch on error.
      refresh()
    }
  }, [user, refresh])

  useEffect(() => {
    if (!user?.id) {
      setState({ ...INITIAL, loading: false })
      return
    }
    let abort = false
    setState(s => ({ ...s, loading: true, error: null }))

    ;(async () => {
      try {
        const [watchRes, fingerprint, profile] = await Promise.all([
          supabase
            .from('user_watchlist')
            .select(`
              movie_id,
              added_at,
              status,
              movies!inner (
                id, tmdb_id, title, director_name, release_date, runtime,
                original_language, primary_genre,
                mood_tags, tone_tags, fit_profile, poster_path,
                ff_final_rating, ff_rating, ff_rating_genre_normalized,
                ff_audience_rating, ff_audience_confidence, ff_critic_rating,
                discovery_potential, polarization_score,
                llm_pacing, llm_intensity, llm_emotional_depth,
                llm_dialogue_density, llm_attention_demand
              )
            `)
            .eq('user_id', user.id)
            .order('added_at', { ascending: false }),
          getTasteFingerprint(user.id).catch(() => null),
          computeUserProfile(user.id).catch(() => null),
        ])
        if (abort) return
        if (watchRes.error) throw watchRes.error

        const items = deriveItems({ rows: watchRes.data || [], fingerprint, profile })
        setState({
          items,
          stats: recomputeStats(items),
          loading: false,
          error: null,
          removeFromWatchlist,
          refresh,
        })
      } catch (e) {
        if (abort) return
        console.error('[useWatchlistData]', e)
        setState(s => ({ ...s, loading: false, error: e?.message || 'Failed to load' }))
      }
    })()

    return () => { abort = true }
  }, [user, nonce, removeFromWatchlist, refresh])

  const value = useMemo(() => state, [state])
  return <WatchlistDataContext.Provider value={value}>{children}</WatchlistDataContext.Provider>
}

function recomputeStats(items) {
  return {
    watchlistTotal: items.length,
    perfectForTonightCount: items.filter(it => it.perfect).length,
    gettingStaleCount: items.filter(it => it.stale).length,
  }
}

export function useWatchlistData() {
  const ctx = useContext(WatchlistDataContext)
  if (!ctx) throw new Error('useWatchlistData must be inside WatchlistDataProvider')
  return ctx
}
