import { useEffect, useState, useRef } from "react";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const CARD_WIDTH = 168;
const CARD_HEIGHT = 246;
const CARD_GAP = 32;

export default function TrendingToday({ onSignUp }) {
  const handleSignUp = onSignUp || (() => { window.location.href = '/auth/sign-up'; });
  const [movies, setMovies] = useState([]);
  const scrollRef = useRef(null);
  const [selectedMovie, setSelectedMovie] = useState(null);

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}`)
      .then(res => res.json())
      .then(data => setMovies((data.results || []).slice(0, 10)));
  }, []);

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -(CARD_WIDTH + CARD_GAP), behavior: "smooth" });
  };
  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: (CARD_WIDTH + CARD_GAP), behavior: "smooth" });
  };

  return (
    <section className="bg-black/80 py-9 relative min-h-[360px] w-full">
      {/* Heading */}
      <div className="font-black text-white text-lg md:text-xl tracking-widest uppercase mb-7 mt-2 ml-[8vw] text-left">
        Trending Now
      </div>

      {/* Row wrapper for padding & arrows */}
      <div className="relative w-full px-[8vw] overflow-visible">
        {/* Left Arrow */}
        <button
          aria-label="Scroll Left"
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-zinc-900/80 border-none rounded-xl w-9 h-14 text-white text-xl cursor-pointer z-10 opacity-70 hover:opacity-100 transition"
        >‹</button>
        {/* Right Arrow */}
        <button
          aria-label="Scroll Right"
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-zinc-900/80 border-none rounded-xl w-9 h-14 text-white text-xl cursor-pointer z-10 opacity-70 hover:opacity-100 transition"
        >›</button>

        {/* Horizontal scroller */}
        <div
          ref={scrollRef}
          className={`
            flex gap-8 overflow-x-auto overflow-y-visible mx-auto w-full max-w-full no-scrollbar
            py-4 pl-11 pr-2
            items-end relative
            scroll-smooth
          `}
          style={{
            minHeight: `${CARD_HEIGHT}px`
          }}
        >
          {movies.map((movie, idx) => (
            <button
              key={movie.id}
              className={`
                group relative flex-none
                rounded-xl shadow-lg bg-[#181818]
                w-[168px] min-w-[168px] h-[246px] outline-none cursor-pointer
                transition-all duration-150 ease-in
                hover:-translate-y-1.5 hover:scale-105 focus:-translate-y-1.5 focus:scale-105
                hover:z-20 focus:z-20
                border-2 border-transparent hover:border-orange-400 focus:border-orange-400
              `}
              style={{ marginRight: idx !== movies.length - 1 ? `${CARD_GAP}px` : 0 }}
              tabIndex={0}
              onClick={() => setSelectedMovie(movie)}
            >
              {/* Ranking Number */}
              <span className="
                absolute left-[-26px] bottom-3 text-[3rem] md:text-[4.8rem] font-black text-white opacity-60
                pointer-events-none drop-shadow-[0_2px_8px_#000a] z-10 select-none
                "
                style={{
                  WebkitTextStroke: "2px #fff",
                  textStroke: "2px #fff",
                  lineHeight: 1,
                  fontFamily: "Montserrat,Arial,sans-serif"
                }}
              >
                {idx + 1}
              </span>
              {/* Poster */}
              <img
                src={movie.poster_path
                  ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                  : "/posters/placeholder.png"}
                alt={movie.title}
                className={`
                  w-full h-full object-cover rounded-xl shadow-md bg-[#191919]
                  transition-all duration-150
                  group-hover:shadow-2xl group-focus:shadow-2xl
                  group-hover:brightness-105 group-focus:brightness-105
                `}
                draggable={false}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onSignUp={handleSignUp}
        />
      )}

      {/* Hide scrollbar on webkit */}
      <style>
        {`
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}
      </style>
    </section>
  );
}

function MovieModal({ movie, onClose, onSignUp }) {
  if (!movie) return null;
  const GENRES = {
    28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama",
    10751: "Family", 14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance",
    878: "Sci-Fi", 10770: "TV", 53: "Thriller", 10752: "War", 37: "Western"
  };
  const genreLabels = (movie.genre_ids || []).map(id => GENRES[id] || null).filter(Boolean);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center animate-fadeIn"
        onClick={onClose}
      />
      {/* Modal box */}
      <div
        className={`
          fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          w-[490px] max-w-[97vw] min-w-[320px]
          bg-zinc-900 rounded-2xl shadow-2xl text-white z-[10001] overflow-hidden
          animate-fadeIn
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
          className="w-full object-cover max-h-[220px] rounded-t-2xl brightness-95 contrast-105"
        />
        <div className="p-6 pt-4">
          <div className="font-black text-2xl mb-2 tracking-tight">{movie.title}</div>
          <div className="mb-3 flex gap-2 flex-wrap">
            {movie.release_date && (
              <span className="bg-zinc-700 text-white rounded px-3 py-1 text-sm mr-1">{movie.release_date.slice(0, 4)}</span>
            )}
            {genreLabels.map(label => (
              <span key={label} className="bg-zinc-700 text-white rounded px-3 py-1 text-sm mr-1">{label}</span>
            ))}
          </div>
          <div className="text-zinc-100 text-base mb-5 font-normal leading-[1.56]">
            {movie.overview || "No description available."}
          </div>
          <button
            onClick={onSignUp}
            className={`
              bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold
              rounded-md px-5 py-2 min-w-[100px] shadow-md
              hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400
              flex items-center gap-2 text-sm mt-2
              transition
            `}
          >
            Get Started <span className="text-base">›</span>
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
