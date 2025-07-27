import MovieCard from '@/app/pages/shared/MovieCard'

export default function ResultsGrid({ results, onMovieClick }) {
  if (!results.length) return null

  // Show 5 movies per page
  const displayMovies = results.slice(0, 5);

  return (
    <div
      className="
        flex overflow-x-auto gap-6 px-1 pt-2 pb-3 sm:grid sm:grid-cols-5 sm:gap-8
        snap-x snap-mandatory scroll-smooth
      "
      style={{
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-x",
        minWidth: 0,
        maxWidth: "100vw",
      }}
    >
      {displayMovies.map(movie => (
        <div key={movie.id} className="snap-start flex-shrink-0" style={{ width: 186, minWidth: 186 }}>
          <MovieCard movie={movie} onClick={onMovieClick} />
        </div>
      ))}
    </div>
  )
}
