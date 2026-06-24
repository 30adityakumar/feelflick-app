import { useState } from 'react'
import { Check } from 'lucide-react'

import { tmdbImg } from '@/shared/api/tmdb'

export default function MovieCard({ movie, isSelected, onClick }) {
  const [loaded, setLoaded] = useState(false)
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? 'Remove' : 'Select'} ${movie.title}`}
      className={`ob-movie-card${isSelected ? ' is-selected' : ''}`}
    >
      <span className="ob-movie-poster">
        {!loaded && <span className="ob-movie-skeleton" aria-hidden="true" />}
        <img
          src={tmdbImg(movie.poster_path, 'w342')}
          alt=""
          loading="lazy"
          className={loaded ? 'is-loaded' : ''}
          onLoad={() => setLoaded(true)}
        />
        {isSelected && (
          <span className="ob-movie-check" aria-hidden="true">
            <Check className="h-3.5 w-3.5" />
          </span>
        )}
      </span>
      <span className="ob-movie-copy">
        <strong>{movie.title}</strong>
        {year && <small>{year}</small>}
      </span>
    </button>
  )
}
