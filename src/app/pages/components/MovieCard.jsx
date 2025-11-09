// src/app/pages/components/MovieCard.jsx
import { useState } from "react";
import { Link } from "react-router-dom";

const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w342";

export default function MovieCard({
  movie,           // { id, title, poster_path, release_date, vote_average, status }
  onRemove,
  removing,
  showRemove = true
}) {
  const [hovered, setHovered] = useState(false);

  // Mobile device detection
  const isTouchDevice = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  return (
    <article
      tabIndex={0}
      className="relative group cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-neutral-900/70 shadow-lg transition-shadow duration-300 focus-within:shadow-2xl hover:shadow-2xl outline-none"
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
          className={`absolute top-2 right-2 z-20 rounded-full bg-black/60 p-2 text-white shadow-lg shadow-black/50 transition-colors 
            focus:outline-none focus:ring-2 focus:ring-orange-400
            ${removing ? "opacity-100" : 
              (isTouchDevice || hovered ? "opacity-100" : "opacity-0")}
            ${removing ? "cursor-wait" : "cursor-pointer"}
          `}
          tabIndex={0}
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

      {/* Movie link and poster */}
      <Link to={`/movie/${movie.id}`} aria-label={`Go to movie details for ${movie.title}`}>
        <div className="relative aspect-[11/16] w-full bg-black rounded-t-xl overflow-hidden">
          <img
            src={movie.poster_path ? TMDB_IMG_BASE + movie.poster_path : "/placeholder-movie.png"}
            alt={`${movie.title} poster`}
            className="w-full h-full object-contain object-top transition-transform duration-300 ease-in-out group-hover:scale-105"
            loading="lazy"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 via-black/10"
            aria-hidden="true"
          />
        </div>

        <div className="p-3">
          <h3 className="text-base font-semibold leading-snug text-white truncate drop-shadow-md">
            {movie.title}
          </h3>
          <p className="mt-1 flex items-center justify-between text-xs text-white/70 font-medium">
            <span>{(movie.release_date || "").slice(0, 4)}</span>
            <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold leading-none">
              ★ {movie.vote_average?.toFixed(1) ?? "–"}
            </span>
          </p>
          {movie.status === "onboarding" && (
            <span className="mt-2 inline-block rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white uppercase select-none">
              Onboarding
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}
