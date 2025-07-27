// Enhanced Carousel useRef } from "react";
import { useNavigate } from "react-router-dom";

async function fetchMovies(endpoint) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${endpoint}?api_key=${apiKey}&language=en-US&page=1`
  );
  const data = await res.json();
  return (data.results || []).filter(m => m.poster_path);
}

export default function CarouselRow({ title, endpoint }) {
  const nav = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    fetchMovies(endpoint).then(setMovies).finally(() => setLoading(false));
  }, [endpoint]);

  // Handle scroll state for navigation indicators
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Netflix-inspired scroll navigation
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Optimized card sizing - inspired by Prime Video's responsive approach
  const cardClass = `
    w-[30vw] min-w-[120px] max-w-[160px] 
    sm:w-[22vw] sm:min-w-[140px] sm:max-w-[180px]
    md:w-[18vw] md:min-w-[160px] md:max-w-[200px]
    lg:w-[15vw] lg:min-w-[180px] lg:max-w-[220px]
    aspect-[2/3] flex-shrink-0 snap-start rounded-lg overflow-hidden
    bg-zinc-900 relative group cursor-pointer
    transition-all duration-300 ease-out
    hover:scale-105 hover:z-10 hover:shadow-2xl
    focus:scale-105 focus:z-10 focus:outline-2 focus:outline-orange-500
  `;

  return (
    <section className="mt-6 sm:mt-8 md:mt-12" aria-label={`${title} section`}>
      {/* Section Header with Netflix-style design */}
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
          {title}
        </h2>
        
        {/* Desktop Navigation Arrows - inspired by Netflix */}
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`p-2 rounded-full transition-all duration-200 ${
              canScrollLeft 
                ? 'bg-zinc-800/80 hover:bg-zinc-700 text-white' 
                : 'bg-zinc-900/50 text-zinc-600 cursor-not-allowed'
            }`}
            aria-label="Scroll left"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`p-2 rounded-full transition-all duration-200 ${
              canScrollRight 
                ? 'bg-zinc-800/80 hover:bg-zinc-700 text-white' 
                : 'bg-zinc-900/50 text-zinc-600 cursor-not-allowed'
            }`}
            aria-label="Scroll right"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Carousel Container with improved mobile scrolling */}
      <div className="relative group">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="
            flex gap-2 sm:gap-3 md:gap-4
            px-4 sm:px-6 lg:px-8
            overflow-x-auto overflow-y-hidden
            snap-x snap-mandatory scroll-smooth
            scrollbar-hide
            overscroll-behavior-x-contain
            -webkit-overflow-scrolling-touch
          "
          style={{
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-x pinch-zoom",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
          role="region"
          aria-label={`${title} movies carousel`}
        >
          {(loading ? Array(8).fill(null) : movies).map((m, i) =>
            m ? (
              <div
                key={m.id}
                className={cardClass}
                onClick={() => nav(`/movie/${m.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    nav(`/movie/${m.id}`);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${m.title}`}
              >
                <img
                  src={`https://image.tmdb.org/t/p/w500${m.poster_path}`}
                  alt={m.title}
                  className="w-full h-full object-cover transition-transform duration-300"
                  draggable={false}
                  loading="lazy"
                />
                
                {/* Letterboxd-inspired overlay with rating */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent 
                              opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white text-xs font-medium truncate mb-1">
                      {m.title}
                    </p>
                    {m.vote_average > 0 && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-yellow-400 text-xs font-bold">
                          {m.vote_average.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div key={i} className={cardClass + " animate-pulse"}>
                <div className="w-full h-full bg-zinc-800"></div>
              </div>
            )
          )}
        </div>

        {/* Mobile scroll indicator */}
        <div className="md:hidden flex justify-center mt-3 gap-1">
          <div className={`h-1 rounded-full transition-all duration-300 ${
            canScrollLeft ? 'w-4 bg-zinc-600' : 'w-2 bg-zinc-800'
          }`}></div>
          <div className={`h-1 rounded-full transition-all duration-300 ${
            canScrollRight ? 'w-4 bg-zinc-600' : 'w-2 bg-zinc-800'
          }`}></div>
        </div>
      </div>
    </section>
  );
}
