import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

const STORAGE_KEY = (userId) => `ff_feed_viewed_${userId}`

/**
 * Tracks whether the user has unread feed activity.
 * Uses localStorage to persist the last-viewed timestamp per device.
 * @param {string|null} userId
 * @returns {{ hasUnread: boolean, markRead: () => void }}
 */
export function useUnreadFeed(userId) {
  const [hasUnread, setHasUnread] = useState(false)

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    const lastViewed = localStorage.getItem(STORAGE_KEY(userId)) ?? '1970-01-01T00:00:00.000Z'

    supabase
      .from('user_interactions')
      .select('created_at', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gt('created_at', lastViewed)
      .then(({ count }) => {
        if (!cancelled) setHasUnread((count ?? 0) > 0)
      })

    return () => { cancelled = true }
  }, [userId])

  const markRead = useCallback(() => {
    if (!userId) return
    localStorage.setItem(STORAGE_KEY(userId), new Date().toISOString())
    setHasUnread(false)
  }, [userId])

  return { hasUnread, markRead }
}
