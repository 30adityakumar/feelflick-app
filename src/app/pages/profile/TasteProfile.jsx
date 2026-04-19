// src/app/pages/profile/TasteProfile.jsx
import { useEffect, useMemo, useRef, useState } from 'react'

import { useOutletContext, Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import { Film, Star, Bookmark, Compass, Users, UserPlus, X } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import { tmdbImg } from '@/shared/api/tmdb'
import FollowButton from '@/shared/components/FollowButton'
import TasteFingerprint from './TasteFingerprint'
import { useTasteFingerprint } from '@/shared/hooks/useTasteFingerprint'

import {
  RATING_PERSONALITY_SELF,
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
// SKELETON (loading state)
// ============================================================================

function ProfileSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-5">
        <div className="h-16 w-16 rounded-full bg-purple-500/[0.04] flex-shrink-0" />
        <div className="space-y-2.5 flex-1">
          <div className="h-5 w-40 rounded-lg bg-purple-500/[0.04]" />
          <div className="h-3 w-28 rounded bg-purple-500/[0.04]" />
        </div>
      </div>
      {/* Stat pills skeleton */}
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-8 w-28 rounded-full bg-purple-500/[0.04]" />
        ))}
      </div>
      {/* DNA cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-purple-500/[0.04]" />
        ))}
      </div>
      {/* Poster grid skeleton */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="aspect-[2/3] rounded-xl bg-purple-500/[0.04]" />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyProfile() {
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
      <h2 className="text-xl font-bold text-white mb-2">Your taste profile is waiting</h2>
      <p className="text-white/40 text-sm max-w-sm mb-6">
        Start watching and rating films to build your cinematic identity. The more you watch, the more we learn about your taste.
      </p>
      <Link
        to="/discover"
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
      >
        <Compass className="h-4 w-4" />
        Discover films
      </Link>
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TasteProfile() {
  const outlet = useOutletContext() || {}
  const userId = outlet.userId
  const authUser = outlet.user

  const { fingerprint } = useTasteFingerprint(userId)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [history, setHistory] = useState([])
  const [ratings, setRatings] = useState([])
  const [watchlistCount, setWatchlistCount] = useState(0)
  const [moodSessions, setMoodSessions] = useState([])
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [followModal, setFollowModal] = useState(null) // 'followers' | 'following' | null
  const [userLists, setUserLists] = useState([])
  const [posterMap, setPosterMap] = useState(new Map())
  const [aiSummary, setAiSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const summaryCalledRef = useRef(false)

  // === DATA FETCHING ===

  useEffect(() => {
    if (!userId) return
    let active = true

    ;(async () => {
      try {
        const [profileRes, historyRes, ratingsRes, watchlistRes, moodRes, followersRes, followingRes, listsRes] = await Promise.all([
          supabase
            .from('users')
            .select('name, avatar_url, joined_at')
            .eq('id', userId)
            .maybeSingle(),
          supabase
            .from('user_history')
            .select('movie_id, watched_at, movies ( id, tmdb_id, title, poster_path, genres, director_name, primary_genre, release_date, mood_tags, tone_tags, fit_profile )')
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
          supabase
            .from('lists')
            .select('id, title, description, is_public, updated_at')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(3),
        ])

        if (!active) return

        setProfile(profileRes.data)
        setHistory(historyRes.data ?? [])
        setRatings(ratingsRes.data ?? [])
        setWatchlistCount(watchlistRes.count ?? 0)
        setMoodSessions(moodRes.data ?? [])
        setFollowersCount(followersRes.count ?? 0)
        setFollowingCount(followingRes.count ?? 0)

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
            // Count
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
        console.error('[TasteProfile] fetch error:', err)
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => { active = false }
  }, [userId])

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

    // Average rating (stored 1-10, display as /5)
    let avgRating = null
    let ratingPersonality = null
    if (ratedCount > 0) {
      const sum = ratings.reduce((acc, r) => acc + (r.rating || 0), 0)
      avgRating = sum / ratedCount
      for (const [threshold, label] of RATING_PERSONALITY_SELF) {
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
        tmdbId: e.movies.tmdb_id,
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
      topDirectors,
      topMoods,
      avgRating,
      ratingPersonality,
      tasteSummary,
      recentlyWatched,
    }
  }, [history, ratings, watchlistCount, moodSessions])

  // === DISPLAY VALUES ===

  const displayName = profile?.name
    || authUser?.user_metadata?.name
    || authUser?.email?.split('@')[0]
    || 'Film Lover'

  const avatarUrl = profile?.avatar_url || authUser?.user_metadata?.avatar_url || null

  const memberSince = formatMemberSince(profile?.joined_at)

  // === AI TASTE SUMMARY ===

  useEffect(() => {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
    const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

    console.log('[TasteSummary] effect fired', {
      topGenres: stats.topGenres?.length,
      hasCalledRef: summaryCalledRef.current,
      userId,
    })

    // Wait for data to be ready
    if (!stats.topGenres?.length) return
    // Only call once
    if (summaryCalledRef.current) return
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !userId) return
    summaryCalledRef.current = true

    // Check localStorage cache
    const cacheKey = `ff_taste_summary_v4_${userId}`
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const { summary, generatedAt } = JSON.parse(cached)
        if (summary && Date.now() - generatedAt < CACHE_TTL) {
          console.log('[TasteSummary] using cached summary')
          setAiSummary(summary)
          return
        }
      }
    } catch {
      // Corrupted cache — ignore and refetch
    }

    console.log('[TasteSummary] invoking edge function')
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
            console.log('[TasteSummary] cached for', userId)
          } catch {
            // storage quota exceeded — ignore
          }
        }
      } catch (err) {
        console.error('[TasteSummary] fetch failed:', err)
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
        ) : stats.watchedCount === 0 ? (
          <EmptyProfile />
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
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate">{displayName}</h1>
                  {memberSince && (
                    <p className="text-sm text-white/40 mt-0.5">Member since {memberSince}</p>
                  )}
                </div>
              </div>

              {/* Stat pills — clickable */}
              <div className="flex flex-wrap gap-2.5">
                <StatPill icon={Film} value={stats.watchedCount} label="watched" to="/history" />
                <StatPill icon={Star} value={stats.ratedCount} label="rated" to="/history" />
                <StatPill icon={Bookmark} value={stats.watchlistCount} label="saved" to="/watchlist" />
                <StatPill icon={Users} value={followersCount} label="followers" onClick={() => setFollowModal('followers')} />
                <StatPill icon={UserPlus} value={followingCount} label="following" onClick={() => setFollowModal('following')} />
              </div>
            </motion.div>

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
                  <SectionHeader title="Your Cinematic DNA" />
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
                    <StatCard index={2} className="sm:col-span-2">
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
                        <p className="text-white/20 text-sm">Try discovering films by mood to see your patterns</p>
                      )}
                    </StatCard>
                  </div>
                </div>

                {/* === TASTE FINGERPRINT === */}
                <TasteFingerprint fingerprint={fingerprint} history={history} />
                {history.length >= 10 && (
                  <Link
                    to="/challenges"
                    className="inline-flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200 transition-colors"
                  >
                    <Compass className="h-4 w-4" /> Expand your taste &rarr;
                  </Link>
                )}

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
                          <Link to={movie.tmdbId ? `/movie/${movie.tmdbId}` : '#'} className="block group">
                            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/8 transition-transform duration-200 group-hover:scale-[1.03]">
                              <img
                                src={tmdbImg(movie.posterPath, 'w185')}
                                alt={movie.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <p className="text-white/60 text-[11px] mt-1.5 line-clamp-2 leading-tight group-hover:text-white/70 transition-colors">{movie.title}</p>
                            {movie.year && (
                              <p className="text-white/20 text-[10px]">{movie.year}</p>
                            )}
                          </Link>
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
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Your Rating Style</h3>
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
                    <p className="text-white/20 text-sm">Rate films to discover your critic personality</p>
                  )}
                </div>

                {/* Lists widget */}
                {userLists.length > 0 && (
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-[3px] h-4 rounded-full bg-gradient-to-b from-purple-400 to-pink-500 shrink-0" />
                      <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Lists</span>
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
                    <div className="mt-3 text-right">
                      <Link to="/lists" className="text-xs text-purple-400/70 hover:text-purple-300 transition-colors font-medium">
                        See all lists &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </aside>

            </div>
          </motion.div>
        )}
      </div>

      {/* Follow list modal */}
      {followModal && (
        <FollowListModal
          type={followModal}
          userId={userId}
          onClose={() => setFollowModal(null)}
        />
      )}
    </div>
  )
}

// ============================================================================
// FOLLOW LIST MODAL
// ============================================================================

function FollowListModal({ type, userId, onClose }) {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const isFollowers = type === 'followers'
  const title = isFollowers ? 'Followers' : 'Following'

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        let query

        if (isFollowers) {
          // WHY: join user_follows → users via follower_id to get who follows this user
          query = supabase
            .from('user_follows')
            .select('follower_id, users!user_follows_follower_id_fkey ( id, name, avatar_url )')
            .eq('following_id', userId)
            .order('created_at', { ascending: false })
        } else {
          // WHY: join user_follows → users via following_id to get who this user follows
          query = supabase
            .from('user_follows')
            .select('following_id, users!user_follows_following_id_fkey ( id, name, avatar_url )')
            .eq('follower_id', userId)
            .order('created_at', { ascending: false })
        }

        const { data, error } = await query

        if (error) throw error
        if (!mounted) return

        const parsed = (data || []).map((row) => {
          const user = row.users
          return user ? { id: user.id, name: user.name, avatarUrl: user.avatar_url } : null
        }).filter(Boolean)

        setUsers(parsed)
      } catch (err) {
        console.error('[FollowListModal] fetch error:', err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()

    return () => { mounted = false }
  }, [userId, isFollowers])

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="presentation"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md max-h-[70vh] flex flex-col rounded-2xl border border-white/8 bg-neutral-950 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h2 className="text-base font-bold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-purple-500/[0.04]" />
                  <div className="h-3.5 w-28 rounded bg-purple-500/[0.04]" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-white/40 text-sm">
                {isFollowers ? 'No followers yet' : 'Not following anyone yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-3 px-5 py-3">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name || 'User'}
                      className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, rgb(168,85,247), rgb(236,72,153))' }}
                    >
                      {(user.name || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-white/80 font-medium flex-1 truncate">
                    {user.name || 'Anonymous'}
                  </span>
                  <FollowButton userId={user.id} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
