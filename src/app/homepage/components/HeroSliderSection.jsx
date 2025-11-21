// src/app/homepage/components/HeroSliderSection.jsx

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info, Bookmark } from "lucide-react";
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

  // Get user and initial watchlist
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user || null);

      if (user) {
        const { data } = await supabase
          .from("user_watchlist")
          .select("movie_id")
          .eq("user_id", user.id);

        if (data) {
          setWatchlistIds(new Set(data.map((item) => item.movie_id)));
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
    }, 8000);
    return () => clearInterval(timerRef.current);
  }, [slides.length, currentIndex, isPaused]);

  const nextSlide = () => {
    if (isTransitioning || !slides.length) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const prevSlide = () => {
    if (isTransitioning || !slides.length) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const goToSlide = (index) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  // Touch gestures for swipe navigation
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diffX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;
    if (Math.abs(diffX) > minSwipeDistance) {
      if (diffX > 0) nextSlide();
      else prevSlide();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const currentMovie = slides[currentIndex] || {};
  const inWatchlist =
    currentMovie?.id && watchlistIds.has(currentMovie.id);

  const viewDetails = () =>
    currentMovie?.id && nav(`/movie/${currentMovie.id}`);

  const toggleWatchlist = async () => {
    if (!user || !currentMovie?.id) return;
    const movieId = currentMovie.id;

    try {
      if (watchlistIds.has(movieId)) {
        await supabase
          .from("user_watchlist")
          .delete()
          .eq("user_id", user.id)
          .eq("movie_id", movieId);

        setWatchlistIds((prev) => {
          const next = new Set(prev);
          next.delete(movieId);
          return next;
        });
      } else {
        await supabase.from("user_watchlist").upsert(
          {
            user_id: user.id,
            movie_id: movieId,
          },
          { onConflict: "user_id,movie_id" }
        );

        setWatchlistIds((prev) => {
          const next = new Set(prev);
          next.add(movieId);
          return next;
        });
      }
    } catch (e) {
      console.warn("Hero watchlist toggle error", e);
    }
  };

  if (loading) {
    return (
      <section
        className={`relative w-full bg-black ${className}`}
      >
        <div className="h-[70vh] md:h-[80vh] bg-gradient-to-b from-neutral-900 to-black animate-pulse" />
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
      <div className="relative w-full h-[70vh] md:h-[80vh]">
        {/* Backdrop images */}
        {slides.map((movie, idx) => {
          const bg = tmdbImg(
            movie.backdrop_path || movie.poster_path,
            "original"
          );
          return (
            <div
              key={movie.id || idx}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {bg && (
                <img
                  src={bg}
                  alt={movie.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
            </div>
          );
        })}

        {/* Dark + brand-tinted gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/40 z-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent z-20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(147,51,234,0.45),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.25),transparent_55%)] mix-blend-screen opacity-60 z-20 pointer-events-none" />

        {/* Foreground Prime-style card */}
        <div className="absolute inset-0 z-30 flex items-end md:items-center">
          <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 pb-8 md:pb-10">
            <div className="flex flex-col md:flex-row items-end md:items-center gap-6 max-w-5xl">
              {/* Poster on left (hidden on very small screens) */}
              <div className="hidden sm:block flex-shrink-0">
                <div className="relative w-28 sm:w-32 md:w-44 aspect-[2/3] rounded-2xl overflow-hidden bg-neutral-900/80 border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.9)]">
                  {currentMovie?.poster_path ? (
                    <img
                      src={tmdbImg(currentMovie.poster_path, "w500")}
                      alt={currentMovie.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-white/40">
                      No image
                    </div>
                  )}
                  {/* Small corner gradient band to feel on-brand */}
                  <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
                </div>
              </div>

              {/* Text + actions on right */}
              <div className="flex-1 min-w-0">
                {/* Title */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-[0_8px_30px_rgba(0,0,0,0.85)] line-clamp-2">
                  {currentMovie?.title || "Featured"}
                </h1>

                {/* Meta row: rating, year, type */}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  {currentMovie?.vote_average ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-400/40 shadow-[0_0_25px_rgba(168,85,247,0.45)]">
                      <span className="text-purple-300 text-sm">★</span>
                      <span className="text-purple-100 text-xs font-semibold">
                        {currentMovie.vote_average.toFixed(1)} Match
                      </span>
                    </div>
                  ) : null}

                  {currentMovie?.release_date && (
                    <span className="text-white/80 text-xs sm:text-sm">
                      {new Date(currentMovie.release_date).getFullYear()}
                    </span>
                  )}

                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-white/80 text-[10px] font-semibold tracking-wide uppercase">
                    Movie
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-black/60 border border-white/15 text-white/80 text-[10px] font-semibold tracking-wide uppercase">
                    HD
                  </span>
                </div>

                {/* Overview */}
                {currentMovie?.overview && (
                  <p className="mt-3 hidden sm:block text-sm md:text-base text-white/85 leading-relaxed max-w-xl line-clamp-3">
                    {currentMovie.overview}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {/* Primary CTA */}
                  <button
                    type="button"
                    onClick={viewDetails}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-pink-500 shadow-[0_18px_60px_rgba(76,29,149,0.9)] hover:scale-[1.03] active:scale-[0.98] transition-transform focus:outline-none focus:ring-4 focus:ring-purple-500/40"
                  >
                    <Info className="h-4 w-4" />
                    <span>More info</span>
                  </button>

                  {/* Watchlist CTA (Prime-like secondary) */}
                  <button
                    type="button"
                    onClick={toggleWatchlist}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold border border-white/20 bg-black/50 text-white/80 hover:bg-white/10 hover:text-white active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  >
                    <Bookmark
                      className={`h-4 w-4 ${
                        inWatchlist ? "text-purple-300" : "text-white/70"
                      }`}
                    />
                    <span>
                      {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop navigation arrows (subtle, Prime-like) */}
        <button
          type="button"
          onClick={prevSlide}
          disabled={isTransitioning}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-40 h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white/60 hover:bg-black/70 hover:text-white transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/40"
          aria-label="Previous"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="none"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.4}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          type="button"
          onClick={nextSlide}
          disabled={isTransitioning}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-40 h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white/60 hover:bg-black/70 hover:text-white transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/40"
          aria-label="Next"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="none"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.4}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Bottom thumbnail strip (Prime-inspired slide nav) */}
        <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 z-40 flex justify-center">
          <div className="flex gap-2 px-4 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
            {slides.map((movie, idx) => (
              <button
                key={movie.id || idx}
                type="button"
                onClick={() => goToSlide(idx)}
                className={`relative h-8 w-14 sm:h-10 sm:w-16 rounded-md overflow-hidden transition-all border ${
                  idx === currentIndex
                    ? "border-purple-400 shadow-[0_0_0_1px_rgba(168,85,247,0.9)] scale-105"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
                aria-label={`Go to ${movie.title || "slide"}`}
              >
                {movie.backdrop_path || movie.poster_path ? (
                  <img
                    src={tmdbImg(
                      movie.backdrop_path || movie.poster_path,
                      "w300"
                    )}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/10" />
                )}
                {/* Gradient overlay for better legibility / style */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
