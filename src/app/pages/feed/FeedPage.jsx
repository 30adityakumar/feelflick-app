// src/app/pages/feed/FeedPage.jsx
import { useState, useEffect, useMemo } from 'react'

import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

import { Bookmark } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import Button from '@/shared/ui/Button'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { useUnreadFeed } from '@/shared/hooks/useUnreadFeed'
import { tmdbImg } from '@/shared/api/tmdb'
import { addToWatchlist } from '@/shared/services/watchlist'

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Formats a date string into a human-readable relative time.
 * @param {string} dateStr - ISO date string
 * @returns {string}
 */
function formatTimeAgo(dateStr) {
  if (!dateStr) return ''
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Groups feed items by date bucket: Today, Yesterday, This week, or month label.
 * @param {Array} items - Sorted feed items (newest first)
 * @returns {Array<{ label: string, items: Array }>}
 */
function groupByDate(items) {
  if (items.length === 0) return []

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterdayStart = todayStart - 86400000
  const weekStart = todayStart - 6 * 86400000

  const groups = []
  let currentLabel = null
  let currentItems = []

  for (const item of items) {
    const ts = new Date(item.eventTime).getTime()
    let label
    if (ts >= todayStart) label = 'Today'
    else if (ts >= yesterdayStart) label = 'Yesterday'
    else if (ts >= weekStart) label = 'This week'
    else label = new Date(item.eventTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    if (label !== currentLabel) {
      if (currentItems.length > 0) groups.push({ label: currentLabel, items: currentItems })
      currentLabel = label
      currentItems = [item]
    } else {
      currentItems.push(item)
    }
  }
  if (currentItems.length > 0) groups.push({ label: currentLabel, items: currentItems })

  return groups
}

// === STAGGER ANIMATION VARIANTS ===
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, delay: Math.min(i * 0.05, 0.3) },
  }),
}

// ============================================================================
// SMALL UI PIECES
// ============================================================================

function UserAvatar({ name, avatarUrl, size = 20 }) {
  const initial = (name || '?')[0].toUpperCase()

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || 'User'}
        className="rounded-full object-cover flex-shrink-0 inline-block align-middle"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className="rounded-full flex-shrink-0 inline-flex items-center justify-center font-bold text-white align-middle"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: 'linear-gradient(135deg, rgb(168,85,247), rgb(236,72,153))',
      }}
    >
      {initial}
    </div>
  )
}

// ============================================================================
// FILTER PILLS
// ============================================================================

function FilterPills({ followedUsers, activeFilter, onFilter }) {
  if (followedUsers.length === 0) return null

  const isAllActive = activeFilter === null

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 mb-3"
      style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
    >
      <style>{`.feed-pills::-webkit-scrollbar { display: none; }`}</style>
      <div className="feed-pills contents">
        {/* "All" pill */}
        <button
          type="button"
          onClick={() => onFilter(null)}
          className={`px-3.5 py-1 rounded-full text-xs font-medium shrink-0 cursor-pointer border transition-all duration-150 ${
            isAllActive
              ? 'bg-purple-500/20 border-purple-500/40 text-white'
              : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.07] hover:text-white/70'
          }`}
        >
          All
        </button>

        {/* Per-person pills */}
        {followedUsers.map((u) => {
          const isActive = activeFilter === u.id
          const firstName = (u.name || 'User').split(' ')[0]
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => onFilter(u.id)}
              className={`flex items-center gap-1.5 px-2.5 pr-3.5 py-1 rounded-full text-xs font-medium shrink-0 cursor-pointer border transition-all duration-150 ${
                isActive
                  ? 'bg-purple-500/20 border-purple-500/40 text-white'
                  : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.07] hover:text-white/70'
              }`}
            >
              <UserAvatar name={u.name} avatarUrl={u.avatar_url} size={18} />
              <span className="truncate max-w-[72px]">{firstName}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// DATE GROUP HEADER
// ============================================================================

function DateGroupHeader({ label }) {
  return (
    <div className="flex items-center gap-3 pt-1 pb-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-white/20 shrink-0">
        {label}
      </span>
      <div className="h-px flex-1 bg-white/[0.06]" />
    </div>
  )
}

// ============================================================================
// FEED CARD
// ============================================================================

function FeedCard({ event, user, isLatest, currentUserId, onNavigate }) {
  const [bookmarked, setBookmarked] = useState(false)

  const movieLink = event.movie?.tmdb_id ? `/movie/${event.movie.tmdb_id}` : null
  const year = event.movie?.release_date
    ? new Date(event.movie.release_date).getFullYear()
    : null
  const genre = event.movie?.primary_genre || null
  const director = event.movie?.director_name || null

  const isRated = event.type === 'rated'
  const userName = user?.name || 'Someone'
  const metaParts = [year, genre, director].filter(Boolean)

  const handleBookmark = async (e) => {
    e.stopPropagation()
    if (bookmarked || !currentUserId || !event.movie?.id) return
    setBookmarked(true)
    try {
      await addToWatchlist(currentUserId, event.movie.id, { source: 'browse' })
    } catch {
      setBookmarked(false)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => { if (movieLink) onNavigate(movieLink) }}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && movieLink) onNavigate(movieLink) }}
      className={`group/card rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden cursor-pointer hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-[0_0_20px_rgba(168,85,247,0.06)] transition-all duration-200${isLatest ? ' border-l-2 border-l-purple-500/40' : ''}`}
    >
      <div className="flex">
        {/* Poster */}
        <div className="relative w-[72px] sm:w-[88px] flex-shrink-0">
          {event.movie?.poster_path ? (
            <img
              src={tmdbImg(event.movie.poster_path, 'w154')}
              alt={event.movie.title || 'Movie poster'}
              className="w-full aspect-[2/3] object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full aspect-[2/3] bg-white/5 animate-pulse" />
          )}
          {/* Poster gradient fade into content */}
          <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-r from-transparent to-black/40 pointer-events-none" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 px-3.5 py-3 sm:px-4 sm:py-3.5 flex flex-col">
          {/* Activity line */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] leading-snug flex-1 min-w-0">
              {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
              <span onClick={(e) => e.stopPropagation()} className="inline">
                <Link to={`/profile/${event.userId}`} className="inline-flex items-center gap-1.5 hover:opacity-75 transition-opacity align-middle">
                  <UserAvatar name={user?.name} avatarUrl={user?.avatar_url} size={18} />
                  <span className="font-semibold text-white">{userName}</span>
                </Link>
              </span>
              <span className="text-white/40"> {isRated ? 'rated' : 'watched'} </span>
              <span className="font-bold text-white">{event.movie?.title || 'Untitled'}</span>
            </p>

            {/* Bookmark quick action */}
            <button
              type="button"
              onClick={handleBookmark}
              aria-label={bookmarked ? 'Added to watchlist' : 'Add to watchlist'}
              className={`shrink-0 mt-0.5 p-1 rounded-md transition-all duration-150 ${
                bookmarked
                  ? 'text-purple-400'
                  : 'text-white/20 opacity-0 group-hover/card:opacity-100 hover:text-purple-400 hover:bg-white/[0.06]'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5${bookmarked ? ' fill-current' : ''}`} />
            </button>
          </div>

          {/* Meta line — always show year/genre/director for context */}
          {metaParts.length > 0 && (
            <p className="text-[11px] text-white/40 mt-1">
              {metaParts.join(' · ')}
            </p>
          )}

          {/* Rating stars (rated events) */}
          {isRated && event.rating != null && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-amber-400/90" aria-label={`Rating: ${event.rating} out of 5`}>
                {'★'.repeat(Math.round(Math.max(0, Math.min(5, event.rating))))}{'☆'.repeat(5 - Math.round(Math.max(0, Math.min(5, event.rating))))}
              </span>
              <span className="text-[10px] text-white/20">{event.rating}/5</span>
            </div>
          )}

          {/* Review text (rated events only) */}
          {isRated && event.reviewText && (
            <p className="text-[11px] text-white/40 italic line-clamp-2 mt-1">
              &ldquo;{event.reviewText}&rdquo;
            </p>
          )}

          {/* Timestamp — pushed to bottom */}
          <p className="text-[10px] text-white/20 mt-auto pt-1.5">
            {formatTimeAgo(event.eventTime)}
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SKELETON
// ============================================================================

function FeedSkeleton() {
  return (
    <div className="space-y-2.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden animate-pulse">
          <div className="flex">
            <div className="w-[72px] sm:w-[88px] aspect-[2/3] bg-purple-500/[0.04] flex-shrink-0" />
            <div className="flex-1 px-3.5 py-3 sm:px-4 sm:py-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-[18px] w-[18px] rounded-full bg-purple-500/[0.04]" />
                <div className="h-3 w-36 rounded bg-purple-500/[0.04]" />
              </div>
              <div className="h-2.5 w-28 rounded bg-purple-500/[0.04]" />
              <div className="h-2 w-14 rounded bg-purple-500/[0.04]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyFeed({ variant }) {
  const isNoFollows = variant === 'no-follows'

  return (
    <div className="text-center py-16">
      <p className="text-white/40 text-sm mb-1">
        {isNoFollows ? 'Nothing here yet' : 'No activity yet'}
      </p>
      <p className="text-white/20 text-xs mb-6">
        {isNoFollows
          ? 'Follow people to see what they\u2019re watching'
          : 'The people you follow haven\u2019t watched anything recently'
        }
      </p>
      {isNoFollows && (
        <Link
          to="/people"
          className="text-xs text-purple-400 hover:text-purple-300 border border-purple-500/30 hover:border-purple-400/50 px-4 py-2 rounded-full transition-colors duration-200"
        >
          Find people to follow &rarr;
        </Link>
      )}
    </div>
  )
}

// ============================================================================
// SIDEBAR — FOLLOWING
// ============================================================================

function FollowingSidebar({ followedUsers, activeFilter, navigate }) {
  const visible = followedUsers.slice(0, 6)

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-[3px] h-4 rounded-full bg-gradient-to-b from-purple-400 to-pink-500 shrink-0" />
        <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
          Following
        </span>
      </div>

      {followedUsers.length === 0 ? (
        <>
          <p className="text-xs text-white/40 text-center py-2">
            Follow people to see them here
          </p>
          <button
            type="button"
            onClick={() => navigate('/people')}
            className="w-full mt-1 text-xs text-purple-400/70 hover:text-purple-400 transition-colors text-center"
          >
            Find people &rarr;
          </button>
        </>
      ) : (
        <>
          {visible.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => navigate(`/profile/${u.id}`)}
              className="flex items-center gap-2.5 py-1.5 w-full rounded-lg px-1 -mx-1 hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <UserAvatar name={u.name} avatarUrl={u.avatar_url} size={28} />
              <span className="text-sm text-white/70 truncate flex-1 text-left">
                {u.name || 'User'}
              </span>
              {activeFilter === u.id && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
              )}
            </button>
          ))}
          {followedUsers.length > 6 && (
            <button
              type="button"
              onClick={() => navigate('/people')}
              className="text-xs text-purple-400/70 hover:text-purple-400 transition-colors mt-2"
            >
              See all &rarr;
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ============================================================================
// SIDEBAR — TRENDING AMONG THEM
// ============================================================================

function TrendingSidebar({ trendingItems, navigate }) {
  if (trendingItems.length === 0) return null

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-[3px] h-4 rounded-full bg-gradient-to-b from-purple-400 to-pink-500 shrink-0" />
        <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
          Trending Among Them
        </span>
      </div>

      {trendingItems.map((item) => (
        <button
          key={item.movie.tmdb_id || item.movie.id}
          type="button"
          onClick={() => navigate(`/movie/${item.movie.tmdb_id}`)}
          className="flex items-center gap-2.5 py-1.5 w-full rounded-lg px-1 -mx-1 hover:bg-white/[0.04] transition-colors cursor-pointer"
        >
          <div className="w-8 h-12 rounded-md overflow-hidden shrink-0">
            {item.movie.poster_path ? (
              <img
                src={tmdbImg(item.movie.poster_path, 'w92')}
                alt={item.movie.title || 'Poster'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-white/10" />
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm text-white/80 truncate font-medium">
              {item.movie.title || 'Untitled'}
            </p>
            <p className="text-xs text-white/40">
              {item.watchCount} people watched this
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FeedPage() {
  const { userId: currentUserId } = useAuthSession()
  const { markRead } = useUnreadFeed(currentUserId)
  const navigate = useNavigate()

  useEffect(() => { markRead() }, [markRead])

  const [feedItems, setFeedItems] = useState([])
  const [userMap, setUserMap] = useState(new Map())
  const [followedUsers, setFollowedUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasNoFollows, setHasNoFollows] = useState(false)
  const [activeFilter, setActiveFilter] = useState(null)
  const [limit, setLimit] = useState(20)
  const [hasMore, setHasMore] = useState(false)

  // WHY: Reset limit when filter changes so we don't carry stale pagination
  useEffect(() => {
    setLimit(20)
  }, [activeFilter])

  useEffect(() => {
    if (!currentUserId) return
    let mounted = true

    ;(async () => {
      try {
        // Step 1: Get followed users with profiles (for filter pills)
        const { data: followRows, error: followErr } = await supabase
          .from('user_follows')
          .select('following_id, users!user_follows_following_id_fkey ( id, name, avatar_url )')
          .eq('follower_id', currentUserId)

        if (followErr) throw followErr
        if (!mounted) return

        const followedProfiles = (followRows || [])
          .map((r) => r.users)
          .filter(Boolean)
        const followedIds = followedProfiles.map((u) => u.id)

        if (mounted) setFollowedUsers(followedProfiles)

        if (followedIds.length === 0) {
          setHasNoFollows(true)
          setIsLoading(false)
          return
        }

        // Step 2: Fetch watched + rated events in parallel
        const perQueryLimit = limit
        const [historyRes, ratingsRes] = await Promise.all([
          supabase
            .from('user_history')
            .select('user_id, watched_at, movies ( id, title, poster_path, release_date, tmdb_id, primary_genre, director_name )')
            .in('user_id', followedIds)
            .order('watched_at', { ascending: false })
            .limit(perQueryLimit),
          supabase
            .from('user_ratings')
            .select('user_id, rating, review_text, rated_at, movies ( id, title, poster_path, release_date, tmdb_id, primary_genre, director_name )')
            .in('user_id', followedIds)
            .order('rated_at', { ascending: false })
            .limit(perQueryLimit),
        ])

        if (historyRes.error) throw historyRes.error
        if (ratingsRes.error) throw ratingsRes.error
        if (!mounted) return

        // Step 3: Build user map from already-fetched profiles
        const usersMap = new Map(followedProfiles.map((u) => [u.id, u]))

        // Merge, tag, sort
        const watchedEvents = (historyRes.data || [])
          .filter((r) => r.movies)
          .map((r) => ({
            type: 'watched',
            userId: r.user_id,
            movie: r.movies,
            eventTime: r.watched_at,
          }))

        const ratedEvents = (ratingsRes.data || [])
          .filter((r) => r.movies)
          .map((r) => ({
            type: 'rated',
            userId: r.user_id,
            movie: r.movies,
            rating: r.rating,
            reviewText: r.review_text,
            eventTime: r.rated_at,
          }))

        const merged = [...watchedEvents, ...ratedEvents]
          .sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime))

        if (mounted) {
          setFeedItems(merged)
          setUserMap(usersMap)
          // WHY: If either source returned its full limit, there's likely more
          setHasMore(
            (historyRes.data || []).length === perQueryLimit ||
            (ratingsRes.data || []).length === perQueryLimit
          )
        }
      } catch (err) {
        console.error('[FeedPage] fetch error:', err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()

    return () => { mounted = false }
  }, [currentUserId, limit])

  // === FILTER + GROUP VISIBLE ITEMS ===
  const visibleItems = activeFilter
    ? feedItems.filter((item) => item.userId === activeFilter)
    : feedItems

  const dateGroups = useMemo(() => groupByDate(visibleItems), [visibleItems])

  // === TRENDING AMONG FOLLOWED (derived from loaded feed items) ===
  const trendingAmongFollowed = useMemo(() => {
    const counts = {}
    feedItems.forEach((item) => {
      const key = item.movie?.tmdb_id || item.movie?.id
      if (!key) return
      if (!counts[key]) counts[key] = { movie: item.movie, watchCount: 0 }
      counts[key].watchCount++
    })
    return Object.values(counts)
      .filter((m) => m.watchCount >= 2)
      .sort((a, b) => b.watchCount - a.watchCount)
      .slice(0, 3)
  }, [feedItems])

  const goToMovie = (path) => navigate(path)

  // Track global card index across groups for stagger animation
  let globalIdx = 0

  return (
    <div className="min-h-screen bg-black text-white pb-24 md:pb-10" style={{ paddingTop: 'var(--hdr-h, 64px)' }}>
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 35% at 50% 0%, rgba(88,28,135,0.1) 0%, transparent 65%)' }} />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">

          {/* LEFT: Feed */}
          <div className="min-w-0">
            {/* Page header */}
            <div className="mb-3">
              <h1 className="text-2xl font-black text-white tracking-tight mb-0.5">Activity</h1>
              <p className="text-sm text-white/40">What people you follow are watching</p>
            </div>

            {/* Content */}
            {isLoading ? (
              <FeedSkeleton />
            ) : hasNoFollows ? (
              <EmptyFeed variant="no-follows" />
            ) : feedItems.length === 0 ? (
              <EmptyFeed variant="no-activity" />
            ) : (
              <>
                {/* Filter pills — tight below header */}
                <FilterPills
                  followedUsers={followedUsers}
                  activeFilter={activeFilter}
                  onFilter={setActiveFilter}
                />

                {visibleItems.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-white/40 text-sm">No activity from this person yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {dateGroups.map((group) => (
                      <div key={group.label}>
                        <DateGroupHeader label={group.label} />
                        <div className="space-y-2.5 mt-2">
                          {group.items.map((event) => {
                            const idx = globalIdx++
                            return (
                              <motion.div
                                key={`${event.type}-${event.userId}-${event.movie?.id}-${idx}`}
                                custom={idx}
                                initial="hidden"
                                animate="visible"
                                variants={cardVariants}
                              >
                                <FeedCard
                                  event={event}
                                  user={userMap.get(event.userId)}
                                  isLatest={idx === 0}
                                  currentUserId={currentUserId}
                                  onNavigate={goToMovie}
                                />
                              </motion.div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Load more */}
                {hasMore && !activeFilter && (
                  <Button variant="secondary" size="sm" fullWidth onClick={() => setLimit((l) => l + 20)} className="mt-4">
                    Load more
                  </Button>
                )}
              </>
            )}
          </div>

          {/* RIGHT: Sidebar — hidden on mobile, sticky on desktop */}
          <aside className="hidden lg:block sticky top-[calc(var(--hdr-h,64px)+24px)] space-y-4">
            <FollowingSidebar
              followedUsers={followedUsers}
              activeFilter={activeFilter}
              navigate={navigate}
            />
            <TrendingSidebar
              trendingItems={trendingAmongFollowed}
              navigate={navigate}
            />
          </aside>

        </div>
      </div>
    </div>
  )
}
