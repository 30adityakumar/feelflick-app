// src/features/discover-v5/useDiscoverData.jsx
// FeelFlick — Discover v5 data layer.
//
// Two live sources replace the prototype's hardcoded arrays:
//   • FILMS         → top-quality candidates from `movies` (capped at 60),
//                     shaped into the engine's fit-vector format. Mood fit
//                     for each axis (tense, slow, tender, cerebral, cozy,
//                     bittersweet, mythic, restless) is derived from the
//                     film's mood_tags via a many-to-many bridge.
//   • DIARY_QUOTES  → user's recent review_text from user_ratings, indexed
//                     by the dominant mood of the rated film. Falls back to
//                     a curated default per mood when the user has no diary
//                     yet for that axis.
//
// criticLine / twin / arcPoints stay as derived/synthesized fields because
// FeelFlick doesn't yet have a real critic-quote source or a per-film
// pre-computed emotional arc. These are clearly flagged below.

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { computeUserProfile } from '@/shared/services/recommendations'

const DiscoverDataContext = createContext(null)

const TMDB_IMG = (path, size = 'w500') => path ? `https://image.tmdb.org/t/p/${size}${path}` : null

// === Mood axis ↔ mood_tag bridge =========================================
//
// The page UI uses 8 mood axes (tender / tense / slow / cerebral / cozy /
// bittersweet / mythic / restless). The DB's mood_tags vocabulary is
// different (intense, suspenseful, contemplative, mysterious, etc). This
// bridge maps each axis to the set of DB tags that contribute to it; per
// film, fit[axis] = max signal across mapped tags.
const MOOD_BRIDGE = {
  tender:      ['tender', 'romantic', 'heartwarming'],
  tense:       ['tense', 'suspenseful', 'intense', 'thrilling'],
  slow:        ['contemplative', 'meditative', 'melancholic', 'somber', 'haunting'],
  cerebral:    ['contemplative', 'mind-bending', 'provocative'],
  cozy:        ['cozy', 'heartwarming', 'lighthearted', 'whimsical'],
  bittersweet: ['bittersweet', 'melancholic', 'somber', 'nostalgic', 'devastating'],
  mythic:      ['haunting', 'dreamy', 'exhilarating', 'mind-bending'],
  restless:    ['intense', 'suspenseful', 'exhilarating', 'gritty', 'thrilling', 'unsettling'],
}
const MOOD_AXES = Object.keys(MOOD_BRIDGE)

function computeFit(movieTags) {
  if (!Array.isArray(movieTags) || movieTags.length === 0) {
    return Object.fromEntries(MOOD_AXES.map(a => [a, 0.15]))
  }
  const tagSet = new Set(movieTags.map(t => String(t).toLowerCase()))
  const fit = {}
  for (const axis of MOOD_AXES) {
    let signal = 0
    for (const tag of MOOD_BRIDGE[axis]) {
      if (tagSet.has(tag)) signal = Math.max(signal, 0.86)
    }
    fit[axis] = signal || 0.15
  }
  return fit
}

// Pick the strongest axis for a film's tags — used to bucket user diary
// quotes back to the right axis when the user views that mood later.
function dominantAxisOf(movieTags) {
  const fit = computeFit(movieTags)
  let best = 'tender', bestN = 0
  for (const axis of MOOD_AXES) {
    if (fit[axis] > bestN) { best = axis; bestN = fit[axis] }
  }
  return best
}

// === Synthesized arc (placeholder until a real per-film arc source lands)
function arcPointsFrom(fit) {
  // Use the film's tense + tender + bittersweet vector to shape a 10-step
  // arc with a typical mid-climax curve. Visual only.
  const peak = Math.max(fit.tense, fit.bittersweet, fit.tender, 0.4)
  const start = Math.max(fit.cozy, 0.35)
  const end = Math.max(fit.bittersweet, fit.tender, 0.45)
  return [start, start + 0.04, start + 0.1, start + 0.18, peak * 0.85, peak, peak * 0.92, end + 0.08, end + 0.02, end]
    .map(v => Math.max(0.15, Math.min(0.98, v)))
}

function arcDescriptionFor(fit) {
  if (fit.tense > 0.7 && fit.bittersweet < 0.5) return 'Tense build → tighter still → release.'
  if (fit.bittersweet > 0.7) return 'Soft throughout. Heaviest in the final scene.'
  if (fit.slow > 0.7) return 'Patient → revelation → quiet ache.'
  if (fit.cozy > 0.7) return 'Warm → warmer → home.'
  if (fit.cerebral > 0.6) return 'Patient → big idea → quiet residue.'
  return 'Steady build → peak in act 3 → soft landing.'
}

// === Fallback diary quotes (used per axis when user has no review yet) ===
const FALLBACK_DIARY = {
  tense:       { quote: 'I held my breath the whole final scene.',         after: 'a tense film, weeks ago' },
  slow:        { quote: 'Wrote nothing for an hour after the credits.',    after: 'a slow film, weeks ago' },
  tender:      { quote: 'Soft. Devastating. I sat there.',                 after: 'a tender film, weeks ago' },
  cerebral:    { quote: 'Stayed in my chest for days.',                    after: 'a cerebral film, weeks ago' },
  cozy:        { quote: 'It healed something I didn’t know was hurting.', after: 'a cozy film, weeks ago' },
  bittersweet: { quote: 'Still thinking about the final shot.',            after: 'a bittersweet film, weeks ago' },
  mythic:      { quote: 'Like seeing the world the first time.',           after: 'a mythic film, weeks ago' },
  restless:    { quote: 'Couldn’t sit. Got up. Sat down again.',      after: 'a restless film, weeks ago' },
}

function timeAgo(iso) {
  if (!iso) return 'recently'
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.round(ms / 86400000)
  if (days < 1) return 'today'
  if (days < 2) return 'yesterday'
  if (days < 7) return `${days} days ago`
  const weeks = Math.round(days / 7)
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  const months = Math.round(days / 30)
  return `${months} month${months === 1 ? '' : 's'} ago`
}

// === Shape one DB movie row into the engine's film format ================
function shapeFilm(m) {
  const fit = computeFit(m.mood_tags)
  const ff = Math.round(m.ff_final_rating ?? m.ff_audience_rating ?? 75)
  const critic = Math.round(m.ff_critic_rating ?? m.ff_audience_rating ?? 80)
  const audience = Math.round(m.ff_audience_rating ?? 75)
  return {
    id: m.id,
    tmdbId: m.tmdb_id,
    title: m.title || 'Untitled',
    year: m.release_date ? new Date(m.release_date).getFullYear() : (m.release_year || ''),
    runtime: m.runtime || 110,
    dir: m.director_name || 'Unknown',
    genre: m.primary_genre || 'Drama',
    poster: TMDB_IMG(m.poster_path),
    ff,
    critic,
    audience,
    fit,
    arc: arcDescriptionFor(fit),
    arcPoints: arcPointsFrom(fit),
    twin: null, // populated below if we find a follow who rated this film
    criticLine: null, // no real critic source yet — page hides this section when null
    // Raw Supabase row preserved for scoreMovieForUser — DiscoverV5 does the
    // engine call inline because the magazine flow applies UI-driven
    // intention/energy modifiers on top of the engine score.
    _raw: m,
  }
}

// === Provider ============================================================

const INITIAL = {
  films: [],
  diaryQuotes: {},
  profile: null, // computeUserProfile(userId) result — DiscoverV5 calls scoreMovieForUser inline
  loading: true,
  error: null,
}

export function DiscoverDataProvider({ children }) {
  const { user } = useAuthSession()
  const userId = user?.id
  const [state, setState] = useState(INITIAL)

  useEffect(() => {
    let abort = false
    setState(s => ({ ...s, loading: true, error: null }))
    ;(async () => {
      try {
        // === Phase 1: my watch history (to exclude already-seen) + candidates ===
        // Done in a small sequential step because the candidate query needs the
        // watched-id list to filter on. Cheap query — just movie_ids.
        let watchedIds = []
        if (userId) {
          const { data: hist } = await supabase
            .from('user_history')
            .select('movie_id')
            .eq('user_id', userId)
          watchedIds = (hist || []).map(r => r.movie_id)
        }

        const recentCutoff = new Date(Date.now() - 30 * 86400000).toISOString()
        let candidateQuery = supabase
          .from('movies')
          .select(`
            id, tmdb_id, title, release_date, release_year, runtime,
            director_name, primary_genre, poster_path, original_language,
            mood_tags, tone_tags, fit_profile,
            ff_audience_rating, ff_audience_confidence, ff_critic_rating,
            ff_final_rating, ff_rating, ff_rating_genre_normalized,
            discovery_potential, polarization_score,
            llm_pacing, llm_intensity, llm_emotional_depth,
            llm_dialogue_density, llm_attention_demand
          `)
          .eq('is_valid', true)
          .not('poster_path', 'is', null)
          .not('mood_tags', 'is', null)
          .gte('ff_audience_confidence', 60)
          .gte('ff_audience_rating', 72)
          .order('ff_audience_rating', { ascending: false })
          .limit(60)
        if (watchedIds.length > 0) {
          candidateQuery = candidateQuery.not('id', 'in', `(${watchedIds.join(',')})`)
        }

        const [moviesRes, ratingsRes, followsRes, profile] = await Promise.all([
          candidateQuery,
          userId
            ? supabase
                .from('user_ratings')
                .select('movie_id, rating, review_text, rated_at, movies!inner(title, mood_tags)')
                .eq('user_id', userId)
                .not('review_text', 'is', null)
                .gte('rated_at', recentCutoff)
                .order('rated_at', { ascending: false })
                .limit(40)
            : Promise.resolve({ data: [] }),
          userId
            ? supabase
                .from('user_follows')
                .select('following_id')
                .eq('follower_id', userId)
            : Promise.resolve({ data: [] }),
          userId ? computeUserProfile(userId).catch(() => null) : Promise.resolve(null),
        ])
        if (abort) return

        const movieRows = moviesRes.data || []
        const ratingRows = ratingsRes.data || []
        const followsArr = (followsRes.data || []).map(r => r.following_id)

        // === Phase 2: friend ratings + editorial overlays (parallel) ======
        const movieIds = movieRows.map(m => m.id)
        const [friendRes, overlayRes] = await Promise.all([
          followsArr.length && movieIds.length
            ? supabase
                .from('user_ratings')
                .select('user_id, movie_id, rating, review_text, users!inner(name)')
                .in('user_id', followsArr)
                .in('movie_id', movieIds)
                .gte('rating', 8)
            : Promise.resolve({ data: [] }),
          movieIds.length
            ? supabase
                .from('movies_editorial_overlay')
                .select('movie_id, critic_quotes, arc_points')
                .in('movie_id', movieIds)
            : Promise.resolve({ data: [] }),
        ])
        const friendRatings = friendRes.data || []
        const overlayByMovie = new Map((overlayRes.data || []).map(o => [o.movie_id, o]))
        if (abort) return

        // Best (highest-rated, first reviewer wins on tie) friend per movie
        const friendByMovie = new Map()
        for (const r of friendRatings) {
          const existing = friendByMovie.get(r.movie_id)
          if (!existing || (r.rating ?? 0) > (existing.rating ?? 0)) friendByMovie.set(r.movie_id, r)
        }

        const films = movieRows.map(m => {
          const shaped = shapeFilm(m)
          const fr = friendByMovie.get(m.id)
          if (fr) {
            shaped.twin = {
              who: fr.users?.name || 'A friend',
              rating: Math.round((fr.rating || 10) / 2), // 0–10 → 0–5
              note: fr.review_text || null,
            }
          }
          // Lift first curated critic quote into criticLine if the film has
          // an editorial overlay row. Page hides this section when null.
          const overlay = overlayByMovie.get(m.id)
          const firstQuote = Array.isArray(overlay?.critic_quotes) ? overlay.critic_quotes[0] : null
          if (firstQuote?.quote) {
            const src = [firstQuote.author, firstQuote.outlet].filter(Boolean).join(', ')
            shaped.criticLine = { q: firstQuote.quote, src: src ? `— ${src}` : '' }
          }
          // Hand-curated emotional arc beats the synthesized one. Falls back
          // to shapeFilm's fit_profile-derived curve when no overlay exists.
          if (Array.isArray(overlay?.arc_points) && overlay.arc_points.length >= 4) {
            const cleaned = overlay.arc_points
              .map((n) => (typeof n === 'number' ? Math.max(0, Math.min(1, n)) : null))
              .filter((n) => n !== null)
            if (cleaned.length >= 4) shaped.arcPoints = cleaned
          }
          return shaped
        })

        // === Diary quotes by dominant mood ================================
        const diaryByAxis = {}
        for (const r of ratingRows) {
          if (!r.review_text) continue
          const axis = dominantAxisOf(r.movies?.mood_tags)
          if (diaryByAxis[axis]) continue // keep most recent only (already DESC)
          diaryByAxis[axis] = {
            quote: r.review_text.slice(0, 140),
            after: `${r.movies?.title || 'a film'}, ${timeAgo(r.rated_at)}`,
          }
        }
        const diaryQuotes = { ...FALLBACK_DIARY, ...diaryByAxis }

        setState({ films, diaryQuotes, profile, loading: false, error: null })
      } catch (e) {
        if (abort) return
        console.error('[useDiscoverData]', e)
        setState(s => ({ ...s, loading: false, error: e?.message || 'Failed to load' }))
      }
    })()
    return () => { abort = true }
  }, [userId])

  const value = useMemo(() => state, [state])
  return <DiscoverDataContext.Provider value={value}>{children}</DiscoverDataContext.Provider>
}

export function useDiscoverData() {
  const ctx = useContext(DiscoverDataContext)
  if (!ctx) throw new Error('useDiscoverData must be inside DiscoverDataProvider')
  return ctx
}
