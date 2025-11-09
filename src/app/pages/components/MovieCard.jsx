// src/app/pages/components/MovieCard.jsx
import { useState } from "react";
import { Link } from "react-router-dom";

const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w342";

export default function MovieCard({
  movie,
  onRemove,
  removing,
  showRemove = true,
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <article
      className="relative group cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-neutral-900/70 shadow-lg transition-shadow duration-300
                 hover:shadow-2xl focus-within:shadow-2xl"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {showRemove && onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(movie.id);
          }}
          disabled={removing}
          aria-label={`Remove ${movie.title} from list`}
          className={`absolute top-2 right-2 z-20 rounded-full bg-black/70 p-2 text-white transition-colors ${
            hovered ? "opacity-100" : "opacity-0"
          } focus:opacity-100`}
        >
          {removing ? (
            <svg
              className="h-5 w-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                strokeWidth="4"
                stroke="currentColor"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
      )}

      <Link to={`/movie/${movie.id}`}>
        <div className="relative">
          <img
            src={
              movie.poster_path
                ? TMDB_IMG_BASE + movie.poster_path
                : "/placeholder-movie.png"
            }
            alt={`${movie.title} poster`}
            className="w-full rounded-t-xl object-cover aspect-[11/16]"
            loading="lazy"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 via-black/30"
            aria-hidden="true"
          />
        </div>

        <div className="p-3">
          <h3 className="text-base font-semibold leading-tight text-white truncate">
            {movie.title}
          </h3>
          <p className="mt-1 flex items-center justify-between text-sm text-white/70">
            <span>{(movie.release_date || "").slice(0, 4)}</span>
            <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs">
              ★ {movie.vote_average?.toFixed(1) ?? "–"}
            </span>
          </p>
          {movie.status === "onboarding" && (
            <span className="mt-2 inline-block rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white uppercase">
              Onboarding
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}
