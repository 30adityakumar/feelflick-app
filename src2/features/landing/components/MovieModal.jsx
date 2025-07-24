import { useNavigate } from "react-router-dom";

const GENRES = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama",
  10751: "Family", 14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance",
  878: "Sci-Fi", 10770: "TV", 53: "Thriller", 10752: "War", 37: "Western"
};

export default function MovieModal({ movie, onClose }) {
  const navigate = useNavigate();
  if (!movie) return null;
  const genreLabels = (movie.genre_ids || []).map(id => GENRES[id] || null).filter(Boolean);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center animate-fadeIn"
        onClick={onClose}
      />
      {/* Modal box */}
      <div
        className={`
          fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          w-[490px] max-w-[97vw] min-w-[320px]
          bg-[#18141c] rounded-2xl shadow-2xl text-white z-[10001] overflow-hidden
          animate-fadeIn
          sm:w-[97vw] sm:min-w-0
        `}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 bg-zinc-800/80 text-white text-2xl w-10 h-10 rounded-full flex items-center justify-center z-10 hover:bg-zinc-700/80 transition"
        >&#10005;</button>
        {/* Movie Image */}
        <img
          src={movie.backdrop_path
            ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
            : (movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : "/posters/placeholder.png")}
          alt={movie.title}
          className="w-full object-cover max-h-[220px] rounded-t-2xl brightness-95 contrast-105 sm:max-h-[210px]"
        />
        <div className="p-7 pt-5">
          <div className="font-black text-2xl mb-2 tracking-tight">{movie.title}</div>
          <div className="mb-3 flex gap-2 flex-wrap">
            {movie.release_date && (
              <span className="bg-zinc-700 text-white rounded px-3 py-1 text-sm mr-1">{movie.release_date.slice(0, 4)}</span>
            )}
            {genreLabels.map(label => (
              <span key={label} className="bg-zinc-700 text-white rounded px-3 py-1 text-sm mr-1">{label}</span>
            ))}
          </div>
          <div className="text-zinc-100 text-base mb-6 font-normal leading-[1.56]">
            {movie.overview || "No description available."}
          </div>
          <button
            onClick={() => navigate("/auth/sign-up")}
            className={`
              bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold
              rounded-md px-6 py-2 min-w-[100px] shadow-md
              hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400
              flex items-center gap-2 text-base mt-2
              transition
            `}
            style={{
              letterSpacing: "0.01em",
            }}
          >
            Get Started <span className="text-lg">›</span>
          </button>
        </div>
      </div>
      {/* Modal fade-in animation */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fadeIn { animation: fadeIn 0.22s; }
        `}
      </style>
    </>
  );
}
