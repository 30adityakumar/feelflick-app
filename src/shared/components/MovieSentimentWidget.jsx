// src/shared/components/MovieSentimentWidget.jsx

/**
 * Movie Sentiment Widget
 * Collects rich feedback after user watches a movie
 */

import { useState } from 'react'
import { Heart, ThumbsUp, Meh, ThumbsDown, X } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'
import { ensureMovieInDb } from '@/shared/lib/movies/ensureMovieInDb'

const SENTIMENTS = [
  { value: 'loved', label: 'Loved it!', icon: Heart, color: 'text-red-500', bg: 'bg-red-500/20', border: 'border-red-500' },
  { value: 'liked', label: 'Liked it', icon: ThumbsUp, color: 'text-green-500', bg: 'bg-green-500/20', border: 'border-green-500' },
  { value: 'meh', label: 'It was ok', icon: Meh, color: 'text-yellow-500', bg: 'bg-yellow-500/20', border: 'border-yellow-500' },
  { value: 'disliked', label: 'Didn\'t like', icon: ThumbsDown, color: 'text-orange-500', bg: 'bg-orange-500/20', border: 'border-orange-500' },
  { value: 'hated', label: 'Hated it', icon: X, color: 'text-red-600', bg: 'bg-red-600/20', border: 'border-red-600' },
]

const VIEWING_CONTEXT = [
  'mood_match', 'great_reviews', 'friend_recommendation', 
  'actor_fan', 'director_fan', 'genre_fan', 'sequel', 'trending'
]

const WHAT_STOOD_OUT = [
  'acting', 'story', 'visuals', 'music', 'directing', 
  'cinematography', 'emotions', 'plot_twist', 'characters'
]

export default function MovieSentimentWidget({ user, movie, onClose }) {
  const [sentiment, setSentiment] = useState(null)
  const [viewingContext, setViewingContext] = useState([])
  const [whatStoodOut, setWhatStoodOut] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const toggleTag = (tag, list, setter) => {
    if (list.includes(tag)) {
      setter(list.filter(t => t !== tag))
    } else {
      setter([...list, tag])
    }
  }

  const handleSubmit = async () => {
    if (!user?.id || !movie?.id || !sentiment) return

    setSubmitting(true)

    try {
      // Ensure movie exists in DB
      const internalMovieId = await ensureMovieInDb(movie)
      
      console.log('[MovieSentimentWidget] Submitting feedback:', { 
        userId: user.id,
        movieId: internalMovieId,
        sentiment,
        viewingContext,
        whatStoodOut
      })

      // ✅ FIXED: Removed updated_at, matches your schema exactly
      const payload = {
        user_id: user.id,
        movie_id: internalMovieId,
        feedback_type: 'sentiment',
        sentiment: sentiment,
        watched_confirmed: true,
        viewing_context_tags: viewingContext.length > 0 ? viewingContext : null,
        what_stood_out: whatStoodOut.length > 0 ? whatStoodOut : null
      }

      const { data, error } = await supabase
        .from('user_movie_feedback')
        .upsert(payload, {
          onConflict: 'user_id,movie_id',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (error) {
        console.error('[MovieSentimentWidget] Database error:', error)
        throw error
      }

      console.log('[MovieSentimentWidget] ✅ Feedback submitted:', data)
      
      setSubmitted(true)

      // Close after 1.5s
      setTimeout(() => {
        onClose?.()
      }, 1500)

    } catch (error) {
      console.error('[MovieSentimentWidget] Submit error:', error)
      alert('Failed to save feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-gradient-to-br from-neutral-900 to-black rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative h-32 overflow-hidden">
          {movie?.backdrop_path && (
            <img
              src={`https://image.tmdb.org/t/p/w780${movie.backdrop_path}`}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-white" />
          </button>
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="text-xl font-bold text-white line-clamp-1">
              How did you feel about {movie?.title}?
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="inline-flex h-16 w-16 rounded-full bg-green-500/20 items-center justify-center mb-2">
                <Heart className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Thanks for your feedback!</h3>
              <p className="text-sm text-white/60">This helps us recommend better movies for you.</p>
            </div>
          ) : (
            <>
              {/* Sentiment Selection */}
              <div>
                <h3 className="text-sm font-bold text-white mb-3">Your overall feeling *</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {SENTIMENTS.map(s => {
                    const Icon = s.icon
                    const isSelected = sentiment === s.value
                    return (
                      <button
                        key={s.value}
                        onClick={() => setSentiment(s.value)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          isSelected 
                            ? `${s.bg} ${s.border} scale-105` 
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <Icon className={`h-6 w-6 ${isSelected ? s.color : 'text-white/60'}`} />
                        <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-white/60'}`}>
                          {s.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Viewing Context */}
              <div>
                <h3 className="text-sm font-bold text-white mb-2">Why did you watch this? (optional)</h3>
                <div className="flex flex-wrap gap-2">
                  {VIEWING_CONTEXT.map(tag => {
                    const isSelected = viewingContext.includes(tag)
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag, viewingContext, setViewingContext)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-purple-500/30 border-purple-500 text-purple-300'
                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                        } border`}
                      >
                        {tag.replace(/_/g, ' ')}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* What Stood Out */}
              <div>
                <h3 className="text-sm font-bold text-white mb-2">What stood out? (optional)</h3>
                <div className="flex flex-wrap gap-2">
                  {WHAT_STOOD_OUT.map(tag => {
                    const isSelected = whatStoodOut.includes(tag)
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag, whatStoodOut, setWhatStoodOut)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-pink-500/30 border-pink-500 text-pink-300'
                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                        } border`}
                      >
                        {tag.replace(/_/g, ' ')}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!sentiment || submitting}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                {submitting ? 'Saving...' : 'Submit Feedback'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
