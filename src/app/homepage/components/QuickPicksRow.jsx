// src/app/homepage/components/QuickPicksRow.jsx
import { useMemo } from 'react'
import CarouselRow from '@/components/carousel/Row'
import { useQuickPicks, useTopPick } from '@/shared/hooks/useRecommendations'

export default function QuickPicksRow() {
  const { data: topPick } = useTopPick()
  const excludeTmdbId = topPick?.id || null
  const { data: movies, loading, error } = useQuickPicks({ limit: 20, excludeTmdbId })

  const validMovies = useMemo(
    () => (movies || []).filter((m) => m?.poster_path),
    [movies]
  )

  return (
    <CarouselRow
      title="✨ Quick picks for tonight"
      items={validMovies}
      loading={loading}
      error={error}
      priority
    />
  )
}
