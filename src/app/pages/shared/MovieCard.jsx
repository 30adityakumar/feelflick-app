// MovieCard.jsx
import { Star } from "lucide-react";
const TMDB_IMG = "https://image.tmdb.org/t/p/w342";

export default function MovieCard({ movie, onClick }) {
  const posterPath = movie.poster || movie.poster_path || "";
  const posterUrl = posterPath.startsWith("http")
    ? posterPath
    : `${TMDB_IMG}${posterPath}`;

  return (
    <div
      className="movie-card group shadow-xl transition-transform duration-200 bg-[#17151e] rounded-2xl overflow-hidden relative cursor-pointer"
      tabIndex={0}
      style={{
        width: "94%",
        maxWidth: 190,
        minWidth: 140,
        height: 312,
      }}
      onClick={() => onClick(movie)}
    >
      {/* Poster */}
      <img
        src={posterUrl}
        alt={movie.title}
        style={{
          width: "100%",
          height: 234,
          objectFit: "cover",
          display: "block",
          borderRadius: "18px 18px 0 0",
        }}
        onError={e => { e.currentTarget.src = "/placeholder-movie.png"; }}
        className="group-hover:brightness-95 transition"
      />
      {/* Badges */}
      <div className="absolute top-3 right-3 flex flex-col items-end z-10">
        <span className="bg-black/85 text-yellow-400 font-bold text-xs rounded-full px-3 py-1 flex items-center gap-1 mb-2 shadow">
          <Star size={13} />{movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
        </span>
        {movie.release_date && (
          <span className="bg-black/75 text-white font-semibold text-[13px] rounded-full px-2.5 py-0.5 shadow">
            {movie.release_date.slice(0, 4)}
          </span>
        )}
      </div>
      {/* Title */}
      <div className="pt-2 pb-2 px-2 bg-[#18151c] rounded-b-2xl flex flex-col items-center justify-center" style={{ minHeight: 56 }}>
        <span className="text-center text-[1rem] font-extrabold text-white leading-tight w-full tracking-tight whitespace-normal" style={{ textShadow: "0 1.5px 8px #0003" }}>
          {movie.title}
        </span>
      </div>
    </div>
  );
}
