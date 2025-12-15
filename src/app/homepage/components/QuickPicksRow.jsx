// src/app/homepage/components/QuickPicksRow.jsx
import { useMemo } from 'react'
import CarouselRow from '@/components/carousel/Row'
import { useQuickPicks } from '@/shared/hooks/useRecommendations'

function normalizeExcludeIds(excludeIds) {
  if (!Array.isArray(excludeIds) || excludeIds.length === 0) return []
  const nums = []
  for (const v of excludeIds) {
    const n = typeof v === 'number' ? v : Number(v)
    if (Number.isFinite(n)) nums.push(n)
  }
  return Array.from(new Set(nums)).sort((a, b) => a - b)
}

/**
 * QuickPicksRow
 * - No useTopPick() here (prevents duplicate hero fetch)
 * - Receives hero exclusion via props: excludeIds=[heroInternalId]
 * - Pass userId only when present; otherwise let shared auth resolve it
 */
export default function QuickPicksRow({
  userId = undefined,
  excludeIds = [],
  limit = 20,
  enabled = true,
  title = '✨ Quick picks for tonight',
} = {}) {
  const userIdOverride =
    typeof userId === 'string' && userId.trim().length > 0 ? userId.trim() : undefined

  const stableExcludeIds = useMemo(() => normalizeExcludeIds(excludeIds), [excludeIds])

  const { data: movies, loading, error, refetch } = useQuickPicks({
    limit,
    excludeIds: stableExcludeIds,
    enabled,
    userId: userIdOverride,
  })

  const validMovies = useMemo(() => {
    return (movies || []).filter((m) => m?.poster_path)
  }, [movies])

  return (
    <CarouselRow
      title={title}
      items={validMovies}
      loading={loading}
      error={error}
      priority
      placement="quick_picks"
      onRetry={typeof refetch === 'function' ? refetch : undefined}
    />
  )
}
