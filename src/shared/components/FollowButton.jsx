// src/shared/components/FollowButton.jsx
import { useState, useEffect, useCallback } from 'react'

import { Check, UserPlus, UserMinus } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'

/**
 * Reusable follow/unfollow button.
 *
 * @param {object} props
 * @param {string} props.userId - UUID of the user to follow
 * @param {'sm' | 'md'} [props.size='md'] - Button size variant
 * @returns {JSX.Element | null}
 */
export default function FollowButton({ userId, size = 'md' }) {
  const { userId: currentUserId } = useAuthSession()

  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isToggling, setIsToggling] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const isSelf = !currentUserId || userId === currentUserId

  // Fetch initial follow status
  useEffect(() => {
    if (isSelf || !userId) {
      setIsLoading(false)
      return
    }

    let mounted = true

    ;(async () => {
      try {
        const { data } = await supabase
          .from('user_follows')
          .select('follower_id')
          .eq('follower_id', currentUserId)
          .eq('following_id', userId)
          .maybeSingle()

        if (mounted) {
          setIsFollowing(Boolean(data))
          setIsLoading(false)
        }
      } catch (err) {
        console.error('[FollowButton] status fetch error:', err)
        if (mounted) setIsLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [currentUserId, userId, isSelf])

  const handleToggle = useCallback(async () => {
    if (isToggling || isSelf) return

    setIsToggling(true)
    const wasFollowing = isFollowing

    try {
      if (wasFollowing) {
        // Optimistic unfollow
        setIsFollowing(false)

        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', userId)

        if (error) throw error
      } else {
        // Optimistic follow
        setIsFollowing(true)

        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: currentUserId,
            following_id: userId
          })

        if (error) throw error
      }
    } catch (err) {
      console.error('[FollowButton] toggle error:', err)
      // Revert optimistic update
      setIsFollowing(wasFollowing)
    } finally {
      setIsToggling(false)
    }
  }, [isToggling, isFollowing, currentUserId, userId, isSelf])

  // Don't render for own profile or unauthenticated users
  if (isSelf) return null

  // === SIZE VARIANTS ===
  const sizeClasses =
    size === 'sm'
      ? 'text-xs px-3 py-1.5 rounded-lg'
      : 'text-sm px-4 py-2 rounded-xl'

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <div
        className={`${sizeClasses} animate-pulse bg-white/10 inline-block`}
        style={{ minWidth: size === 'sm' ? 72 : 88, height: size === 'sm' ? 30 : 36 }}
      />
    )
  }

  // === VISUAL STATES ===
  if (isFollowing) {
    const showUnfollow = isHovered && !isToggling

    return (
      <button
        type="button"
        onClick={handleToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={isToggling}
        aria-label={showUnfollow ? 'Unfollow user' : 'Following user'}
        className={`${sizeClasses} inline-flex items-center gap-1.5 font-medium transition-all duration-200 border ${
          showUnfollow
            ? 'bg-red-500/10 border-red-400/30 text-red-400'
            : 'bg-white/10 border-white/8 text-white/70'
        } disabled:opacity-50`}
      >
        {showUnfollow ? (
          <>
            <UserMinus className="h-3.5 w-3.5" />
            Unfollow
          </>
        ) : (
          <>
            <Check className="h-3.5 w-3.5" />
            Following
          </>
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isToggling}
      aria-label="Follow user"
      className={`${sizeClasses} inline-flex items-center gap-1.5 font-medium transition-all duration-200 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400 disabled:opacity-50`}
    >
      <UserPlus className="h-3.5 w-3.5" />
      Follow
    </button>
  )
}
