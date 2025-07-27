import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

async function fetchFeaturedMovieWithGenres() {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`);
  const data = await res.json();
  const movie = data.results[0]; // Just the most popular!
  const detail = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}&language=en-US`)
    .then(r => r.json());
  return { ...movie, genres: detail.genres?.map(g => g.name) || [] };
}

export default function HeroSection() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState(null);

  useEffect(() => { fetchFeaturedMovieWithGenres().then(setFeatured); }, []);

  if (!featured) return <div className="h-[55vw] max-h-[330px] rounded-2xl bg-zinc-900 animate-pulse my-3 mx-2 md:mx-auto md:w-[900px]" />;

  return (
    <section className="w-full flex justify-center my-3">
      <div className="relative w-full max-w-[900px] aspect-[16/7] rounded-2xl overflow-hidden shadow-xl mx-2">
        {/* Blurred backdrop */}
        <img
          src={`https://image.tmdb.org/t/p/w1280${featured.backdrop_path}`}
          alt={featured.title}
          className="absolute inset-0 w-full h-full object-cover opacity-70"
          draggable={false}
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950/90 via-zinc-950/40 to-transparent" />
        {/* Content */}
        <div className="absolute left-0 bottom-0 top-0 flex items-end md:items-center px-5 pb-5 md:pb-0 md:pl-10 gap-5 z-10">
          <img
            src={`https://image.tmdb.org/t/p/w300${featured.poster_path}`}
            alt={featured.title}
            className="w-16 h-24 md:w-28 md:h-40 rounded-lg shadow-lg bg-zinc-900 border-2 border-zinc-800 object-cover"
            draggable={false}
          />
          <div className="flex flex-col justify-end md:justify-center">
            <h1 className="text-white text-lg md:text-2xl font-bold mb-1">{featured.title}</h1>
            <div className="flex gap-2 flex-wrap mb-1">
              {featured.genres.slice(0,2).map(g => (
                <span key={g} className="bg-zinc-800 text-zinc-200 text-xs px-2 py-0.5 rounded">{g}</span>
              ))}
              {featured.vote_average > 0 && (
                <span className="bg-zinc-700 text-yellow-300 text-xs px-2 py-0.5 rounded font-bold">
                  ★ {featured.vote_average.toFixed(1)}
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-200 max-w-xs mb-2 line-clamp-2">{featured.overview}</p>
            <button
              onClick={() => navigate(`/movie/${featured.id}`)}
              className="px-5 py-1.5 rounded-lg bg-orange-500 text-white font-bold text-sm shadow hover:scale-105 transition"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
