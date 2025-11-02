// src/app/pages/watched/components/WatchedHistory.jsx
import { Link } from "react-router-dom";
import MovieCard from "@/app/pages/shared/MovieCard";

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
    <div
      className={`
        grid gap-x-4 gap-y-8
        grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
        ${gridClass || ""}
      `}
      aria-label="Watched movies grid"
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
    </div>
  );
}