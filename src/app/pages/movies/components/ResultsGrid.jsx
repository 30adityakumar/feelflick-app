import MovieCard from '@/app/pages/shared/MovieCard';

export default function ResultsGrid({ results, onMovieClick }) {
  if (!results.length) return null;

  return (
    <div
      className="movie-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "2.1rem 1.2rem",
        justifyItems: "center",
        padding: "0 8px 16px 8px",
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
