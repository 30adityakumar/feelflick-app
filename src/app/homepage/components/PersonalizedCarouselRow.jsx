// src/app/homepage/components/PersonalizedCarouselRow.jsx
/**
 * Personalized carousel row component
 * Uses main CarouselRow for consistent behavior (hover, watchlist, tracking)
 */

import { useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import CarouselRow from '@/components/carousel/Row'

export default function PersonalizedCarouselRow({ 
  title, 
  movies = [], 
  loading = false, 
  error = null,
  icon: Icon = Sparkles,
  rowId = 'personalized',
  placement = null
}) {
  const validMovies = useMemo(() => {
    return (movies || []).filter(m => m && m.poster_path)
  }, [movies])

  // Build title with icon
  const titleWithIcon = (
    <span className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-[#667eea]" />
      {title}
    </span>
  )

  return (
    <CarouselRow
      title={title}
      items={validMovies}
      loading={loading}
      error={error}
      priority={false}
      placement={placement}
    />
  )
}