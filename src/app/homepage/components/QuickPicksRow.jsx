// src/app/homepage/components/QuickPicksRow.jsx
import { useMemo } from 'react'
import CarouselRow from '@/components/carousel/Row'
import { useQuickPicks, useTopPick } from '@/shared/hooks/useRecommendations'

export default function QuickPicksRow() {
  const { data: topPick } = useTopPick()
  
  // Exclude hero movie from quick picks
  const excludeIds = useMemo(() => {
    return topPick?.id ? [topPick.id] : []
  }, [topPick?.id])
  
  const { data: movies, loading, error } = useQuickPicks({ 
    limit: 20, 
    excludeIds 
  })

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
      placement="quick_picks"
    />
  )
}