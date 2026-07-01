// src/features/dna/useDnaProfileData.jsx
// Assembles the /DNA social-profile model for three modes:
//   • owner   — the signed-in user's own profile (direct RLS-allowed reads of their rows)
//   • visitor — another member's profile via profilePublic-gated SECURITY DEFINER RPCs
//   • view-as-visitor is NOT a data mode: the page renders the owner model but applies the
//     owner's own section-visibility projection (resolveSectionVisibility) + visitor chrome.
//
// All numbers are real or honest-empty. Reuses the existing pure profile derivations; adds the
// DNA-specific ones from ./derive/dnaProfileDerivations. Never calls the editorial Edge function.

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { getTasteFingerprint } from '@/shared/services/tasteCache'
import { dedupeHistoryByMovie } from '@/shared/lib/canonicalHistory'
import {
  deriveMoods, deriveDirectors,
  deriveTrajectoryAllTime, deriveDecades, deriveRuntime, deriveDaypart,
} from '@/features/profile/derive'
import { deriveRatingLanguage } from '@/features/profile/derive/ratingLanguage'
import { deriveTasteJourney } from '@/features/profile/derive/tasteJourney'
import { deriveYIR } from '@/features/profile/derive'
import { archetypeForFingerprint } from '@/features/profile/archetype'
import { classifyProfileMaturity, MATURITY } from '@/features/profile/derive/profilePresentation'
import { resolveDnaIdentity } from '@/features/profile/dna/identity'
import {
  deriveYearByMonth, deriveActivity,
  resolveFeatured, resolveHighlights, resolveSectionVisibility, movieView,
} from './derive/dnaProfileDerivations'

const HISTORY_COLS = `movie_id, watched_at, movies!inner ( id, tmdb_id, title, director_name, release_date, runtime, mood_tags, tone_tags, poster_path, backdrop_path )`

function firstName(name) {
  return (name || '').trim().split(/\s+/)[0] || ''
}

// Shape flat RPC taste rows → the {movie_id, watched_at, movies:{...}} form the derives expect.
function rowsToHistory(rows) {
  return (rows || []).map((r) => ({
    movie_id: r.movie_id,
    watched_at: r.watched_at,
    movies: {
      id: r.movie_id, tmdb_id: r.tmdb_id, title: r.title, director_name: r.director_name,
      release_date: r.release_date, runtime: r.runtime, mood_tags: r.mood_tags, tone_tags: r.tone_tags,
      poster_path: r.poster_path, backdrop_path: r.backdrop_path,
    },
  }))
}

function normalizeReviews(rows, ratingsByMovieId) {
  // rows: either raw user_ratings (owner) or get_dna_public_reviews rows (visitor)
  return (rows || [])
    .filter((r) => r.review_text && String(r.review_text).trim())
    .map((r) => ({
      movieId: r.movie_id,
      title: r.title || null,
      posterPath: r.poster_path || null,
      rating: r.rating ?? ratingsByMovieId?.get(r.movie_id)?.rating ?? null,
      reviewText: String(r.review_text).trim(),
      ratedAt: r.rated_at || null,
    }))
    .sort((a, b) => new Date(b.ratedAt || 0) - new Date(a.ratedAt || 0))
}

function buildModel({ mode, identity, dnaProfile, visibility, fingerprint, canonicalHistory, ratings, reviews, lists, social, watchedTotal, ratedTotal }) {
  const ratingsByMovieId = new Map(ratings.map((r) => [r.movie_id, r]))
  const isOwner = mode === 'owner'

  // Stats — all real. NO "rewatches": the repo has no rewatch model (user_history is deduped by
  // (user, movie); see src/features/history). Hours watched is the honest 4th stat.
  const filmsWatched = Math.max(canonicalHistory.length, Number(watchedTotal) || 0)
  const filmsRated = Math.max(ratings.length, Number(ratedTotal) || 0)
  const rl = deriveRatingLanguage({ ratings })
  const avgStars = rl?.averageStars ?? null
  const hoursWatched = Math.round(canonicalHistory.reduce((s, h) => s + (h.movies?.runtime || 0), 0) / 60)

  // DNA identity (archetype/forming/tags) — same builder as the public profile
  const archetype = archetypeForFingerprint(fingerprint)
  const maturity = classifyProfileMaturity({ watchedCount: filmsWatched, ratedCount: filmsRated })
  const dnaConfidence = maturity === MATURITY.ESTABLISHED ? 72 : maturity === MATURITY.EMERGING ? 48 : 15
  const moods = deriveMoods(fingerprint)
  const dnaIdentity = resolveDnaIdentity({
    user: { name: identity.name },
    stats: { filmsLogged: filmsWatched, filmsRated, dnaConfidence },
    moods,
    editorial: { archetype, summary: null, signature: null, generatedAt: null },
    editorialStatus: maturity === MATURITY.FORMING ? 'forming' : 'none',
  }, isOwner ? null : firstName(identity.name))

  const directors = deriveDirectors({ history: canonicalHistory, ratingsByMovieId })

  // Charts
  const charts = {
    trendAll: deriveTrajectoryAllTime({ history: canonicalHistory }).map((b) => ({ label: b.label, count: b.count })),
    trendYear: deriveYearByMonth(canonicalHistory),
    ratingBuckets: rl?.buckets || [],
    ratingLanguage: rl,
    decades: deriveDecades({ history: canonicalHistory }),
    runtime: deriveRuntime({ history: canonicalHistory }),
    daypart: deriveDaypart({ history: canonicalHistory }),
  }

  // Featured (curated → honest fallback)
  const featured = resolveFeatured({ dnaProfile, history: canonicalHistory, ratingsByMovieId, reviews, lists })
  const highlights = resolveHighlights({ dnaProfile, history: canonicalHistory, ratingsByMovieId })

  // Activity
  const activity = deriveActivity({ canonicalHistory, ratingsByMovieId, lists, limit: 12 })

  // Journey (for the cover chapter-card + DNA-tab "current chapter") + year-in-review (emerging edge)
  const journey = deriveTasteJourney({ history: canonicalHistory })
  const yir = deriveYIR({ history: canonicalHistory })
  const currentChapter = journey.length ? journey[journey.length - 1] : null
  const emergingEdge = yir?.topMoodGrowth?.mood && yir.topMoodGrowth.mood !== '—' ? yir.topMoodGrowth.mood : null

  // Films / diary for tabs
  const films = canonicalHistory.map((h) => ({ ...movieView(h), rating: ratingsByMovieId.get(h.movie_id)?.rating ?? null, watchedAt: h.watched_at }))
  const diary = [...canonicalHistory]
    .filter((h) => h.watched_at)
    .sort((a, b) => new Date(b.watched_at) - new Date(a.watched_at))
    .map((h) => ({ ...movieView(h), rating: ratingsByMovieId.get(h.movie_id)?.rating ?? null, watchedAt: h.watched_at }))

  // Reputation — grounded traits only (archetype + top moods + top fit); NO endorsement counts
  const reputationKnownFor = [
    ...(archetype || []).slice(0, 2),
    ...moods.slice(0, 3).map((m) => m.name),
  ].filter(Boolean).slice(0, 5)

  return {
    mode,
    isOwner,
    identity,
    visibility,
    dnaProfile,
    stats: { filmsWatched, avgStars, reviews: reviews.length, hoursWatched },
    dna: dnaIdentity,
    moods,
    directors,
    charts,
    featured,
    highlights,
    activity,
    films,
    diary,
    reviews,
    lists,
    reputationKnownFor,
    journey,
    currentChapter,
    emergingEdge,
    social: social || { endorsements: [], reviewLikes: [], listSaves: [] },
    sections: resolveSectionVisibility({ visibility, isOwner }),
  }
}

async function fetchLists(userId, { publicOnly }) {
  let q = supabase.from('lists').select('id, title, description, is_public, updated_at').eq('user_id', userId)
  if (publicOnly) q = q.eq('is_public', true)
  const { data: listRows, error } = await q
  if (error) throw error
  const rows = listRows || []
  if (rows.length === 0) return []
  const ids = rows.map((l) => l.id)
  const { data: lm } = await supabase.from('list_movies').select('list_id, position, movies(poster_path)').in('list_id', ids).order('position', { ascending: true })
  const byList = new Map()
  for (const row of lm || []) {
    if (!byList.has(row.list_id)) byList.set(row.list_id, [])
    byList.get(row.list_id).push(row.movies?.poster_path || null)
  }
  return rows.map((l) => ({
    id: l.id, title: l.title, description: l.description || null,
    isPublic: !!l.is_public, updatedAt: l.updated_at,
    count: (byList.get(l.id) || []).length,
    posters: (byList.get(l.id) || []).filter(Boolean).slice(0, 4),
  }))
}

// Real social-proof counts (endorsements / review likes / list saves) via the profilePublic-gated
// SECURITY DEFINER RPC. Owner-bypass returns the owner's own received counts. Fails gracefully to
// empty (e.g. before the social migrations are deployed).
const EMPTY_SOCIAL = { endorsements: [], reviewLikes: [], listSaves: [] }
async function fetchSocial(targetId) {
  try {
    const { data, error } = await supabase.rpc('get_dna_social_counts', { target_user_id: targetId })
    if (error || !data) return EMPTY_SOCIAL
    return { endorsements: data.endorsements || [], reviewLikes: data.reviewLikes || [], listSaves: data.listSaves || [] }
  } catch { return EMPTY_SOCIAL }
}

export function useDnaProfileData({ userId, viewer, ownerSettings, ownerProfile }) {
  const viewerId = viewer?.id || null
  const isSelf = !userId || userId === viewerId
  const [state, setState] = useState({ status: 'loading', model: null })

  const load = useCallback(async () => {
    if (!viewerId) { setState({ status: 'loading', model: null }); return }
    setState({ status: 'loading', model: null })
    try {
      if (isSelf) {
        // ── OWNER ──────────────────────────────────────────────────────────────────────────
        const targetId = viewerId
        const [historyRes, ratingsRes, fingerprint, lists, social] = await Promise.all([
          supabase.from('user_history').select(HISTORY_COLS).eq('user_id', targetId),
          supabase.from('user_ratings').select('movie_id, rating, review_text, rated_at').eq('user_id', targetId),
          getTasteFingerprint(targetId).catch(() => null),
          fetchLists(targetId, { publicOnly: false }),
          fetchSocial(targetId),
        ])
        if (historyRes.error) throw historyRes.error
        const rawHistory = historyRes.data || []
        const canonicalHistory = dedupeHistoryByMovie(rawHistory)
        const ratings = ratingsRes.data || []
        const ratingsByMovieId = new Map(ratings.map((r) => [r.movie_id, r]))
        // reviews: attach title/poster from history for display
        const byId = new Map(canonicalHistory.map((h) => [h.movie_id, movieView(h)]))
        const reviews = normalizeReviews(ratings.map((r) => ({ ...r, title: byId.get(r.movie_id)?.title, poster_path: null })), ratingsByMovieId)
        const identity = {
          name: ownerProfile?.name || viewer?.user_metadata?.full_name || viewer?.user_metadata?.name || 'You',
          avatarUrl: ownerProfile?.avatar_url || viewer?.user_metadata?.avatar_url || null,
          joinedAt: ownerProfile?.joined_at || viewer?.created_at || null,
          handle: (ownerSettings?.dnaProfile?.handle || '').trim() || null,
          bio: (ownerSettings?.dnaProfile?.bio || '').trim() || null,
          location: (ownerSettings?.dnaProfile?.location || '').trim() || null,
          publicProfile: !!ownerSettings?.privacy?.profilePublic,
        }
        const model = buildModel({
          mode: 'owner', identity,
          dnaProfile: ownerSettings?.dnaProfile || {},
          visibility: ownerSettings?.privacy || {},
          fingerprint, canonicalHistory, ratings, reviews, lists, social,
          watchedTotal: canonicalHistory.length, ratedTotal: ratings.length,
        })
        setState({ status: 'ready', model })
        return
      }

      // ── VISITOR ──────────────────────────────────────────────────────────────────────────
      const { data: profData, error: profErr } = await supabase.rpc('get_dna_public_profile', { target_user_id: userId })
      if (profErr) throw profErr
      const prof = Array.isArray(profData) ? profData[0] : profData
      if (!prof) { setState({ status: 'private', model: null }); return }

      const visibility = prof.visibility || {}
      const curated = prof.curated || {}
      const [tasteRes, reviewRes, lists, social] = await Promise.all([
        supabase.rpc('get_dna_public_taste', { target_user_id: userId, max_rows: 500 }),
        visibility.reviewsPublic
          ? supabase.rpc('get_dna_public_reviews', { target_user_id: userId, max_rows: 100 })
          : Promise.resolve({ data: [] }),
        visibility.listsPublic ? fetchLists(userId, { publicOnly: true }).catch(() => []) : Promise.resolve([]),
        fetchSocial(userId),
      ])
      const rawHistory = rowsToHistory(tasteRes.data || [])
      const canonicalHistory = dedupeHistoryByMovie(rawHistory)
      const ratings = (tasteRes.data || []).filter((r) => r.rating != null)
        .map((r) => ({ movie_id: r.movie_id, rating: r.rating, rated_at: r.watched_at, review_text: '' }))
      const reviews = normalizeReviews(reviewRes.data || [])
      const identity = {
        name: prof.name || 'Member',
        avatarUrl: prof.avatar_url || null,
        joinedAt: null,
        handle: (curated.handle || '').trim() || null,
        bio: (curated.bio || '').trim() || null,
        location: (curated.location || '').trim() || null,
        publicProfile: true,
        followersTotal: prof.followers_total ?? null,
        followingTotal: prof.following_total ?? null,
      }
      const model = buildModel({
        mode: 'visitor', identity,
        dnaProfile: curated, visibility,
        fingerprint: prof.fingerprint || null,
        canonicalHistory, ratings, reviews, lists, social,
        watchedTotal: prof.watched_total, ratedTotal: prof.rated_total,
      })
      setState({ status: 'ready', model })
    } catch (e) {
      console.error('[useDnaProfileData]', e)
      setState({ status: 'error', model: null })
    }
  }, [viewerId, userId, isSelf, ownerSettings, ownerProfile, viewer])

  useEffect(() => { load() }, [load])

  return { ...state, isSelf, retry: load }
}
