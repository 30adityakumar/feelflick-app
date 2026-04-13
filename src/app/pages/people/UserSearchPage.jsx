// src/app/pages/people/UserSearchPage.jsx
import { useState, useEffect, useRef } from 'react'

import { motion } from 'framer-motion'

import { Search, Users } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import FollowButton from '@/shared/components/FollowButton'

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
// AVATAR
// ============================================================================

function UserAvatar({ name, avatarUrl, size = 40 }) {
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
// MAIN COMPONENT
// ============================================================================

export default function UserSearchPage() {
  const { userId: currentUserId } = useAuthSession()

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [suggested, setSuggested] = useState([])
  const [isSuggestedLoading, setIsSuggestedLoading] = useState(true)

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
          .select('id, name, avatar_url, total_movies_watched')
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

  // === SUGGESTED USERS (from user_similarity) ===
  useEffect(() => {
    if (!currentUserId) {
      setIsSuggestedLoading(false)
      return
    }

    let mounted = true

    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('user_similarity')
          .select('user_b_id, overall_similarity, movies_in_common, users!user_similarity_user_b_id_fkey ( id, name, avatar_url, total_movies_watched )')
          .eq('user_a_id', currentUserId)
          .order('overall_similarity', { ascending: false })
          .limit(6)

        if (error) throw error
        if (mounted) setSuggested(data || [])
      } catch (err) {
        console.error('[UserSearchPage] suggestions error:', err)
      } finally {
        if (mounted) setIsSuggestedLoading(false)
      }
    })()

    return () => { mounted = false }
  }, [currentUserId])

  const hasQuery = debouncedQuery.length > 0

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
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-2xl sm:text-3xl font-bold text-white mb-6"
        >
          Find People
        </motion.h1>

        {/* Search input */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="relative mb-8"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find people by name..."
            aria-label="Search for users by name"
            className="w-full rounded-xl bg-white/[0.03] border border-white/8 text-white text-sm pl-11 pr-4 py-3 placeholder:text-white/25 focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-colors"
          />
        </motion.div>

        {/* === SEARCH RESULTS === */}
        {hasQuery ? (
          <div>
            <SectionHeader title="Results" />
            {isSearching ? (
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] divide-y divide-white/5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-4 animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-purple-500/[0.04]" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-32 rounded bg-purple-500/[0.04]" />
                      <div className="h-2.5 w-20 rounded bg-purple-500/[0.04]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-white/30 text-sm">No users found for &ldquo;{debouncedQuery}&rdquo;</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] divide-y divide-white/5">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 px-5 py-4">
                    <UserAvatar name={user.name} avatarUrl={user.avatar_url} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{user.name || 'Anonymous'}</p>
                      <p className="text-xs text-white/40">
                        {user.total_movies_watched ?? 0} {(user.total_movies_watched ?? 0) === 1 ? 'film' : 'films'} watched
                      </p>
                    </div>
                    <FollowButton userId={user.id} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* === SUGGESTED SECTION === */
          <div>
            <SectionHeader title="Suggested for you" />
            {isSuggestedLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-purple-500/[0.04]" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-24 rounded bg-purple-500/[0.04]" />
                        <div className="h-2.5 w-16 rounded bg-purple-500/[0.04]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : suggested.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center text-center py-16 px-4"
              >
                <div className="h-16 w-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5">
                  <Users className="h-7 w-7 text-purple-400/60" />
                </div>
                <p className="text-white/40 text-sm max-w-xs">
                  Watch more films to discover people with similar taste
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggested.map((row, idx) => {
                  const user = row.users
                  if (!user) return null
                  const matchPct = Math.round((row.overall_similarity ?? 0) * 100)
                  const commonCount = row.movies_in_common ?? 0

                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(idx * 0.06, 0.3) }}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <UserAvatar name={user.name} avatarUrl={user.avatar_url} size={40} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{user.name || 'Anonymous'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-medium text-purple-400 bg-purple-500/10 rounded-full px-2 py-0.5">
                              {matchPct}% match
                            </span>
                            {commonCount > 0 && (
                              <span className="text-[11px] text-white/30">
                                {commonCount} {commonCount === 1 ? 'film' : 'films'} in common
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <FollowButton userId={user.id} size="sm" />
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
