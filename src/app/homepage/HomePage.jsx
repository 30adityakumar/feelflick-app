import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Star, Fire, Film, ThumbsUp } from "lucide-react";
import CarouselRow from "./CarouselRow";

// Dummy data fetchers for MVP (replace with real API calls as needed)
async function fetchFeaturedMovie() {
  // Use TMDb’s "popular" endpoint for now
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`);
  const data = await res.json();
  const movie = data.results[Math.floor(Math.random() * data.results.length)];
  return movie;
}

export default function HomePage({ userName, userId }) {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState(null);

  useEffect(() => {
    fetchFeaturedMovie().then(setFeatured);
  }, []);

  return (
    <div className="w-full min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full min-h-[340px] bg-gradient-to-r from-[#1a131b] to-[#23202d] flex flex-col md:flex-row items-center md:items-end md:justify-between px-3 md:px-16 py-8 mb-8 rounded-2xl shadow-xl overflow-hidden">
        <div className="z-10 flex-1 flex flex-col items-center md:items-start text-center md:text-left">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 text-white tracking-tight drop-shadow">
            Welcome{userName ? `, ${userName}` : ""}!
          </h1>
          <h2 className="text-lg sm:text-xl font-semibold text-orange-300 mb-3">
            Find the perfect movie for your mood.
          </h2>
          {featured && (
            <div className="mb-2 mt-1 max-w-md flex flex-col gap-2 items-center md:items-start">
              <div className="flex items-center gap-2">
                <Film size={22} className="text-orange-400" />
                <span className="font-semibold text-white text-lg">
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
              <p className="text-zinc-200 text-sm line-clamp-2 max-w-sm">
                {featured.overview}
              </p>
              <button
                className="mt-2 py-2 px-6 bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold text-base rounded-lg shadow transition hover:scale-105 active:scale-100"
                onClick={() => navigate(`/movie/${featured.id}`)}
              >
                <span className="inline-flex items-center gap-2">
                  <Sparkles size={18} /> Watch now
                </span>
              </button>
            </div>
          )}
        </div>
        {/* Hero Poster */}
        {featured?.poster_path && (
          <img
            src={`https://image.tmdb.org/t/p/w342${featured.poster_path}`}
            alt={featured.title}
            className="w-[160px] sm:w-[200px] md:w-[240px] rounded-2xl shadow-lg md:absolute md:right-14 md:bottom-6 object-cover bg-zinc-900"
            draggable={false}
          />
        )}
        {/* Hero BG blur */}
        {featured?.backdrop_path && (
          <img
            src={`https://image.tmdb.org/t/p/w780${featured.backdrop_path}`}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-25 blur-xl pointer-events-none"
            draggable={false}
          />
        )}
      </section>

      {/* Content Rows */}
      <div className="flex flex-col gap-7 md:gap-12 max-w-[1400px] mx-auto">
        {/* Popular Now */}
        <CarouselRow
          title={
            <span className="inline-flex items-center gap-2 text-orange-300 font-semibold">
              <Fire size={19} /> Popular Now
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
        {/* Recommended (could be based on preferences, for MVP use same as Top Rated or random genre) */}
        {userId ? (
          <CarouselRow
            title={
              <span className="inline-flex items-center gap-2 text-green-400 font-semibold">
                <ThumbsUp size={19} /> Recommended
              </span>
            }
            endpoint="top_rated" // For MVP, use top_rated or another; replace with real logic later
            emptyMessage={
              <div className="text-zinc-400 text-base px-2 py-4">
                No recommendations yet. <br />
                Pick your favorite genres in <span className="underline cursor-pointer" onClick={() => navigate("/preferences")}>Preferences</span> for personalized picks!
              </div>
            }
          />
        ) : null}
      </div>
    </div>
  );
}
