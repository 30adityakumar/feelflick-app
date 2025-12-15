// src/app/homepage/components/HiddenGemsRow.jsx
import { Gem } from 'lucide-react'
import PersonalizedCarouselRow from './PersonalizedCarouselRow'
import { useHiddenGems } from '@/shared/hooks/useRecommendations'
import { useStaggeredEnabled } from '@/shared/hooks/useStaggeredEnabled'

/**
 * HiddenGemsRow
 *
 * - Accepts `userId` from HomePage to avoid waiting on internal auth readiness.
 * - Keeps a small stagger so Hero + top rows paint first.
 */
export default function HiddenGemsRow({
  userId = undefined,
  limit = 20,
  enabled: enabledProp = undefined,
} = {}) {
  const enabledStaggered = useStaggeredEnabled(250)
  const enabled = typeof enabledProp === 'boolean' ? enabledProp : enabledStaggered

  const userIdOverride =
    typeof userId === 'string' && userId.trim().length > 0 ? userId.trim() : undefined

  const { data, loading, error } = useHiddenGems({
    limit,
    enabled,
    userId: userIdOverride,
  })

  return (
    <PersonalizedCarouselRow
      title="Hidden gems you might love"
      movies={data || []}
      loading={loading}
      error={error}
      icon={Gem}
      rowId="hidden-gems"
      placement="hidden_gems"
    />
  )
}
