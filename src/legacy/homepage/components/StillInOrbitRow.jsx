// src/app/homepage/components/StillInOrbitRow.jsx
import { Orbit } from 'lucide-react'

import PersonalizedCarouselRow from './PersonalizedCarouselRow'

/**
 * Row 5: Embedding-similarity row seeded from user's highest-rated film.
 * Hides entirely when no qualifying seed exists.
 *
 * @param {{ data: { films: Object[], seed: { title: string }|null }|null, loading: boolean }} props
 */
export default function StillInOrbitRow({ data, loading }) {
  const seed = data?.seed
  const films = data?.films || []

  // Hide if no seed or no films
  if (!loading && (!seed || films.length < 6)) return null

  const title = seed ? `Still in ${seed.title}'s orbit` : 'Still in orbit'

  return (
    <PersonalizedCarouselRow
      title={title}
      movies={films}
      loading={loading}
      icon={Orbit}
      rowId="still-in-orbit"
      placement="still_in_orbit"
    />
  )
}
