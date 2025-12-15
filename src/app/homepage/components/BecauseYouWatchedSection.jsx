// src/app/homepage/components/BecauseYouWatchedSection.jsx
import { useMemo } from 'react'
import { Heart } from 'lucide-react'

import PersonalizedCarouselRow from './PersonalizedCarouselRow'
import { useBecauseYouWatchedRows } from '@/shared/hooks/useRecommendations'
import { useStaggeredEnabled } from '@/shared/hooks/useStaggeredEnabled'

/**
 * BecauseYouWatchedSection
 *
 * - Accepts `userId` from HomePage so the hook can fetch immediately (no redundant auth wait)
 * - Adds a gentle stagger for smoother above-the-fold performance
 * - Removes the broken "..." placeholder and makes rendering resilient to empty states
 */
export default function BecauseYouWatchedSection({
  userId = undefined,
  maxSeeds = 2,
  limitPerSeed = 20,
  enabled: enabledProp = undefined,
} = {}) {
  const enabledStaggered = useStaggeredEnabled(300)
  const enabled = typeof enabledProp === 'boolean' ? enabledProp : enabledStaggered

  const userIdOverride =
    typeof userId === 'string' && userId.trim().length > 0 ? userId.trim() : undefined

  const { data: rows, loading, error } = useBecauseYouWatchedRows({
    maxSeeds,
    limitPerSeed,
    enabled,
    userId: userIdOverride,
  })

  const safeRows = useMemo(() => {
    if (!Array.isArray(rows)) return []
    return rows
      .filter((r) => r && Array.isArray(r.movies) && r.movies.length > 0)
      .slice(0, maxSeeds)
  }, [rows, maxSeeds])

  if (!enabled) return null

  if (loading && safeRows.length === 0) {
    return (
      <PersonalizedCarouselRow
        title="Because you watched"
        movies={[]}
        loading={true}
        error={null}
        icon={Heart}
        rowId="because-you-watched-loading"
        placement="because_you_watched"
      />
    )
  }

  if (error && safeRows.length === 0) return null
  if (safeRows.length === 0) return null

  return (
    <section className="space-y-10 sm:space-y-12" aria-label="Because you watched">
      {safeRows.map((row, idx) => {
        const seedTitle = row.seedTitle || 'this'
        const seedId = row.seedId ?? `seed-${idx}`
        return (
          <PersonalizedCarouselRow
            key={`${seedId}-${idx}`}
            title={`Because you loved ${seedTitle}`}
            movies={row.movies}
            loading={false}
            error={null}
            icon={Heart}
            rowId={`because-you-watched-${seedId}`}
            placement="because_you_loved"
          />
        )
      })}
    </section>
  )
}
