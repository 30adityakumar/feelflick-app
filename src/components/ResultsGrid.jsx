import MovieCard from './MovieCard'

export default function ResultsGrid({
  results,
  genreMap,
  onMarkWatched,
  watchedIds
}) {
  if (!results.length) return null

  return (
    <>
      <h2 className="text-xl font-semibold mb-4 text-white">🔍 Search Results</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '2rem',
          justifyItems: 'center'
        }}
      >
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
