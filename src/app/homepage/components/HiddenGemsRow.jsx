// src/app/homepage/components/HiddenGemsRow.jsx
import { Gem } from 'lucide-react'
import PersonalizedCarouselRow from './PersonalizedCarouselRow'
import { useHiddenGems } from '@/shared/hooks/useRecommendations'
import { useStaggeredEnabled } from '@/shared/hooks/useStaggeredEnabled'

export default function HiddenGemsRow() {
  const enabled = useStaggeredEnabled(100) // 100ms delay
  const { data, loading, error } = useHiddenGems({ limit: 20, enabled })

  return (
    <PersonalizedCarouselRow
      title="Hidden gems you might love"
      movies={data}
      loading={loading}
      error={error}
      icon={Gem}
      rowId="hidden-gems"
      placement="hidden_gems"
    />
  )
}