import MovieCard from './MovieCard'

export default function WatchedHistory({ watched, genreMap, onRemove, gridClass = "movie-grid" }) {
  if (!watched.length) {
    return null
  }
  return (
    <div className={gridClass}>
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
  )
}
