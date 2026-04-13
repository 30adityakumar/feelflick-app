// src/app/pages/feed/FeedPage.jsx
import { useState, useEffect } from 'react'

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import { Users, Clock } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { tmdbImg } from '@/shared/api/tmdb'

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
 * Renders a 1–5 star rating as filled/empty star characters.
 * @param {number} rating - Rating on a 1–5 scale
 * @returns {string}
 */
function renderStars(rating) {
  const rounded = Math.round(rating)
  const clamped = Math.max(0, Math.min(5, rounded))
  return '★'.repeat(clamped) + '☆'.repeat(5 - clamped)
}

// ============================================================================
// SMALL UI PIECES
// ============================================================================

function UserAvatar({ name, avatarUrl, size = 32 }) {
  const initial = (name || '?')[0].toUpperCase()

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || 'User'}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className="rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white"
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
// FEED CARD
// ============================================================================

function FeedCard({ event, user }) {
  const movieLink = event.movie?.tmdb_id ? `/movie/${event.movie.tmdb_id}` : null
  const year = event.movie?.release_date
    ? new Date(event.movie.release_date).getFullYear()
    : null
  const genre = event.movie?.primary_genre || null
  const director = event.movie?.director_name || null

  const metaParts = [year, genre, director].filter(Boolean)

  const isRated = event.type === 'rated'
  const userName = user?.name || 'Someone'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
    >
      <div className="flex gap-4">
        {/* Poster */}
        {event.movie?.poster_path ? (
          movieLink ? (
            <Link to={movieLink} className="flex-shrink-0">
              <img
                src={tmdbImg(event.movie.poster_path, 'w154')}
                alt={event.movie.title || 'Movie poster'}
                className="w-16 h-24 rounded-lg object-cover"
                loading="lazy"
              />
            </Link>
          ) : (
            <img
              src={tmdbImg(event.movie.poster_path, 'w154')}
              alt={event.movie.title || 'Movie poster'}
              className="w-16 h-24 rounded-lg object-cover flex-shrink-0"
              loading="lazy"
            />
          )
        ) : (
          <div className="w-16 h-24 rounded-lg bg-white/5 flex-shrink-0" />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          {/* User + action + title */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to={`/profile/${event.userId}`} className="inline-flex items-center gap-2 hover:opacity-75 transition-opacity">
                <UserAvatar
                  name={user?.name}
                  avatarUrl={user?.avatar_url}
                  size={24}
                />
                <span className="text-sm font-semibold text-white/80">{userName}</span>
              </Link>
              <span className="text-sm text-white/80">
                <span className="text-white/40">{isRated ? 'rated' : 'watched'} </span>
                {movieLink ? (
                  <Link to={movieLink} className="font-bold text-white hover:text-purple-300 transition-colors">
                    {event.movie?.title || 'Untitled'}
                  </Link>
                ) : (
                  <span className="font-bold text-white">{event.movie?.title || 'Untitled'}</span>
                )}
              </span>
            </div>

            {/* Meta: year · genre · director */}
            {metaParts.length > 0 && (
              <p className="text-xs text-white/30 mb-1">
                {metaParts.join(' · ')}
              </p>
            )}

            {/* Rating stars */}
            {isRated && event.rating != null && (
              <p className="text-sm text-yellow-400 mb-1" aria-label={`Rating: ${event.rating} out of 5`}>
                {renderStars(event.rating)}
              </p>
            )}

            {/* Review text */}
            {isRated && event.reviewText && (
              <p className="text-sm text-white/50 italic line-clamp-2">
                &ldquo;{event.reviewText}&rdquo;
              </p>
            )}
          </div>

          {/* Time ago */}
          <p className="text-xs text-white/25 mt-1.5">
            {formatTimeAgo(event.eventTime)}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// SKELETON
// ============================================================================

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 animate-pulse">
          <div className="flex gap-4">
            <div className="w-16 h-24 rounded-lg bg-purple-500/[0.04] flex-shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-purple-500/[0.04]" />
                <div className="h-3.5 w-40 rounded bg-purple-500/[0.04]" />
              </div>
              <div className="h-3 w-32 rounded bg-purple-500/[0.04]" />
              <div className="h-3 w-24 rounded bg-purple-500/[0.04]" />
              <div className="h-2.5 w-16 rounded bg-purple-500/[0.04]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// EMPTY STATES
// ============================================================================

function EmptyFeed({ variant }) {
  const isNoFollows = variant === 'no-follows'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center text-center py-24 px-4"
    >
      <div className="h-20 w-20 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
        {isNoFollows
          ? <Users className="h-9 w-9 text-purple-400/60" />
          : <Clock className="h-9 w-9 text-purple-400/60" />
        }
      </div>
      <h2 className="text-xl font-bold text-white mb-2">
        {isNoFollows ? 'Nothing here yet' : 'No activity yet'}
      </h2>
      <p className="text-white/40 text-sm max-w-sm mb-6">
        {isNoFollows
          ? 'Follow people to see their activity'
          : "The people you follow haven\u2019t watched anything recently"
        }
      </p>
      {isNoFollows && (
        <Link
          to="/people"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
        >
          <Users className="h-4 w-4" />
          Find People
        </Link>
      )}
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FeedPage() {
  const { userId: currentUserId } = useAuthSession()

  const [feedItems, setFeedItems] = useState([])
  const [userMap, setUserMap] = useState(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [hasNoFollows, setHasNoFollows] = useState(false)

  useEffect(() => {
    if (!currentUserId) return
    let mounted = true

    ;(async () => {
      try {
        // Step 1: Get followed user IDs
        const { data: followRows, error: followErr } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', currentUserId)

        if (followErr) throw followErr
        if (!mounted) return

        const followedIds = (followRows || []).map((r) => r.following_id)

        if (followedIds.length === 0) {
          setHasNoFollows(true)
          setIsLoading(false)
          return
        }

        // Step 2: Fetch watched + rated events in parallel
        const [historyRes, ratingsRes] = await Promise.all([
          supabase
            .from('user_history')
            .select('user_id, watched_at, movies ( id, title, poster_path, release_date, tmdb_id, primary_genre, director_name )')
            .in('user_id', followedIds)
            .order('watched_at', { ascending: false })
            .limit(30),
          supabase
            .from('user_ratings')
            .select('user_id, rating, review_text, rated_at, movies ( id, title, poster_path, release_date, tmdb_id, primary_genre, director_name )')
            .in('user_id', followedIds)
            .order('rated_at', { ascending: false })
            .limit(30),
        ])

        if (historyRes.error) throw historyRes.error
        if (ratingsRes.error) throw ratingsRes.error
        if (!mounted) return

        // Step 3: Batch-fetch user profiles (N+1 protection)
        const allUserIds = [...new Set([
          ...(historyRes.data || []).map((r) => r.user_id),
          ...(ratingsRes.data || []).map((r) => r.user_id),
        ])]

        let usersMap = new Map()
        if (allUserIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, name, avatar_url')
            .in('id', allUserIds)

          usersMap = new Map((usersData || []).map((u) => [u.id, u]))
        }

        if (!mounted) return

        // Merge, tag, sort, take top 40
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
          .slice(0, 40)

        setFeedItems(merged)
        setUserMap(usersMap)
      } catch (err) {
        console.error('[FeedPage] fetch error:', err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()

    return () => { mounted = false }
  }, [currentUserId])

  return (
    <div className="min-h-screen text-white pb-24 md:pb-12" style={{ background: 'var(--color-bg)', paddingTop: 'var(--hdr-h, 64px)' }}>
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(88,28,135,0.12) 0%, transparent 65%)' }}
        />
      </div>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Activity</h1>
          <p className="text-sm text-white/35 mt-1">People you follow</p>
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <FeedSkeleton />
        ) : hasNoFollows ? (
          <EmptyFeed variant="no-follows" />
        ) : feedItems.length === 0 ? (
          <EmptyFeed variant="no-activity" />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {feedItems.map((event, idx) => (
              <FeedCard
                key={`${event.type}-${event.userId}-${event.movie?.id}-${idx}`}
                event={event}
                user={userMap.get(event.userId)}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
