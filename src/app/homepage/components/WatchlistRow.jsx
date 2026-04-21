// src/app/homepage/components/WatchlistRow.jsx
import { Bookmark } from 'lucide-react'

import PersonalizedCarouselRow from './PersonalizedCarouselRow'

/**
 * Row 7: Watchlist items added >= 14 days ago. Engaged-only.
 * Hides if fewer than 3 qualifying items.
 *
 * @param {{ data: { films: Object[] }|null, loading: boolean }} props
 */
export default function WatchlistRow({ data, loading }) {
  const films = data?.films || []

  // Hide if empty (service already enforces <3 threshold)
  if (!loading && films.length < 6) return null

  return (
    <PersonalizedCarouselRow
      title="Still on your watchlist"
      movies={films}
      loading={loading}
      icon={Bookmark}
      rowId="watchlist-row"
      placement="watchlist_row"
    />
  )
}
