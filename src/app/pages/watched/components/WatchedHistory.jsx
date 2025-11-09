// src/app/pages/watched/components/WatchedHistory.jsx
import { Link } from "react-router-dom";
import MovieCard from "@/app/pages/components/MovieCard";
import MovieGrid from "@/app/pages/components/MovieGrid";

export default function WatchedHistory({
  watched,
  genreMap,
  onRemove,
  gridClass,
}) {
  if (!watched?.length) {
    return (
      <p className="text-center text-zinc-400 text-base md:text-lg font-medium my-16">
        <span role="img" aria-label="Empty" className="block text-3xl mb-2">
          🍿
        </span>
        No watched movies yet. Mark some as watched to see them here!
      </p>
    );
  }

  return (
    <MovieGrid
      className={`${gridClass || ""}
        grid-cols-[repeat(auto-fill,minmax(140px,1fr))]
        sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]
        md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]
        lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]
        xl:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]`}
    >
      {watched.map((m) => {
        const id = m.movie_id ?? m.id;
        return (
          <Link
            key={id}
            to={`/movie/${id}`}
            aria-label={`View details for ${m.title}`}
            className="group relative block outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-xl transition-transform hover:scale-[1.03] hover:z-20"
          >
            <MovieCard
              movie={m}
              genreMap={genreMap}
              isWatched
              onRemove={() => onRemove(id)}
            />
          </Link>
        );
      })}
    </MovieGrid>
  );
}
