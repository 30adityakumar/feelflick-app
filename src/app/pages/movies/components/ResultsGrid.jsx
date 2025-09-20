import { Link } from 'react-router-dom'
import { posterSrcSet, tmdbImg } from '@/shared/api/tmdb'

/**
 * ResultsGrid
 * - Pure presentational
 * - Expects `results` from TMDb discover/search
 */
export default function ResultsGrid({ results = [] }) {
  if (!results?.length) {
    return (
      <div className="rounded-xl border border-white/10 p-6 text-center text-white/70">
        No movies found. Try adjusting your search or filters.
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {results.map((m) => (
        <li key={m.id} className="group">
          <Link to={`/movie/${m.id}`} className="block">
            <img
              alt={m.title}
              src={tmdbImg(m.poster_path, 'w342')}
              srcSet={posterSrcSet(m.poster_path)}
              width="342"
              height="513"
              loading="lazy"
              className="aspect-[2/3] w-full rounded-xl object-cover shadow-sm transition-transform group-hover:scale-[1.02]"
            />
            <div className="mt-2 truncate text-sm text-white">{m.title}</div>
            <div className="text-xs text-white/60">
              {(m.release_date || '').slice(0, 4)} • ⭐ {m.vote_average?.toFixed?.(1) ?? '—'}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}