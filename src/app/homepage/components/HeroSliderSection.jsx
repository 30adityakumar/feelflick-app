// src/app/homepage/components/HeroSliderSection.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, Plus, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/shared/lib/supabase/client";

const tmdbImg = (p, s = "original") =>
  p ? `https://image.tmdb.org/t/p/${s}${p}` : "";

export default function HeroSliderSection({ className = "" }) {
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [watchlistIds, setWatchlistIds] = useState(new Set());
  const [addingToWatchlist, setAddingToWatchlist] = useState(false);
  const nav = useNavigate();
  const timerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Get user and watchlist
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data } = await supabase
          .from("user_watchlist")
          .select("movie_id")
          .eq("user_id", user.id);
        if (data) {
          setWatchlistIds(new Set(data.map(item => item.movie_id)));
        }
      }
    })();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(
      `https://api.themoviedb.org/3/trending/movie/week?api_key=${
        import.meta.env.VITE_TMDB_API_KEY
      }&language=en-US`
    )
      .then((r) => r.json())
      .then((j) => {
        const movies = j?.results?.slice(0, 5) ?? [];
        setSlides(movies);
        setLoading(false);
      })
      .catch(() => {
        setSlides([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!slides.length || isPaused) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(timerRef.current);
  }, [slides.length, currentIndex, isPaused]);

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const goToSlide = (index) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
  };

  const currentMovie = slides[currentIndex] || {};
  const isInWatchlist = watchlistIds.has(currentMovie.id);

  const viewDetails = () => currentMovie?.id && nav(`/movie/${currentMovie.id}`);

  const toggleWatchlist = async () => {
    if (!user || !currentMovie.id || addingToWatchlist) return;
    
    setAddingToWatchlist(true);
    try {
      if (isInWatchlist) {
        await supabase
          .from("user_watchlist")
          .delete()
          .eq("user_id", user.id)
          .eq("movie_id", currentMovie.id);
        setWatchlistIds(prev => {
          const next = new Set(prev);
          next.delete(currentMovie.id);
          return next;
        });
      } else {
        await supabase.from("user_watchlist").insert({
          user_id: user.id,
          movie_id: currentMovie.id,
          status: "plan_to_watch"
        });
        setWatchlistIds(prev => new Set([...prev, currentMovie.id]));
      }
    } finally {
      setAddingToWatchlist(false);
    }
  };

  if (loading) {
    return (
      <section className={`relative w-full bg-neutral-950 ${className}`}>
        <div className="h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] animate-pulse bg-neutral-900" />
      </section>
    );
  }

  if (!slides.length) return null;

  return (
    <section
      className={`relative w-full overflow-hidden bg-black group ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Hero Image Container - SMALLER */}
      <div className="relative w-full h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh]">
        {/* Images */}
        {slides.map((movie, idx) => {
          const bg = tmdbImg(
            movie.backdrop_path || movie.poster_path,
            "original"
          );
          return (
            <div
              key={movie.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <img
                src={bg}
                alt={movie.title || ""}
                className="absolute inset-0 h-full w-full object-cover"
                loading={idx === 0 ? "eager" : "lazy"}
              />
            </div>
          );
        })}

        {/* Stronger gradients for better readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent z-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 md:via-black/40 to-transparent z-20" />
        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black to-transparent z-20" />
        <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/60 to-transparent z-20" />
      </div>

      {/* Content Overlay - SMALLER & MORE COMPACT */}
      <div className="absolute inset-0 z-30 flex flex-col justify-end pb-6 sm:pb-8 md:pb-12 lg:pb-16 pt-16">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="max-w-xl sm:max-w-2xl md:max-w-3xl">
            {/* Title - MUCH SMALLER */}
            <h1 className="text-white font-black tracking-tight leading-tight text-2xl sm:text-3xl md:text-4xl lg:text-5xl drop-shadow-2xl mb-2 line-clamp-2">
              {currentMovie?.title || "Featured"}
            </h1>

            {/* Meta Info - More compact */}
            <div className="flex items-center gap-2 mb-2 text-xs">
              {currentMovie?.vote_average && (
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/20 border border-green-500/30">
                  <span className="text-green-400 font-bold">★</span>
                  <span className="text-green-400 font-semibold">
                    {currentMovie.vote_average.toFixed(1)}
                  </span>
                </div>
              )}
              {currentMovie?.release_date && (
                <span className="text-white/90 font-semibold">
                  {new Date(currentMovie.release_date).getFullYear()}
                </span>
              )}
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 text-[10px] font-semibold">
                HD
              </span>
            </div>

            {/* Overview - SMALLER */}
            {currentMovie?.overview && (
              <p className="hidden md:block text-white/90 text-sm leading-relaxed line-clamp-2 drop-shadow-lg mb-3 max-w-2xl">
                {currentMovie.overview}
              </p>
            )}

            {/* Buttons - FeelFlick Theme with Orange Gradient */}
            <div className="flex items-center gap-2">
              {/* Watch Now Button - Orange gradient like your brand */}
              <button
                onClick={viewDetails}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg px-5 py-2 text-xs sm:text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500/50 shadow-xl"
                style={{
                  background: "linear-gradient(90deg, #fe9245 10%, #eb423b 90%)",
                }}
              >
                <Info className="h-3.5 w-3.5" />
                <span>View Details</span>
              </button>

              {/* Add to Watchlist - Cleaner design */}
              {user && (
                <button
                  onClick={toggleWatchlist}
                  disabled={addingToWatchlist}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 disabled:opacity-50 ${
                    isInWatchlist
                      ? "bg-white/20 text-white border border-white/30 hover:bg-white/30"
                      : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                  }`}
                >
                  {isInWatchlist ? (
                    <>
                      <Bookmark className="h-3.5 w-3.5 fill-current" />
                      <span className="hidden sm:inline">In Watchlist</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Watchlist</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows - Desktop */}
      <div className="hidden md:block">
        <button
          onClick={prevSlide}
          disabled={isTransitioning}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-40 h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={nextSlide}
          disabled={isTransitioning}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-40 h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-4 right-4 sm:right-6 md:right-8 z-40 flex items-center gap-1.5">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-1 rounded-full transition-all duration-500 focus:outline-none ${
              idx === currentIndex
                ? "w-8 bg-gradient-to-r from-orange-500 to-red-500 shadow-lg"
                : "w-1 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
