// src/app/homepage/components/PeoplesChampionsRow.jsx
import { Users } from 'lucide-react'

import PersonalizedCarouselRow from './PersonalizedCarouselRow'

/**
 * Row 3B: Audiences made these theirs. The critics missed it.
 * Engaged-only, shown when rotation variant is B.
 *
 * @param {{ data: Object[]|null, loading: boolean }} props
 */
export default function PeoplesChampionsRow({ data, loading }) {
  return (
    <PersonalizedCarouselRow
      title="The people's champions"
      movies={data || []}
      loading={loading}
      icon={Users}
      rowId="peoples-champions"
      placement="peoples_champions"
    />
  )
}
