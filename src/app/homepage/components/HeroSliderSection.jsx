// src/app/homepage/components/HeroSliderSection.jsx
import { useEffect, useMemo, useRef, useState } from "react";
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

  // Fetch popular movies for hero slider
  useEffect(() => {
    setLoading(true);
    fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US&page=1`
    )
      .then((r) => r.json())
      .then((j) => {
        const movies = j?.results?.slice(0, 6) ?? [];
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
    }, 6000);
    return () => clearInterval(timerRef.current);
  }, [slides.length, currentIndex, isPaused]);

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 700);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 700);
  };

  const goToSlide = (index) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 700);
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
  const backdrop = useMemo(
    () => tmdbImg(currentMovie.backdrop_path || currentMovie.poster_path, "original"),
    [currentMovie]
  );

  const viewDetails = () => currentMovie?.id && nav(`/movie/${currentMovie.id}`);

  if (loading) {
    return (
      <section className={`relative w-full bg-neutral-900 ${className}`}>
        <div className="aspect-[16/9] md:aspect-[21/9] animate-pulse bg-neutral-800" />
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
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/8] md:aspect-[21/9]">
        {/* Background Images with Crossfade */}
        {slides.map((movie, idx) => {
          const bg = tmdbImg(movie.backdrop_path || movie.poster_path, "original");
          return (
            <div
              key={movie.id}
              className={`absolute inset-0 transition-opacity duration-700 ${
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

        {/* Gradient Overlays for Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent z-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-20" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 z-30 flex items-end pb-8 sm:pb-12 md:pb-16 lg:pb-20">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="max-w-2xl">
            {/* Title */}
            <h1 className="text-white font-black tracking-tight leading-[1.1] text-3xl sm:text-4xl md:text-5xl lg:text-6xl drop-shadow-2xl mb-3 md:mb-4">
              {currentMovie?.title || "Featured"}
            </h1>

            {/* Overview */}
            {currentMovie?.overview && (
              <p className="text-white/90 text-sm sm:text-base md:text-lg leading-relaxed line-clamp-2 md:line-clamp-3 drop-shadow-lg mb-4 md:mb-6">
                {currentMovie.overview}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={viewDetails}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm md:text-base font-bold text-black transition-all hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <Play className="h-5 w-5 fill-current" />
                <span className="hidden sm:inline">Play</span>
              </button>
              <button
                onClick={viewDetails}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/20 backdrop-blur-sm px-6 py-3 text-sm md:text-base font-bold text-white transition-all hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <Info className="h-5 w-5" />
                <span className="hidden sm:inline">More Info</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Indicators (Pips) */}
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none ${
              idx === currentIndex
                ? "w-8 bg-white"
                : "w-1.5 bg-white/50 hover:bg-white/75"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
