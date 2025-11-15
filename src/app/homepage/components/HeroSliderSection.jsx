// src/app/homepage/components/HeroSliderSection.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Info, ChevronRight } from "lucide-react";

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

  // Fetch trending/popular movies for hero
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

  // Auto-advance slider
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

  // Touch handlers for mobile swipe
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
      <section className={`relative w-full bg-neutral-950 ${className}`}>
        <div className="aspect-[16/9] md:aspect-[21/9] animate-pulse bg-neutral-900" />
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
      {/* Hero Image Container */}
      <div className="relative w-full aspect-[9/14] xs:aspect-[16/11] sm:aspect-[16/9] md:aspect-[21/9]">
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
                className="absolute inset-0 h-full w-full object-cover"
                loading={idx === 0 ? "eager" : "lazy"}
              />
            </div>
          );
        })}

        {/* Gradient Overlays - Netflix style */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/30 to-transparent z-20" />
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black to-transparent z-20" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 z-30 flex items-end pb-12 sm:pb-16 md:pb-20 lg:pb-24">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="max-w-xl lg:max-w-2xl">
            {/* Title */}
            <h1 className="text-white font-black tracking-tight leading-[0.95] text-4xl sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-2xl mb-4 md:mb-5 animate-fade-in">
              {currentMovie?.title || "Featured"}
            </h1>

            {/* Meta Info */}
            <div className="flex items-center gap-3 mb-4 text-sm md:text-base">
              {currentMovie?.vote_average && (
                <div className="flex items-center gap-1.5 text-green-400 font-bold">
                  <span className="text-lg">★</span>
                  <span>{currentMovie.vote_average.toFixed(1)}</span>
                </div>
              )}
              {currentMovie?.release_date && (
                <span className="text-white/80 font-semibold">
                  {new Date(currentMovie.release_date).getFullYear()}
                </span>
              )}
            </div>

            {/* Overview */}
            {currentMovie?.overview && (
              <p className="text-white/95 text-sm sm:text-base md:text-lg leading-relaxed line-clamp-2 sm:line-clamp-3 md:line-clamp-4 drop-shadow-lg mb-5 md:mb-7 max-w-2xl">
                {currentMovie.overview}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={viewDetails}
                className="inline-flex items-center justify-center gap-2.5 rounded-md bg-white px-6 sm:px-8 py-3 sm:py-3.5 text-base sm:text-lg font-bold text-black transition-all hover:bg-white/90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-xl"
              >
                <Play className="h-5 w-5 sm:h-6 sm:w-6 fill-current" />
                <span>Play</span>
              </button>
              <button
                onClick={viewDetails}
                className="inline-flex items-center justify-center gap-2.5 rounded-md bg-white/25 backdrop-blur-md px-6 sm:px-8 py-3 sm:py-3.5 text-base sm:text-lg font-bold text-white transition-all hover:bg-white/35 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-xl"
              >
                <Info className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>More Info</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Indicators (Pips) - Bottom right */}
      <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 z-40 flex items-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-1 rounded-full transition-all duration-500 focus:outline-none ${
              idx === currentIndex
                ? "w-8 bg-white shadow-lg"
                : "w-1 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
