import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// Fetch a few featured movies for the slider!
async function fetchFeaturedMovies() {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  const res = await fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=en-US&page=1`);
  const data = await res.json();
  return (data.results || []).slice(0, 5);
}

export default function HeroSliderSection() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef();

  useEffect(() => {
    fetchFeaturedMovies().then(setMovies);
  }, []);

  // Auto-slide (optional: remove if you want manual only)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % movies.length);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, [movies.length]);

  const featured = movies[current];

  if (!featured) return <div className="h-[320px] md:h-[430px] bg-zinc-900 animate-pulse w-full" />;

  return (
    <section className="w-full relative m-0 p-0">
      {/* Slider controls */}
      <div className="absolute z-20 right-3 top-3 flex gap-2 md:right-8 md:top-8">
        {movies.map((_, i) => (
          <button
            key={i}
            className={`w-3 h-3 rounded-full ${i === current ? 'bg-orange-500' : 'bg-white/30'} transition`}
            onClick={() => setCurrent(i)}
            aria-label={`Show slide ${i + 1}`}
            style={{ border: 0, outline: "none" }}
          />
        ))}
      </div>
      {/* Main Hero Content */}
      <div className={`
        relative w-full mx-0 px-0
        h-[320px] md:h-[430px] 
        md:rounded-none rounded-none
        overflow-hidden shadow-2xl flex items-center
      `}>
        {/* Blurred Backdrop */}
        <img
          src={`https://image.tmdb.org/t/p/w1280${featured.backdrop_path}`}
          alt={featured.title}
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/60 to-transparent" />
        {/* Content: Poster + Info */}
        <div className={`
          relative z-10 flex flex-col md:flex-row items-end md:items-center w-full h-full px-4 md:px-16 py-6 md:py-0
        `}>
          <div className="flex-shrink-0 flex justify-center items-center w-full md:w-auto">
            <img
              src={`https://image.tmdb.org/t/p/w500${featured.poster_path}`}
              alt={featured.title}
              className="w-32 h-48 md:w-52 md:h-72 rounded-2xl drop-shadow-lg bg-zinc-900 border-4 border-white/10 object-cover mb-3 md:mb-0"
              draggable={false}
            />
          </div>
          <div className="flex-1 flex flex-col justify-center min-w-0 ml-0 md:ml-10 text-center md:text-left">
            <h1 className="text-white text-2xl md:text-4xl font-extrabold mb-2 md:mb-3 truncate">{featured.title}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2">
              {featured.genre_ids?.slice?.(0,2)?.map?.(g => (
                <span key={g} className="bg-zinc-800 text-zinc-200 text-xs md:text-base px-2 py-0.5 rounded">{g}</span>
              ))}
              {featured.vote_average > 0 && (
                <span className="bg-zinc-700 text-yellow-300 text-xs md:text-base px-2 py-0.5 rounded font-bold">
                  ★ {featured.vote_average.toFixed(1)}
                </span>
              )}
            </div>
            <p className="text-xs md:text-base text-zinc-200 mb-3 md:mb-6 max-w-full md:max-w-[60%] mx-auto md:mx-0 line-clamp-2">
              {featured.overview}
            </p>
            <button
              onClick={() => navigate(`/movie/${featured.id}`)}
              className="px-8 py-2 rounded-lg bg-orange-500 text-white font-bold text-base md:text-lg shadow hover:scale-105 transition w-fit mx-auto md:mx-0"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
