import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Star, Flame, Film, ThumbsUp } from "lucide-react";
import CarouselRow from "@/app/homepage/components/CarouselRow";

// Helper: Fetch TMDb movie details for genres
async function fetchFeaturedMovieWithGenres() {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`);
  const data = await res.json();
  const movie = data.results[Math.floor(Math.random() * data.results.length)];
  // Fetch genres for the movie
  const detailRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}&language=en-US`);
  const detail = await detailRes.json();
  return { ...movie, genres: detail.genres?.map(g => g.name) || [] };
}

export default function HomePage({ userName, userId }) {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState(null);

  useEffect(() => {
    fetchFeaturedMovieWithGenres().then(setFeatured);
  }, []);

  return (
    <div className="w-full min-h-screen pb-4">
      {/* Hero Section */}
      <section className="relative w-full min-h-[260px] md:min-h-[340px] flex flex-col md:flex-row items-center md:items-end md:justify-start p-0 md:px-12 mb-8 md:mb-10 rounded-none md:rounded-2xl overflow-hidden shadow-xl">
        {/* Hero BG Blur + Fade */}
        {featured?.backdrop_path && (
          <img
            src={`https://image.tmdb.org/t/p/w1280${featured.backdrop_path}`}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-35 blur-xl pointer-events-none z-0"
            draggable={false}
          />
        )}
        {/* Fade at bottom (like Netflix) */}
        <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-[#101015ee] to-transparent z-10 pointer-events-none" />

        {/* Glass Overlay for text readability */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#19151b88] to-[#23202da0] backdrop-blur-sm" />

        <div className="relative z-20 flex flex-col md:flex-row w-full max-w-[1200px] mx-auto items-center md:items-end md:justify-start py-7 px-4 md:px-0 animate-fadeInHero">
          {/* Poster (anchored left, not drifting) */}
          {featured?.poster_path && (
            <div className="flex justify-center md:justify-start items-end md:items-center md:mr-9 shrink-0 pt-2 md:pt-0 pb-4 md:pb-0">
              <img
                src={`https://image.tmdb.org/t/p/w342${featured.poster_path}`}
                alt={featured.title}
                className="w-[120px] sm:w-[160px] md:w-[200px] rounded-xl shadow-xl object-cover bg-zinc-900 border-2 border-zinc-800"
                draggable={false}
              />
            </div>
          )}

          {/* Main Hero Content */}
          <div className="flex flex-col justify-center flex-1 min-w-0 md:pl-0 pt-2 pb-2 md:py-0">
            {featured && (
              <div className="flex flex-col gap-2 items-center md:items-start">
                <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                  <Film size={22} className="text-orange-400" />
                  <span className="font-semibold text-white text-2xl md:text-3xl leading-tight">
                    {featured.title}
                  </span>
                  {featured.release_date && (
                    <span className="text-sm text-zinc-400 ml-1">
                      ({featured.release_date.slice(0, 4)})
                    </span>
                  )}
                  {featured.vote_average > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded bg-[#23212b] text-yellow-300 font-bold text-xs">
                      ★ {featured.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
                {/* Genre tags */}
                {featured.genres && featured.genres.length > 0 && (
                  <div className="flex gap-2 flex-wrap justify-center md:justify-start mb-1">
                    {featured.genres.slice(0, 2).map(genre => (
                      <span key={genre} className="bg-zinc-800 text-zinc-200 text-xs rounded px-2 py-0.5 font-medium opacity-80">
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-zinc-200 text-base line-clamp-3 max-w-xl px-1 md:px-0 mt-1 text-center md:text-left">
                  {featured.overview}
                </p>
                <button
                  className="mt-3 py-2 px-8 bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold text-base rounded-lg shadow transition hover:scale-105 active:scale-100"
                  onClick={() => navigate(`/movie/${featured.id}`)}
                >
                  <span className="inline-flex items-center gap-2">
                    <Sparkles size={18} /> Know more
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content Rows */}
      <div className="flex flex-col gap-10 md:gap-14 max-w-[1400px] mx-auto px-2 md:px-6">
        {/* Popular Now */}
        <CarouselRow
          title={
            <span className="inline-flex items-center gap-2 text-orange-300 font-semibold">
              <Flame size={19} /> Popular Now
            </span>
          }
          endpoint="popular"
        />
        {/* Top Rated */}
        <CarouselRow
          title={
            <span className="inline-flex items-center gap-2 text-yellow-200 font-semibold">
              <Star size={19} /> Top Rated
            </span>
          }
          endpoint="top_rated"
        />
        {/* Recently Added */}
        <CarouselRow
          title={
            <span className="inline-flex items-center gap-2 text-red-400 font-semibold">
              <Film size={19} /> Recently Added
            </span>
          }
          endpoint="now_playing"
        />
        {/* Recommended */}
        {userId ? (
          <CarouselRow
            title={
              <span className="inline-flex items-center gap-2 text-green-400 font-semibold">
                <ThumbsUp size={19} /> Recommended
              </span>
            }
            endpoint="top_rated"
            emptyMessage={
              <div className="text-zinc-400 text-base px-2 py-4">
                No recommendations yet. <br />
                Pick your favorite genres in <span className="underline cursor-pointer" onClick={() => navigate("/preferences")}>Preferences</span> for personalized picks!
              </div>
            }
          />
        ) : null}
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
