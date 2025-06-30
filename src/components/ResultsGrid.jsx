import MovieCard from './MovieCard'

export default function ResultsGrid({
  results,
  genreMap,
  onMarkWatched,
  watchedIds,
  gridClass = "movie-grid"
}) {
  if (!results.length) return null
  return (
    <div className={gridClass}>
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
  )
}
