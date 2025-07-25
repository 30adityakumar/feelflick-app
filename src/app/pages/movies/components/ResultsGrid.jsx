import MovieCard from '@/app/pages/shared/MovieCard'

export default function ResultsGrid({
  results,
  genreMap,
  onMarkWatched,
  watchedIds,
  gridClass,
  onMovieClick
}) {
  if (!results.length) return null

  return (
    <div
      className={gridClass}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
        gap: "1.3rem",
        justifyContent: "center",
        width: "100%"
      }}
    >
      {results.map(movie => (
        <MovieCard
          key={movie.id}
          movie={movie}
          genreMap={genreMap}
          isWatched={watchedIds?.has(movie.id)}
          onMarkWatched={onMarkWatched}
          onClick={() => onMovieClick && onMovieClick(movie)} // << HERE
        />
      ))}
    </div>
  )
}
