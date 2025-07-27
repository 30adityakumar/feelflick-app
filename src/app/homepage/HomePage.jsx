import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Film, Star, Flame } from "lucide-react";
import CarouselRow from "@/app/homepage/components/CarouselRow";

async function fetchFeaturedMovieWithGenres() {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`);
  const data = await res.json();
  const movie = data.results[Math.floor(Math.random() * data.results.length)];
  const detail = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}&language=en-US`)
                 .then(r => r.json());
  return { ...movie, genres: detail.genres?.map(g => g.name) || [] };
}

export default function HomePage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState(null);

  useEffect(() => { fetchFeaturedMovieWithGenres().then(setFeatured); }, []);

  return (
    <div className="w-full min-h-screen pb-14 bg-zinc-950">
      {/* Hero Section */}
      <section className="relative w-full min-h-[180px] md:min-h-[340px] flex items-end px-0 md:px-4 mb-3 overflow-hidden">
        {/* Blurred backdrop for mobile, poster takes focus */}
        {featured?.backdrop_path && (
          <img
            src={`https://image.tmdb.org/t/p/w780${featured.backdrop_path}`}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-35 blur-sm md:opacity-25 md:blur-xl"
            draggable={false}
          />
        )}
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-zinc-950 to-transparent" />
        <div className="relative z-10 flex items-end w-full max-w-full mx-0 px-3 py-4 md:py-7">
          {/* Poster on mobile, left-aligned */}
          {featured?.poster_path && (
            <img
              src={`https://image.tmdb.org/t/p/w342${featured.poster_path}`}
              alt={featured.title}
              className="w-20 h-28 rounded-md shadow-lg bg-zinc-900 border border-zinc-800 object-cover mr-3 md:w-40 md:h-56"
              draggable={false}
            />
          )}
          <div className="flex-1 flex flex-col justify-end min-w-0">
            {featured && (
              <>
                <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-1">
                  <span className="font-bold text-white text-lg md:text-2xl truncate">{featured.title}</span>
                  {featured.release_date && (
                    <span className="text-xs text-zinc-400">({featured.release_date.slice(0, 4)})</span>
                  )}
                  {featured.vote_average > 0 && (
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-yellow-300 text-xs font-bold ml-1">
                      ★ {featured.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 mt-0 mb-1 flex-wrap">
                  {featured.genres.slice(0, 2).map(g => (
                    <span key={g} className="bg-zinc-800 text-zinc-300 text-[10px] rounded px-1.5 py-0.5">{g}</span>
                  ))}
                </div>
                <p className="text-xs text-zinc-200 opacity-90 line-clamp-2 mb-2">{featured.overview}</p>
                <button
                  onClick={() => navigate(`/movie/${featured.id}`)}
                  className="py-1 px-4 rounded bg-orange-500 text-white font-semibold text-xs shadow hover:scale-105 transition w-fit"
                >
                  Details
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Carousels */}
      <div className="flex flex-col gap-6 md:gap-10 w-full mx-0 px-0 md:max-w-[1100px] md:mx-auto">
        <CarouselRow
          title={<span className="inline-flex items-center gap-2 text-orange-300 font-bold text-base md:text-lg"><Flame size={18} /> Popular Now</span>}
          endpoint="popular"
          cardType="big"
        />
        <CarouselRow
          title={<span className="inline-flex items-center gap-2 text-yellow-300 font-bold text-base md:text-lg"><Star size={18} /> Top Rated</span>}
          endpoint="top_rated"
          cardType="big"
        />
      </div>
    </div>
  );
}
