// Shared poster tile with honest fallback (title monogram) and optional rating badge.
import { Link } from 'react-router-dom'
import { tmdbImg, posterSrcSet } from '@/shared/api/tmdb'

export function starString(stars) {
  if (stars == null) return ''
  const full = Math.floor(stars)
  const half = stars - full >= 0.5
  return '★'.repeat(full) + (half ? '½' : '')
}

export default function DnaPoster({ movie, showTitle = false, showRating = false, linkToMovie = true }) {
  const rating = showRating && movie?.rating != null ? movie.rating : null
  const inner = (
    <>
      {movie?.posterPath ? (
        <img src={tmdbImg(movie.posterPath, 'w342')} srcSet={posterSrcSet(movie.posterPath)}
          sizes="(max-width: 640px) 40vw, 200px" alt={showTitle ? '' : movie.title} loading="lazy" decoding="async" />
      ) : (
        <span className="dna-poster__fallback">{movie?.title || 'Untitled'}</span>
      )}
      {rating != null ? <span className="dna-poster__rating">{starString(rating)}</span> : null}
      {showTitle ? <span className="dna-poster__title">{movie?.title}</span> : null}
    </>
  )
  if (linkToMovie && movie?.id != null) {
    return <Link to={`/movie/${movie.id}`} className="dna-poster" aria-label={movie.title}>{inner}</Link>
  }
  return <div className="dna-poster" aria-hidden={!showTitle}>{inner}</div>
}
