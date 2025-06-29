import MovieCard from './MovieCard'

export default function ResultsGrid ({ results, genreMap, onMarkWatched }) {
  if (results.length === 0) return null

  return (
    <>
      <h2 className="text-xl font-semibold mb-4 text-white">🔍 Search Results</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {results.map(movie => (
          <MovieCard
            key={movie.id}
            movie={movie}
            genreMap={genreMap}
            showWatchedButton={!watchedIds.has(movie.id)}
            onMarkWatched={onMarkWatched}
          />
        ))}
      </div>
    </>
  )
}
