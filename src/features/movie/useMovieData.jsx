// src/features/movie/useMovieData.jsx
// FeelFlick — Movie Detail data layer.
// Fetches TMDB by id, maps to the shape sections expect, and provides via context.
// FeelFlick-engine fields (mood fingerprint, why-for-you reasons, editorial take,
// critic pull-quotes, taste twin) live in ./data and are NOT replaced here —
// they only apply to the curated "Featured Film" (currently Parasite, id 496243).

import { createContext, useContext, useEffect, useState } from 'react'
import { backdropImg, fetchJson, getMovieDetails, tmdbImg } from '@/shared/api/tmdb'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { computeUserProfile, scoreMovieForUser } from '@/shared/services/recommendations'
import { computeMatchPercent } from '@/shared/services/matchScore'
import { MOVIE_ENGINE_COLS } from '@/shared/services/movieFields'
import { activeMovieBoundaries, BOUNDARY_LABEL } from '@/shared/services/boundaries'
import { formatFullDate } from '@/shared/lib/format/date'
import { deriveMoodAxes } from './derive/moodRadar'
import { classifyFilmFileContent } from './derive/sourceClassification'
import { classifyMovieProviderState } from './derive/providerState'

// Pull the full engine column set so the match % on this page matches
// what /home shows for the same film. Single source of truth in
// shared/services/movieFields.js.
const MOVIE_DB_COLS = MOVIE_ENGINE_COLS

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

// NOTE (movie redesign §7): browser-triggered editorial-overlay generation was
// RETIRED. The public /movie/:id route must not fire a paid, anon-key-authenticated
// generation write simply because a visitor (including an anonymous one) opens a
// film — that exposed cost + a prompt-injection surface + concurrent duplicate
// writes with no dedupe. We now ONLY read existing movies_editorial_overlay rows;
// films without an overlay fall back to derived cold-path copy. Follow-up debt: a
// server-controlled, authenticated, deduplicated editorial-generation pipeline.

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
  const releaseDate = formatFullDate(tmdb?.release_date)

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
    tmdbRating: tmdb.vote_average ? +tmdb.vote_average.toFixed(1) : null,
    // ffCritic / ffAudience are merged in from filmDbRow.ff_critic_rating /
    // ff_audience_rating after this map runs (see mergeFilmDbSignals below).
    // They start null so the hero's ratings widget self-hides for films not
    // in our catalog or without FF aggregates yet.
    ffCritic: null,
    ffAudience: null,
    ffMatch: null,  // resolved below from computeMatchPercent when we have a profile
    daypartFit: null,  // resolved below from overlay.daypart_fit when present
    budget: formatMoney(tmdb.budget),
    revenue: formatMoney(tmdb.revenue),
    cinematographer: dop?.name || '—',
    composer: composer?.name || '—',
  }
}

// Merge FeelFlick aggregate signals from the internal movies row into the
// TMDB-shaped mv object. Critic + audience scores are real FF aggregates
// (smallint 0-100, populated from our scoring pipeline) — never the
// vote_average × 10 fabrication this page used to ship.
function mergeFilmDbSignals(mv, filmDbRow, overlay) {
  if (filmDbRow) {
    if (Number.isFinite(filmDbRow.ff_critic_rating))   mv.ffCritic   = filmDbRow.ff_critic_rating
    if (Number.isFinite(filmDbRow.ff_audience_rating)) mv.ffAudience = filmDbRow.ff_audience_rating
  }
  if (overlay?.daypart_fit) mv.daypartFit = overlay.daypart_fit
  return mv
}

function mapTmdbToCast(tmdb) {
  return (tmdb?.credits?.cast || []).slice(0, 6).map((p, i) => ({
    id: p.id,                             // tmdb person id — used by hydrateCastAlsoIn
    name: p.name,
    role: p.character || '—',
    tint: PALETTE[i % PALETTE.length],
    also: [],                             // populated post-fetch with real titles
    inYourLibrary: 0,                     // count of those titles in user_history
    profilePath: p.profile_path,
  }))
}

// For each cast member, fetch their movie credits from TMDB and pick the
// top 3 highest-vote-count films other than the current one. When the
// signed-in user has any of those films in user_history, those bubble to
// the top AND the "inYourLibrary" count reflects the real overlap. No
// fabricated "3 in your library" claim.
async function hydrateCastAlsoIn(cast, currentTmdbId, userId) {
  if (!cast || cast.length === 0) return cast
  let userHistoryTmdbIds = new Set()
  if (userId) {
    try {
      const { data } = await supabase
        .from('user_history')
        .select('movies!inner(tmdb_id)')
        .eq('user_id', userId)
      if (data) userHistoryTmdbIds = new Set(data.map(r => r.movies?.tmdb_id).filter(Boolean))
    } catch { /* fall through with empty set */ }
  }
  const results = await Promise.all(cast.map(async (p) => {
    if (!p.id) return p
    try {
      const json = await fetchJson(`/person/${p.id}/movie_credits`)
      const acted = (json?.cast || []).filter(c => c.id !== currentTmdbId && c.poster_path)
      // Sort: films the user has watched first, then by TMDB vote_count.
      acted.sort((a, b) => {
        const aSeen = userHistoryTmdbIds.has(a.id) ? 1 : 0
        const bSeen = userHistoryTmdbIds.has(b.id) ? 1 : 0
        if (aSeen !== bSeen) return bSeen - aSeen
        return (b.vote_count || 0) - (a.vote_count || 0)
      })
      const top = acted.slice(0, 3)
      const alsoTitles = top.map(c => c.title)
      const overlap = top.filter(c => userHistoryTmdbIds.has(c.id)).length
      return { ...p, also: alsoTitles, inYourLibrary: overlap }
    } catch {
      return p
    }
  }))
  return results
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
    .map((r) => ({
      key: String(r.id),
      tmdbId: r.id,
      title: r.title,
      year: r.release_date ? new Date(r.release_date).getFullYear() : '',
      dir: '',
      match: null,   // resolved by hydrateSimilarMatches via the real engine
      why: '',       // resolved from mood_tags overlap with the current film
      poster: tmdbImg(r.poster_path, 'w342'),
    }))
}

// Hydrate the Pairs-With cards with real match% (per-user engine score) and
// a "why" caption derived from mood_tags overlap with the current film.
// Films not in our internal catalog stay at match:null — the badge then
// self-hides instead of showing a fabricated descending sequence.
// Hybrid recommendation: TMDB provides the candidate pool, our engine ranks
// it. Result reads as "engine-picked above, TMDB's other suggestions below."
//
// Three tiers in the returned order:
//   1. In-catalog films the engine ranked (match% passed the floor),
//      sorted by match desc. These are the real recommendations.
//   2. Off-catalog films (no movies row to score). Kept in their original
//      TMDB order — TMDB suggested them, we can't agree or disagree.
//      They render without a match badge (already self-hides on null).
//   3. (DROPPED) In-catalog films where computeMatchPercent returned null
//      i.e. engineScore < 50 — the engine actively rejects them. No reason
//      to surface a card our own scoring would never have produced.
//
// Signed-out / cold-start users skip the rerank entirely so the section
// still has 12 candidates — TMDB-order, no badges, no drops.
async function hydrateSimilarMatches(similar, profile, currentMoodTags) {
  if (!similar || similar.length === 0) return similar
  const tmdbIds = similar.map(s => s.tmdbId).filter(Boolean)
  if (tmdbIds.length === 0) return similar
  try {
    const { data: rows } = await supabase
      .from('movies')
      .select(`${MOVIE_DB_COLS}, tmdb_id`)
      .in('tmdb_id', tmdbIds)
    const rowByTmdb = new Map((rows || []).map(r => [r.tmdb_id, r]))
    const currentMoodSet = new Set(currentMoodTags || [])

    // First pass: enrich every candidate with whatever we can derive.
    // `_inCatalog` tracks whether the engine had data to score this film;
    // we strip it before returning so the rest of the app doesn't see it.
    const enriched = similar.map(s => {
      const row = rowByTmdb.get(s.tmdbId)
      if (!row) return { ...s, _inCatalog: false }
      // Match % via the same engine path the hero uses, so the badge here
      // and the hero's match ring are computed identically.
      let match = null
      let dir = s.dir
      if (profile) {
        const result = scoreMovieForUser(row, profile, 'default')
        if (result) {
          const pct = computeMatchPercent({ engineScore: result.score, profile })
          if (pct != null) match = pct
        }
      }
      if (row.director_name) dir = row.director_name
      // "Why" caption — top 2 shared mood_tags with the current film.
      // Phrased as a sentence rather than a tag dump so the card reads
      // like editorial, not raw metadata.
      let why = ''
      const otherMoods = Array.isArray(row.mood_tags) ? row.mood_tags : []
      const shared = otherMoods.filter(t => currentMoodSet.has(t)).slice(0, 2)
      if (shared.length > 0) {
        const labels = shared.map(s => s.charAt(0).toLowerCase() + s.slice(1))
        const joined = labels.length === 2 ? `${labels[0]} and ${labels[1]}` : labels[0]
        why = `Lands in the same ${joined} register.`
      }
      return { ...s, match, why, dir, _inCatalog: true }
    })

    const strip = ({ _inCatalog, ...rest }) => rest

    // Without a profile we can't score — fall back to TMDB order (the
    // signed-out / cold-start experience).
    if (!profile) return enriched.map(strip)

    const scored = enriched.filter(s => s._inCatalog && s.match != null)
    const offCatalog = enriched.filter(s => !s._inCatalog)
    // Engine-rejected in-catalog films are dropped on purpose (see header).
    scored.sort((a, b) => (b.match || 0) - (a.match || 0))
    return [...scored, ...offCatalog].map(strip)
  } catch {
    return similar
  }
}

// TMDB ships duplicate-looking variants for the same brand (e.g. Apple TV +
// Apple TV Plus + Apple TV Store, Amazon Prime Video + Amazon Video +
// Amazon Video with Ads). They're distinct SKUs technically but visually
// noisy in a chip grid. Collapse them down to the brand root so the row
// reads cleanly.
function brandKey(name) {
  return (name || '')
    .toLowerCase()
    // Strip the marketing suffix words that TMDB uses to differentiate SKUs.
    // Order matters: longer phrases first so "with ads" beats "ads".
    .replace(/\bwith ads?\b/g, '')
    .replace(/\bon demand\b/g, '')
    .replace(/\bprime\b/g, '')
    .replace(/\bplus\b/g, '')
    .replace(/\bvideo\b/g, '')
    .replace(/\bstore\b/g, '')
    .replace(/\bmovies?\b/g, '')
    .replace(/\bads?\b/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim()
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
  // Dedupe by brand root. Use a fresh Set for the streaming row, then a
  // shared Set across rent+buy because the section renders those two as
  // a single visual row — without sharing, "Amazon Video (rent)" and
  // "Amazon Video (buy)" both render as side-by-side chips.
  const dedupe = (chips, seen) => {
    const out = []
    for (const c of chips) {
      const k = brandKey(c.name)
      if (!k || seen.has(k)) continue
      seen.add(k)
      out.push(c)
    }
    return out
  }
  const flatrate = dedupe((area?.flatrate || []).map(toChip), new Set()).slice(0, 6)
  const sharedRentBuy = new Set()
  const rent = dedupe((area?.rent || []).map(toChip), sharedRentBuy).slice(0, 6)
  const buy = dedupe((area?.buy || []).map(toChip), sharedRentBuy).slice(0, 6)
  return { flatrate, rent, buy, link }
}

// Director-shelf candidate pool. Two improvements over the old "newest first"
// sort:
//   1. Drop shorts / docs / obscure entries that flooded the top spots for
//      directors with active recent output (e.g. a 2024 Robbie Robertson doc
//      outranking Killers of the Flower Moon). `vote_count >= 100` is a
//      cheap proxy for "real feature with audience reach."
//   2. Sort by TMDB `vote_average` desc — this is the cold-start order.
//      hydrateDirShelf reranks with the engine when a profile is available,
//      replacing this fallback with personalised picks.
//
// Pool size grows from 5 to 12 so the engine has something to choose from.
function mapDirectorFilmography(personJson, currentTmdbId) {
  const directed = (personJson?.crew || [])
    .filter(c => c.job === 'Director' && c.id !== currentTmdbId && c.poster_path)
    .filter(c => (c.vote_count || 0) >= 100)
  const seen = new Set()
  const unique = directed.filter(f => {
    if (seen.has(f.id)) return false
    seen.add(f.id)
    return true
  })
  return unique
    .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
    .slice(0, 12)
    .map(f => ({
      tmdbId: f.id,
      title: f.title,
      year: f.release_date ? new Date(f.release_date).getFullYear() : '',
      voteAvg: f.vote_average || 0,
      yourRating: null,  // populated by hydrateDirShelf post-fetch
      poster: tmdbImg(f.poster_path, 'w342'),
    }))
}

// Two jobs on the same payload:
//   1. Engine-rerank the 12-film pool by per-user score, take top 5. Falls
//      back to the cold-start `vote_average` order when no profile yet, so
//      anonymous / new users still see canonical top picks instead of
//      whatever scored 0 against an empty fingerprint.
//   2. Stamp each surviving card with the user's 1-5★ rating (when they've
//      rated it). Films the user hasn't rated stay at yourRating:null and
//      the card renders the "NEW TO YOU" fallback.
async function hydrateDirShelf(dirShelf, userId, profile) {
  if (!dirShelf || dirShelf.length === 0) return dirShelf
  const tmdbIds = dirShelf.map(f => f.tmdbId).filter(Boolean)
  if (tmdbIds.length === 0) return dirShelf
  try {
    // Fetch internal id + engine cols for every candidate. Single query
    // serves both the rating lookup AND the engine rerank.
    const { data: rows } = await supabase
      .from('movies')
      .select(`${MOVIE_DB_COLS}, id, tmdb_id`)
      .in('tmdb_id', tmdbIds)
    const rowByTmdb = new Map((rows || []).map(r => [r.tmdb_id, r]))

    // Rerank pass — only when we have a profile to score against. Without
    // it the function just slices the existing vote_average order.
    let ordered = dirShelf
    if (profile) {
      const scored = dirShelf.map(f => {
        const row = rowByTmdb.get(f.tmdbId)
        if (!row) return { ...f, _engineScore: -1 }  // off-catalog → last
        const result = scoreMovieForUser(row, profile, 'default')
        return { ...f, _engineScore: result?.score ?? 0 }
      })
      // Engine score desc; ties broken by TMDB vote_average so we don't
      // shuffle a director's "two films, identical engine score" pair.
      scored.sort((a, b) =>
        b._engineScore - a._engineScore || (b.voteAvg || 0) - (a.voteAvg || 0)
      )
      ordered = scored.map(({ _engineScore, ...rest }) => rest)
    }
    ordered = ordered.slice(0, 5)

    // Rating hydration — only meaningful for signed-in users.
    if (!userId) return ordered
    const internalIds = ordered
      .map(f => rowByTmdb.get(f.tmdbId)?.id)
      .filter(Boolean)
    if (internalIds.length === 0) return ordered
    const { data: ratings } = await supabase
      .from('user_ratings')
      .select('movie_id, rating')
      .eq('user_id', userId)
      .in('movie_id', internalIds)
    if (!ratings || ratings.length === 0) return ordered
    const tmdbByInternal = new Map(
      Array.from(rowByTmdb.values()).map(r => [r.id, r.tmdb_id])
    )
    const ratingByTmdb = new Map()
    for (const r of ratings) {
      const t = tmdbByInternal.get(r.movie_id)
      if (t) ratingByTmdb.set(t, Math.round(r.rating / 2))  // 1-10 → 1-5
    }
    return ordered.map(f => ratingByTmdb.has(f.tmdbId)
      ? { ...f, yourRating: ratingByTmdb.get(f.tmdbId) }
      : f
    )
  } catch {
    return dirShelf.slice(0, 5)
  }
}

const EMPTY_PROVIDERS = { flatrate: [], rent: [], buy: [], link: '' }
const INITIAL_STATE = {
  mv: null,
  cast: [],
  videos: [],
  providers: EMPTY_PROVIDERS,
  providerStatus: 'loading', // F5.7: 'idle'|'loading'|'found'|'empty'|'error'
  providerRegion: 'US',
  similar: [],
  dirShelf: [],
  filmDbRow: null,     // internal movies row — mood_tags + llm_* used by Mood Radar / Why-for-you
  moodAxes: null,      // derived 6-axis radar; null when no LLM signal
  overlay: null,       // curated editorial overlay (movies_editorial_overlay) when present
  hasOverlay: false,
  boundaryWarnings: [], // [{ id, label }] for /preferences boundaries the user has on AND this film matches
  contentSources: null, // F5.2 provenance metadata (origin/presentation per content surface); NOT rendered
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
        const [details, releaseDates, providers, filmDbResult, userSettingsResult] = await Promise.all([
          getMovieDetails(id),
          fetchJson(`/movie/${id}/release_dates`).catch(() => null),
          // F5.7: keep the provider request in the same parallel batch, but settle it
          // explicitly so an EMPTY result and a FAILED request can be told apart. No
          // second request, no retry.
          fetchJson(`/movie/${id}/watch/providers`).then(data => ({ ok: true, data })).catch(() => ({ ok: false, data: null })),
          supabase.from('movies').select(MOVIE_DB_COLS).eq('tmdb_id', id).maybeSingle(),
          // user's content-boundary toggles (anonymous viewers get [])
          user?.id
            ? supabase.from('user_settings').select('settings').eq('user_id', user.id).maybeSingle()
            : Promise.resolve({ data: null }),
        ])
        if (abort) return
        if (!details || details?.success === false || details?.status_code) {
          // Normalized internal signal — never store the raw TMDB status_message.
          throw Object.assign(new Error('movie_not_found'), { kind: 'not_found' })
        }

        const usCert = releaseDates?.results?.find(r => r.iso_3166_1 === 'US')
          ?.release_dates?.[0]?.certification || ''

        const mv = mapTmdbToMv(details, { certification: usCert })
        const cast = mapTmdbToCast(details)
        const videos = mapTmdbToVideos(details)
        const similar = mapTmdbToSimilar(details)
        // F5.7: `providers` is now { ok, data }. On failure → EMPTY_PROVIDERS + an
        // explicit 'error' status (never an 'empty'). The mapped array shape/order
        // are unchanged. classifyMovieProviderState resolves found/empty/error.
        const providerOk = providers?.ok !== false
        const prov = mapTmdbProviders(providerOk ? providers?.data : null)
        const providerStatus = classifyMovieProviderState({ loading: false, failed: !providerOk, providers: prov }).status
        const filmDbRow = filmDbResult?.data || null
        const moodAxes = deriveMoodAxes(filmDbRow)

        // Engine-derived match % for the hero ring + Pairs-With cards.
        // Both reads share the SAME profile so the % is identical wherever
        // a given (user, film) pair appears.
        let engineProfile = null
        if (filmDbRow && user?.id) {
          engineProfile = await computeUserProfile(user.id).catch(() => null)
          if (abort) return
          if (engineProfile) {
            // scoreMovieForUser returns null when a hard-filter triggers
            // (muted director or active content boundary). In that case we
            // intentionally skip the match % — the film still loads, the
            // warning line below tells the user why we wouldn't have picked it.
            const result = scoreMovieForUser(filmDbRow, engineProfile, 'default')
            if (result) {
              const pct = computeMatchPercent({ engineScore: result.score, profile: engineProfile })
              if (pct != null) mv.ffMatch = pct
            }
          }
        }

        // Pairs-With: real per-user match % + mood-overlap "why" caption.
        // Films from TMDB recommendations that aren't in our catalog stay
        // unscored (badge hides). The current film's mood_tags drive the
        // "Shares" caption — purely shared signal, no fabrication.
        const enrichedSimilar = await hydrateSimilarMatches(
          similar,
          engineProfile,
          filmDbRow?.mood_tags || [],
        )
        if (abort) return

        // Content boundary warnings — only the boundaries the user has on
        // AND this film matches. Empty when anonymous or when no toggles are
        // on. Computed off filmDbRow which has the engine-shaped keywords +
        // certification columns; falls back to empty if film isn't in our
        // catalog.
        const userBoundaries = userSettingsResult?.data?.settings?.prefs?.boundaries
        const boundaryWarnings = filmDbRow && userBoundaries
          ? activeMovieBoundaries(filmDbRow, userBoundaries).map(b => ({ id: b, label: BOUNDARY_LABEL[b] }))
          : []

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

        // Fold in FF critic/audience scores + overlay daypart so the hero
        // shows real numbers instead of fabricated TMDB-multiples.
        mergeFilmDbSignals(mv, filmDbRow, overlay)

        // §7: NO browser-triggered overlay generation. We render whatever curated
        // overlay already exists (or derived cold-path copy); we never call the
        // generate-movie-overlay edge function from the page.

        setState({
          mv,
          cast,
          videos,
          similar: enrichedSimilar,
          providers: prov,
          providerStatus,
          providerRegion: 'US',
          dirShelf: [],
          filmDbRow,
          moodAxes,
          overlay,
          hasOverlay: Boolean(overlay),
          boundaryWarnings,
          // F5.2 provenance metadata — records WHERE each Film File surface comes
          // from (origin/presentation). Unrendered: no consumer reads it yet. The
          // social/rating surfaces resolve in their own hooks, so they are classified
          // from the data this layer has (overlay/filmRow/match/providers).
          contentSources: classifyFilmFileContent({
            overlay,
            filmRow: filmDbRow,
            matchPct: mv.ffMatch,
            providers: prov,
          }),
          loading: false,
          error: null,
        })

        if (mv.directorId) {
          fetchJson(`/person/${mv.directorId}/movie_credits`)
            .then(async personJson => {
              if (abort) return
              // baseShelf is 12 candidates sorted by TMDB vote_average — the
              // cold-start order. We render the top 5 immediately so the
              // section appears without waiting on the engine, then swap in
              // the engine-reranked + rating-stamped top 5 when ready.
              const baseShelf = mapDirectorFilmography(personJson, mv.id)
              setState(s => ({ ...s, dirShelf: baseShelf.slice(0, 5) }))
              const hydrated = await hydrateDirShelf(baseShelf, user?.id, engineProfile)
              if (!abort) setState(s => ({ ...s, dirShelf: hydrated }))
            })
            .catch(() => { /* silent — shelf just stays empty */ })
        }

        // Cast "Also in" — fetch each member's filmography in parallel and
        // populate p.also + p.inYourLibrary with real titles + real overlap
        // count. Non-blocking; the cards render immediately and the back
        // face lights up when the fetches resolve.
        if (cast.length > 0) {
          hydrateCastAlsoIn(cast, mv.id, user?.id)
            .then(hydratedCast => {
              if (abort) return
              setState(s => ({ ...s, cast: hydratedCast }))
            })
            .catch(() => { /* silent — back face stays empty */ })
        }
      } catch (e) {
        if (abort) return
        // F5.7: store ONLY a normalized internal kind — never a raw error string for
        // rendering. Diagnostic detail stays in the console (no secrets).
        console.warn('[useMovieData] load failed:', e?.kind || e?.status || e?.message || e)
        // §6: a real TMDB HTTP 404 throws from fetchJson with e.status === 404 (no
        // `kind`) — normalize it to not_found so the route shows the correct safe copy
        // rather than a generic load error. A not-found TMDB payload already sets kind.
        const kind = (e?.kind === 'not_found' || e?.status === 404) ? 'not_found' : 'load_error'
        setState(s => ({ ...s, loading: false, error: { kind } }))
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
