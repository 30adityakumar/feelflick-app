// src/app/pages/people/UserSearchPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { motion } from 'framer-motion'

import { Search, Users } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import Button from '@/shared/ui/Button'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import FollowButton from '@/shared/components/FollowButton'

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extracts up to `max` genre names from user_preferences join data.
 * @param {object} user - User object with user_preferences array
 * @param {number} max - Maximum genres to return
 * @returns {string[]}
 */
function getTopGenres(user, max = 3) {
  const prefs = user?.user_preferences
  if (!Array.isArray(prefs) || prefs.length === 0) return []
  return prefs
    .map((p) => p.genres?.name)
    .filter(Boolean)
    .slice(0, max)
}

// === STAGGER ANIMATION VARIANTS ===
const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: Math.min(i * 0.06, 0.3) },
  }),
}

// ============================================================================
// SECTION HEADER (matches CLAUDE.md pattern)
// ============================================================================

function SectionHeader({ title, count }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-purple-400 to-pink-500" />
      <h2 className="text-[1.05rem] sm:text-[1.15rem] font-bold text-white tracking-tight whitespace-nowrap">
        {title}
      </h2>
      {count > 0 && (
        <span className="text-xs text-white/40 font-normal">{count} people</span>
      )}
      <div className="h-px flex-1 bg-gradient-to-r from-purple-400/20 via-white/5 to-transparent" />
    </div>
  )
}

// ============================================================================
// AVATAR
// ============================================================================

function UserAvatar({ name, avatarUrl, size = 40 }) {
  const initial = (name || '?')[0].toUpperCase()

  if (avatarUrl) {
    return (
      <div
        className="rounded-full overflow-hidden shrink-0 bg-white/10 ring-2 ring-transparent group-hover:ring-purple-500/20 transition-all duration-200"
        style={{ width: size, height: size }}
      >
        <img
          src={avatarUrl}
          alt={name || 'User'}
          className="w-full h-full object-cover block"
        />
      </div>
    )
  }

  return (
    <div
      className="rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white ring-2 ring-transparent group-hover:ring-purple-500/20 transition-all duration-200"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  )
}

// ============================================================================
// PERSON CARD (shared by all sections)
// ============================================================================

function PersonCard({ user, matchPct, commonCount, showFollow = true, isFollowed = false, onNavigate }) {
  const watchedCount = user.user_history?.[0]?.count ?? 0
  const genres = getTopGenres(user)

  // Build subtitle line
  let subtitle
  if (matchPct != null) {
    subtitle = `${matchPct}% taste match`
    if (commonCount > 0) subtitle += ` · ${commonCount} in common`
  } else if (genres.length > 0) {
    subtitle = genres.join(' · ')
  } else if (watchedCount > 0) {
    subtitle = `${watchedCount} films watched`
  } else {
    subtitle = 'New member'
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onNavigate(user.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate(user.id) }}
      className={`group rounded-2xl border border-white/[0.07] bg-white/[0.05] backdrop-blur-sm p-3.5 cursor-pointer hover:bg-white/[0.08] hover:border-white/[0.13] hover:shadow-[0_0_20px_rgba(168,85,247,0.08)] transition-all duration-200${isFollowed ? ' border-l-2 border-l-purple-500/30' : ''}`}
    >
      <div className="flex items-center gap-3">
        <UserAvatar name={user.name} avatarUrl={user.avatar_url} size={44} />
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-white truncate">
            {user.name || 'Anonymous'}
          </p>
          <p className="text-xs text-white/40 truncate">
            {subtitle}
          </p>
        </div>
        {showFollow && (
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
          <div onClick={(e) => e.stopPropagation()} className="ml-auto shrink-0">
            <FollowButton userId={user.id} size="sm" />
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// SKELETON CARD
// ============================================================================

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.05] backdrop-blur-sm p-3.5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-purple-500/[0.04] shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-24 rounded bg-purple-500/[0.04]" />
          <div className="h-2.5 w-16 rounded bg-purple-500/[0.04]" />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SELECT FRAGMENTS
// ============================================================================

const USER_SELECT = 'id, name, avatar_url, user_history(count), user_preferences(genre_id, genres(name))'

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function UserSearchPage() {
  const { userId: currentUserId } = useAuthSession()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [suggested, setSuggested] = useState([])
  const [isSuggestedLoading, setIsSuggestedLoading] = useState(true)
  const [isFallback, setIsFallback] = useState(false)
  const [following, setFollowing] = useState([])
  const [isFollowingLoading, setIsFollowingLoading] = useState(true)

  const debounceRef = useRef(null)

  // === DEBOUNCED SEARCH INPUT ===
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) {
      setDebouncedQuery('')
      setSearchResults([])
      return
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // === SEARCH USERS ===
  useEffect(() => {
    if (!debouncedQuery || !currentUserId) {
      setSearchResults([])
      return
    }

    let mounted = true
    setIsSearching(true)

    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select(USER_SELECT)
          .ilike('name', `%${debouncedQuery}%`)
          .neq('id', currentUserId)
          .limit(20)

        if (error) throw error
        if (mounted) setSearchResults(data || [])
      } catch (err) {
        console.error('[UserSearchPage] search error:', err)
      } finally {
        if (mounted) setIsSearching(false)
      }
    })()

    return () => { mounted = false }
  }, [debouncedQuery, currentUserId])

  // === PEOPLE YOU FOLLOW ===
  useEffect(() => {
    if (!currentUserId) {
      setIsFollowingLoading(false)
      return
    }

    let mounted = true

    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('user_follows')
          .select(`following_id, users!user_follows_following_id_fkey ( ${USER_SELECT} )`)
          .eq('follower_id', currentUserId)

        if (error) throw error
        if (mounted) setFollowing(data || [])
      } catch (err) {
        console.error('[UserSearchPage] following error:', err)
      } finally {
        if (mounted) setIsFollowingLoading(false)
      }
    })()

    return () => { mounted = false }
  }, [currentUserId])

  // === SUGGESTED USERS (from user_similarity, fallback to active users) ===
  // WHY: Depends on `following` so we can exclude already-followed users
  useEffect(() => {
    if (!currentUserId || isFollowingLoading) return

    let mounted = true
    const followingIds = following.map((r) => r.users?.id).filter(Boolean)

    ;(async () => {
      try {
        // Build similarity query, excluding followed users
        let simQuery = supabase
          .from('user_similarity')
          .select(`user_b_id, overall_similarity, movies_in_common, users!user_similarity_user_b_fkey ( ${USER_SELECT} )`)
          .eq('user_a_id', currentUserId)
          .order('overall_similarity', { ascending: false })
          .limit(8)

        if (followingIds.length > 0) {
          simQuery = simQuery.not('user_b_id', 'in', `(${followingIds.join(',')})`)
        }

        const { data, error } = await simQuery
        if (error) throw error

        if (mounted && data && data.length > 0) {
          setSuggested(data)
          setIsFallback(false)
        } else if (mounted) {
          // Fallback: most active users, excluding self + followed
          const excludeIds = [currentUserId, ...followingIds]
          let fallbackQuery = supabase
            .from('users')
            .select(USER_SELECT)
            .order('total_movies_watched', { ascending: false })
            .limit(4)

          if (excludeIds.length === 1) {
            fallbackQuery = fallbackQuery.neq('id', currentUserId)
          } else {
            fallbackQuery = fallbackQuery.not('id', 'in', `(${excludeIds.join(',')})`)
          }

          const { data: activeUsers, error: activeErr } = await fallbackQuery
          if (activeErr) throw activeErr
          // Wrap in same shape as similarity rows for PersonCard compatibility
          setSuggested((activeUsers || []).map((u) => ({ users: u })))
          setIsFallback(true)
        }
      } catch (err) {
        console.error('[UserSearchPage] suggestions error:', err)
      } finally {
        if (mounted) setIsSuggestedLoading(false)
      }
    })()

    return () => { mounted = false }
  }, [currentUserId, following, isFollowingLoading])

  const hasQuery = debouncedQuery.length > 0
  const goToProfile = (userId) => navigate(`/profile/${userId}`)

  return (
    <div className="min-h-screen text-white pb-24 md:pb-10" style={{ background: 'var(--color-bg)', paddingTop: 'var(--hdr-h, 64px)' }}>
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 35% at 50% 0%, rgba(88,28,135,0.1) 0%, transparent 65%)' }} />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-4 sm:pt-6 pb-6 sm:pb-8">
        {/* Page header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-black text-white tracking-tight mb-1">People</h1>
          <p className="text-sm text-white/40">Discover people who share your taste in film.</p>
        </div>

        {/* Search input — always at top */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find people by name..."
            aria-label="Search for users by name"
            className="w-full rounded-full bg-white/[0.05] border border-white/10 text-white text-sm pl-11 pr-4 py-3 placeholder-white/20 focus:outline-none focus:border-purple-500/40 focus:ring-2 focus:ring-purple-500/10 focus:shadow-[0_0_12px_rgba(168,85,247,0.1)] transition-all duration-200"
          />
        </div>

        {hasQuery ? (
          /* === SEARCH RESULTS === */
          <div>
            <SectionHeader title="Results" />
            {isSearching ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-white/40 text-sm">No users found for &ldquo;{debouncedQuery}&rdquo;</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {searchResults.map((user, idx) => (
                  <motion.div
                    key={user.id}
                    custom={idx}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                  >
                    <PersonCard user={user} onNavigate={goToProfile} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* === SECTION A: People You Follow === */}
            <div className="mb-10">
              <SectionHeader title="People you follow" count={!isFollowingLoading && following.length > 0 ? following.length : undefined} />
              {isFollowingLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
                </div>
              ) : following.length === 0 ? (
                <div className="col-span-full border border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-400/60" />
                  </div>
                  <p className="text-sm text-white/40">People you follow will appear here</p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-1"
                    onClick={() => {
                      document.getElementById('suggestions-section')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    Browse suggestions
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {following.map((row, idx) => {
                    const user = row.users
                    if (!user) return null
                    return (
                      <motion.div
                        key={user.id}
                        custom={idx}
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                      >
                        <PersonCard
                          user={user}
                          isFollowed
                          onNavigate={goToProfile}
                        />
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* === SECTION B: Suggested / Active Users === */}
            <div id="suggestions-section">
              <SectionHeader
                title={isFallback ? 'You might know' : 'Suggested for you'}
                count={!isSuggestedLoading && suggested.length > 0 ? suggested.length : undefined}
              />
              {isSuggestedLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
                </div>
              ) : suggested.length === 0 ? (
                <p className="text-sm text-white/40 text-center py-8">
                  No suggestions yet — we&rsquo;re still learning your taste.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggested.map((row, idx) => {
                    const user = row.users
                    if (!user) return null
                    const matchPct = isFallback ? undefined : Math.round((row.overall_similarity ?? 0) * 100)
                    const commonCount = isFallback ? 0 : (row.movies_in_common ?? 0)

                    return (
                      <motion.div
                        key={user.id}
                        custom={idx}
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                      >
                        <PersonCard
                          user={user}
                          matchPct={matchPct}
                          commonCount={commonCount}
                          onNavigate={goToProfile}
                        />
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
