// src/app/homepage/components/HeroSliderSection.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
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
  const nav = useNavigate();
  const timerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Get user and watchlist
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
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

  // Fetch trending movies
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

  // Auto-advance slides
  useEffect(() => {
    if (!slides.length || isPaused) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      nextSlide();
    }, 7000);
    return () => clearInterval(timerRef.current);
  }, [slides.length, currentIndex, isPaused]);

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 1000);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 1000);
  };

  const goToSlide = (index) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 1000);
  };

  // Touch gestures
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
  const viewDetails = () => currentMovie?.id && nav(`/movie/${currentMovie.id}`);

  if (loading) {
    return (
      <section className={`relative w-full bg-black ${className}`}>
        <div className="h-[60vh] md:h-[75vh] animate-pulse bg-neutral-900" />
      </section>
    );
  }

  if (!slides.length) return null;

  return (
    <section
      className={`relative w-full overflow-hidden bg-black ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Hero Image Container - Increased desktop height */}
      <div className="relative w-full h-[60vh] md:h-[75vh]">
        {/* Background Images */}
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

        {/* Refined Gradients - Better text legibility */}
        {/* Top fade - subtle */}
        <div className="absolute top-0 inset-x-0 h-16 md:h-20 bg-gradient-to-b from-black/70 to-transparent z-20" />
        
        {/* Bottom-left corner fade for text readability */}
        <div className="absolute bottom-0 left-0 w-3/4 md:w-1/2 h-2/3 md:h-3/5 bg-gradient-to-tr from-black via-black/70 to-transparent z-20" />
        
        {/* Bottom strip for text base */}
        <div className="absolute bottom-0 inset-x-0 h-1/4 bg-gradient-to-t from-black/90 to-transparent z-20" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 z-30 flex flex-col justify-end pb-10 md:pb-16 pt-20">
        <div className="w-full px-4 md:px-12 lg:px-16">
          <div className="max-w-2xl">
            {/* Title */}
            <h1 className="text-white font-black tracking-tight leading-tight text-3xl sm:text-4xl md:text-5xl drop-shadow-2xl mb-2 line-clamp-2">
              {currentMovie?.title || "Featured"}
            </h1>

            {/* Meta Info */}
            <div className="flex items-center gap-2 mb-2 text-sm">
              {currentMovie?.vote_average && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/20 border border-green-500/40">
                  <span className="text-green-400 font-bold text-sm">★</span>
                  <span className="text-green-400 font-semibold text-xs">
                    {currentMovie.vote_average.toFixed(1)}
                  </span>
                </div>
              )}
              {currentMovie?.release_date && (
                <span className="text-white/90 font-semibold text-sm">
                  {new Date(currentMovie.release_date).getFullYear()}
                </span>
              )}
              <span className="px-2 py-0.5 rounded bg-white/10 text-white/80 text-xs font-semibold">
                HD
              </span>
            </div>

            {/* Overview - 2 lines max */}
            {currentMovie?.overview && (
              <p className="hidden md:block text-white/95 text-sm leading-relaxed line-clamp-2 drop-shadow-lg mb-4 max-w-xl">
                {currentMovie.overview}
              </p>
            )}

            {/* Single Button - More Info */}
            <button
              onClick={viewDetails}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500/50 shadow-2xl"
              style={{
                background: "linear-gradient(90deg, #fe9245 10%, #eb423b 90%)",
              }}
            >
              <Info className="h-4 w-4" />
              <span>More Info</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subtle Navigation Arrows */}
      <button
        onClick={prevSlide}
        disabled={isTransitioning}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-40 items-center justify-center h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm text-white/60 transition-all hover:bg-black/50 hover:text-white opacity-0 hover:opacity-100 active:scale-95 disabled:opacity-0 focus:outline-none"
        aria-label="Previous slide"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        disabled={isTransitioning}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-40 items-center justify-center h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm text-white/60 transition-all hover:bg-black/50 hover:text-white opacity-0 hover:opacity-100 active:scale-95 disabled:opacity-0 focus:outline-none"
        aria-label="Next slide"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 md:bottom-6 right-4 md:right-8 z-40 flex items-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-1 rounded-full transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-white/50 ${
              idx === currentIndex
                ? "w-8 bg-white shadow-lg"
                : "w-1 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
