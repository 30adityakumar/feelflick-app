// src/app/homepage/components/CarouselRow.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const img = (p, s = 'w500') => p ? `https://image.tmdb.org/t/p/${s}${p}` : '/placeholder-movie.png'

export default function CarouselRow({ title, tmdbCategory = 'popular', rowId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const railRef = useRef(null)
  const nav = useNavigate()

  useEffect(() => {
    setLoading(true)
    fetch(`https://api.themoviedb.org/3/movie/${tmdbCategory}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US&page=1`)
      .then(r => r.json())
      .then(j => {
        setItems(j?.results?.slice(0, 20) ?? [])
        setLoading(false)
      })
      .catch(() => {
        setItems([])
        setLoading(false)
      })
  }, [tmdbCategory])

  const scroll = (dir) => {
    const rail = railRef.current
    if (!rail) return
    const scrollAmount = rail.clientWidth * 0.75
    rail.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
  }

  const handleScroll = () => {
    const rail = railRef.current
    if (!rail) return
    setShowLeftArrow(rail.scrollLeft > 10)
    setShowRightArrow(rail.scrollLeft < (rail.scrollWidth - rail.clientWidth - 10))
  }

  useEffect(() => {
    const rail = railRef.current
    if (rail) {
      rail.addEventListener('scroll', handleScroll)
      handleScroll()
    }
    return () => rail?.removeEventListener('scroll', handleScroll)
  }, [items])

  // Loading Skeletons
  const skeletons = Array.from({ length: 6 }).map((_, idx) => (
    <div 
      key={idx} 
      className="aspect-[2/3] w-[150px] min-w-[150px] sm:w-[180px] sm:min-w-[180px] md:w-[200px] md:min-w-[200px] rounded-md bg-neutral-800/60 animate-pulse flex-shrink-0"
    />
  ))

  return (
    <div className="relative group w-full">
      {/* Header - Desktop padding matches hero */}
      <div className="mb-3 px-4 md:px-12 lg:px-16 xl:px-20">
        <h2 className="text-base md:text-lg font-bold tracking-tight text-white/95">{title}</h2>
      </div>

      {/* Carousel Container */}
      <div className="relative w-full">
        
        {/* Navigation Arrows */}
        {!loading && showLeftArrow && (
          <button 
            onClick={() => scroll('left')} 
            className="hidden lg:flex absolute left-0 top-0 z-40 h-full w-16 items-center justify-start pl-2 bg-gradient-to-r from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label="Previous"
          >
            <div className="h-10 w-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-purple-600 hover:text-white hover:scale-110 transition-all duration-200 shadow-2xl border border-white/10">
              <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
            </div>
          </button>
        )}

        {!loading && showRightArrow && (
          <button 
            onClick={() => scroll('right')} 
            className="hidden lg:flex absolute right-0 top-0 z-40 h-full w-16 items-center justify-end pr-2 bg-gradient-to-l from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label="Next"
          >
            <div className="h-10 w-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-purple-600 hover:text-white hover:scale-110 transition-all duration-200 shadow-2xl border border-white/10">
              <ChevronRight className="h-6 w-6 stroke-[2.5]" />
            </div>
          </button>
        )}

        {/* Carousel Rail */}
        <div 
          ref={railRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-4 px-4 md:px-12 lg:px-16 xl:px-20"
          style={{ scrollSnapType: 'x mandatory', scrollPaddingLeft: '1rem' }}
          role="list"
          aria-label={title}
        >
          {loading ? skeletons : items.map((m, idx) => (
            <MovieCard key={m.id} movie={m} onClick={() => nav(`/movie/${m.id}`)} index={idx} />
          ))}
        </div>
      </div>
    </div>
  )
}

function MovieCard({ movie, onClick, index }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group/card relative aspect-[2/3] w-[150px] min-w-[150px] sm:w-[180px] sm:min-w-[180px] md:w-[200px] md:min-w-[200px] flex-shrink-0 overflow-hidden rounded-lg bg-neutral-900 transition-all duration-300 hover:scale-105 hover:z-50 hover:shadow-2xl focus:scale-105 focus:z-50 focus:outline-none"
      style={{ 
        scrollSnapAlign: 'start', 
        transformOrigin: index === 0 ? 'left center' : 'center center' 
      }}
      role="listitem"
      aria-label={movie.title}
    >
      {/* Poster Image */}
      <img 
        src={img(movie.poster_path)} 
        alt={movie.title} 
        className="absolute inset-0 h-full w-full object-cover loading-lazy transition-transform duration-500 group-hover/card:scale-110"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-60 group-hover/card:opacity-90 transition-opacity duration-300" />

      {/* Content Container */}
      <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-100 transition-opacity duration-300">
        <div className="space-y-1.5 transform translate-y-2 group-hover/card:translate-y-0 transition-transform duration-300">
          
          {/* Title */}
          <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 drop-shadow-md">
            {movie.title}
          </h3>

          {/* Metadata Row */}
          <div className="flex items-center gap-2 text-[11px] text-white/90">
            {/* Year */}
            {movie.release_date && (
              <span className="font-medium drop-shadow-sm">
                {new Date(movie.release_date).getFullYear()}
              </span>
            )}

            {/* Rating Badge (Purple) */}
            {movie.vote_average > 0 && (
              <>
                <span className="text-white/30">|</span>
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 backdrop-blur-sm">
                  <span className="text-purple-300 text-[10px]">★</span>
                  <span className="text-purple-200 font-semibold">{movie.vote_average.toFixed(1)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hover Border Glow */}
      <div className={`absolute inset-0 rounded-lg transition-all duration-300 pointer-events-none border-2 ${
        isHovered ? 'border-purple-500/50 shadow-[inset_0_0_20px_rgba(168,85,247,0.2)]' : 'border-transparent'
      }`} />
    </button>
  )
}
