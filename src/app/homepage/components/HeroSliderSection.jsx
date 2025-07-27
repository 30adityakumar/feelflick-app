// Enhanced HeroSliderSection.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

async function fetchFeatured() {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=en-US&page=1`
  );
  const data = await res.json();
  return (data.results || []).slice(0, 5);
}

export default function HeroSliderSection() {
  const nav = useNavigate();
  const [slides, setSlides] = useState([]);
  const [idx, setIdx] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    fetchFeatured().then(setSlides);
  }, []);

  useEffect(() => {
    if (!slides.length || !isAutoPlaying) return;
    const id = setInterval(() => setIdx(i => (i + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [slides, isAutoPlaying]);

  if (!slides[idx]) {
    return (
      <div className="h-[400px] sm:h-[500px] lg:h-[600px] bg-zinc-900 animate-pulse w-full">
        <div className="w-full h-full bg-gradient-to-r from-zinc-800 to-zinc-900"></div>
      </div>
    );
  }

  const m = slides[idx];

  const goToSlide = (index) => {
    setIdx(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume after 10s
  };

  const nextSlide = () => {
    setIdx(i => (i + 1) % slides.length);
  };

  const prevSlide = () => {
    setIdx(i => (i - 1 + slides.length) % slides.length);
  };

  return (
    <section className="w-full select-none relative" role="banner">
      <div className="relative w-full overflow-hidden">
        {/* Enhanced backdrop with better mobile optimization */}
        <div className="absolute inset-0">
          <img
            src={`https://image.tmdb.org/t/p/w1280${m.backdrop_path}`}
            alt=""
            className="w-full h-full object-cover scale-110 transition-transform duration-1000"
            draggable={false}
            style={{ 
              filter: "blur(6px) brightness(0.4)",
              transform: "scale(1.1) translateZ(0)" // GPU acceleration
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20"></div>
        </div>

        {/* Main Content - Netflix/Prime inspired layout */}
        <div className="relative z-10 min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]
                        flex flex-col justify-end">
          
          <div className="px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 lg:pb-16">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-end">
                
                {/* Poster - Hidden on very small screens, shown as thumbnail on mobile */}
                <div className="hidden sm:block lg:col-span-3">
                  <img
                    src={`https://image.tmdb.org/t/p/w500${m.poster_path}`}
                    alt={m.title}
                    className="w-32 h-48 sm:w-40 sm:h-60 lg:w-full lg:h-auto max-w-[280px]
                             rounded-xl shadow-2xl transition-transform duration-300 hover:scale-105"
                    draggable={false}
                    loading="eager"
                  />
                </div>

                {/* Content - Responsive text layout */}
                <div className="lg:col-span-9 space-y-4 sm:space-y-6">
                  
                  {/* Title with improved mobile typography */}
                  <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl
                                 font-bold text-white leading-tight mb-2 sm:mb-3">
                      {m.title}
                    </h1>
                    
                    {/* Metadata row - Prime Video inspired */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm sm:text-base">
                      {m.release_date && (
                        <span className="text-zinc-300 font-medium">
                          {new Date(m.release_date).getFullYear()}
                        </span>
                      )}
                      {m.vote_average > 0 && (
                        <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-full">
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-yellow-400 font-bold">
                            {m.vote_average.toFixed(1)}
                          </span>
                        </div>
                      )}
                      {m.adult === false && (
                        <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-medium">
                          PG
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description with proper mobile wrapping */}
                  <div className="max-w-none lg:max-w-4xl">
                    <p className="text-zinc-200 text-sm sm:text-base lg:text-lg 
                                leading-relaxed line-clamp-3 sm:line-clamp-4 lg:line-clamp-none">
                      {m.overview}
                    </p>
                  </div>

                  {/* Action buttons - Netflix inspired */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                    <button
                      onClick={() => nav(`/movie/${m.id}`)}
                      className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4
                               bg-white text-black font-bold rounded-lg text-sm sm:text-base
                               hover:bg-zinc-200 transition-all duration-200 shadow-lg
                               focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Watch Now
                    </button>
                    
                    <button
                      onClick={() => nav(`/movie/${m.id}`)}
                      className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4
                               bg-zinc-800/80 text-white font-medium rounded-lg text-sm sm:text-base
                               hover:bg-zinc-700/80 transition-all duration-200 border border-zinc-600
                               focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      More Info
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="absolute inset-y-0 left-4 right-4 flex items-center justify-between pointer-events-none">
          <button
            onClick={prevSlide}
            className="pointer-events-auto p-3 rounded-full bg-black/50 text-white
                     hover:bg-black/80 transition-all duration-200 backdrop-blur-sm
                     hidden sm:flex items-center justify-center"
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={nextSlide}
            className="pointer-events-auto p-3 rounded-full bg-black/50 text-white
                     hover:bg-black/80 transition-all duration-200 backdrop-blur-sm
                     hidden sm:flex items-center justify-center"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Enhanced pagination dots */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="flex gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                  i === idx 
                    ? "bg-white scale-125" 
                    : "bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
          <div 
            className="h-full bg-orange-500 transition-all duration-100 ease-linear"
            style={{ 
              width: isAutoPlaying ? `${((Date.now() % 6000) / 6000) * 100}%` : '0%' 
            }}
          />
        </div>
      </div>
    </section>
  );
}
