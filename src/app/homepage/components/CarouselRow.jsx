import MovieCard from "@/app/pages/shared/MovieCard";

export default function CarouselRow({ title, movies }) {
  return (
    <div style={{ marginBottom: 34 }}>
      <div style={{
        fontWeight: 800, fontSize: 22, letterSpacing: "-1px",
        margin: "0 0 13px 14px"
      }}>{title}</div>
      <div style={{
        display: "flex", overflowX: "auto", gap: 22, padding: "4px 0 8px 10px"
      }}>
        {movies.map(movie => <MovieCard key={movie.id} movie={movie} />)}
      </div>
    </div>
  );
}
