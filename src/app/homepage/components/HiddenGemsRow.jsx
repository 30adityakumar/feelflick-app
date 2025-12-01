// src/app/homepage/components/HiddenGemsRow.jsx

import { Sparkles } from 'lucide-react'
import PersonalizedCarouselRow from './PersonalizedCarouselRow'
import { useHiddenGems } from '@/shared/hooks/useRecommendations'

export default function HiddenGemsRow() {
  const { data, loading, error } = useHiddenGems({ limit: 20 })

  return (
    <PersonalizedCarouselRow
      title="Hidden gems you might love"
      movies={data}
      loading={loading}
      error={error}
      icon={Sparkles}
      rowId="hidden-gems"
    />
  )
}
