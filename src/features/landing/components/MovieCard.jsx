// src/features/landing/components/MovieCard.jsx
import { Play } from 'lucide-react';

export function MovieCard({ poster, title, match, isVisible, delay }) {
  return (
    <div
      className={`group relative rounded-2xl overflow-hidden shadow-2xl transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <img src={poster} alt={title} className="w-full h-full object-cover" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
      
      {/* Play button on hover */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Play className="h-16 w-16 text-white" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{title}</h3>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg">
          <span className="text-sm font-bold">{match}% Match</span>
        </div>
      </div>
    </div>
  )
}
