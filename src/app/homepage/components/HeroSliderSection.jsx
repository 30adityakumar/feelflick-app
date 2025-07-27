// HeroSliderSection.jsx
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

  useEffect(() => {
    fetchFeatured().then(setSlides);
  }, []);

  useEffect(() => {
    if (!slides.length) return;
    const id = setInterval(() => setIdx(i => (i + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides]);

  if (!slides[idx]) {
    return <div className="h-64 sm:h-80 md:h-96 bg-zinc-900 animate-pulse" />;
  }

  const m = slides[idx];

  return (
    <div className="relative h-64 sm:h-80 md:h-96 mb-6 sm:mb-8 overflow-hidden">
      <img
        src={`https://image.tmdb.org/t/p/original${m.backdrop_path}`}
        alt={m.title}
        className="w-full h-full object-cover"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      
      {/* Mobile-optimized content container */}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6">
        <div className="max-w-full">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 leading-tight break-words">
            {m.title}
          </h1>
          
          {/* Text with proper mobile constraints */}
          <p className="text-sm sm:text-base md:text-lg opacity-90 mb-3 sm:mb-4 leading-relaxed break-words line-clamp-3 sm:line-clamp-4 md:line-clamp-none">
            {m.overview}
          </p>
          
          <button
            onClick={() => nav(`/movie/${m.id}`)}
            className="bg-red-600 hover:bg-red-700 active:bg-red-800 px-4 sm:px-6 py-2 rounded-lg font-semibold transition-colors text-sm sm:text-base touch-manipulation"
          >
            Watch Now
          </button>
        </div>
      </div>
    </div>
  );
}
