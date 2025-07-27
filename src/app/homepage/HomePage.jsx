import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Film, Star, Flame } from "lucide-react";
import CarouselRow from "@/app/homepage/components/CarouselRow";

// Fetch featured movie + genres for hero
async function fetchFeaturedMovieWithGenres() {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`);
  const data = await res.json();
  const movie = data.results[Math.floor(Math.random() * data.results.length)];
  // Fetch genres for hero movie
  const detailRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}&language=en-US`);
  const detail = await detailRes.json();
  return { ...movie, genres: detail.genres?.map(g => g.name) || [] };
}

export default function HomePage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState(null);

  useEffect(() => {
    fetchFeaturedMovieWithGenres().then(setFeatured);
  }, []);

  return (
    <div className="w-full min-h-screen pb-8 bg-zinc-950">
      {/* Hero Section */}
      <section className="relative w-full min-h-[250px] md:min-h-[340px] flex items-center px-0 md:px-4 mb-8 overflow-hidden">
        {/* BG Blur + Fade */}
        {featured?.backdrop_path && (
          <img
            src={`https://image.tmdb.org/t/p/w1280${featured.backdrop_path}`}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-30 blur-xl pointer-events-none"
            draggable={false}
          />
        )}
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-zinc-950 to-transparent z-10 pointer-events-none" />

        <div className="relative z-20 flex flex-col md:flex-row w-full max-w-[1100px] mx-auto items-center md:items-end justify-start pt-6 md:pt-9 pb-3 md:pb-7 px-2 md:px-0">
          {/* Poster */}
          {featured?.poster_path && (
            <div className="flex items-end md:items-center md:mr-8 shrink-0">
              <img
                src={`https://image.tmdb.org/t/p/w342${featured.poster_path}`}
                alt={featured.title}
                className="w-28 md:w-40 rounded-lg shadow-lg object-cover bg-zinc-900 border border-zinc-800"
                draggable={false}
              />
            </div>
          )}
          {/* Main Content */}
          <div className="flex flex-col justify-center flex-1 min-w-0 pt-6 md:pt-0">
            {featured && (
              <div className="flex flex-col gap-1.5 items-center md:items-start">
                <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                  <Film size={20} className="text-orange-400" />
                  <span className="font-semibold text-white text-xl md:text-2xl truncate max-w-[80vw]">
                    {featured.title}
                  </span>
                  {featured.release_date && (
                    <span className="text-xs text-zinc-400 ml-1">
                      ({featured.release_date.slice(0, 4)})
                    </span>
                  )}
                  {featured.vote_average > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded bg-[#23212b] text-yellow-300 font-bold text-xs">
                      ★ {featured.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
                {/* Genres */}
                {featured.genres && featured.genres.length > 0 && (
                  <div className="flex gap-2 flex-wrap justify-center md:justify-start">
                    {featured.genres.slice(0, 2).map(genre => (
                      <span key={genre} className="bg-zinc-800 text-zinc-200 text-xs rounded px-2 py-0.5 font-medium opacity-80">
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
                {/* Overview */}
                <p className="text-zinc-200 text-sm line-clamp-2 max-w-xl text-center md:text-left mt-1 opacity-90">
                  {featured.overview}
                </p>
                {/* CTA */}
                <button
                  className="mt-3 py-1.5 px-6 bg-gradient-to-r from-orange-400 to-red-500 text-white font-semibold text-base rounded-lg shadow transition hover:scale-105 active:scale-100"
                  onClick={() => navigate(`/movie/${featured.id}`)}
                >
                  Details
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content Rows - no paddings, edge to edge on mobile */}
      <div className="flex flex-col gap-10 md:gap-14 max-w-[1100px] mx-auto px-0 md:px-0">
        <CarouselRow
          title={<span className="inline-flex items-center gap-2 text-orange-300 font-semibold"><Flame size={18} /> Popular Now</span>}
          endpoint="popular"
        />
        <CarouselRow
          title={<span className="inline-flex items-center gap-2 text-yellow-200 font-semibold"><Star size={18} /> Top Rated</span>}
          endpoint="top_rated"
        />
      </div>
      <style>
        {`
          @keyframes fadeInHero {
            from { opacity: 0; transform: translateY(24px);}
            to { opacity: 1; transform: translateY(0);}
          }
          .animate-fadeInHero {
            animation: fadeInHero 0.45s cubic-bezier(.25,1,.5,1) both;
          }
        `}
      </style>
    </div>
  );
}
