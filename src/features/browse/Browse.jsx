// FeelFlick — Browse. Mount at /browse.
//
// Browse is the "explicit curiosity" surface: the USER chooses the territory
// (genre, era, language, runtime, filmmaker, qualities, or a text search) and
// FeelFlick helps them understand, order and navigate what exists inside it. It is
// deliberately distinct from Home ("Made for you") and Discover ("Tuned to the
// moment") — Browse never claims a per-film personal match.
//
// This container owns all URL-driven state, the Supabase/TMDB fetch, the real
// save/watched writes, scroll restoration, and the scoped surprise draw. Every
// presentational piece (masthead, curiosity paths, filter bar, drawer, results
// grid, surprise dialog) is a sibling component fed from here.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { browseMovies, PAGE_SIZE, TMDB_GENRE_IDS, fetchTwinsLovedMovieIds } from '@/shared/api/browse'
import { tmdbImg, discoverMovies } from '@/shared/api/tmdb'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { recommendationCache } from '@/shared/lib/cache'
import { track } from '@/shared/services/analytics'
import { updateImpression } from '@/shared/services/recommendations'
import Pagination from '@/shared/components/Pagination'
import { ThoughtfulRoot } from '@/shared/ui/thoughtful-seatmate'

import { MOODS, DECADE_OPTIONS, LANG_OPTIONS, RUNTIME_OPTIONS, DIALOGUE_OPTIONS, ATTENTION_OPTIONS, GAP_OPTIONS, VIBE_OPTIONS } from './data'
import { useCuriosityPaths } from './useCuriosityPaths'
import BrowseMasthead from './components/BrowseMasthead'
import BrowseCuriosityPaths from './components/BrowseCuriosityPaths'
import BrowseFilterBar from './components/BrowseFilterBar'
import BrowseFilterDrawer from './components/BrowseFilterDrawer'
import BrowseResultsHeader from './components/BrowseResultsHeader'
import BrowseFilmGrid from './components/BrowseFilmGrid'
import BrowseSurpriseDialog from './components/BrowseSurpriseDialog'
import './browse.css'

const DEFAULT_SORT = 'ff_rating.desc'

// Filters TMDB Discover can honour in text-search mode. Anything else is "paused"
// while a text query is active (shown dimmed, never silently applied as truth).
const TMDB_SUPPORTED_KEYS = new Set(['genre', 'decade', 'lang', 'runtime', 'rating'])

// Map a Supabase movies row → the card shape. Objective catalogue facts only —
// no synthesized per-mood "fit", no fabricated reason, no fake availability.
function mapRowToFilm(row) {
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
    ff: Math.round(row.ff_audience_rating || (row.vote_average || 0) * 10 || 0),
    vote: row.vote_average || 0,
    critic: Math.round(row.ff_critic_rating || 0),
    criticConfidence: Math.round(row.ff_critic_confidence || 0),
    audience: Math.round(row.ff_audience_rating || 0),
    cult: Math.round(row.cult_status_score || 0),
    hidden: Math.round(row.discovery_potential || 0),
    exceptional: (row.ff_rating_genre_normalized || 0) >= 8.0,
  }
}

// TMDB → card shape (text-search rows only). No engine columns exist, so there is
// nothing objective to claim beyond title/year/poster — evidence + badges resolve
// to null for these (see browsePresentation isTmdbOnly).
function mapTmdbToFilm(r) {
  const yr = r.release_date ? new Date(r.release_date).getFullYear() : ''
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
    critic: 0, criticConfidence: 0, audience: Math.round((r.vote_average || 0) * 10),
    cult: 0, hidden: 0, exceptional: false,
  }
}

function decadeToTmdbRange(decade) {
  if (!decade) return {}
  if (decade === 'pre1970') return { releaseDateLte: '1969-12-31' }
  const start = Number(decade)
  if (!Number.isFinite(start)) return {}
  return { releaseDateGte: `${start}-01-01`, releaseDateLte: `${start + 9}-12-31` }
}
const TMDB_RUNTIME_RANGES = {
  short: { runtimeLte: 89 }, medium: { runtimeGte: 90, runtimeLte: 130 },
  long: { runtimeGte: 131, runtimeLte: 180 }, epic: { runtimeGte: 181 },
}
const SUPABASE_ONLY_SORTS = new Set([
  'ff_rating.desc', 'discovery_potential.desc', 'ff_critic_rating.desc',
  'cult_status_score.desc', 'accessibility_score.desc',
])

const getStr = (sp, key, fb = '') => sp.get(key) || fb
const getNum = (sp, key, fb = 1) => { const v = Number(sp.get(key) || fb); return Number.isFinite(v) && v > 0 ? Math.floor(v) : fb }
const getBool = (sp, key) => sp.get(key) === '1'
const getList = (sp, key) => { const r = sp.get(key); return r ? r.split(',').filter(Boolean) : [] }

// Honest scope sentence for the surprise dialog — describes WHERE the pick came
// from, never a personal certainty.
function buildScopeReason({ genre, decade, lang, runtime, director, mood }) {
  const langLabel = lang ? LANG_OPTIONS.find(o => o.value === lang)?.label : null
  const decadeLabel = decade ? DECADE_OPTIONS.find(o => o.value === decade)?.label : null
  const rtLabel = runtime ? RUNTIME_OPTIONS.find(o => o.value === runtime)?.label : null
  const lead = [langLabel, genre ? genre.toLowerCase() : null].filter(Boolean).join(' ')
  let phrase = lead ? `A ${lead} film` : 'A film'
  if (decadeLabel) phrase += ` from the ${decadeLabel.toLowerCase()}`
  if (director) phrase += ` by ${director}`
  const tail = []
  if (rtLabel) tail.push(rtLabel.toLowerCase())
  if (mood && mood !== 'all') tail.push(`${MOODS.find(m => m.id === mood)?.label.toLowerCase()} register`)
  const hasScope = lead || decadeLabel || director || rtLabel || (mood && mood !== 'all')
  return hasScope
    ? `${phrase}${tail.length ? ` · ${tail.join(', ')}` : ''}, drawn from within your current filters.`
    : 'A film drawn from across the whole catalogue — set a filter to narrow where the surprise comes from.'
}

export default function Browse() {
  usePageMeta({ title: 'Browse — FeelFlick' })
  const { user } = useAuthSession()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // ── URL-derived state ──────────────────────────────────────────────────────
  const page        = getNum(searchParams, 'page', 1)
  const mood        = getStr(searchParams, 'mood', 'all')
  const query       = getStr(searchParams, 'q')
  const genre       = getStr(searchParams, 'genre')
  const decade      = getStr(searchParams, 'decade')
  const lang        = getStr(searchParams, 'lang')
  const sortBy      = getStr(searchParams, 'sort', DEFAULT_SORT)
  const hideWatched = getBool(searchParams, 'hideWatched')
  const minRating   = getStr(searchParams, 'rating')
  const runtime     = getStr(searchParams, 'runtime')
  const pacing      = getStr(searchParams, 'pacing')
  const intensity   = getStr(searchParams, 'intensity')
  const depth       = getStr(searchParams, 'depth')
  const dialogue    = getStr(searchParams, 'dialogue')
  const attention   = getStr(searchParams, 'attention')
  const minCritic   = getStr(searchParams, 'minCritic')
  const minAudience = getStr(searchParams, 'minAudience')
  const gap         = getStr(searchParams, 'gap')
  const genreTop    = getBool(searchParams, 'genreTop')
  const director    = getStr(searchParams, 'director')
  const vibe        = useMemo(() => getList(searchParams, 'vibe'), [searchParams])
  const twinsLoved  = getBool(searchParams, 'twins')
  const preset      = getStr(searchParams, 'preset') || null

  const [draftQuery, setDraftQ] = useState(query)
  useEffect(() => setDraftQ(query), [query])

  // ── Legacy URL migration ────────────────────────────────────────────────────
  // `avTonight` was an unwired "available tonight" toggle — there is NO reliable
  // region-aware availability data, so it is normalized OUT of the canonical URL
  // (no chip, no filter, no claim). `view=list` is normalized away too: the
  // redesign presents a single dense poster grid. Both are stripped once on mount;
  // all other params are preserved exactly.
  useEffect(() => {
    if (!searchParams.has('avTonight') && !searchParams.has('view')) return
    const next = new URLSearchParams(searchParams)
    next.delete('avTonight')
    next.delete('view')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  // ── URL writers ──────────────────────────────────────────────────────────────
  const writeParams = useCallback((updates, opts = {}) => {
    const next = new URLSearchParams(searchParams)
    const writeOne = (key, value, fallback = '') => {
      if (value === undefined) return
      const v = typeof value === 'string' ? value.trim() : value
      const empty = v === '' || v === null || v === undefined || v === false || v === fallback
      if (empty) next.delete(key)
      else if (Array.isArray(v)) { if (v.length === 0) next.delete(key); else next.set(key, v.join(',')) }
      else next.set(key, String(v))
    }
    for (const [k, v] of Object.entries(updates)) {
      const fallback = k === 'sort' ? DEFAULT_SORT : k === 'mood' ? 'all' : k === 'page' ? 1 : ''
      writeOne(k, v, fallback)
    }
    if (!('page' in updates) && opts.resetPage !== false) next.delete('page')
    setSearchParams(next, { replace: opts.replace ?? false })
  }, [searchParams, setSearchParams])

  const setFilter = useCallback((key, value) => writeParams({ [key]: value }), [writeParams])
  const setSortBy = useCallback((v) => writeParams({ sort: v }), [writeParams])
  const setQuery  = useCallback((v) => writeParams({ q: v }), [writeParams])

  // Curiosity path → a CLEAN territory (its filters only). Resets everything else.
  const selectPath = useCallback((path) => {
    const next = new URLSearchParams()
    for (const [k, v] of Object.entries(path.filters)) {
      if (Array.isArray(v)) { if (v.length) next.set(k, v.join(',')) }
      else if (v) next.set(k, String(v))
    }
    setSearchParams(next, { replace: false })
    setDraftQ('')
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [setSearchParams])

  // ── Scroll restoration ────────────────────────────────────────────────────
  const scrollKey = `browse:scroll:${searchParams.toString()}`
  const pendingScrollRef = useRef(null)
  useEffect(() => {
    const saved = sessionStorage.getItem(scrollKey)
    pendingScrollRef.current = saved ? Number(saved) : null
    let raf = null
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => { raf = null; sessionStorage.setItem(scrollKey, String(window.scrollY)) })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf) }
  }, [scrollKey])

  // ── Watched / watchlist / twins ─────────────────────────────────────────────
  const [watchedIds, setWatchedIds] = useState([])
  const [watchlistIds, setWatchlistIds] = useState([])
  const [twinsLovedIds, setTwinsLovedIds] = useState(null) // null = not fetched
  useEffect(() => {
    if (!user?.id) { setWatchedIds([]); setWatchlistIds([]); setTwinsLovedIds(null); return undefined }
    let abort = false
    Promise.all([
      supabase.from('user_history').select('movie_id').eq('user_id', user.id),
      supabase.from('user_watchlist').select('movie_id').eq('user_id', user.id),
      fetchTwinsLovedMovieIds(user.id),
    ]).then(([h, w, twins]) => {
      if (abort) return
      setWatchedIds(h.data?.map(r => r.movie_id) ?? [])
      setWatchlistIds(w.data?.map(r => r.movie_id) ?? [])
      setTwinsLovedIds(twins)
    }).catch(() => { /* keep empty on error */ })
    return () => { abort = true }
  }, [user?.id])

  const watchedSet = useMemo(() => new Set(watchedIds), [watchedIds])
  const watchlistSet = useMemo(() => new Set(watchlistIds), [watchlistIds])
  const twinsAvailable = Array.isArray(twinsLovedIds) && twinsLovedIds.length > 0

  // ── Curiosity paths (bounded, cached, deterministic — see useCuriosityPaths) ──
  const { paths, loading: pathsLoading } = useCuriosityPaths(user?.id || null)
  const ribbonPosters = useMemo(() => paths.map(p => p.poster).filter(Boolean), [paths])
  const activePathKey = useMemo(() => {
    for (const p of paths) {
      const f = p.filters
      const ok =
        (f.genre === undefined || f.genre === genre) &&
        (f.lang === undefined || f.lang === lang) &&
        (f.decade === undefined || f.decade === decade) &&
        (f.runtime === undefined || f.runtime === runtime) &&
        (f.director === undefined || f.director === director) &&
        (f.sort === undefined || f.sort === sortBy)
      if (ok) return p.key
    }
    return null
  }, [paths, genre, lang, decade, runtime, director, sortBy])

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [loadFailed, setLoadFailed] = useState(false)
  const [retryNonce, setRetryNonce] = useState(0)

  const watchedIdsKey = useMemo(() => watchedIds.slice().sort((a, b) => a - b).join(','), [watchedIds])
  const trimmedQuery = query.trim()
  const isSearchMode = trimmedQuery.length >= 2
  const shortQueryHint = trimmedQuery.length === 1

  useEffect(() => {
    if (loading) return
    if (pendingScrollRef.current == null) return
    const y = pendingScrollRef.current
    pendingScrollRef.current = null
    window.scrollTo({ top: y, behavior: 'instant' })
  }, [loading])

  useEffect(() => {
    let abort = false
    setLoading(true); setLoadFailed(false)
    ;(async () => {
      try {
        if (isSearchMode) {
          // Text search → TMDB Discover (title-oriented `with_text_query`). Keeps
          // TMDB's NATIVE page boundaries + totals (no result is dropped to force
          // an 18-item page). Only TMDB-supported filters are forwarded.
          const tmdbSort = SUPABASE_ONLY_SORTS.has(sortBy) ? 'popularity.desc' : sortBy
          const data = await discoverMovies({
            withTextQuery: trimmedQuery, page, sortBy: tmdbSort,
            genreIds: genre && TMDB_GENRE_IDS[genre] ? [TMDB_GENRE_IDS[genre]] : undefined,
            language: lang || undefined,
            voteAverageGte: minRating ? Number(minRating) : undefined,
            ...decadeToTmdbRange(decade), ...(TMDB_RUNTIME_RANGES[runtime] || {}),
          })
          if (abort) return
          setMovies((data.results || []).map(mapTmdbToFilm))
          setTotalPages(Math.min(data.total_pages || 1, 500))
          setTotalResults(data.total_results || 0)
          return
        }

        let restrictToIds = null
        if (twinsLoved) {
          if (twinsLovedIds === null) return // twin set still loading
          restrictToIds = twinsLovedIds
        }
        const data = await browseMovies({
          page, mood, genre, sortBy, decade, lang,
          rating: minRating, runtime, pacing, intensity, depth,
          vibe, director, hideWatched, watchedIds, dialogue, attention,
          minCritic: minCritic ? Number(minCritic) : 0,
          minAudience: minAudience ? Number(minAudience) : 0,
          criticAudienceGap: gap, exceptionalGenre: genreTop, restrictToIds,
        })
        if (abort) return
        setMovies((data.movies || []).map(mapRowToFilm))
        setTotalPages(data.totalPages || 1)
        setTotalResults(data.totalCount || 0)
      } catch (err) {
        console.error('[Browse] fetch error:', err)
        if (!abort) { setLoadFailed(true); setMovies([]); setTotalResults(0); setTotalPages(1) }
      } finally {
        if (!abort) setLoading(false)
      }
    })()
    return () => { abort = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, mood, query, isSearchMode, genre, sortBy, decade, lang, minRating, runtime, pacing, intensity, depth, dialogue, attention, minCritic, minAudience, gap, genreTop, director, vibe.join(','), hideWatched, watchedIdsKey, twinsLoved, twinsLovedIds, retryNonce])

  // ── Real save / watched writes (optimistic + rollback) ───────────────────────
  const toggleW = useCallback(async (filmId) => {
    if (!user?.id) { navigate('/'); return }
    const wasWatched = watchedSet.has(filmId)
    setWatchedIds(prev => wasWatched ? prev.filter(id => id !== filmId) : [...prev, filmId])
    if (!wasWatched) setWatchlistIds(prev => prev.filter(id => id !== filmId))
    try {
      if (wasWatched) {
        await supabase.from('user_history').delete().eq('user_id', user.id).eq('movie_id', filmId)
      } else {
        await supabase.from('user_history').insert({ user_id: user.id, movie_id: filmId, watched_at: new Date().toISOString(), source: 'browse', watch_duration_minutes: null, mood_session_id: null })
        await supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', filmId)
      }
      recommendationCache.invalidateUser(user.id)
    } catch (err) {
      console.error('[Browse.toggleW] error:', err)
      setWatchedIds(prev => wasWatched ? [...prev, filmId] : prev.filter(id => id !== filmId))
    }
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
        await supabase.from('user_watchlist').upsert({ user_id: user.id, movie_id: filmId, added_at: new Date().toISOString(), status: 'want_to_watch', source: 'browse' }, { onConflict: 'user_id,movie_id' })
        await supabase.from('user_history').delete().eq('user_id', user.id).eq('movie_id', filmId)
      }
      recommendationCache.invalidateUser(user.id)
    } catch (err) {
      console.error('[Browse.toggleWL] error:', err)
      setWatchlistIds(prev => wasIn ? [...prev, filmId] : prev.filter(id => id !== filmId))
    }
  }, [user?.id, watchlistSet, navigate])

  const openFilm = useCallback((film) => {
    if (!film?.tmdbId) return
    if (film.id > 0 && user?.id) updateImpression(user.id, film.id, 'clicked').catch(() => {})
    track('card_clicked', { movie_id: film.tmdbId, movie_title: film.title, source: 'browse' })
    navigate(`/movie/${film.tmdbId}`)
  }, [navigate, user?.id])

  // TMDB-only rows have no internal movies row yet — route their actions through
  // /movie/:tmdbId where the row is created before any write.
  const onToggleWatched = useCallback((film) => { if (film.id < 0) navigate(`/movie/${film.tmdbId}`); else toggleW(film.id) }, [navigate, toggleW])
  const onToggleWatchlist = useCallback((film) => { if (film.id < 0) navigate(`/movie/${film.tmdbId}`); else toggleWL(film.id) }, [navigate, toggleWL])

  // ── Scoped surprise (weighted-from-pool, confirmation dialog) ─────────────────
  const [surpriseOpen, setSurpriseOpen] = useState(false)
  const [surpriseLoading, setSurpriseLoading] = useState(false)
  const [surpriseFilm, setSurpriseFilm] = useState(null)
  const lastSurpriseRef = useRef(null)

  const drawSurprise = useCallback(async () => {
    setSurpriseLoading(true)
    try {
      // Search mode: draw from the loaded, title-matched results.
      if (isSearchMode) {
        const pool = movies.filter(m => m && m.title && m.id !== lastSurpriseRef.current)
        const pick = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null
        if (pick) lastSurpriseRef.current = pick.id
        setSurpriseFilm(pick)
        return
      }
      // Browse mode: sample a random page in the qualified pool (respects every
      // active filter + Hide watched via browseMovies), exclude invalid records +
      // the immediately-previous pick, then choose uniformly to preserve surprise.
      const maxPage = Math.min(totalPages || 1, 50)
      const randomPage = Math.floor(Math.random() * maxPage) + 1
      let restrictToIds = null
      if (twinsLoved && Array.isArray(twinsLovedIds)) restrictToIds = twinsLovedIds
      const fetchPage = (p) => browseMovies({
        page: p, mood, genre, sortBy, decade, lang, rating: minRating, runtime, pacing, intensity, depth,
        vibe, director, hideWatched, watchedIds, dialogue, attention,
        minCritic: minCritic ? Number(minCritic) : 0, minAudience: minAudience ? Number(minAudience) : 0,
        criticAudienceGap: gap, exceptionalGenre: genreTop, restrictToIds,
      })
      let data = await fetchPage(randomPage)
      let candidates = (data.movies || []).filter(r => r && r.poster_path && r.title)
      if (candidates.length === 0 && randomPage !== 1) { data = await fetchPage(1); candidates = (data.movies || []).filter(r => r && r.poster_path && r.title) }
      const fresh = candidates.filter(r => r.id !== lastSurpriseRef.current)
      const pool = fresh.length ? fresh : candidates
      const pick = pool.length ? mapRowToFilm(pool[Math.floor(Math.random() * pool.length)]) : null
      if (pick) lastSurpriseRef.current = pick.id
      setSurpriseFilm(pick)
    } catch (err) {
      console.error('[Browse.surprise] error:', err)
      setSurpriseFilm(null)
    } finally {
      setSurpriseLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSearchMode, movies, totalPages, mood, genre, sortBy, decade, lang, minRating, runtime, pacing, intensity, depth, dialogue, attention, minCritic, minAudience, gap, genreTop, director, vibe.join(','), hideWatched, watchedIdsKey, twinsLoved, twinsLovedIds])

  const openSurprise = useCallback(() => {
    setSurpriseOpen(true)
    drawSurprise()
  }, [drawSurprise])

  const onSurpriseOpenFilm = useCallback((film) => { setSurpriseOpen(false); openFilm(film) }, [openFilm])

  // ── Filters: chips + counts + drawer ─────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)

  const advancedCount = [minRating, pacing, intensity, depth, director, dialogue, attention, minCritic, minAudience, gap, genreTop ? 'on' : '', hideWatched ? 'hw' : '', twinsLoved ? 'tw' : '', mood !== 'all' ? 'mood' : '', ...vibe].filter(Boolean).length
  const hasAnyFilter = !!(query || genre || decade || lang || runtime || hideWatched || twinsLoved || sortBy !== DEFAULT_SORT || advancedCount > 0)

  const clearAll = () => { setSearchParams(new URLSearchParams(), { replace: false }); setDraftQ('') }

  // Active-scope chips. In search mode, filters TMDB can't apply are marked paused.
  const chips = useMemo(() => {
    const mk = (key, label, onRemove) => label ? { key, label, onRemove, paused: isSearchMode && !TMDB_SUPPORTED_KEYS.has(key) } : null
    return [
      mk('mood', mood !== 'all' ? MOODS.find(m => m.id === mood)?.label : '', () => writeParams({ mood: 'all' })),
      mk('genre', genre, () => setFilter('genre', '')),
      mk('decade', decade ? DECADE_OPTIONS.find(d => d.value === decade)?.label : '', () => setFilter('decade', '')),
      mk('lang', lang ? LANG_OPTIONS.find(l => l.value === lang)?.label : '', () => setFilter('lang', '')),
      mk('runtime', runtime ? RUNTIME_OPTIONS.find(r => r.value === runtime)?.label : '', () => setFilter('runtime', '')),
      mk('rating', minRating ? `${minRating}+ rating` : '', () => setFilter('rating', '')),
      mk('director', director ? `Dir: ${director}` : '', () => setFilter('director', '')),
      mk('pacing', pacing ? (pacing === 'slow' ? 'Leans slow-burn' : 'Leans fast') : '', () => setFilter('pacing', '')),
      mk('intensity', intensity ? (intensity === 'chill' ? 'Leans chill' : 'Often intense') : '', () => setFilter('intensity', '')),
      mk('depth', depth ? (depth === 'deep' ? 'Often thought-provoking' : 'Easy watch') : '', () => setFilter('depth', '')),
      mk('dialogue', dialogue ? DIALOGUE_OPTIONS.find(d => d.value === dialogue)?.label : '', () => setFilter('dialogue', '')),
      mk('attention', attention ? ATTENTION_OPTIONS.find(a => a.value === attention)?.label : '', () => setFilter('attention', '')),
      mk('minCritic', minCritic ? `Critics ≥ ${minCritic}` : '', () => setFilter('minCritic', '')),
      mk('minAudience', minAudience ? `Audience ≥ ${minAudience}` : '', () => setFilter('minAudience', '')),
      mk('gap', gap ? GAP_OPTIONS.find(g => g.value === gap)?.label : '', () => setFilter('gap', '')),
      mk('genreTop', genreTop ? 'Exceptional for genre' : '', () => writeParams({ genreTop: '' })),
      mk('hideWatched', hideWatched ? 'Hide watched' : '', () => writeParams({ hideWatched: '' })),
      mk('twins', twinsLoved ? 'Taste twins loved' : '', () => writeParams({ twins: '' })),
      ...vibe.map(v => mk(`vibe-${v}`, VIBE_OPTIONS.find(o => o.value === v)?.label, () => setFilter('vibe', vibe.filter(x => x !== v)))),
    ].filter(Boolean)
  }, [isSearchMode, mood, genre, decade, lang, runtime, minRating, director, pacing, intensity, depth, dialogue, attention, minCritic, minAudience, gap, genreTop, hideWatched, twinsLoved, vibe, writeParams, setFilter])

  const drawerInitial = useMemo(() => ({ pacing, intensity, depth, dialogue, attention, gap, vibe, hideWatched, twins: twinsLoved }), [pacing, intensity, depth, dialogue, attention, gap, vibe, hideWatched, twinsLoved])
  const applyDrawer = useCallback((draft) => {
    writeParams({
      pacing: draft.pacing, intensity: draft.intensity, depth: draft.depth,
      dialogue: draft.dialogue, attention: draft.attention, gap: draft.gap, vibe: draft.vibe,
      hideWatched: draft.hideWatched ? '1' : '', twins: draft.twins ? '1' : '',
    })
    setDrawerOpen(false)
  }, [writeParams])

  // ── Pagination ────────────────────────────────────────────────────────────
  const handlePageChange = (next) => {
    writeParams({ page: next }, { resetPage: false })
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  const resultsTitle = isSearchMode ? 'Search results' : (hasAnyFilter ? 'In this catalogue' : 'The whole catalogue')
  const pageSizeNote = !isSearchMode && totalPages > 1 ? '18 films at a time' : null

  return (
    <ThoughtfulRoot className="ff-browse">
      <BrowseMasthead
        ribbonPosters={ribbonPosters}
        draftQuery={draftQuery}
        setDraftQuery={setDraftQ}
        onSearch={setQuery}
        onSurprise={openSurprise}
      />

      <div className="ff-browse__body">
        {!isSearchMode ? (
          <BrowseCuriosityPaths paths={paths} loading={pathsLoading} activeKey={activePathKey} onSelect={selectPath} />
        ) : null}

        <BrowseFilterBar
          genre={genre} decade={decade} lang={lang} runtime={runtime}
          onSetFilter={setFilter}
          sort={sortBy} onSetSort={setSortBy}
          advancedCount={advancedCount} onOpenDrawer={() => setDrawerOpen(true)}
          chips={chips} onClearAll={clearAll}
          isSearchMode={isSearchMode}
        />

        <section className="ff-browse-results" aria-live="polite">
          {!loadFailed ? (
            <BrowseResultsHeader
              title={resultsTitle} count={totalResults} loading={loading}
              sort={sortBy} isSearchMode={isSearchMode} query={trimmedQuery}
              shortQueryHint={shortQueryHint} infoOpen={infoOpen}
              onToggleInfo={() => setInfoOpen(o => !o)} pageSizeNote={pageSizeNote}
            />
          ) : null}

          {loading ? (
            <div className="ff-browse-grid" aria-hidden="true">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => <div key={i} className="ff-browse-grid__cell"><div className="ff-bcard__poster is-skeleton" /></div>)}
            </div>
          ) : loadFailed ? (
            <div role="alert" className="ff-browse-state ff-browse-state--error">
              <h2>The catalog didn’t load.</h2>
              <p>Your filters are fine — this is on our side. Try again in a moment.</p>
              <button type="button" className="ffb-btn ffb-btn--ghost" onClick={() => setRetryNonce(n => n + 1)}>Try again</button>
            </div>
          ) : movies.length === 0 ? (
            <div className="ff-browse-state ff-browse-state--empty">
              <h2>Nothing matches.</h2>
              <p>Loosen a filter, or clear them all.</p>
              {hasAnyFilter ? <button type="button" className="ffb-btn ffb-btn--primary" onClick={clearAll}>Clear filters →</button> : null}
            </div>
          ) : (
            <BrowseFilmGrid
              films={movies} sort={sortBy} qualityLens={vibe}
              watchedSet={watchedSet} watchlistSet={watchlistSet}
              onOpen={openFilm} onToggleWatched={onToggleWatched} onToggleWatchlist={onToggleWatchlist}
            />
          )}

          {!loading && movies.length > 0 && totalPages > 1 ? (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
          ) : null}
        </section>
      </div>

      <BrowseFilterDrawer
        open={drawerOpen} initial={drawerInitial} twinsAvailable={twinsAvailable}
        onClose={() => setDrawerOpen(false)} onApply={applyDrawer}
      />

      <BrowseSurpriseDialog
        open={surpriseOpen} onClose={() => setSurpriseOpen(false)}
        film={surpriseFilm} loading={surpriseLoading}
        scopeReason={buildScopeReason({ genre, decade, lang, runtime, director, mood })}
        onOpenFilm={onSurpriseOpenFilm} onAnother={drawSurprise}
      />

      {/* `preset` (legacy editorial bundle) + `mood` remain honored from the URL: their
          derived filters drive the query and surface as removable chips; the redesign
          surfaces entry via the curiosity paths instead of a presets row. */}
      {preset ? <span hidden data-legacy-preset={preset} /> : null}
    </ThoughtfulRoot>
  )
}
