import MovieCard from '@/app/pages/shared/MovieCard';

export default function WatchedHistory({ watched, genreMap, onRemove, gridClass, onMovieClick }) {
  if (!watched.length) {
    return <p className="text-gray-400">No watched movies yet.</p>;
  }

  return (
    <div
      className={`
        grid gap-x-4 gap-y-8
        grid-cols-2
        sm:grid-cols-3
        md:grid-cols-4
        lg:grid-cols-5
        xl:grid-cols-6
        ${gridClass}
      `}
      aria-label="Watched movies grid"
    >
      {watched.map(m => (
        <MovieCard
          key={m.movie_id}
          movie={m}
          genreMap={genreMap}
          isWatched
          onRemove={() => onRemove(m.movie_id)}
        />
      ))}
    </div>
  );
}
