// src/features/movie-v2/useMovieData.js
// FeelFlick — Movie Detail v2 data layer.
// Fetches TMDB by id, maps to the shape sections expect, and provides via context.
// FeelFlick-engine fields (mood fingerprint, why-for-you reasons, editorial take,
// critic pull-quotes, taste twin) live in ./data and are NOT replaced here —
// they only apply to the curated "Featured Film" (currently Parasite, id 496243).

import { createContext, useContext, useEffect, useState } from 'react'
import { backdropImg, fetchJson, getMovieDetails, tmdbImg } from '@/shared/api/tmdb'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { computeUserProfile, scoreMovieForUser } from '@/shared/services/recommendations'
import { deriveMoodAxes } from './derive/moodRadar'

// Columns from the internal movies row needed by the editorial sections AND
// every dimension scoreMovieForUser reads (so the match ring isn't hardcoded).
const MOVIE_DB_COLS = `
  id, tmdb_id, title, release_date, release_year, runtime,
  director_name, primary_genre, poster_path, original_language,
  mood_tags, tone_tags, fit_profile,
  ff_audience_rating, ff_audience_confidence, ff_critic_rating,
  ff_final_rating, ff_rating, ff_rating_genre_normalized,
  discovery_potential, polarization_score,
  llm_pacing, llm_intensity, llm_emotional_depth,
  llm_dialogue_density, llm_attention_demand
`

// Engine raw score → display percent. Same clamp as watchlist-v2 for
// consistency: 50–96 range, films saved/viewed cluster at the top.
function engineToPercent(score) {
  if (!Number.isFinite(score)) return null
  return Math.max(50, Math.min(96, Math.round(score)))
}

const MovieDataContext = createContext(null)

// (FEATURED_TMDB_ID was retired in PR 2 — Parasite is now just the first
// curated row in movies_editorial_overlay. `hasOverlay` on the context
// replaces the old gate.)

// === Palette tints used to color cast cards when poster art is missing. ===
const PALETTE = ['#A78BFA', '#EC4899', '#F59E0B', '#34D399', '#7DD3FC', '#F472B6']

function formatMoney(n) {
  if (!n || n <= 0) return '—'
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `$${Math.round(n / 1_000_000)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${n}`
}

function youtubeThumb(key) {
  return `https://i.ytimg.com/vi/${key}/hqdefault.jpg`
}

function mapTmdbToMv(tmdb, { certification }) {
  const crew = tmdb?.credits?.crew || []
  const findJob = (job) => crew.find(c => c.job === job)
  const director = findJob('Director')
  const writer = findJob('Screenplay') || findJob('Writer') || findJob('Story')
  const dop = findJob('Director of Photography') || findJob('Cinematography')
  const composer = findJob('Original Music Composer') || findJob('Music')

  const trailer = (tmdb?.videos?.results || [])
    .filter(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
    .sort((a, b) => {
      if (a.type === 'Trailer' && b.type !== 'Trailer') return -1
      if (b.type === 'Trailer' && a.type !== 'Trailer') return 1
      return Number(b.official) - Number(a.official)
    })[0]

  const langName =
    (tmdb?.spoken_languages || []).find(l => l.iso_639_1 === tmdb?.original_language)?.english_name
    || (tmdb?.original_language ? tmdb.original_language.toUpperCase() : '—')

  const year = tmdb?.release_date ? new Date(tmdb.release_date).getFullYear() : ''
  const releaseDate = tmdb?.release_date
    ? new Date(tmdb.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''

  return {
    id: tmdb.id,
    title: tmdb.title || tmdb.original_title || 'Untitled',
    originalTitle: tmdb.original_title || tmdb.title || '',
    tagline: tmdb.tagline || '',
    overview: tmdb.overview || '',
    year,
    releaseDate,
    runtime: tmdb.runtime || 0,
    director: director?.name || '—',
    directorId: director?.id || null,
    writer: writer?.name || '—',
    genres: (tmdb.genres || []).map(g => g.name),
    certification: certification || 'NR',
    language: langName,
    languages: (tmdb.spoken_languages || []).slice(0, 4).map(l => ({
      code: (l.iso_639_1 || '').toUpperCase(),
      name: l.english_name || l.name,
      primary: l.iso_639_1 === tmdb.original_language,
    })),
    poster: tmdb.poster_path ? tmdbImg(tmdb.poster_path, 'w500') : null,
    backdrop: tmdb.backdrop_path
      ? backdropImg(tmdb.backdrop_path, 'w1280')
      : (tmdb.poster_path ? tmdbImg(tmdb.poster_path, 'w780') : null),
    trailerYouTubeId: trailer?.key || null,
    imdbRating: tmdb.vote_average ? +tmdb.vote_average.toFixed(1) : null,
    rtCritic: tmdb.vote_average ? Math.round(tmdb.vote_average * 10) : null,
    rtAudience: tmdb.vote_count ? Math.round((tmdb.vote_average || 0) * 9.5) : null,
    ffMatch: 88,
    budget: formatMoney(tmdb.budget),
    revenue: formatMoney(tmdb.revenue),
    cinematographer: dop?.name || '—',
    composer: composer?.name || '—',
  }
}

function mapTmdbToCast(tmdb) {
  return (tmdb?.credits?.cast || []).slice(0, 6).map((p, i) => ({
    name: p.name,
    role: p.character || '—',
    tint: PALETTE[i % PALETTE.length],
    also: [],
    profilePath: p.profile_path,
  }))
}

function mapTmdbToVideos(tmdb) {
  const all = (tmdb?.videos?.results || []).filter(v => v.site === 'YouTube' && v.key)
  const sorted = [...all].sort((a, b) => {
    const aT = a.type === 'Trailer' ? 0 : a.type === 'Teaser' ? 1 : 2
    const bT = b.type === 'Trailer' ? 0 : b.type === 'Teaser' ? 1 : 2
    if (aT !== bT) return aT - bT
    return Number(b.official) - Number(a.official)
  })
  return sorted.slice(0, 4).map(v => ({
    id: v.key,
    kind: v.type,
    title: v.name,
    duration: '—',
    thumb: youtubeThumb(v.key),
  }))
}

function mapTmdbToSimilar(tmdb) {
  const pool = (tmdb?.recommendations?.results?.length ? tmdb.recommendations.results : tmdb?.similar?.results) || []
  return pool
    .filter(r => r.poster_path)
    .slice(0, 12)
    .map((r, i) => ({
      key: String(r.id),
      tmdbId: r.id,
      title: r.title,
      year: r.release_date ? new Date(r.release_date).getFullYear() : '',
      dir: '',
      match: Math.max(70, 96 - i * 2),
      why: '',
      poster: tmdbImg(r.poster_path, 'w342'),
    }))
}

function mapTmdbProviders(providersJson, region = 'US') {
  const area = providersJson?.results?.[region] || {}
  const link = area?.link || 'https://www.justwatch.com'
  const toChip = (p, idx) => ({
    name: p.provider_name,
    logo: (p.provider_name || '?').slice(0, 1).toUpperCase(),
    logoPath: p.logo_path,
    tint: PALETTE[idx % PALETTE.length],
  })
  return {
    flatrate: (area?.flatrate || []).slice(0, 6).map(toChip),
    rent: (area?.rent || []).slice(0, 6).map(toChip),
    buy: (area?.buy || []).slice(0, 6).map(toChip),
    link,
  }
}

function mapDirectorFilmography(personJson, currentTmdbId) {
  const directed = (personJson?.crew || [])
    .filter(c => c.job === 'Director' && c.id !== currentTmdbId && c.poster_path)
  const seen = new Set()
  const unique = directed.filter(f => {
    if (seen.has(f.id)) return false
    seen.add(f.id)
    return true
  })
  return unique
    .sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''))
    .slice(0, 5)
    .map(f => ({
      tmdbId: f.id,
      title: f.title,
      year: f.release_date ? new Date(f.release_date).getFullYear() : '',
      yourRating: null,
      poster: tmdbImg(f.poster_path, 'w342'),
    }))
}

const EMPTY_PROVIDERS = { flatrate: [], rent: [], buy: [], link: '' }
const INITIAL_STATE = {
  mv: null,
  cast: [],
  videos: [],
  providers: EMPTY_PROVIDERS,
  similar: [],
  dirShelf: [],
  filmDbRow: null,     // internal movies row — mood_tags + llm_* used by Mood Radar / Why-for-you
  moodAxes: null,      // derived 6-axis radar; null when no LLM signal
  overlay: null,       // curated editorial overlay (movies_editorial_overlay) when present
  hasOverlay: false,
  loading: true,
  error: null,
}

export function useMovieDataFetch(id) {
  const { user } = useAuthSession()
  const [state, setState] = useState(INITIAL_STATE)

  useEffect(() => {
    if (!id) return
    let abort = false
    setState(INITIAL_STATE)

    ;(async () => {
      try {
        const [details, releaseDates, providers, filmDbResult] = await Promise.all([
          getMovieDetails(id),
          fetchJson(`/movie/${id}/release_dates`).catch(() => null),
          fetchJson(`/movie/${id}/watch/providers`).catch(() => null),
          supabase.from('movies').select(MOVIE_DB_COLS).eq('tmdb_id', id).maybeSingle(),
        ])
        if (abort) return
        if (!details || details?.success === false || details?.status_code) {
          throw new Error(details?.status_message || 'Movie not found')
        }

        const usCert = releaseDates?.results?.find(r => r.iso_3166_1 === 'US')
          ?.release_dates?.[0]?.certification || ''

        const mv = mapTmdbToMv(details, { certification: usCert })
        const cast = mapTmdbToCast(details)
        const videos = mapTmdbToVideos(details)
        const similar = mapTmdbToSimilar(details)
        const prov = mapTmdbProviders(providers)
        const filmDbRow = filmDbResult?.data || null
        const moodAxes = deriveMoodAxes(filmDbRow)

        // Engine-derived match % — replaces the hardcoded 88. Only when we
        // have both a Supabase row (so the engine has fields to read) AND a
        // signed-in user (so we have a profile). For anonymous viewers the
        // hardcoded fallback in mapTmdbToMv stays.
        if (filmDbRow && user?.id) {
          const profile = await computeUserProfile(user.id).catch(() => null)
          if (abort) return
          if (profile) {
            const { score } = scoreMovieForUser(filmDbRow, profile, 'default')
            const pct = engineToPercent(score)
            if (pct != null) mv.ffMatch = pct
          }
        }

        // Editorial overlay — admin-curated per-film fields. Keyed by internal
        // movies.id (filmDbRow.id), not tmdb_id. Skip the query if the film
        // isn't in our catalog yet.
        let overlay = null
        if (filmDbRow?.id) {
          const { data: overlayData } = await supabase
            .from('movies_editorial_overlay')
            .select('why_for_you, mood_fingerprint, ff_take, critic_quotes, film_palette, daypart_fit, hero_signature')
            .eq('movie_id', filmDbRow.id)
            .maybeSingle()
          if (abort) return
          overlay = overlayData || null
        }

        setState({
          mv,
          cast,
          videos,
          similar,
          providers: prov,
          dirShelf: [],
          filmDbRow,
          moodAxes,
          overlay,
          hasOverlay: Boolean(overlay),
          loading: false,
          error: null,
        })

        if (mv.directorId) {
          fetchJson(`/person/${mv.directorId}/movie_credits`)
            .then(personJson => {
              if (abort) return
              setState(s => ({ ...s, dirShelf: mapDirectorFilmography(personJson, mv.id) }))
            })
            .catch(() => { /* silent — shelf just stays empty */ })
        }
      } catch (e) {
        if (abort) return
        setState(s => ({ ...s, loading: false, error: e?.message || 'Failed to load' }))
      }
    })()

    return () => { abort = true }
  }, [id, user?.id])

  return state
}

export function MovieDataProvider({ value, children }) {
  return <MovieDataContext.Provider value={value}>{children}</MovieDataContext.Provider>
}

export function useMovieData() {
  const ctx = useContext(MovieDataContext)
  if (!ctx) throw new Error('useMovieData must be used inside MovieDataProvider')
  return ctx
}
