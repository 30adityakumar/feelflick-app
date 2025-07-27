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
    <div className="w-full min-h-screen pb-12 bg-zinc-950">
      {/* Hero Section */}
      <section className="relative w-full min-h-[230px] md:min-h-[340px] flex items-center px-0 md:px-4 mb-8 overflow-hidden">
        {/* blurred backdrop */}
        {featured?.backdrop_path && (
          <img
            src={`https://image.tmdb.org/t/p/w1280${featured.backdrop_path}`}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-25 blur-xl"
            draggable={false}
          />
        )}
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-zinc-950 to-transparent" />
        {/* hero inner */}
        <div className="relative flex flex-col md:flex-row w-full md:max-w-[1100px] mx-0 md:mx-auto items-center md:items-end pt-5 md:pt-8 pb-3 md:pb-7 px-0 md:px-0">
          {featured?.poster_path && (
            <div className="flex shrink-0 px-0 md:pl-0">
              <img
                src={`https://image.tmdb.org/t/p/w342${featured.poster_path}`}
                alt={featured.title}
                className="w-28 md:w-40 rounded-lg shadow-lg bg-zinc-900 border border-zinc-800"
                draggable={false}
              />
            </div>
          )}
          <div className="flex flex-col justify-center flex-1 min-w-0 pt-5 md:pt-0 pl-0 md:pl-6">
            {featured && (
              <>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <Film className="text-orange-400" size={20} />
                  <h1 className="font-semibold text-white text-xl md:text-2xl truncate">
                    {featured.title}
                  </h1>
                  {featured.release_date && (
                    <span className="text-xs text-zinc-400">
                      ({featured.release_date.slice(0, 4)})
                    </span>
                  )}
                  {featured.vote_average > 0 && (
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-yellow-300 text-xs font-bold">
                      ★ {featured.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
                {featured.genres.length > 0 && (
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {featured.genres.slice(0, 2).map(g => (
                      <span key={g} className="bg-zinc-800 text-zinc-300 text-[11px] rounded px-2 py-0.5">
                        {g}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-sm text-zinc-200 opacity-90 mt-1 line-clamp-2">
                  {featured.overview}
                </p>
                <button
                  onClick={() => navigate(`/movie/${featured.id}`)}
                  className="mt-3 self-start py-1.5 px-6 rounded-lg bg-gradient-to-r from-orange-400 to-red-500 text-white font-semibold text-sm md:text-base shadow hover:scale-105 transition"
                >
                  Details
                </button>
              </>
            )}
          </div>
        </div>
      </section>
      {/* Carousels: edge-to-edge, no left/right gap on mobile */}
      <div className="flex flex-col gap-10 md:gap-14 w-full mx-0 px-0 md:max-w-[1100px] md:mx-auto">
        <CarouselRow
          title={<span className="inline-flex items-center gap-2 text-orange-300 font-semibold"><Flame size={18} /> Popular&nbsp;Now</span>}
          endpoint="popular"
        />
        <CarouselRow
          title={<span className="inline-flex items-center gap-2 text-yellow-300 font-semibold"><Star size={18} /> Top&nbsp;Rated</span>}
          endpoint="top_rated"
        />
      </div>
    </div>
  );
}
