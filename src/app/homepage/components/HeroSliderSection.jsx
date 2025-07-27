import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

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

  // Auto-slide
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % movies.length);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, [movies.length]);

  const featured = movies[current];

  if (!featured) return <div className="h-[65vw] md:h-[430px] bg-zinc-900 animate-pulse w-full" />;

  return (
    <section className="w-full m-0 p-0">
      <div className={`
        relative w-full h-[65vw] max-h-[430px] md:h-[430px] md:max-h-[520px]
        rounded-none md:rounded-none
        overflow-hidden shadow-2xl
        flex items-end
      `}>
        {/* Backdrop */}
        <img
          src={`https://image.tmdb.org/t/p/w1280${featured.backdrop_path}`}
          alt={featured.title}
          className="absolute inset-0 w-full h-full object-cover opacity-85"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/60 to-transparent" />
        {/* Content - bottom left */}
        <div className="relative z-10 flex flex-col md:flex-row items-end md:items-end w-full px-4 md:px-12 pb-8 pt-6 md:pt-0 md:pb-12">
          <img
            src={`https://image.tmdb.org/t/p/w500${featured.poster_path}`}
            alt={featured.title}
            className="w-24 h-36 md:w-48 md:h-72 rounded-2xl drop-shadow-2xl bg-zinc-900 border-4 border-white/10 object-cover mb-3 md:mb-0"
            draggable={false}
          />
          <div className="flex-1 flex flex-col justify-end min-w-0 ml-0 md:ml-8 text-left">
            <h1 className="text-white text-xl md:text-4xl font-extrabold mb-2 md:mb-4 truncate">{featured.title}</h1>
            <div className="flex flex-wrap gap-2 mb-2">
              {featured.genre_ids?.slice?.(0,2)?.map?.(g => (
                <span key={g} className="bg-zinc-800 text-zinc-200 text-xs md:text-base px-2 py-0.5 rounded">{g}</span>
              ))}
              {featured.vote_average > 0 && (
                <span className="bg-zinc-700 text-yellow-300 text-xs md:text-base px-2 py-0.5 rounded font-bold">
                  ★ {featured.vote_average.toFixed(1)}
                </span>
              )}
            </div>
            <p className="text-xs md:text-lg text-zinc-200 mb-3 md:mb-6 max-w-full md:max-w-[70%] line-clamp-2">
              {featured.overview}
            </p>
            <button
              onClick={() => navigate(`/movie/${featured.id}`)}
              className="px-6 py-2 rounded-lg bg-orange-500 text-white font-bold text-base md:text-lg shadow hover:scale-105 transition w-fit"
            >
              Details
            </button>
          </div>
        </div>
        {/* Slider dots at BOTTOM center */}
        <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2 z-20">
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
      </div>
    </section>
  );
}
