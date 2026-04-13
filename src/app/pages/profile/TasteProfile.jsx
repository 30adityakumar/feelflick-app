// src/app/pages/profile/TasteProfile.jsx
import { useEffect, useMemo, useState } from 'react'

import { useOutletContext, Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import { Film, Star, Bookmark, Sparkles, Compass, Users, UserPlus, X } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import { tmdbImg } from '@/shared/api/tmdb'
import FollowButton from '@/shared/components/FollowButton'

// ============================================================================
// CONSTANTS
// ============================================================================

const GENRE_ID_TO_NAME = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
}

/** @type {Array<[number, string]>} [minRating (on /5 scale), label] */
const RATING_PERSONALITY = [
  [4.5, 'You\'re a generous rater — you find the good in everything.'],
  [3.5, 'You\'re a balanced critic — fair but discerning.'],
  [0, 'You\'re a tough critic — only the best earns your praise.'],
]

const TASTE_SUMMARIES = {
  'Drama-Cozy': 'You gravitate toward heartfelt dramas that feel like a warm blanket on a cold night.',
  'Drama-Heartbroken': 'You seek out raw emotional stories that let you feel everything deeply.',
  'Drama-Dark': 'You gravitate toward emotionally intense films that don\'t let you off easy.',
  'Comedy-Silly': 'You love a good laugh and never apologize for wanting pure, joyful entertainment.',
  'Comedy-Cozy': 'You reach for feel-good comedies that leave you smiling long after the credits.',
  'Thriller-Dark': 'You crave tension and the thrill of stories that push into shadowy territory.',
  'Thriller-Energized': 'You live for edge-of-your-seat cinema that keeps your heart pounding.',
  'Action-Adventurous': 'You watch films to feel alive — the bigger the stakes, the better.',
  'Action-Energized': 'You live for high-octane cinema that keeps your pulse racing start to finish.',
  'Horror-Dark': 'You\'re drawn to the edge of fear, finding beauty in cinema\'s darkest corners.',
  'Science Fiction-Curious': 'You\'re a cinematic explorer, drawn to big ideas and unknown frontiers.',
  'Romance-Romantic': 'You believe in the power of love stories and never tire of a great romance.',
  'Romance-Cozy': 'You\'re a romantic at heart, drawn to tender stories that warm the soul.',
  'Documentary-Curious': 'You have an insatiable appetite for truth and real stories that expand your world.',
  'Animation-Cozy': 'You appreciate the artistry of animation and the comfort of beautifully told stories.',
  'Crime-Dark': 'You\'re fascinated by the criminal mind and stories that probe moral grey zones.',
}

const TASTE_FALLBACK = 'You have eclectic taste — a true cinematic omnivore who refuses to be boxed in.'

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Resolve a genre value (TMDB JSONB is polymorphic) to a human-readable name.
 * Handles: integer IDs, {id, name} objects, and plain strings.
 * @param {number|string|{id?:number, name?:string}} g
 * @returns {string|null}
 */
function resolveGenreName(g) {
  if (!g && g !== 0) return null
  if (typeof g === 'object' && g.name) return g.name
  if (typeof g === 'object' && g.id) return GENRE_ID_TO_NAME[g.id] || null
  if (typeof g === 'number') return GENRE_ID_TO_NAME[g] || null
  if (typeof g === 'string') {
    const parsed = parseInt(g, 10)
    if (!isNaN(parsed)) return GENRE_ID_TO_NAME[parsed] || null
    return g
  }
  return null
}

/**
 * Count occurrences in an array of strings, return sorted desc.
 * @param {string[]} items
 * @returns {Array<{name: string, count: number}>}
 */
function countAndSort(items) {
  const map = new Map()
  for (const item of items) {
    if (!item) continue
    map.set(item, (map.get(item) || 0) + 1)
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

function formatMemberSince(dateStr) {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } catch {
    return null
  }
}

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
// SECTION HEADER (matches CLAUDE.md pattern)
// ============================================================================

function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-purple-400 to-pink-500" />
      <h2 className="text-[1.05rem] sm:text-[1.15rem] font-bold text-white tracking-tight whitespace-nowrap">
        {title}
      </h2>
      <div className="h-px flex-1 bg-gradient-to-r from-purple-400/20 via-white/5 to-transparent" />
    </div>
  )
}

// ============================================================================
// STAT CARD
// ============================================================================

function StatCard({ children, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"
    >
      {children}
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
            .select('movie_id, watched_at, movies ( id, title, poster_path, genres, director_name, primary_genre, release_date )')
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
        setUserLists(listsRes.data ?? [])
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

  const initials = displayName
    .trim()
    .split(' ')
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join('')

  const memberSince = formatMemberSince(profile?.joined_at)

  // === RENDER ===

  return (
    <div className="min-h-screen text-white pb-24 md:pb-12" style={{ background: 'var(--color-bg)', paddingTop: 'var(--hdr-h, 64px)' }}>
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(88,28,135,0.12) 0%, transparent 65%)' }}
        />
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        {loading ? (
          <ProfileSkeleton />
        ) : stats.watchedCount === 0 ? (
          <EmptyProfile />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-10"
          >
            {/* === PROFILE HEADER === */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-5 mb-5">
                {/* Avatar */}
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-16 w-16 rounded-full object-cover ring-2 ring-purple-500/20 flex-shrink-0"
                  />
                ) : (
                  <div
                    className="h-16 w-16 rounded-full flex-shrink-0 flex items-center justify-center text-xl font-black text-white shadow-lg"
                    style={{ background: 'linear-gradient(135deg, rgb(168,85,247), rgb(236,72,153))' }}
                  >
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{displayName}</h1>
                  {memberSince && (
                    <p className="text-sm text-white/35 mt-0.5">Member since {memberSince}</p>
                  )}
                </div>
              </div>

              {/* Stat pills */}
              <div className="flex flex-wrap gap-2.5">
                <StatPill icon={Film} value={stats.watchedCount} label="watched" />
                <StatPill icon={Star} value={stats.ratedCount} label="rated" />
                <StatPill icon={Bookmark} value={stats.watchlistCount} label="saved" />
                <StatPill icon={Users} value={followersCount} label="followers" onClick={() => setFollowModal('followers')} className="cursor-pointer hover:bg-white/8" />
                <StatPill icon={UserPlus} value={followingCount} label="following" onClick={() => setFollowModal('following')} className="cursor-pointer hover:bg-white/8" />
              </div>
            </motion.div>

            {/* === CINEMATIC DNA === */}
            <div>
              <SectionHeader title="Your Cinematic DNA" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Genres */}
                <StatCard index={0}>
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Top Genres</h3>
                  {stats.topGenres.length > 0 ? (
                    <div className="space-y-2.5">
                      {stats.topGenres.map((g) => (
                        <div key={g.name}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-white/80 font-medium">{g.name}</span>
                            <span className="text-white/35 text-xs">{g.pct}%</span>
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
                    <p className="text-white/25 text-sm">Not enough data yet</p>
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
                            <span className="text-white/25 text-xs mr-2">{i + 1}.</span>
                            {d.name}
                          </span>
                          <span className="text-white/30 text-xs">
                            {d.count} {d.count === 1 ? 'film' : 'films'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/25 text-sm">Director data isn&apos;t available yet</p>
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
                          <span className="text-white/30 text-xs">
                            {m.count} {m.count === 1 ? 'session' : 'sessions'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/25 text-sm">Try discovering films by mood to see your patterns</p>
                  )}
                </StatCard>

                {/* Average Rating */}
                <StatCard index={3}>
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Your Rating Style</h3>
                  {stats.avgRating != null ? (
                    <div>
                      <div className="flex items-baseline gap-1.5 mb-2">
                        <span className="text-3xl font-black text-white">{stats.avgRating.toFixed(1)}</span>
                        <span className="text-white/25 text-sm font-medium">/ 5</span>
                        <span className="text-white/30 text-xs ml-1">avg</span>
                      </div>
                      {stats.ratingPersonality && (
                        <p className="text-white/40 text-xs leading-relaxed">{stats.ratingPersonality}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-white/25 text-sm">Rate films to discover your critic personality</p>
                  )}
                </StatCard>
              </div>
            </div>

            {/* === TASTE SUMMARY === */}
            {stats.watchedCount >= 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-2xl border border-purple-500/15 bg-gradient-to-br from-purple-500/[0.06] to-pink-500/[0.03] p-6"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-purple-400/60 flex-shrink-0 mt-0.5" />
                  <p className="text-white/70 text-sm sm:text-base leading-relaxed italic">
                    &ldquo;{stats.tasteSummary}&rdquo;
                  </p>
                </div>
              </motion.div>
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
                      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/8">
                        <img
                          src={tmdbImg(movie.posterPath, 'w185')}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <p className="text-white/50 text-[11px] mt-1.5 truncate leading-tight">{movie.title}</p>
                      {movie.year && (
                        <p className="text-white/25 text-[10px]">{movie.year}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* === LISTS === */}
            {userLists.length > 0 && (
              <div>
                <SectionHeader title="Lists" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {userLists.map((list, idx) => (
                    <motion.div
                      key={list.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.3) }}
                    >
                      <Link
                        to={`/lists/${list.id}`}
                        className="block rounded-xl border border-white/8 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition-colors"
                      >
                        <h3 className="text-sm font-bold text-white truncate mb-1">{list.title}</h3>
                        {list.description && (
                          <p className="text-xs text-white/30 line-clamp-2 leading-relaxed">{list.description}</p>
                        )}
                      </Link>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-3 text-right">
                  <Link to="/lists" className="text-xs text-purple-400/70 hover:text-purple-300 transition-colors font-medium">
                    See all lists &rarr;
                  </Link>
                </div>
              </div>
            )}
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
              <p className="text-white/30 text-sm">
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

// ============================================================================
// SMALL UI PIECES
// ============================================================================

function StatPill({ icon: Icon, value, label, onClick, className }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-label={onClick ? `View ${label}` : undefined}
      className={`inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/8 px-3.5 py-1.5 transition-colors duration-200 ${className || ''}`}
    >
      <Icon className="h-3.5 w-3.5 text-purple-400/60" />
      <span className="text-xs text-white/70 font-medium">
        <span className="text-white font-semibold">{value}</span> {label}
      </span>
    </Tag>
  )
}
