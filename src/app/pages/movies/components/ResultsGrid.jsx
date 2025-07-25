import { Star } from "lucide-react";

// Poster aspect ratio for all cards
const POSTER_RATIO = 2 / 3;

export default function ResultsGrid({
  results = [],
  genreMap = {},
  watchedIds = new Set(),
  onMarkWatched,
  gridClass = "",
  onMovieClick
}) {
  if (!results.length) return null;

  return (
    <div
      className={`
        grid gap-x-4 gap-y-8
        grid-cols-2
        sm:grid-cols-3
        md:grid-cols-4
        lg:grid-cols-5
        xl:grid-cols-6
        ${gridClass}
      `}
      aria-label="Movie results"
    >
      {results.map((movie) => (
        <div
          key={movie.id}
          className={`
            group flex flex-col items-center bg-zinc-950/85 rounded-xl shadow-lg overflow-hidden
            cursor-pointer hover:scale-105 hover:shadow-2xl focus-within:scale-105 transition
            border border-zinc-800
            outline-none
          `}
          tabIndex={0}
          aria-label={`Open details for ${movie.title}`}
          onClick={() => onMovieClick?.(movie)}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") onMovieClick?.(movie);
          }}
        >
          {/* Movie poster */}
          <div className="relative w-full aspect-[2/3] bg-zinc-800 rounded-t-xl overflow-hidden flex-shrink-0">
            {movie.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                alt={movie.title}
                className="w-full h-full object-cover transition group-hover:opacity-90"
                draggable={false}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">No Image</div>
            )}
            {/* Watched badge */}
            {watchedIds.has(movie.id) && (
              <span className="absolute top-2 left-2 bg-green-500 text-xs text-white px-2 py-0.5 rounded-lg shadow font-bold z-10 select-none">
                Watched
              </span>
            )}
            {/* Rating badge */}
            {movie.vote_average > 0 && (
              <span className="absolute top-2 right-2 flex items-center gap-1 bg-[#23212b] text-yellow-300 font-bold text-xs px-2 py-0.5 rounded-lg shadow select-none">
                <Star size={13} className="inline-block -mt-0.5" />
                {movie.vote_average.toFixed(1)}
              </span>
            )}
          </div>

          {/* Movie info */}
          <div className="w-full flex flex-col items-center gap-1 py-3 px-1 bg-zinc-950/80 rounded-b-xl min-h-[66px]">
            <div className="font-semibold text-sm text-white truncate w-full text-center">
              {movie.title}
            </div>
            <div className="text-xs text-zinc-400">
              {movie.release_date ? movie.release_date.slice(0, 4) : ""}
            </div>
            {/* Genres, optional:
            <div className="flex gap-1 flex-wrap justify-center">
              {(movie.genre_ids || []).slice(0,2).map(id => (
                <span key={id} className="text-[10px] bg-zinc-800 text-zinc-300 rounded px-1">{genreMap[id]}</span>
              ))}
            </div>
            */}
            {/* Watched button (if not already watched) */}
            {onMarkWatched && !watchedIds.has(movie.id) && (
              <button
                className="
                  mt-1 px-3 py-1 rounded-full bg-gradient-to-r from-orange-400 to-red-500
                  text-white font-bold text-xs shadow hover:scale-105 transition
                  focus-visible:outline-2 focus-visible:outline-orange-400
                "
                onClick={e => { e.stopPropagation(); onMarkWatched(movie); }}
                tabIndex={0}
                aria-label={`Mark ${movie.title} as watched`}
              >
                Mark as Watched
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
