import { useState } from 'react'
import { Check } from 'lucide-react'

import { tmdbImg } from '@/shared/api/tmdb'

// Grid card: poster + title + year below (not overlaid). Fills its grid track.
export default function MovieCard({ movie, isSelected, onClick }) {
  const [loaded, setLoaded] = useState(false)
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? 'Remove' : 'Select'} ${movie.title}`}
      className="w-full flex flex-col gap-1.5 text-left focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg group"
    >
      <div className={`relative aspect-2/3 w-full rounded-lg overflow-hidden transition-shadow duration-200 ${
        isSelected
          ? 'ring-2 ring-purple-400 shadow-[0_0_16px_rgba(168,85,247,0.4)]'
          : 'ring-1 ring-white/6 group-hover:ring-white/20'
      }`}>
        {!loaded && <div className="absolute inset-0 animate-pulse bg-white/4" />}
        <img
          src={tmdbImg(movie.poster_path, 'w342')}
          alt=""
          loading="lazy"
          className={`w-full h-full object-cover transition-all duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          } ${isSelected ? 'brightness-75' : 'group-hover:brightness-110'}`}
          onLoad={() => setLoaded(true)}
        />
        {isSelected && <div className="absolute inset-0 bg-purple-600/15" />}
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center shadow">
            <Check className="h-3 w-3 text-white stroke-3" />
          </div>
        )}
      </div>
      <div className="px-0.5">
        <p className={`text-[11px] font-medium leading-tight line-clamp-2 transition-colors ${
          isSelected ? 'text-purple-300' : 'text-white/80'
        }`}>
          {movie.title}
        </p>
        {year && <p className="text-[10px] text-white/35 mt-0.5">{year}</p>}
      </div>
    </button>
  )
}
