export default function MovieCard({
  movie,
  genreMap,
  showWatchedButton = false,
  onMarkWatched = () => {}
}) {
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w185${movie.poster_path}`
    : null;

  const year  = movie.release_date ? new Date(movie.release_date).getFullYear() : '—';
  const score = movie.vote_average ? movie.vote_average.toFixed(1) : '–';

  const genres = (movie.genre_ids || [])
    .map(id => genreMap[id])
    .filter(Boolean)
    .slice(0, 3)
    .join(', ');

  return (
    <div className="bg-white/10 p-2 rounded-lg shadow text-center hover:scale-[1.02] transition-transform flex flex-col" style={{ maxWidth: '150px' }}>
      {posterUrl ? (
        <img
          src={posterUrl}
          alt={movie.title}
          className="rounded w-full h-auto mb-2 object-cover"
          style={{ height: '225px' }}
        />
      ) : (
        <div
          className="rounded w-full mb-2 flex items-center justify-center text-gray-400 text-xs"
          style={{ backgroundColor: '#222', height: '225px' }}
        >
          No Image
        </div>
      )}

      <div className="flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold truncate" title={movie.title}>
            {movie.title}
          </p>
          <p className="text-xs text-gray-300 truncate" title={genres}>
            {genres || '—'}
          </p>
          <p className="text-xs text-gray-400">
            {year} • ⭐ {score}
          </p>
        </div>

        {showWatchedButton ? (
          <button
            onClick={() => onMarkWatched(movie)}
            className="mt-3 w-full bg-green-600 text-white py-1 text-xs rounded hover:bg-green-700"
          >
            Watched ✓
          </button>
        ) : (
          <p className="text-xs text-gray-500 mt-3">Already watched</p>
        )}
      </div>
    </div>
  );
}
