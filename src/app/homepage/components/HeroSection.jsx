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

  // Height for mobile, aspect ratio for desktop
  return (
    <section className="w-full">
      <div className="
        relative w-full mx-0
        h-[170px] md:h-auto md:aspect-[16/7]
        md:rounded-2xl rounded-none
        overflow-hidden shadow-xl
        flex items-center
      ">
        {/* Blurred Backdrop */}
        {featured && (
          <img
            src={`https://image.tmdb.org/t/p/w780${featured.backdrop_path}`}
            alt={featured.title}
            className="absolute inset-0 w-full h-full object-cover opacity-70"
            draggable={false}
            style={{ objectPosition: 'center 35%' }}
          />
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/60 to-transparent" />
        {/* Content: poster + info row, always visible */}
        <div className="relative flex flex-row items-center px-3 md:px-10 py-3 h-full z-10">
          {featured && (
            <>
              <img
                src={`https://image.tmdb.org/t/p/w300${featured.poster_path}`}
                alt={featured.title}
                className="w-14 h-20 md:w-24 md:h-36 rounded-lg shadow-lg bg-zinc-900 border-2 border-zinc-800 object-cover mr-3"
                draggable={false}
              />
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <h1 className="text-white text-base md:text-2xl font-bold mb-1 truncate">{featured.title}</h1>
                <div className="flex gap-2 flex-wrap mb-1">
                  {featured.genres.slice(0,2).map(g => (
                    <span key={g} className="bg-zinc-800 text-zinc-200 text-[11px] px-2 py-0.5 rounded">{g}</span>
                  ))}
                  {featured.vote_average > 0 && (
                    <span className="bg-zinc-700 text-yellow-300 text-[11px] px-2 py-0.5 rounded font-bold">
                      ★ {featured.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
                <p className="text-xs md:text-sm text-zinc-200 max-w-full md:max-w-xs mb-2 line-clamp-2">{featured.overview}</p>
                <button
                  onClick={() => navigate(`/movie/${featured.id}`)}
                  className="px-4 py-1 rounded-lg bg-orange-500 text-white font-bold text-xs md:text-sm shadow hover:scale-105 transition w-fit"
                >
                  Details
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
