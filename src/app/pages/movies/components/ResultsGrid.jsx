import MovieCard from '@/app/pages/shared/MovieCard';

export default function ResultsGrid({ results, onMovieClick }) {
  if (!results.length) return null;
  return (
    <div
      className="movie-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "1.7rem 0.7rem",
        justifyItems: "center",
        padding: "0 5px 12px 5px",
        width: "100%",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      {results.map(movie => (
        <MovieCard
          key={movie.id}
          movie={movie}
          onClick={onMovieClick}
        />
      ))}
    </div>
  );
}
