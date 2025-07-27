import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

async function fetchFeaturedMovieWithGenres() {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`);
  const data = await res.json();
  const movie = data.results[0];
  const detail = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}&language=en-US`)
    .then(r => r.json());
  return { ...movie, genres: detail.genres?.map(g => g.name) || [] };
}

export default function HeroSection() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState(null);

  useEffect(() => { fetchFeaturedMovieWithGenres().then(setFeatured); }, []);

  if (!featured) return (
    <div className="h-[54vw] max-h-[340px] rounded-none md:rounded-2xl bg-zinc-900 animate-pulse my-1 w-full" />
  );

  return (
    <section className="w-full my-1 px-0 md:px-0 flex justify-center">
      <div className="relative w-full md:max-w-[1100px] aspect-[16/7] md:rounded-2xl rounded-none overflow-hidden shadow-xl mx-0">
        {/* Backdrop */}
        <img
          src={`https://image.tmdb.org/t/p/w1280${featured.backdrop_path}`}
          alt={featured.title}
          className="absolute inset-0 w-full h-full object-cover opacity-75"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/60 to-transparent" />
        {/* Content */}
        <div className="absolute left-0 bottom-0 w-full flex flex-row md:flex-row items-end md:items-center px-4 md:px-12 pb-6 pt-10 z-10">
          <img
            src={`https://image.tmdb.org/t/p/w300${featured.poster_path}`}
            alt={featured.title}
            className="w-16 h-24 md:w-28 md:h-40 rounded-lg shadow-lg bg-zinc-900 border-2 border-zinc-800 object-cover mr-4"
            draggable={false}
            style={{ boxShadow: "0 4px 24px #0009" }}
          />
          <div className="flex-1 flex flex-col justify-end md:justify-center min-w-0">
            <h1 className="text-white text-lg md:text-2xl font-bold mb-1 truncate">{featured.title}</h1>
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
            <p className="text-xs md:text-sm text-zinc-200 max-w-full md:max-w-xs mb-2 line-clamp-2">{featured.overview}</p>
            <button
              onClick={() => navigate(`/movie/${featured.id}`)}
              className="px-5 py-1.5 rounded-lg bg-orange-500 text-white font-bold text-xs md:text-sm shadow hover:scale-105 transition w-fit"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
