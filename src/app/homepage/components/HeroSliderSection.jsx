// src/app/homepage/components/HeroSliderSection.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";

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
  const viewDetails = () => currentMovie?.id && nav(`/movie/${currentMovie.id}`);

  if (loading) {
    return (
      <section className={`relative w-full bg-neutral-950 ${className}`}>
        <div className="h-[60vh] sm:h-[65vh] md:h-[70vh] lg:h-[75vh] animate-pulse bg-neutral-900" />
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
      {/* Hero Image Container - Reduced height */}
      <div className="relative w-full h-[60vh] sm:h-[65vh] md:h-[70vh] lg:h-[75vh]">
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

        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 md:via-black/20 to-transparent z-20" />
        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black via-black/90 to-transparent z-20" />
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/70 to-transparent z-20" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 z-30 flex flex-col justify-end pb-8 sm:pb-12 md:pb-16 lg:pb-20 pt-20">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="max-w-xl sm:max-w-2xl md:max-w-3xl">
            {/* Title - De-zoomed */}
            <h1 className="text-white font-black tracking-tight leading-[0.9] text-3xl sm:text-4xl md:text-5xl lg:text-6xl drop-shadow-2xl mb-2 sm:mb-3 line-clamp-2">
              {currentMovie?.title || "Featured"}
            </h1>

            {/* Meta Info - Simplified */}
            <div className="flex items-center gap-2 mb-3 text-xs sm:text-sm">
              {currentMovie?.vote_average && (
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 border border-green-500/30">
                  <span className="text-green-400 font-bold">★</span>
                  <span className="text-green-400 font-bold">
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

            {/* Overview */}
            {currentMovie?.overview && (
              <p className="hidden sm:block text-white/90 text-sm md:text-base leading-relaxed line-clamp-2 drop-shadow-lg mb-4 max-w-2xl">
                {currentMovie.overview}
              </p>
            )}

            {/* Buttons - Compact */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={viewDetails}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-black transition-all hover:bg-white/90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-xl"
              >
                <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
                <span>Play</span>
              </button>
              <button
                onClick={viewDetails}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-md px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white transition-all hover:bg-white/30 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">More Info</span>
                <span className="xs:hidden">Info</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows - Desktop Only */}
      <div className="hidden md:block">
        <button
          onClick={prevSlide}
          disabled={isTransitioning}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-40 h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-all opacity-0 hover:opacity-100 group-hover:opacity-100 disabled:opacity-30"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={nextSlide}
          disabled={isTransitioning}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-40 h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-all opacity-0 hover:opacity-100 group-hover:opacity-100 disabled:opacity-30"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Indicators - Simplified */}
      <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 md:right-8 z-40 flex items-center gap-1.5">
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
