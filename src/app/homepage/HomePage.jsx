import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Star, Flame, Film, ThumbsUp } from "lucide-react";
import CarouselRow from "@/app/homepage/components/CarouselRow";

async function fetchFeaturedMovie() {
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
    <div className="w-full min-h-screen pb-4">
      {/* Hero Section */}
      <section className="relative w-full min-h-[275px] md:min-h-[340px] bg-gradient-to-r from-[#19151b] to-[#23202d] flex flex-col md:flex-row items-center md:items-end md:justify-start px-0 md:px-12 py-0 md:py-0 mb-7 rounded-none md:rounded-2xl shadow-xl overflow-hidden">
        {/* Hero BG blur */}
        {featured?.backdrop_path && (
          <img
            src={`https://image.tmdb.org/t/p/w1280${featured.backdrop_path}`}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-25 blur-xl pointer-events-none z-0"
            draggable={false}
          />
        )}
        <div className="relative z-10 flex flex-col md:flex-row w-full max-w-[1150px] mx-auto md:py-6">
          {/* Poster (left, anchored, no "float") */}
          {featured?.poster_path && (
            <div className="flex justify-center md:justify-start items-end md:items-center md:mr-8 shrink-0 pt-6 md:pt-0">
              <img
                src={`https://image.tmdb.org/t/p/w342${featured.poster_path}`}
                alt={featured.title}
                className="w-[120px] sm:w-[160px] md:w-[190px] rounded-xl shadow-xl object-cover bg-zinc-900"
                draggable={false}
              />
            </div>
          )}
          {/* Main Hero Content */}
          <div className="flex flex-col justify-center md:justify-end flex-1 min-w-0 pt-6 pb-7 md:py-0 px-4 md:px-0">
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
        <CarouselRow
          title={
            <span className="inline-flex items-center gap-2 text-orange-300 font-semibold">
              <Flame size={19} /> Popular Now
            </span>
          }
          endpoint="popular"
        />
        <CarouselRow
          title={
            <span className="inline-flex items-center gap-2 text-yellow-200 font-semibold">
              <Star size={19} /> Top Rated
            </span>
          }
          endpoint="top_rated"
        />
        <CarouselRow
          title={
            <span className="inline-flex items-center gap-2 text-red-400 font-semibold">
              <Film size={19} /> Recently Added
            </span>
          }
          endpoint="now_playing"
        />
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
    </div>
  );
}
