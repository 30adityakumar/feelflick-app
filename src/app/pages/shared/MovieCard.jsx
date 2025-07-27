import { Star } from "lucide-react";
const TMDB_IMG = "https://image.tmdb.org/t/p/w342";

export default function MovieCard({ movie, onClick }) {
  const posterPath = movie.poster || movie.poster_path || "";
  const posterUrl = posterPath.startsWith("http")
    ? posterPath
    : `${TMDB_IMG}${posterPath}`;
  const movieId = movie.movie_id || movie.id;

  return (
    <div
      tabIndex={0}
      className="group shadow-xl transition-transform duration-200 bg-[#17151e] rounded-2xl overflow-hidden relative cursor-pointer"
      style={{ width: 186, minWidth: 186, height: 295 }}
      onClick={() => onClick(movie)}
    >
      {/* Poster */}
      <img
        src={posterUrl}
        alt={movie.title}
        style={{ width: "100%", height: 230, objectFit: "cover", display: "block", borderRadius: "18px 18px 0 0" }}
        onError={e => { e.currentTarget.src = "/placeholder-movie.png"; }}
        className="group-hover:brightness-95 transition"
      />
      {/* Overlay badges */}
      <div className="absolute top-3 right-3 flex flex-col items-end z-10">
        {/* Rating badge */}
        <span className="bg-black/85 text-yellow-400 font-bold text-xs rounded-full px-3 py-1 flex items-center gap-1 mb-2 shadow">
          <Star size={13} />{movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
        </span>
        {/* Year badge */}
        {movie.release_date && (
          <span className="bg-black/75 text-white font-semibold text-[13px] rounded-full px-2.5 py-0.5 shadow">
            {movie.release_date.slice(0, 4)}
          </span>
        )}
      </div>
      {/* Movie title */}
      <div className="pt-3 pb-2 px-3 bg-[#18151c] rounded-b-2xl flex flex-col items-center justify-center" style={{ minHeight: 54 }}>
        <span
          className="
            text-center text-[1.06rem] sm:text-base font-extrabold text-white
            leading-tight tracking-tight w-full
            transition group-hover:text-orange-300
            whitespace-normal"
          style={{
            letterSpacing: "0.015em",
            textShadow: "0 1.5px 8px #0004"
          }}
        >
          {movie.title}
        </span>
      </div>
    </div>
  );
}
