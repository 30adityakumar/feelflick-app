// src/app/homepage/components/HeroSliderSection.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Info } from "lucide-react";

const tmdbImg = (p, s = "original") => (p ? `https://image.tmdb.org/t/p/${s}${p}` : "");

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
      `https://api.themoviedb.org/3/trending/movie/week?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US`
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
    }, 7000);
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
        <div className="aspect-[2/3] sm:aspect-[3/4] md:aspect-[16/9] lg:aspect-[21/9] animate-pulse bg-neutral-900" />
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
      {/* Hero Image Container - Netflix-style aspect ratios */}
      <div className="relative w-full aspect-[2/3] sm:aspect-[3/4] md:aspect-[16/9] lg:aspect-[21/9]">
        {/* Background Images with Crossfade */}
        {slides.map((movie, idx) => {
          const bg = tmdbImg(movie.backdrop_path || movie.poster_path, "original");
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
                className="absolute inset-0 h-full w-full object-cover object-center"
                loading={idx === 0 ? "eager" : "lazy"}
              />
            </div>
          );
        })}

        {/* Gradient Overlays - More aggressive for better readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/30 md:via-black/20 to-transparent z-20" />
        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black via-black/80 to-transparent z-20" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 z-30 flex items-end pb-20 sm:pb-24 md:pb-28 lg:pb-32">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-[2000px] mx-auto">
          <div className="max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
            {/* Title - Better mobile sizing */}
            <h1 className="text-white font-black tracking-tight leading-[0.9] text-[clamp(2rem,8vw,5rem)] md:text-[clamp(3rem,5vw,4.5rem)] lg:text-[clamp(4rem,6vw,6rem)] drop-shadow-2xl mb-3 sm:mb-4 md:mb-5">
              {currentMovie?.title || "Featured"}
            </h1>

            {/* Meta Info - Compact on mobile */}
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-5 text-sm sm:text-base">
              {currentMovie?.vote_average && (
                <div className="flex items-center gap-1 text-green-400 font-bold">
                  <span className="text-base sm:text-lg">★</span>
                  <span>{currentMovie.vote_average.toFixed(1)}</span>
                </div>
              )}
              {currentMovie?.release_date && (
                <span className="text-white/90 font-semibold">
                  {new Date(currentMovie.release_date).getFullYear()}
                </span>
              )}
            </div>

            {/* Overview - Hidden on mobile, shown progressively */}
            {currentMovie?.overview && (
              <p className="hidden sm:block text-white/95 text-sm md:text-base lg:text-lg leading-relaxed line-clamp-2 md:line-clamp-3 drop-shadow-lg mb-5 md:mb-6 lg:mb-7">
                {currentMovie.overview}
              </p>
            )}

            {/* Action Buttons - Properly sized and spaced */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={viewDetails}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 sm:px-7 md:px-9 py-2.5 sm:py-3 md:py-3.5 text-sm sm:text-base md:text-lg font-bold text-black transition-all hover:bg-white/90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-xl"
              >
                <Play className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 fill-current" />
                <span>Play</span>
              </button>
              <button
                onClick={viewDetails}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-white/25 backdrop-blur-md px-5 sm:px-7 md:px-9 py-2.5 sm:py-3 md:py-3.5 text-sm sm:text-base md:text-lg font-bold text-white transition-all hover:bg-white/35 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-xl"
              >
                <Info className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                <span>Info</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 lg:bottom-10 right-4 sm:right-6 md:right-8 lg:right-12 z-40 flex items-center gap-1.5 sm:gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-1 rounded-full transition-all duration-500 focus:outline-none ${
              idx === currentIndex
                ? "w-6 sm:w-8 md:w-10 bg-white shadow-lg"
                : "w-1 sm:w-1.5 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
