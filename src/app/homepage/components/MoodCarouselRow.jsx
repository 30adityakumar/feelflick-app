// src/app/homepage/components/MoodCarouselRow.jsx
/**
 * MoodCarouselRow
 *
 * Improvements:
 * - Accepts `userId` so fetching can start immediately (no redundant auth wait).
 * - Supports `enabled` and an optional stagger delay (better above-the-fold performance).
 * - Uses an emoji icon that is compatible with PersonalizedCarouselRow's icon contract.
 */

import { useMemo } from 'react'
import { useMoodRecommendations } from '@/shared/hooks/useRecommendations'
import { useStaggeredEnabled } from '@/shared/hooks/useStaggeredEnabled'
import PersonalizedCarouselRow from './PersonalizedCarouselRow'

function EmojiIcon({ emoji, className }) {
  return (
    <span
      className={className ? `${className} text-base leading-none` : 'text-base leading-none'}
      aria-hidden="true"
    >
      {emoji}
    </span>
  )
}

export default function MoodCarouselRow({
  moodId,
  moodName,
  moodEmoji = '✨',
  userId = undefined,
  limit = 20,
  enabled: enabledProp = undefined,
  staggerMs = 350,
} = {}) {
  const enabledStaggered = useStaggeredEnabled(staggerMs)
  const enabled = typeof enabledProp === 'boolean' ? enabledProp : enabledStaggered

  const userIdOverride =
    typeof userId === 'string' && userId.trim().length > 0 ? userId.trim() : undefined

  const title = useMemo(() => {
    const name = typeof moodName === 'string' ? moodName.trim() : ''
    return name ? `${moodEmoji} ${name}` : `${moodEmoji} Mood picks`
  }, [moodEmoji, moodName])

  const { data, loading, error } = useMoodRecommendations(moodId, {
    limit,
    enabled,
    userId: userIdOverride,
  })

  if (!moodId) return null

  const Icon = useMemo(() => {
    return function MoodEmojiIcon(props) {
      return <EmojiIcon emoji={moodEmoji} {...props} />
    }
  }, [moodEmoji])

  return (
    <PersonalizedCarouselRow
      title={title}
      movies={data || []}
      loading={loading}
      error={error}
      icon={Icon}
      rowId={`mood-${moodId}`}
      placement="mood"
    />
  )
}
