/**
 * MovieRatingWidget Component
 * 1-10 star rating system
 */

import { useState } from 'react'
import { Star, Loader2, Check, X } from 'lucide-react'
import { useMovieRating } from '@/shared/hooks/useMovieRating'
import StarRating from '@/shared/components/StarRating'

export default function MovieRatingWidget({
  user,
  movieInternalId,
  size = 'md',
  showLabel = true,
  className = ''
}) {
  // ✅ CORRECT PARAMETER ORDER: (movieId, userId)
  const { rating, loading, saving, error, saveRating, hasRated } = useMovieRating(
    movieInternalId,  // ← First: movie ID (integer)
    user?.id          // ← Second: user ID (UUID string)
  )

  const [justSaved, setJustSaved] = useState(false)

  const handleRatingClick = async (newRating) => {
    if (saving || !user) return

    const success = await saveRating(newRating)
    
    if (success) {
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2000)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-white/50" />
        <span className="text-sm text-white/50">Loading rating...</span>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return (
      <div className={`${className}`}>
        <p className="text-sm text-white/60 italic">
          Sign in to rate this movie
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/90">
          Your Rating
        </h3>
        {justSaved && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 text-xs font-medium animate-in fade-in">
            <Check className="h-3 w-3" />
            Saved
          </span>
        )}
      </div>

      {/* Star Rating Component */}
      <StarRating
        value={rating}
        onChange={handleRatingClick}
        readonly={saving}
        size={size}
        showLabel={showLabel}
        showClearButton={true}
      />

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <X className="h-3 w-3" />
          {error}
        </p>
      )}

      {/* Saving indicator */}
      {saving && (
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </div>
      )}
    </div>
  )
}
