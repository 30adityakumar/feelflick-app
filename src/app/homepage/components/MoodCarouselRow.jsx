// src/app/homepage/components/MoodCarouselRow.jsx
import { useRecommendations } from '@/shared/hooks/useRecommendations';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';

export default function MoodCarouselRow({ moodId, moodName, moodEmoji }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const { recommendations, loading, error } = useRecommendations(moodId, 1, 1, 10);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">{moodEmoji} {moodName}</h2>
        <div className="flex gap-3 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-[140px] sm:w-[180px] flex-shrink-0">
              <div className="aspect-[2/3] bg-white/10 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !recommendations.length) return null;

  return (
    <div className="relative group px-4 sm:px-6 lg:px-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">{moodEmoji} {moodName}</h2>
      
      {/* Left Arrow */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-full w-12 bg-gradient-to-r from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-start pl-2"
        >
          <ChevronLeft className="h-8 w-8 text-white" />
        </button>
      )}

      {/* Carousel */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
      >
        {recommendations.map((movie) => (
          <div
            key={movie.movie_id}
            onClick={() => navigate(`/movie/${movie.tmdb_id}`)}
            className="w-[140px] sm:w-[180px] flex-shrink-0 cursor-pointer group/card"
          >
            {movie.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                alt={movie.title}
                className="w-full aspect-[2/3] object-cover rounded-lg group-hover/card:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-4xl">🎬</span>
              </div>
            )}
            <div className="mt-2">
              <h3 className="text-sm font-medium line-clamp-2">{movie.title}</h3>
              <div className="text-xs text-white/50 mt-1">⭐ {movie.vote_average?.toFixed(1)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Right Arrow */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-full w-12 bg-gradient-to-l from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end pr-2"
        >
          <ChevronRight className="h-8 w-8 text-white" />
        </button>
      )}
    </div>
  );
}