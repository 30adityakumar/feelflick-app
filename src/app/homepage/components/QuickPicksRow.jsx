// src/app/homepage/components/QuickPicksRow.jsx
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { useQuickPicks, useTopPick } from '@/shared/hooks/useRecommendations'
import PersonalizedCarouselRow from './PersonalizedCarouselRow'

export default function QuickPicksRow() {
  const { data: topPick } = useTopPick()
  const excludeTmdbId = topPick?.id || null
  const { data, loading, error } = useQuickPicks({ limit: 20, excludeTmdbId })

  return (
    <PersonalizedCarouselRow
      title="Quick picks for tonight"
      movies={data}
      loading={loading}
      error={error}
      icon={Sparkles}
      rowId="quick-picks"
    />
  )
}
