// src/app/homepage/components/HeroSliderSection.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Info } from "lucide-react";

const tmdbImg = (p, s = "original") =>
  p ? `https://image.tmdb.org/t/p/${s}${p}` : "";

export default function HeroSliderSection({ className = "" }) {
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const timerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

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
      else {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
        setTimeout(() => setIsTransitioning(false), 800);
      }
    }
  };

  const currentMovie = slides[currentIndex] || {};
  const viewDetails = () => currentMovie?.id && nav(`/movie/${currentMovie.id}`);

  if (loading) {
    return (
      <section className={`relative w-full bg-neutral-950 ${className}`}>
        <div className="h-[70vh] sm:h-[75vh] md:h-[80vh] lg:h-[85vh] xl:h-[90vh] animate-pulse bg-neutral-900" />
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
      {/* Hero Image Container - Optimized heights */}
      <div className="relative w-full h-[70vh] sm:h-[75vh] md:h-[80vh] lg:h-[85vh] xl:h-[90vh]">
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

        {/* Enhanced Gradients for better text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent z-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/50 md:via-black/30 to-transparent z-20" />
        <div className="absolute bottom-0 inset-x-0 h-2/5 bg-gradient-to-t from-black via-black/95 to-transparent z-20" />
        
        {/* Top gradient to prevent header overlap */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/80 to-transparent z-20" />
      </div>

      {/* Content Overlay - Better positioning */}
      <div className="absolute inset-0 z-30 flex flex-col justify-end pb-12 sm:pb-16 md:pb-20 lg:pb-24 xl:pb-28 pt-24">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
            {/* Title - Optimized sizes */}
            <h1 className="text-white font-black tracking-tight leading-[0.9] text-[1.75rem] xs:text-[2rem] sm:text-[2.5rem] md:text-[3.5rem] lg:text-[4.5rem] xl:text-[5.5rem] drop-shadow-2xl mb-2 sm:mb-3 md:mb-4 line-clamp-2">
              {currentMovie?.title || "Featured"}
            </h1>

            {/* Meta Info */}
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm">
              {currentMovie?.vote_average && (
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/20 border border-green-500/30">
                  <span className="text-green-400 font-bold text-sm sm:text-base">
                    ★
                  </span>
                  <span className="text-green-400 font-bold text-xs sm:text-sm">
                    {currentMovie.vote_average.toFixed(1)}
                  </span>
                </div>
              )}
              {currentMovie?.release_date && (
                <span className="text-white/90 font-semibold">
                  {new Date(currentMovie.release_date).getFullYear()}
                </span>
              )}
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 text-[10px] sm:text-xs font-semibold">
                HD
              </span>
            </div>

            {/* Overview - Progressive display */}
            {currentMovie?.overview && (
              <p className="hidden sm:block text-white/90 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed line-clamp-2 md:line-clamp-3 drop-shadow-lg mb-4 sm:mb-5 md:mb-6 max-w-2xl">
                {currentMovie.overview}
              </p>
            )}

            {/* Buttons - Compact on mobile */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={viewDetails}
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-white px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base font-bold text-black transition-all hover:bg-white/90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-2xl"
              >
                <Play className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 fill-current" />
                <span>Play</span>
              </button>
              <button
                onClick={viewDetails}
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-white/20 backdrop-blur-md px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base font-bold text-white transition-all hover:bg-white/30 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-xl"
              >
                <Info className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                <span className="hidden xs:inline">More Info</span>
                <span className="xs:hidden">Info</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Indicators - Better positioning */}
      <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 right-4 sm:right-6 md:right-8 lg:right-12 z-40 flex items-center gap-1.5 sm:gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-0.5 sm:h-1 rounded-full transition-all duration-500 focus:outline-none ${
              idx === currentIndex
                ? "w-6 sm:w-8 md:w-10 bg-white shadow-lg"
                : "w-0.5 sm:w-1 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
