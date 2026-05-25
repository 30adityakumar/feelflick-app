// FeelFlick — Browse page entry. Mount at /browse.
//
// Wires the /browse v5 visual surface to real Supabase data, mirroring the
// legacy MoviesTab (/browse-legacy) data path: URL-driven state, browseMovies
// fetch with pagination, user_history + user_watchlist for the watched /
// saved badges, and live toggles that persist to Supabase. The legacy file
// stays mounted at /browse-legacy for rollback safety.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { browseMovies, PAGE_SIZE, TMDB_GENRE_IDS, fetchTwinsLovedMovieIds, fetchUserSubscriptions } from '@/shared/api/browse'
import { tmdbImg, discoverMovies } from '@/shared/api/tmdb'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { recommendationCache } from '@/shared/lib/cache'
import Pagination from '@/app/pages/movies/components/Pagination'

import { HP, HP_GRAD, MOODS, DECADE_OPTIONS, LANG_OPTIONS, RUNTIME_OPTIONS, DIALOGUE_OPTIONS, ATTENTION_OPTIONS, GAP_OPTIONS, VIBE_OPTIONS } from './data'
import { MoodRow, Toolbar, RefinePanel, GridCard, ListRow } from './components'
import { MoodBackdrop } from './immersive'
import './browse.css'

// /browse v5 — production wiring. Replaces the FILMS mock that shipped with
// the v5 visual prototype.

const DEFAULT_SORT = 'ff_rating.desc'

// Map a Supabase movies row → the shape GridCard / ListRow / QuickLook expect.
// The card components were built against the original FILMS mock shape, so
// we shim the field names here instead of touching every consumer.
function mapRowToFilm(row) {
  const tags = new Set(row.mood_tags || [])
  // pacing/intensity/depth on the mock were 1-10 scale; Supabase has 0-100
  // scores. Divide so per-card surfaces (RefinePanel, ListRow) read the
  // right magnitude.
  const pacing10 = Math.round((row.pacing_score || 0) / 10)
  const intensity10 = Math.round((row.intensity_score || 0) / 10)
  const depth10 = Math.round((row.emotional_depth_score || 0) / 10)
  // Synthesise fit + rationale per mood pill. The mock had hand-authored
  // per-mood fit numbers (0-1); we derive a coarser version from mood_tags
  // membership + the engine columns so the mood-weighted score on cards
  // doesn't render NaN.
  // Keys MUST match data.js MOODS[].id so GridCard / ListRow / QuickLook
  // can look up `f.fit[mood]` by the URL param value (which is the pill id).
  const fit = {
    tense:      tags.has('tense') || tags.has('suspenseful') ? 0.85 : (intensity10 >= 7 ? 0.65 : 0.25),
    slow:       tags.has('meditative') || tags.has('somber') ? 0.85 : (pacing10 <= 4 ? 0.6 : 0.25),
    tender:     tags.has('tender') || tags.has('heartwarming') ? 0.85 : 0.25,
    cerebral:   tags.has('mysterious') ? 0.8 : (depth10 >= 7 ? 0.65 : 0.3),
    cozy:       tags.has('heartwarming') || tags.has('lighthearted') || tags.has('whimsical') ? 0.85 : 0.25,
    melancholy: tags.has('melancholic') || tags.has('bittersweet') ? 0.85 : 0.25,
  }
  const rationale = {
    tense:      tags.has('tense') ? 'Mood signature · tense' : 'Tense register',
    slow:       tags.has('meditative') ? 'Patient build · meditative' : 'Slow build',
    tender:     tags.has('tender') ? 'Tender beat · tender' : 'Tender register',
    cerebral:   tags.has('mysterious') ? 'Cerebral lean · mysterious' : 'Cerebral register',
    cozy:       tags.has('heartwarming') ? 'Cozy beat · heartwarming' : 'Cozy register',
    melancholy: tags.has('melancholic') ? 'Melancholic register' : 'Bittersweet undertow',
  }
  return {
    id: row.id,
    tmdbId: row.tmdb_id,
    title: row.title,
    dir: row.director_name || '—',
    year: row.release_year || '',
    runtime: row.runtime || 0,
    genre: row.primary_genre || '',
    lang: row.original_language || '',
    poster: row.poster_path ? tmdbImg(row.poster_path, 'w342') : '',
    ff: Math.round(row.ff_audience_rating || row.vote_average * 10 || 0),
    vote: row.vote_average || 0,
    critic: Math.round(row.ff_critic_rating || 0),
    audience: Math.round(row.ff_audience_rating || 0),
    cult: Math.round(row.cult_status_score || 0),
    hidden: Math.round(row.discovery_potential || 0),
    pacing: pacing10,
    intensity: intensity10,
    depth: depth10,
    dialogue: row.dialogue_density >= 65 ? 'heavy' : 'light',
    attention: row.attention_demand >= 65 ? 'high' : 'low',
    fit,
    rationale,
    vibes: [],
    available: true,
    twinsLoved: false,
  }
}

// TMDB → card-shape adapter. Used only in search mode (text query). TMDB
// rows lack our engine columns, so the synthetic fit/rationale collapses
// to "no signal" defaults — match score becomes a derived score from
// vote_average. The card still renders cleanly.
function mapTmdbToFilm(r) {
  const yr = r.release_date ? new Date(r.release_date).getFullYear() : ''
  // Treat TMDB id as the "internal" id surrogate (negative-tagged to avoid
  // collisions with real movies.id values). Card click navigates via tmdbId.
  return {
    id: -Math.abs(r.id),
    tmdbId: r.id,
    title: r.title || r.name || '',
    dir: '',
    year: yr,
    runtime: 0,
    genre: '',
    lang: r.original_language || '',
    poster: r.poster_path ? tmdbImg(r.poster_path, 'w342') : '',
    ff: Math.round((r.vote_average || 0) * 10),
    vote: r.vote_average || 0,
    critic: 0,
    audience: Math.round((r.vote_average || 0) * 10),
    cult: 0, hidden: 0, pacing: 5, intensity: 5, depth: 5,
    dialogue: 'light', attention: 'low',
    fit: { tense:0.4, slow:0.4, tender:0.4, cerebral:0.4, cozy:0.4, melancholy:0.4 },
    rationale: { tense:'TMDB match', slow:'TMDB match', tender:'TMDB match', cerebral:'TMDB match', cozy:'TMDB match', melancholy:'TMDB match' },
    vibes: [],
    available: true,
    twinsLoved: false,
  }
}

// Decade param → TMDB date range for the discover endpoint.
function decadeToTmdbRange(decade) {
  if (!decade) return {}
  if (decade === 'pre1970') return { releaseDateLte: '1969-12-31' }
  const start = Number(decade)
  if (!Number.isFinite(start)) return {}
  return { releaseDateGte: `${start}-01-01`, releaseDateLte: `${start + 9}-12-31` }
}

// Runtime bucket → TMDB minute ranges.
const TMDB_RUNTIME_RANGES = {
  short:  { runtimeLte: 89 },
  medium: { runtimeGte: 90, runtimeLte: 130 },
  long:   { runtimeGte: 131, runtimeLte: 180 },
  epic:   { runtimeGte: 181 },
}

// Supabase-only sort keys that TMDB Discover doesn't support. When the
// user has one of these active and switches to text search, fall back to
// popularity.desc so the request doesn't 400.
const SUPABASE_ONLY_SORTS = new Set([
  'ff_rating.desc', 'discovery_potential.desc',
  'cult_status_score.desc', 'accessibility_score.desc',
])

// URL helpers — coerce a search param to a usable value.
function getStr(sp, key, fallback = '') {
  return sp.get(key) || fallback
}
function getNum(sp, key, fallback = 1) {
  const v = Number(sp.get(key) || fallback)
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : fallback
}
function getBool(sp, key) {
  return sp.get(key) === '1'
}
function getList(sp, key) {
  const raw = sp.get(key)
  return raw ? raw.split(',').filter(Boolean) : []
}

export default function Browse() {
  usePageMeta({ title: 'Browse — FeelFlick' })

  const { user } = useAuthSession()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // ── URL-derived state ────────────────────────────────────────────────────
  const page         = getNum(searchParams, 'page', 1)
  const mood         = getStr(searchParams, 'mood', 'all')
  const query        = getStr(searchParams, 'q')
  const genre        = getStr(searchParams, 'genre')
  const decade       = getStr(searchParams, 'decade')
  const lang         = getStr(searchParams, 'lang')
  const sortBy       = getStr(searchParams, 'sort', DEFAULT_SORT)
  const hideWatched  = getBool(searchParams, 'hideWatched')
  const minRating    = getStr(searchParams, 'rating')
  const runtime      = getStr(searchParams, 'runtime')
  const pacing       = getStr(searchParams, 'pacing')
  const intensity    = getStr(searchParams, 'intensity')
  const depth        = getStr(searchParams, 'depth')
  const dialogue     = getStr(searchParams, 'dialogue')
  const attention    = getStr(searchParams, 'attention')
  const minCritic    = getStr(searchParams, 'minCritic')
  const minAudience  = getStr(searchParams, 'minAudience')
  const gap          = getStr(searchParams, 'gap')
  const genreTop     = getBool(searchParams, 'genreTop')
  const director     = getStr(searchParams, 'director')
  const vibe         = useMemo(() => getList(searchParams, 'vibe'), [searchParams])
  const view         = getStr(searchParams, 'view', 'grid')
  const preset       = getStr(searchParams, 'preset') || null

  // Draft state for inputs that shouldn't update the URL on every keystroke.
  const [draftQuery, setDraftQ]    = useState(query)
  const [draftDirector, setDraftDir] = useState(director)
  useEffect(() => setDraftQ(query), [query])
  useEffect(() => setDraftDir(director), [director])

  // ── Setters that mutate the URL ──────────────────────────────────────────
  // Helper: write a single key, dropping it when value is empty/default.
  const writeParams = useCallback((updates, opts = {}) => {
    const next = new URLSearchParams(searchParams)
    const writeOne = (key, value, fallback = '') => {
      if (value === undefined) return
      const v = typeof value === 'string' ? value.trim() : value
      const empty = v === '' || v === null || v === undefined || v === false || v === fallback
      if (empty) next.delete(key)
      else if (Array.isArray(v)) {
        if (v.length === 0) next.delete(key)
        else next.set(key, v.join(','))
      } else next.set(key, String(v))
    }
    for (const [k, v] of Object.entries(updates)) {
      const fallback =
        k === 'sort' ? DEFAULT_SORT
        : k === 'view' ? 'grid'
        : k === 'mood' ? 'all'
        : k === 'page' ? 1
        : ''
      writeOne(k, v, fallback)
    }
    // Filter changes reset page to 1 unless the caller explicitly set it.
    if (!('page' in updates) && opts.resetPage !== false) next.delete('page')
    setSearchParams(next, { replace: opts.replace ?? false })
  }, [searchParams, setSearchParams])

  const setMood        = (v) => writeParams({ mood: v })
  const setGenre       = (v) => writeParams({ genre: v })
  const setDecade      = (v) => writeParams({ decade: v })
  const setLang        = (v) => writeParams({ lang: v })
  const setSortBy      = (v) => writeParams({ sort: v })
  const setHide        = (v) => writeParams({ hideWatched: v ? '1' : '' })
  const setMinRating   = (v) => writeParams({ rating: v })
  const setRuntime     = (v) => writeParams({ runtime: v })
  const setPacing      = (v) => writeParams({ pacing: v })
  const setIntensity   = (v) => writeParams({ intensity: v })
  const setDepth       = (v) => writeParams({ depth: v })
  const setDialogue    = (v) => writeParams({ dialogue: v })
  const setAttention   = (v) => writeParams({ attention: v })
  const setMinCritic   = (v) => writeParams({ minCritic: v })
  const setMinAudience = (v) => writeParams({ minAudience: v })
  const setGap         = (v) => writeParams({ gap: v })
  const setGenreTop    = (v) => writeParams({ genreTop: v ? '1' : '' })
  const setDirector    = (v) => writeParams({ director: v })
  const setVibe        = (v) => writeParams({ vibe: v })
  const setView        = (v) => writeParams({ view: v }, { resetPage: false })
  const setQuery       = (v) => writeParams({ q: v })

  // "Tonight" and the unwired "available tonight / twins loved" toggles are
  // left as local state — they're not yet backed by a real signal (we'd need
  // a streaming-providers column or a user_similarity join). UI stays so the
  // surface doesn't regress, but the toggles are persisted to URL with no
  // effect on the query for now.
  const availableTonight = getBool(searchParams, 'avTonight')
  const twinsLoved       = getBool(searchParams, 'twins')
  const setAvailableTonight = (v) => writeParams({ avTonight: v ? '1' : '' })
  const setTwinsLoved       = (v) => writeParams({ twins: v ? '1' : '' })

  // ── Refine panel open/close (local-only — not URL-persisted) ─────────────
  const [panelOpen, setPanel] = useState(false)

  // Card clicks navigate straight to /movie/:tmdbId — the Film File is the
  // destination and the QuickLook side-panel that used to open here was a
  // halfway state. Browser back returns to the same /browse view because
  // every filter lives in the URL.
  const openFilm = useCallback((film) => {
    if (film?.tmdbId) navigate(`/movie/${film.tmdbId}`)
  }, [navigate])

  // ── Scroll restoration ──────────────────────────────────────────────────
  // React Router's BrowserRouter doesn't restore scroll on back. Save the
  // current scrollY against the full URL key whenever the user scrolls,
  // then restore it once the grid has rendered (after the loading flip
  // from true → false so the document is tall enough to scroll to).
  const scrollKey = `browse:scroll:${searchParams.toString()}`
  const pendingScrollRef = useRef(null)
  useEffect(() => {
    const saved = sessionStorage.getItem(scrollKey)
    pendingScrollRef.current = saved ? Number(saved) : null
    let raf = null
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = null
        sessionStorage.setItem(scrollKey, String(window.scrollY))
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [scrollKey])

  // ── Watched + watchlist IDs (cached, used for hideWatched + card badges) ─
  const [watchedIds, setWatchedIds] = useState([])
  const [watchlistIds, setWatchlistIds] = useState([])
  // Twins-loved + subscriptions fetched once per session — twin set and
  // user prefs change slowly. Re-fetch on user change. Empty subscriptions
  // makes the "Streaming I have" toggle render disabled in the toolbar.
  const [twinsLovedIds, setTwinsLovedIds] = useState(null)  // null = not fetched yet
  const [userSubscriptions, setUserSubscriptions] = useState([])
  useEffect(() => {
    if (!user?.id) {
      setWatchedIds([])
      setWatchlistIds([])
      setTwinsLovedIds(null)
      setUserSubscriptions([])
      return
    }
    let abort = false
    Promise.all([
      supabase.from('user_history').select('movie_id').eq('user_id', user.id),
      supabase.from('user_watchlist').select('movie_id').eq('user_id', user.id),
      fetchTwinsLovedMovieIds(user.id),
      fetchUserSubscriptions(user.id),
    ]).then(([h, w, twins, subs]) => {
      if (abort) return
      setWatchedIds(h.data?.map(r => r.movie_id) ?? [])
      setWatchlistIds(w.data?.map(r => r.movie_id) ?? [])
      setTwinsLovedIds(twins)
      setUserSubscriptions(subs)
    }).catch(() => { /* keep empty arrays on error */ })
    return () => { abort = true }
  }, [user?.id])

  const watchedSet = useMemo(() => new Set(watchedIds), [watchedIds])
  const watchlistSet = useMemo(() => new Set(watchlistIds), [watchlistIds])
  const hasSubscriptions = userSubscriptions.length > 0

  // ── Fetch movies on filter/page change ───────────────────────────────────
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)

  // Stringify watchedIds for stable dependency — array ref changes shouldn't
  // re-trigger the fetch unless the contents changed.
  const watchedIdsKey = useMemo(() => watchedIds.slice().sort((a,b)=>a-b).join(','), [watchedIds])

  // Search only fires for queries of 2+ characters. Single-char queries
  // make TMDB Discover return ~100k matches (anything with that letter)
  // and aren't useful — silently fall through to Supabase browse instead.
  // The toolbar shows a quiet hint when the user has typed 1 character.
  const trimmedQuery = query.trim()
  const isSearchMode = trimmedQuery.length >= 2
  const shortQueryHint = trimmedQuery.length === 1

  // Apply the pending scroll restoration after loading finishes — that
  // way the document is tall enough for the scrollTo to land where the
  // user left off. `behavior: 'instant'` avoids the user seeing the page
  // animate from top to their previous position.
  useEffect(() => {
    if (loading) return
    if (pendingScrollRef.current == null) return
    const y = pendingScrollRef.current
    pendingScrollRef.current = null
    window.scrollTo({ top: y, behavior: 'instant' })
  }, [loading])

  useEffect(() => {
    let abort = false
    setLoading(true)
    ;(async () => {
      try {
        // ── Text search: route to TMDB Discover. Real text matching needs a
        //    tsvector on movies.title which we don't have; TMDB's catalog is
        //    broader and supports `with_text_query` natively.
        if (isSearchMode) {
          const tmdbSort = SUPABASE_ONLY_SORTS.has(sortBy) ? 'popularity.desc' : sortBy
          const tmdbRuntime = TMDB_RUNTIME_RANGES[runtime] || {}
          const tmdbDecade = decadeToTmdbRange(decade)
          const data = await discoverMovies({
            withTextQuery: query.trim(),
            page,
            sortBy: tmdbSort,
            genreIds: genre && TMDB_GENRE_IDS[genre] ? [TMDB_GENRE_IDS[genre]] : undefined,
            language: lang || undefined,
            voteAverageGte: minRating ? Number(minRating) : undefined,
            ...tmdbDecade,
            ...tmdbRuntime,
          })
          if (abort) return
          let mapped = (data.results || []).map(mapTmdbToFilm)
          // Apply mood / engine-only filters client-side. TMDB Discover
          // can't filter by mood_tags, intensity, etc., so the result is a
          // best-effort intersection: text-matched films, post-filtered.
          if (mood !== 'all') {
            // We can't tell from TMDB alone — leave the result as-is. The
            // count label calls out search mode so the user knows mood is
            // bypassed.
          }
          setMovies(mapped)
          setTotalPages(Math.min(data.total_pages || 1, 500))
          setTotalResults(data.total_results || 0)
          return
        }

        // ── Browse mode: Supabase, with Twins-loved restriction when set ──
        let restrictToIds = null
        if (twinsLoved) {
          // When twinsLovedIds is null we're still loading the twin set;
          // wait it out (initial mount race). Empty array = no twins, so
          // browseMovies short-circuits to an empty result honestly.
          if (twinsLovedIds === null) return
          restrictToIds = twinsLovedIds
        }

        const data = await browseMovies({
          page, mood, genre, sortBy, decade, lang,
          rating: minRating, runtime, pacing, intensity, depth,
          vibe, director, hideWatched, watchedIds, dialogue, attention,
          minCritic: minCritic ? Number(minCritic) : 0,
          minAudience: minAudience ? Number(minAudience) : 0,
          criticAudienceGap: gap,
          exceptionalGenre: genreTop,
          restrictToIds,
        })
        if (abort) return
        setMovies((data.movies || []).map(mapRowToFilm))
        setTotalPages(data.totalPages || 1)
        setTotalResults(data.totalCount || 0)
      } catch (err) {
        console.error('[Browse] fetch error:', err)
        if (!abort) { setMovies([]); setTotalResults(0); setTotalPages(1) }
      } finally {
        if (!abort) setLoading(false)
      }
    })()
    return () => { abort = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, mood, query, isSearchMode, genre, sortBy, decade, lang, minRating, runtime, pacing, intensity, depth, dialogue, attention, minCritic, minAudience, gap, genreTop, director, vibe.join(','), hideWatched, watchedIdsKey, twinsLoved, twinsLovedIds])

  // ── Watched / Watchlist toggles (real DB writes) ─────────────────────────
  // Optimistic update: mutate the Set locally first, fire the DB write, and
  // roll back on error. Cache is invalidated so /home + recommendations pick
  // up the change without a refresh.
  const toggleW = useCallback(async (filmId, tmdbId) => {
    if (!user?.id) { navigate('/'); return }
    const wasWatched = watchedSet.has(filmId)
    setWatchedIds(prev => wasWatched ? prev.filter(id => id !== filmId) : [...prev, filmId])
    if (wasWatched) setWatchlistIds(prev => prev)  // no-op
    else setWatchlistIds(prev => prev.filter(id => id !== filmId))
    try {
      if (wasWatched) {
        await supabase.from('user_history').delete().eq('user_id', user.id).eq('movie_id', filmId)
      } else {
        await supabase.from('user_history').insert({
          user_id: user.id, movie_id: filmId,
          watched_at: new Date().toISOString(), source: 'browse',
          watch_duration_minutes: null, mood_session_id: null,
        })
        await supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', filmId)
      }
      recommendationCache.invalidateUser(user.id)
    } catch (err) {
      console.error('[Browse.toggleW] error:', err)
      // Revert
      setWatchedIds(prev => wasWatched ? [...prev, filmId] : prev.filter(id => id !== filmId))
    }
    void tmdbId
  }, [user?.id, watchedSet, navigate])

  const toggleWL = useCallback(async (filmId) => {
    if (!user?.id) { navigate('/'); return }
    const wasIn = watchlistSet.has(filmId)
    setWatchlistIds(prev => wasIn ? prev.filter(id => id !== filmId) : [...prev, filmId])
    if (!wasIn) setWatchedIds(prev => prev.filter(id => id !== filmId))
    try {
      if (wasIn) {
        await supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', filmId)
      } else {
        await supabase.from('user_watchlist').upsert({
          user_id: user.id, movie_id: filmId,
          added_at: new Date().toISOString(),
          status: 'want_to_watch', source: 'browse',
        }, { onConflict: 'user_id,movie_id' })
        await supabase.from('user_history').delete().eq('user_id', user.id).eq('movie_id', filmId)
      }
      recommendationCache.invalidateUser(user.id)
    } catch (err) {
      console.error('[Browse.toggleWL] error:', err)
      setWatchlistIds(prev => wasIn ? [...prev, filmId] : prev.filter(id => id !== filmId))
    }
  }, [user?.id, watchlistSet, navigate])

  // ── Surprise me — random pick that opens the Film File directly ─────────
  // Pulls from a random page in the current filter pool (capped at 50) so
  // the surprise isn't limited to the 24 visible cards. Same pattern the
  // legacy MoviesTab uses. When in TMDB text-search mode we sample from
  // the already-loaded `movies` array since we can't easily query a random
  // TMDB Discover page mid-search.
  const [surpriseLoading, setSurpriseLoading] = useState(false)
  const onSurprise = useCallback(async () => {
    if (surpriseLoading) return
    if (isSearchMode) {
      if (movies.length === 0) return
      const pick = movies[Math.floor(Math.random() * movies.length)]
      if (pick?.tmdbId) navigate(`/movie/${pick.tmdbId}`)
      return
    }
    setSurpriseLoading(true)
    try {
      const maxPage = Math.min(totalPages || 1, 50)
      const randomPage = Math.floor(Math.random() * maxPage) + 1
      let restrictToIds = null
      if (twinsLoved && Array.isArray(twinsLovedIds)) restrictToIds = twinsLovedIds
      const data = await browseMovies({
        page: randomPage, mood, genre, sortBy, decade, lang,
        rating: minRating, runtime, pacing, intensity, depth,
        vibe, director, hideWatched, watchedIds, dialogue, attention,
        minCritic: minCritic ? Number(minCritic) : 0,
        minAudience: minAudience ? Number(minAudience) : 0,
        criticAudienceGap: gap,
        exceptionalGenre: genreTop,
        restrictToIds,
      })
      const candidates = data.movies || []
      if (candidates.length === 0) return
      const pick = candidates[Math.floor(Math.random() * candidates.length)]
      if (pick?.tmdb_id) navigate(`/movie/${pick.tmdb_id}`)
    } catch (err) {
      console.error('[Browse.surprise] error:', err)
    } finally {
      setSurpriseLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surpriseLoading, isSearchMode, movies, totalPages, mood, genre, sortBy, decade, lang, minRating, runtime, pacing, intensity, depth, dialogue, attention, minCritic, minAudience, gap, genreTop, director, vibe.join(','), hideWatched, watchedIdsKey, twinsLoved, twinsLovedIds])

  // ── Active filters chips + clear all ─────────────────────────────────────
  // Badge count on the Filters button now reflects EVERY active filter —
  // basics (genre/decade/lang/runtime/mood/preset) + advanced (refine
  // panel). Was previously advanced-only, which made the badge silently
  // ignore the most-common picks.
  const basicsCount = [
    mood !== 'all' ? 'mood' : '',
    genre, decade, lang, runtime, preset || '',
    hideWatched ? 'hw' : '',
    availableTonight ? 'av' : '',
    twinsLoved ? 'tw' : '',
  ].filter(Boolean).length
  const advancedCount = [minRating, pacing, intensity, depth, director, dialogue, attention, minCritic, minAudience, gap, genreTop ? 'on' : '', ...vibe].filter(Boolean).length
  const totalFilterCount = basicsCount + advancedCount
  const hasAnyFilter = !!(query || genre || decade || lang || hideWatched || availableTonight || twinsLoved || sortBy !== DEFAULT_SORT || advancedCount > 0 || mood !== 'all')

  const clearAll = () => {
    setSearchParams(new URLSearchParams(), { replace: false })
    setDraftQ('')
    setDraftDir('')
  }

  const applyPreset = (p) => {
    if (preset === p.id) {
      setSearchParams(new URLSearchParams(), { replace: false })
      return
    }
    const next = new URLSearchParams()
    next.set('preset', p.id)
    if (p.filters.language) next.set('lang', p.filters.language)
    if (p.filters.sortBy && p.filters.sortBy !== DEFAULT_SORT) next.set('sort', p.filters.sortBy)
    if (p.filters.runtime) next.set('runtime', p.filters.runtime)
    if (p.filters.pacing) next.set('pacing', p.filters.pacing)
    if (p.filters.intensity) next.set('intensity', p.filters.intensity)
    if (p.filters.depth) next.set('depth', p.filters.depth)
    if (p.filters.attention) next.set('attention', p.filters.attention)
    if (Array.isArray(p.filters.vibe) && p.filters.vibe.length) next.set('vibe', p.filters.vibe.join(','))
    setSearchParams(next, { replace: false })
  }

  const activeFilters = [
    // Mood is an active filter too — show it as a removable chip so users
    // who picked the wrong mood from the scrolling pill row can clear it
    // without hunting for the "All moods" pill.
    mood !== 'all' && { k:'mood', l:MOODS.find(m=>m.id===mood)?.label, c:()=>setMood('all') },
    genre && { k:'genre', l:genre, c:()=>setGenre('') },
    decade && { k:'decade', l:DECADE_OPTIONS.find(d=>d.value===decade)?.label, c:()=>setDecade('') },
    lang && { k:'lang', l:LANG_OPTIONS.find(l=>l.value===lang)?.label, c:()=>setLang('') },
    runtime && { k:'rt', l:RUNTIME_OPTIONS.find(r=>r.value===runtime)?.label, c:()=>setRuntime('') },
    minRating && { k:'rating', l:`${minRating}+ rating`, c:()=>setMinRating('') },
    director && { k:'dir', l:`Dir: ${director}`, c:()=>{setDirector(''); setDraftDir('')} },
    pacing && { k:'pacing', l: pacing==='slow' ? 'Slow burn' : 'Fast-paced', c:()=>setPacing('') },
    intensity && { k:'intensity', l: intensity==='chill' ? 'Chill' : 'Intense', c:()=>setIntensity('') },
    depth && { k:'depth', l: depth==='deep' ? 'Thought-provoking' : 'Easy watch', c:()=>setDepth('') },
    dialogue && { k:'dialogue', l: DIALOGUE_OPTIONS.find(d=>d.value===dialogue)?.label, c:()=>setDialogue('') },
    attention && { k:'attention', l: ATTENTION_OPTIONS.find(a=>a.value===attention)?.label, c:()=>setAttention('') },
    minCritic && { k:'mc', l:`Critics ≥ ${minCritic}`, c:()=>setMinCritic('') },
    minAudience && { k:'ma', l:`Audience ≥ ${minAudience}`, c:()=>setMinAudience('') },
    gap && { k:'gap', l: GAP_OPTIONS.find(g=>g.value===gap)?.label, c:()=>setGap('') },
    genreTop && { k:'gt', l:'Exceptional for genre', c:()=>setGenreTop(false) },
    hideWatched && { k:'hw', l:'Hide watched', c:()=>setHide(false) },
    availableTonight && { k:'av', l:'Streaming I have', c:()=>setAvailableTonight(false) },
    twinsLoved && { k:'tw', l:'Twins loved', c:()=>setTwinsLoved(false) },
    ...vibe.map(v => ({ k:'vibe-'+v, l:VIBE_OPTIONS.find(o=>o.value===v)?.label, c:()=>setVibe(vibe.filter(x=>x!==v)) })),
  ].filter(Boolean)

  // ── Pagination ───────────────────────────────────────────────────────────
  const handlePageChange = (next) => {
    writeParams({ page: next }, { resetPage: false })
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
  }

  return (
    <div style={{ minHeight:'100vh', background:HP.bg, color:HP.text, fontFamily:'Inter, sans-serif', position:'relative' }}>
      <MoodBackdrop tint={MOODS.find(m=>m.id===mood)?.hex || HP.purple} />
      <div style={{ position:'relative', zIndex:1, maxWidth:1440, margin:'0 auto' }}>
        <Toolbar
          query={draftQuery} setQuery={setQuery} draftQuery={draftQuery} setDraftQuery={setDraftQ}
          hideWatched={hideWatched} setHide={setHide}
          availableTonight={availableTonight} setAvailableTonight={setAvailableTonight}
          availableTonightDisabled={!hasSubscriptions}
          availableTonightTitle={!hasSubscriptions ? 'Add your streaming services in Account first' : undefined}
          twinsLoved={twinsLoved} setTwinsLoved={setTwinsLoved}
          twinsLovedDisabled={Array.isArray(twinsLovedIds) && twinsLovedIds.length === 0}
          twinsLovedTitle={Array.isArray(twinsLovedIds) && twinsLovedIds.length === 0 ? 'Rate more films so the engine can find your taste twins' : undefined}
          onSurprise={onSurprise}
          panelOpen={panelOpen} setPanel={setPanel} advancedCount={totalFilterCount}
          preset={preset} applyPreset={applyPreset}
          genre={genre} setGenre={setGenre}
          decade={decade} setDecade={setDecade}
          lang={lang} setLang={setLang}
          runtime={runtime} setRuntime={setRuntime}
          hasAnyFilter={hasAnyFilter} clearAll={clearAll}
          activeFilters={activeFilters}
        />

        <RefinePanel
          open={panelOpen} onClose={()=>setPanel(false)}
          totalResults={totalResults}
          hasAnyFilter={hasAnyFilter}
          clearAll={clearAll}
          onClearAdvanced={()=>{
            const next = new URLSearchParams(searchParams)
            ;['rating','runtime','pacing','intensity','depth','dialogue','attention','minCritic','minAudience','gap','genreTop','director','vibe'].forEach(k => next.delete(k))
            next.delete('page')
            setSearchParams(next, { replace: false })
            setDraftDir('')
          }}
          // Quick filters (also visible in the toolbar on desktop; mobile
          // hides the toolbar chips and routes users here instead).
          genre={genre} setGenre={setGenre}
          decade={decade} setDecade={setDecade}
          lang={lang} setLang={setLang}
          runtime={runtime} setRuntime={setRuntime}
          hideWatched={hideWatched} setHide={setHide}
          availableTonight={availableTonight} setAvailableTonight={setAvailableTonight}
          availableTonightDisabled={!hasSubscriptions}
          availableTonightTitle={!hasSubscriptions ? 'Add your streaming services in Account first' : undefined}
          twinsLoved={twinsLoved} setTwinsLoved={setTwinsLoved}
          twinsLovedDisabled={Array.isArray(twinsLovedIds) && twinsLovedIds.length === 0}
          twinsLovedTitle={Array.isArray(twinsLovedIds) && twinsLovedIds.length === 0 ? 'Rate more films so the engine can find your taste twins' : undefined}
          onSurprise={onSurprise}
          // Advanced fields
          minRating={minRating} setMinRating={setMinRating}
          pacing={pacing} setPacing={setPacing}
          intensity={intensity} setIntensity={setIntensity}
          depth={depth} setDepth={setDepth}
          dialogue={dialogue} setDialogue={setDialogue}
          attention={attention} setAttention={setAttention}
          minCritic={minCritic} setMinCritic={setMinCritic}
          minAudience={minAudience} setMinAudience={setMinAudience}
          gap={gap} setGap={setGap}
          genreTop={genreTop} setGenreTop={setGenreTop}
          director={director} setDirector={setDirector}
          draftDirector={draftDirector} setDraftDir={setDraftDir}
          vibe={vibe} setVibe={setVibe}
        />

        <MoodRow mood={mood} setMood={setMood} sortBy={sortBy} setSortBy={setSortBy} view={view} setView={setView} />

        {/* Results */}
        <section className="ff-browse-results" style={{ padding:'18px 56px 56px' }}>
          <div style={{ marginBottom:16, fontFamily:'Inter', fontSize:13, color:HP.textLow }}>
            {loading ? (
              <span style={{ color:HP.textFaint }}>Loading…</span>
            ) : (
              <>
                <span style={{ color:HP.textMid, fontWeight:500 }}>{totalResults.toLocaleString()}</span> {totalResults===1?'film':'films'}
                {mood !== 'all' && <span style={{ color:HP.textFaint }}> · ranked for <span style={{ color:HP.textMid }}>{MOODS.find(m=>m.id===mood)?.label.toLowerCase()}</span></span>}
                {isSearchMode && <span style={{ color:HP.textFaint }}> · matching <span style={{ color:HP.textMid }}>“{query}”</span></span>}
                {shortQueryHint && <span style={{ color:HP.textFaint }}> · type one more character to search</span>}
              </>
            )}
          </div>

          {loading ? (
            // Skeleton reuses the grid wrapper so it matches the responsive
            // column count (2 / 3 / 4 / 5 / 6 at each breakpoint).
            <div className="ff-browse-grid" style={{ display:'grid', gridTemplateColumns:'repeat(6, minmax(0, 1fr))', gap:18 }}>
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="animate-pulse" style={{ aspectRatio:'2/3', borderRadius:10, background:'rgba(167,139,250,0.06)' }} />
              ))}
            </div>
          ) : movies.length === 0 ? (
            <div style={{ padding:'80px 0', textAlign:'center' }}>
              <div style={{ fontFamily:'Outfit', fontSize:24, fontWeight:300, color:HP.textMid, letterSpacing:'-0.015em' }}>Nothing matches.</div>
              <div style={{ marginTop:8, fontFamily:'Inter', fontSize:13.5, color:HP.textLow }}>Loosen a filter, or clear them all.</div>
              {hasAnyFilter && <button onClick={clearAll} style={{ marginTop:18, padding:'10px 20px', borderRadius:999, background:HP_GRAD, color:'#fff', border:'none', fontFamily:'Inter', fontSize:13, fontWeight:600, cursor:'pointer' }}>Clear filters →</button>}
            </div>
          ) : view === 'grid' ? (
            // Inline grid template is the desktop default; browse.css overrides it
            // responsively. `minmax(0, 1fr)` is the bit that keeps long titles
            // from making one column wider than its siblings.
            <div className="ff-browse-grid" style={{ display:'grid', gridTemplateColumns:'repeat(6, minmax(0, 1fr))', gap:18 }}>
              {movies.map(f => {
                // TMDB-only rows (from text search) don't have an internal
                // movies row yet — Save/Watched actions can't write to
                // user_history / user_watchlist without one. For those,
                // route the action buttons to /movie/:tmdbId where
                // ensureMovieInDb creates the row before any DB write.
                const isTmdbOnly = f.id < 0
                return (
                  // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
                  <div key={f.id} id={`film-${f.id}`} onClick={() => openFilm(f)} style={{ borderRadius: 12, cursor:'pointer' }}>
                    <GridCard f={f} mood={mood}
                      watched={watchedSet.has(f.id)} inWatchlist={watchlistSet.has(f.id)}
                      onTW={isTmdbOnly ? () => navigate(`/movie/${f.tmdbId}`) : () => toggleW(f.id, f.tmdbId)}
                      onTWL={isTmdbOnly ? () => navigate(`/movie/${f.tmdbId}`) : () => toggleWL(f.id)} />
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ borderRadius:12, border:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.015)', overflow:'hidden' }}>
              {movies.map(f => {
                const isTmdbOnly = f.id < 0
                return (
                  // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
                  <div key={f.id} id={`film-${f.id}`} onClick={() => openFilm(f)} style={{ cursor:'pointer' }}>
                    <ListRow f={f} mood={mood}
                      watched={watchedSet.has(f.id)} inWatchlist={watchlistSet.has(f.id)}
                      onTW={isTmdbOnly ? () => navigate(`/movie/${f.tmdbId}`) : () => toggleW(f.id, f.tmdbId)}
                      onTWL={isTmdbOnly ? () => navigate(`/movie/${f.tmdbId}`) : () => toggleWL(f.id)} />
                  </div>
                )
              })}
            </div>
          )}

          {!loading && movies.length > 0 && totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
          )}
        </section>
      </div>

    </div>
  )
}
