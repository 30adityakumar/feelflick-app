// src/app/pages/watched/components/WatchedHistory.jsx
import MovieCard from '@/app/pages/shared/MovieCard';

export default function WatchedHistory({
  watched,
  genreMap,
  onRemove,
  gridClass = '',
  onMovieClick,
}) {
  if (!watched?.length) {
    return (
      <div className="text-zinc-400 text-center text-base md:text-lg font-medium my-16">
        <span role="img" aria-label="Empty" className="block text-3xl mb-2">🍿</span>
        No watched movies yet. Mark some as watched to see them here!
      </div>
    );
  }

  return (
    <div
      className={[
        'grid gap-x-4 gap-y-8',
        'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6',
        gridClass,
      ].join(' ')}
      aria-label="Watched movies grid"
    >
      {watched.map((m) => (
        <MovieCard
          key={m.movie_id ?? m.id}
          movie={m}
          genreMap={genreMap}
          isWatched
          onRemove={() => onRemove(m.movie_id ?? m.id)}
          onClick={() => onMovieClick?.(m)}
        />
      ))}
    </div>
  );
}