// src/app/homepage/components/BecauseYouWatchedSection.jsx

import PersonalizedCarouselRow from './PersonalizedCarouselRow'
import { useBecauseYouWatchedRows } from '@/shared/hooks/useRecommendations'

export default function BecauseYouWatchedSection() {
  const { data: rows, loading, error } = useBecauseYouWatchedRows({
    maxSeeds: 2,
    limitPerSeed: 20,
  })

  if (loading && (!rows || rows.length === 0)) {
    // Let the row component handle loading state with empty movies
    return (
      <PersonalizedCarouselRow
        title="Because you watched"
        movies={[]}
        loading={true}
        error={null}
        rowId="because-you-watched"
      />
    )
  }

  if (error) {
    return (
      <PersonalizedCarouselRow
        title="Because you watched"
        movies={[]}
        loading={false}
        error={error}
        rowId="because-you-watched"
      />
    )
  }

  if (!rows || rows.length === 0) {
    return null
  }

  return (
    <section className="space-y-6">
      {rows.map((row, idx) => (
        <PersonalizedCarouselRow
          key={`${row.seedTmdbId}-${idx}`}
          title={`Because you watched ${row.seedTitle}`}
          movies={row.movies}
          loading={false}
          error={null}
          rowId={`because-you-watched-${idx}`}
        />
      ))}
    </section>
  )
}
