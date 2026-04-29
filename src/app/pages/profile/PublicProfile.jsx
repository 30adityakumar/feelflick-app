// src/app/pages/profile/PublicProfile.jsx
import { useEffect, useMemo, useRef, useState } from 'react'

import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import { Film, Star, Bookmark, Sparkles, Users, UserPlus } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import { tmdbImg } from '@/shared/api/tmdb'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import FollowButton from '@/shared/components/FollowButton'
import TasteFingerprint from './TasteFingerprint'
import { useTasteFingerprint } from '@/shared/hooks/useTasteFingerprint'

import {
  RATING_PERSONALITY,
  TASTE_SUMMARIES,
  TASTE_FALLBACK,
  resolveGenreName,
  countAndSort,
  formatMemberSince,
  SectionHeader,
  StatCard,
  ProfileAvatar,
  StatPill,
  SidebarListCard,
} from './profileUtils'

// ============================================================================
// TASTE MATCH HELPERS
// ============================================================================

/**
 * Compute taste similarity between two users from client-side data.
 * @param {{ viewedGenres: string[], currentGenres: string[], viewedMoods: string[], currentMoods: string[], viewedMovieIds: number[], currentMovieIds: number[], viewedHistory: object[] }} p
 * @returns {{ filmsInCommon: number, genreScore: number, moodScore: number, overallScore: number, firstSharedFilm: object|null }}
 */
function computeTasteMatch({ viewedGenres, currentGenres, viewedMoods, currentMoods, viewedMovieIds, currentMovieIds, viewedHistory }) {
  const currentSet = new Set(currentMovieIds)
  const commonIds = viewedMovieIds.filter((id) => currentSet.has(id))
  const filmsInCommon = commonIds.length

  // Jaccard genre overlap
  const vG = new Set(viewedGenres)
  const cG = new Set(currentGenres)
  const genreIntersect = [...vG].filter((g) => cG.has(g)).length
  const genreUnion = new Set([...vG, ...cG]).size
  const genreScore = genreUnion > 0 ? genreIntersect / genreUnion : 0

  // Jaccard mood overlap
  const vM = new Set(viewedMoods)
  const cM = new Set(currentMoods)
  const moodIntersect = [...vM].filter((m) => cM.has(m)).length
  const moodUnion = new Set([...vM, ...cM]).size
  const moodScore = moodUnion > 0 ? moodIntersect / moodUnion : 0

  // Weighted overall: 50% genre + 30% mood + 20% films (capped at 10)
  const overallScore = 0.5 * genreScore + 0.3 * moodScore + 0.2 * Math.min(filmsInCommon / 10, 1)

  // First shared film for display
  const commonSet = new Set(commonIds)
  const firstEntry = viewedHistory.find((e) => commonSet.has(e.movie_id) && e.movies)
  const firstSharedFilm = firstEntry
    ? {
        title: firstEntry.movies.title,
        posterPath: firstEntry.movies.poster_path,
        year: firstEntry.movies.release_date
          ? new Date(firstEntry.movies.release_date).getFullYear()
          : null,
        tmdbId: firstEntry.movies.tmdb_id,
      }
    : null

  return { filmsInCommon, genreScore, moodScore, overallScore, firstSharedFilm }
}

/** @param {number} score - 0–1 */
function getScoreColor(score) {
  if (score >= 0.7) return 'text-emerald-400'
  if (score >= 0.4) return 'text-amber-400'
  return 'text-pink-400'
}

const COMPATIBILITY_SENTENCES = [
  [0.8, 'A rare cinematic bond \u2014 you two were made to watch films together.'],
  [0.6, 'Strong taste overlap \u2014 you\u2019ll rarely argue about what to watch.'],
  [0.4, 'Solid common ground \u2014 expect some great discoveries watching together.'],
  [0.2, 'Different tastes \u2014 that means lots of new recommendations for each other.'],
  [0,   'Opposites attract \u2014 your film worlds barely overlap, but that\u2019s interesting.'],
]

/** @param {number} score - 0–1 */
function getCompatibilitySentence(score) {
  for (const [threshold, sentence] of COMPATIBILITY_SENTENCES) {
    if (score >= threshold) return sentence
  }
  return COMPATIBILITY_SENTENCES[COMPATIBILITY_SENTENCES.length - 1][1]
}

// ============================================================================
// SKELETON
// ============================================================================

function ProfileSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex items-center gap-5">
        <div className="h-16 w-16 rounded-full bg-purple-500/[0.04] flex-shrink-0" />
        <div className="space-y-2.5 flex-1">
          <div className="h-5 w-40 rounded-lg bg-purple-500/[0.04]" />
          <div className="h-3 w-28 rounded bg-purple-500/[0.04]" />
        </div>
      </div>
      <div className="flex gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-28 rounded-full bg-purple-500/[0.04]" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-purple-500/[0.04]" />
        ))}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="aspect-[2/3] rounded-xl bg-purple-500/[0.04]" />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// NOT FOUND STATE
// ============================================================================

function UserNotFound() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center text-center py-24 px-4"
    >
      <div className="h-20 w-20 rounded-full bg-white/5 border border-white/8 flex items-center justify-center mb-6">
        <Film className="h-9 w-9 text-white/20" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-white mb-2">User not found</h2>
      <p className="text-white/40 text-sm max-w-sm mb-6">
        This profile doesn&apos;t exist or may have been removed.
      </p>
      <Link
        to="/home"
        className="inline-flex items-center gap-2 rounded-xl bg-white/8 border border-white/10 px-6 py-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/12 hover:text-white"
      >
        Go home
      </Link>
    </motion.div>
  )
}

// ============================================================================
// EMPTY PROFILE (viewed user has no watch history)
// ============================================================================

function EmptyPublicProfile({ displayName }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center text-center py-24 px-4"
    >
      <div className="h-20 w-20 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
        <Film className="h-9 w-9 text-purple-400/60" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-white mb-2">
        {displayName} hasn&apos;t watched anything yet
      </h2>
      <p className="text-white/40 text-sm max-w-sm">
        Their taste profile will appear here once they start watching films.
      </p>
    </motion.div>
  )
}

// ============================================================================
// TASTE MATCH CARD
// ============================================================================

function TasteMatchCard({ tasteMatch, displayName }) {
  if (!tasteMatch) return null

  if (tasteMatch.insufficient) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"
      >
        <div className="flex items-center gap-2.5 mb-2">
          <Sparkles className="h-4 w-4 text-purple-400/40 flex-shrink-0" />
          <h2 className="text-sm font-semibold text-white/60">Taste Match</h2>
        </div>
        <p className="text-white/40 text-sm">
          Watch at least 5 films each to unlock your taste compatibility with {displayName}.
        </p>
      </motion.div>
    )
  }

  const { filmsInCommon, genreScore, moodScore, overallScore, firstSharedFilm } = tasteMatch
  const scoreColor = getScoreColor(overallScore)
  const sentence = getCompatibilitySentence(overallScore)
  const pct = Math.round(overallScore * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <Sparkles className="h-4 w-4 text-purple-400/60 flex-shrink-0" />
        <h2 className="text-sm font-semibold text-white/80">Taste Match</h2>
      </div>

      <div className="flex items-center gap-6">
        {/* Overall score */}
        <div className="text-center flex-shrink-0">
          <span className={`text-5xl font-black leading-none ${scoreColor}`}>{pct}%</span>
          <p className="text-white/40 text-xs mt-1">match</p>
        </div>

        {/* Sub-scores */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/40">Genre overlap</span>
            <span className="text-white/70 font-medium">{Math.round(genreScore * 100)}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/40">Mood overlap</span>
            <span className="text-white/70 font-medium">{Math.round(moodScore * 100)}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/40">Films in common</span>
            <span className="text-white/70 font-medium">{filmsInCommon}</span>
          </div>
        </div>
      </div>

      {/* Compatibility sentence */}
      <p className="text-white/40 text-sm italic mt-4 leading-relaxed">
        &ldquo;{sentence}&rdquo;
      </p>

      {/* First shared film */}
      {firstSharedFilm && (
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
          <span className="text-xs text-white/20 flex-shrink-0">Both watched</span>
          {firstSharedFilm.posterPath && (
            firstSharedFilm.tmdbId ? (
              <Link to={`/movie/${firstSharedFilm.tmdbId}`} className="flex-shrink-0 hover:opacity-80 transition-opacity">
                <img
                  src={tmdbImg(firstSharedFilm.posterPath, 'w92')}
                  alt={firstSharedFilm.title}
                  className="w-8 h-12 rounded object-cover ring-1 ring-white/10"
                />
              </Link>
            ) : (
              <img
                src={tmdbImg(firstSharedFilm.posterPath, 'w92')}
                alt={firstSharedFilm.title}
                className="w-8 h-12 rounded object-cover ring-1 ring-white/10 flex-shrink-0"
              />
            )
          )}
          <div className="min-w-0">
            <p className="text-sm text-white/70 font-medium truncate">{firstSharedFilm.title}</p>
            {firstSharedFilm.year && (
              <p className="text-xs text-white/40">{firstSharedFilm.year}</p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PublicProfile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { userId: currentUserId } = useAuthSession()

  const { fingerprint } = useTasteFingerprint(userId)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [profile, setProfile] = useState(null)
  const [history, setHistory] = useState([])
  const [ratings, setRatings] = useState([])
  const [watchlistCount, setWatchlistCount] = useState(0)
  const [moodSessions, setMoodSessions] = useState([])
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [currentUserHistory, setCurrentUserHistory] = useState([])
  const [currentUserMoodSessions, setCurrentUserMoodSessions] = useState([])
  const [userLists, setUserLists] = useState([])
  const [posterMap, setPosterMap] = useState(new Map())
  const [aiSummary, setAiSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const summaryCalledRef = useRef(false)

  // Self-redirect: don't show the current user their own public profile
  useEffect(() => {
    if (currentUserId && userId && currentUserId === userId) {
      navigate('/profile', { replace: true })
    }
  }, [currentUserId, userId, navigate])

  // === DATA FETCHING ===

  useEffect(() => {
    if (!userId) return
    let active = true

    ;(async () => {
      try {
        const [profileRes, historyRes, ratingsRes, watchlistRes, moodRes, followersRes, followingRes, currentHistoryRes, currentMoodRes, listsRes] = await Promise.all([
          supabase
            .from('users')
            .select('name, avatar_url, joined_at')
            .eq('id', userId)
            .maybeSingle(),
          supabase
            .from('user_history')
            .select('movie_id, watched_at, movies ( id, title, poster_path, genres, director_name, primary_genre, release_date, tmdb_id, mood_tags, tone_tags, fit_profile )')
            .eq('user_id', userId)
            .order('watched_at', { ascending: false }),
          supabase
            .from('user_ratings')
            .select('movie_id, rating')
            .eq('user_id', userId),
          supabase
            .from('user_watchlist')
            .select('movie_id', { count: 'exact', head: true })
            .eq('user_id', userId),
          supabase
            .from('mood_sessions')
            .select('mood_id, moods ( id, name, emoji )')
            .eq('user_id', userId),
          supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', userId),
          supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', userId),
          currentUserId
            ? supabase
                .from('user_history')
                .select('movie_id, movies ( id, genres )')
                .eq('user_id', currentUserId)
            : Promise.resolve({ data: [], error: null }),
          currentUserId
            ? supabase
                .from('mood_sessions')
                .select('mood_id, moods ( name )')
                .eq('user_id', currentUserId)
            : Promise.resolve({ data: [], error: null }),
          supabase
            .from('lists')
            .select('id, title, description, is_public')
            .eq('user_id', userId)
            .eq('is_public', true)
            .order('updated_at', { ascending: false })
            .limit(3),
        ])

        if (!active) return

        if (!profileRes.data) {
          setNotFound(true)
          return
        }

        setProfile(profileRes.data)
        setHistory(historyRes.data ?? [])
        setRatings(ratingsRes.data ?? [])
        setWatchlistCount(watchlistRes.count ?? 0)
        setMoodSessions(moodRes.data ?? [])
        setFollowersCount(followersRes.count ?? 0)
        setFollowingCount(followingRes.count ?? 0)
        setCurrentUserHistory(currentHistoryRes.data ?? [])
        setCurrentUserMoodSessions(currentMoodRes.data ?? [])

        const lists = listsRes.data ?? []
        setUserLists(lists)

        // Fetch poster thumbnails for lists
        const listIds = lists.map((l) => l.id)
        if (listIds.length > 0) {
          const { data: movieRows } = await supabase
            .from('list_movies')
            .select('list_id, movie_id, position, movies ( poster_path )')
            .in('list_id', listIds)
            .order('position', { ascending: true, nullsFirst: false })

          const pMap = new Map()
          for (const row of (movieRows || [])) {
            const existing = pMap.get(row.list_id) || { count: 0, posters: [] }
            existing.count += 1
            if (existing.posters.length < 3 && row.movies?.poster_path) {
              existing.posters.push(row.movies.poster_path)
            }
            pMap.set(row.list_id, existing)
          }
          if (active) setPosterMap(pMap)
        }
      } catch (err) {
        console.error('[PublicProfile] fetch error:', err)
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => { active = false }
  }, [userId, currentUserId])

  // === COMPUTED STATS ===

  const stats = useMemo(() => {
    const watchedCount = history.length
    const ratedCount = ratings.length

    // Top genres
    const allGenres = []
    for (const entry of history) {
      const genres = entry.movies?.genres
      if (!Array.isArray(genres)) continue
      for (const g of genres) {
        const name = resolveGenreName(g)
        if (name) allGenres.push(name)
      }
    }
    const genreCounts = countAndSort(allGenres)
    const totalGenres = allGenres.length
    const topGenres = genreCounts.slice(0, 3).map((g) => ({
      ...g,
      pct: totalGenres > 0 ? Math.round((g.count / totalGenres) * 100) : 0,
    }))

    // Top directors
    const directorNames = history
      .map((e) => e.movies?.director_name)
      .filter(Boolean)
    const topDirectors = countAndSort(directorNames).slice(0, 3)

    // Top moods
    const moodNames = moodSessions
      .filter((s) => s.moods?.name)
      .map((s) => ({ name: s.moods.name, emoji: s.moods.emoji || '' }))
    const moodMap = new Map()
    for (const m of moodNames) {
      const existing = moodMap.get(m.name)
      if (existing) {
        existing.count += 1
      } else {
        moodMap.set(m.name, { name: m.name, emoji: m.emoji, count: 1 })
      }
    }
    const topMoods = [...moodMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    // Average rating
    let avgRating = null
    let ratingPersonality = null
    if (ratedCount > 0) {
      const sum = ratings.reduce((acc, r) => acc + (r.rating || 0), 0)
      avgRating = sum / ratedCount
      for (const [threshold, label] of RATING_PERSONALITY) {
        if (avgRating >= threshold) {
          ratingPersonality = label
          break
        }
      }
    }

    // Taste summary
    const topGenreName = topGenres[0]?.name || null
    const topMoodName = topMoods[0]?.name || null
    let tasteSummary = TASTE_FALLBACK
    if (topGenreName && topMoodName) {
      const key = `${topGenreName}-${topMoodName}`
      tasteSummary = TASTE_SUMMARIES[key] || TASTE_FALLBACK
    }

    // Recently watched (first 6)
    const recentlyWatched = history
      .slice(0, 6)
      .filter((e) => e.movies?.poster_path)
      .map((e) => ({
        id: e.movies.id,
        title: e.movies.title,
        posterPath: e.movies.poster_path,
        year: e.movies.release_date
          ? new Date(e.movies.release_date).getFullYear()
          : null,
      }))

    return {
      watchedCount,
      ratedCount,
      watchlistCount,
      topGenres,
      topGenreNames5: genreCounts.slice(0, 5).map((g) => g.name),
      topDirectors,
      topMoods,
      avgRating,
      ratingPersonality,
      tasteSummary,
      recentlyWatched,
    }
  }, [history, ratings, watchlistCount, moodSessions])

  const tasteMatch = useMemo(() => {
    if (!currentUserId) return null
    const viewedMovieIds = history.map((e) => e.movie_id).filter(Boolean)
    const currentMovieIds = currentUserHistory.map((e) => e.movie_id).filter(Boolean)
    if (viewedMovieIds.length < 5 || currentMovieIds.length < 5) return { insufficient: true }

    const viewedGenres = stats.topGenreNames5 ?? []
    const currentGenres = (() => {
      const allGenres = []
      for (const entry of currentUserHistory) {
        const genres = entry.movies?.genres
        if (!Array.isArray(genres)) continue
        for (const g of genres) {
          const name = resolveGenreName(g)
          if (name) allGenres.push(name)
        }
      }
      return countAndSort(allGenres).slice(0, 5).map((g) => g.name)
    })()

    const viewedMoods = stats.topMoods.map((m) => m.name)
    const currentMoods = [...new Set(
      currentUserMoodSessions.filter((s) => s.moods?.name).map((s) => s.moods.name)
    )].slice(0, 3)

    return computeTasteMatch({ viewedGenres, currentGenres, viewedMoods, currentMoods, viewedMovieIds, currentMovieIds, viewedHistory: history })
  }, [history, stats, currentUserHistory, currentUserMoodSessions, currentUserId])

  // === DISPLAY VALUES ===

  const displayName = profile?.name || 'Film Lover'

  const avatarUrl = profile?.avatar_url || null

  const memberSince = formatMemberSince(profile?.joined_at)

  // === AI TASTE SUMMARY ===

  useEffect(() => {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
    const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

    // Wait for data to be ready
    if (!stats.topGenres?.length) return
    // Only call once
    if (summaryCalledRef.current) return
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !userId) return
    summaryCalledRef.current = true

    // Check localStorage cache (keyed by profile owner, not logged-in user)
    const cacheKey = `ff_taste_summary_v4_${userId}`
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const { summary, generatedAt } = JSON.parse(cached)
        if (summary && Date.now() - generatedAt < CACHE_TTL) {
          setAiSummary(summary)
          return
        }
      }
    } catch {
      // Corrupted cache — ignore and refetch
    }

    setSummaryLoading(true)

    ;(async () => {
      try {
        // Fetch recent watch history for richer prompt context
        const { data: historyData } = await supabase
          .from('user_history')
          .select('movies(title, mood_tags, tone_tags, fit_profile)')
          .eq('user_id', userId)
          .order('watched_at', { ascending: false })
          .limit(20)

        const watchedFilms = (historyData ?? [])
          .map((h) => h.movies)
          .filter(Boolean)
          .map((m) => m.title)

        // Aggregate mood/tone/fit signals from watch history
        const tagCounts = { mood: {}, tone: {}, fit: {} }
        for (const h of historyData ?? []) {
          const m = h.movies
          if (!m) continue
          ;(m.mood_tags ?? []).forEach((t) => { tagCounts.mood[t] = (tagCounts.mood[t] || 0) + 1 })
          ;(m.tone_tags ?? []).forEach((t) => { tagCounts.tone[t] = (tagCounts.tone[t] || 0) + 1 })
          if (m.fit_profile) tagCounts.fit[m.fit_profile] = (tagCounts.fit[m.fit_profile] || 0) + 1
        }
        const topN = (obj, n) =>
          Object.entries(obj).sort(([, a], [, b]) => b - a).slice(0, n)
        const taggedTasteSignature = {
          topMoodTags: topN(tagCounts.mood, 6).map(([tag, count]) => ({ tag, count })),
          topToneTags: topN(tagCounts.tone, 4).map(([tag, count]) => ({ tag, count })),
          topFitProfiles: topN(tagCounts.fit, 3).map(([profile, count]) => ({ profile, count })),
        }

        const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-taste-summary`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            genres: stats.topGenres.slice(0, 3).map((g) => ({
              name: g.name,
              pct: g.pct ?? 0,
            })),
            directors: stats.topDirectors.slice(0, 3).map((d) => ({
              name: d.name,
              count: d.count ?? 0,
            })),
            moods: stats.topMoods.slice(0, 3).map((m) => ({
              name: m.name,
              sessions: m.count ?? 0,
            })),
            totalWatched: stats.watchedCount ?? 0,
            avgRating: stats.avgRating ?? 0,
            ratingLabel: stats.ratingPersonality ?? '',
            watchedFilms,
            taggedTasteSignature,
          }),
        })

        const data = await res.json()
        if (data?.summary) {
          setAiSummary(data.summary)
          try {
            localStorage.setItem(
              cacheKey,
              JSON.stringify({ summary: data.summary, generatedAt: Date.now() })
            )
          } catch {
            // storage quota exceeded — ignore
          }
        }
      } catch (err) {
        console.error('[TasteSummary:Public] fetch failed:', err)
      } finally {
        setSummaryLoading(false)
      }
    })()
  }, [userId, stats.topGenres, stats.topDirectors, stats.topMoods, stats.watchedCount, stats.avgRating, stats.ratingPersonality])

  // === RENDER ===

  return (
    <div className="min-h-screen text-white pb-24 md:pb-12" style={{ background: 'var(--color-bg)', paddingTop: 'var(--hdr-h, 64px)' }}>
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 35% at 50% 0%, rgba(88,28,135,0.1) 0%, transparent 65%)' }}
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loading ? (
          <ProfileSkeleton />
        ) : notFound ? (
          <UserNotFound />
        ) : stats.watchedCount === 0 ? (
          <EmptyPublicProfile displayName={displayName} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* === PROFILE HEADER === */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8"
            >
              <div className="flex items-center gap-5 mb-5">
                <ProfileAvatar name={displayName} avatarUrl={avatarUrl} size={64} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate">{displayName}</h1>
                    <FollowButton userId={userId} />
                  </div>
                  {memberSince && (
                    <p className="text-sm text-white/40 mt-0.5">Member since {memberSince}</p>
                  )}
                </div>
              </div>

              {/* Stat pills — non-interactive on public profile */}
              <div className="flex flex-wrap gap-2.5">
                <StatPill icon={Film} value={stats.watchedCount} label="watched" />
                <StatPill icon={Star} value={stats.ratedCount} label="rated" />
                <StatPill icon={Bookmark} value={stats.watchlistCount} label="saved" />
                <StatPill icon={Users} value={followersCount} label="followers" />
                <StatPill icon={UserPlus} value={followingCount} label="following" />
              </div>
            </motion.div>

            {/* === TASTE MATCH === */}
            <div className="mb-10">
              <TasteMatchCard tasteMatch={tasteMatch} displayName={displayName} />
            </div>

            {/* === TASTE SUMMARY — above the fold === */}
            {stats.watchedCount >= 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative rounded-2xl overflow-hidden border border-purple-500/25 bg-gradient-to-br from-purple-500/[0.08] via-transparent to-pink-500/[0.04] p-5 mb-10"
              >
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(168,85,247,0.12)' }} aria-hidden />
                <div className="relative flex items-start gap-3">
                  <span className="text-purple-400/70 mt-0.5 shrink-0" aria-hidden>&#10022;</span>
                  {summaryLoading ? (
                    <div className="flex-1 space-y-2 animate-pulse">
                      <div className="h-4 w-3/4 rounded bg-purple-500/[0.08]" />
                      <div className="h-4 w-1/2 rounded bg-purple-500/[0.08]" />
                    </div>
                  ) : (
                    <p className="text-sm sm:text-base text-white/70 leading-relaxed italic">
                      &ldquo;{aiSummary || stats.tasteSummary}&rdquo;
                    </p>
                  )}
                  {!summaryLoading && aiSummary && (
                    <span className="shrink-0 self-start rounded-full bg-purple-500/15 border border-purple-500/25 px-2 py-0.5 text-[10px] font-semibold text-purple-300 uppercase tracking-wider">
                      AI
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* === TWO-COLUMN LAYOUT === */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">

              {/* LEFT: Main content */}
              <div className="min-w-0 space-y-10">

                {/* === CINEMATIC DNA === */}
                <div>
                  <SectionHeader title={`${displayName}\u2019s Cinematic DNA`} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Top Genres */}
                    <StatCard index={0}>
                      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Top Genres</h3>
                      {stats.topGenres.length > 0 ? (
                        <div className="space-y-2.5">
                          {stats.topGenres.map((g) => (
                            <div key={g.name}>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-white/80 font-medium">{g.name}</span>
                                <span className="text-white/40 text-xs">{g.pct}%</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                                  initial={{ width: 0 }}
                                  whileInView={{ width: `${g.pct}%` }}
                                  viewport={{ once: true }}
                                  transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white/20 text-sm">Not enough data yet</p>
                      )}
                    </StatCard>

                    {/* Top Directors */}
                    <StatCard index={1}>
                      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Top Directors</h3>
                      {stats.topDirectors.length > 0 ? (
                        <div className="space-y-2">
                          {stats.topDirectors.map((d, i) => (
                            <div key={d.name} className="flex items-center justify-between">
                              <span className="text-white/80 text-sm font-medium">
                                <span className="text-white/20 text-xs mr-2">{i + 1}.</span>
                                {d.name}
                              </span>
                              <span className="text-white/40 text-xs">
                                {d.count} {d.count === 1 ? 'film' : 'films'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white/20 text-sm">Director data isn&apos;t available yet</p>
                      )}
                    </StatCard>

                    {/* Mood Patterns */}
                    <StatCard index={2}>
                      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Mood Patterns</h3>
                      {stats.topMoods.length > 0 ? (
                        <div className="space-y-2">
                          {stats.topMoods.map((m) => (
                            <div key={m.name} className="flex items-center justify-between">
                              <span className="text-white/80 text-sm font-medium">
                                {m.emoji && <span className="mr-1.5">{m.emoji}</span>}
                                {m.name}
                              </span>
                              <span className="text-white/40 text-xs">
                                {m.count} {m.count === 1 ? 'session' : 'sessions'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white/20 text-sm">No mood data yet</p>
                      )}
                    </StatCard>
                  </div>
                </div>

                {/* === TASTE FINGERPRINT === */}
                <TasteFingerprint fingerprint={fingerprint} history={history} />

                {/* === RECENTLY WATCHED === */}
                {stats.recentlyWatched.length > 0 && (
                  <div>
                    <SectionHeader title="Recently Watched" />
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {stats.recentlyWatched.map((movie, idx) => (
                        <motion.div
                          key={movie.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.3) }}
                        >
                          <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/8">
                            <img
                              src={tmdbImg(movie.posterPath, 'w185')}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <p className="text-white/60 text-[11px] mt-1.5 line-clamp-2 leading-tight">{movie.title}</p>
                          {movie.year && (
                            <p className="text-white/20 text-[10px]">{movie.year}</p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: Sidebar — hidden on mobile, sticky on desktop */}
              <aside className="hidden lg:block sticky top-[calc(var(--hdr-h,64px)+24px)] space-y-4">

                {/* Rating Style card */}
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Rating Style</h3>
                  {stats.avgRating != null ? (
                    <div>
                      <div className="flex items-baseline gap-1.5 mb-2">
                        <span className="text-3xl font-black text-white">{stats.avgRating.toFixed(1)}</span>
                        <span className="text-white/20 text-sm font-medium">/ 10</span>
                        <span className="text-white/40 text-xs ml-1">avg</span>
                      </div>
                      {stats.ratingPersonality && (
                        <p className="text-white/40 text-xs leading-relaxed">{stats.ratingPersonality}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-white/20 text-sm">No ratings yet</p>
                  )}
                </div>

                {/* Lists widget */}
                {userLists.length > 0 && (
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-purple-400 to-pink-500 shrink-0" />
                      <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
                        {displayName}&rsquo;s Lists
                      </span>
                    </div>
                    <div className="space-y-2">
                      {userLists.map((list) => {
                        const data = posterMap.get(list.id)
                        return (
                          <SidebarListCard
                            key={list.id}
                            list={{ ...list, film_count: data?.count ?? 0 }}
                            posters={data?.posters ?? []}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}
              </aside>

            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
