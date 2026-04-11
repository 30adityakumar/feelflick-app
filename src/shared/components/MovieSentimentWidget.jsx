// src/shared/components/MovieSentimentWidget.jsx

import { useState } from 'react'
import { Heart, ThumbsUp, Meh, ThumbsDown, X, AlertCircle, Check } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'
import { ensureMovieInDb } from '@/shared/lib/movies/ensureMovieInDb'
import StarRating from '@/shared/components/StarRating'
import { useReflectionPrompt } from '@/shared/hooks/useReflectionPrompt'

const SENTIMENTS = [
  {
    value: 'loved',
    label: 'Loved it',
    icon: Heart,
    activeClass: 'bg-gradient-to-br from-purple-500/30 to-pink-500/20 border-purple-400/70',
    iconClass: 'text-pink-400',
  },
  {
    value: 'liked',
    label: 'Liked it',
    icon: ThumbsUp,
    activeClass: 'bg-purple-500/20 border-purple-400/50',
    iconClass: 'text-purple-400',
  },
  {
    value: 'meh',
    label: 'It was ok',
    icon: Meh,
    activeClass: 'bg-white/10 border-white/30',
    iconClass: 'text-white/70',
  },
  {
    value: 'disliked',
    label: "Didn't like",
    icon: ThumbsDown,
    activeClass: 'bg-white/6 border-white/20',
    iconClass: 'text-white/50',
  },
  {
    value: 'hated',
    label: 'Hated it',
    icon: X,
    activeClass: 'bg-red-500/15 border-red-500/40',
    iconClass: 'text-red-400',
  },
]

const VIEWING_CONTEXT = [
  { value: 'mood_match',            label: 'Mood match'    },
  { value: 'great_reviews',         label: 'Great reviews' },
  { value: 'friend_recommendation', label: 'Friend rec'    },
  { value: 'actor_fan',             label: 'Actor fan'     },
  { value: 'director_fan',          label: 'Director fan'  },
  { value: 'genre_fan',             label: 'Genre fan'     },
  { value: 'sequel',                label: 'Sequel'        },
  { value: 'trending',              label: 'Trending'      },
]

const WHAT_STOOD_OUT = [
  { value: 'acting',         label: 'Acting'         },
  { value: 'story',          label: 'Story'          },
  { value: 'visuals',        label: 'Visuals'        },
  { value: 'music',          label: 'Music'          },
  { value: 'directing',      label: 'Directing'      },
  { value: 'cinematography', label: 'Cinematography' },
  { value: 'emotions',       label: 'Emotions'       },
  { value: 'plot_twist',     label: 'Plot twist'     },
  { value: 'characters',     label: 'Characters'     },
]

const REVIEW_MAX = 500

/**
 * Unified feedback modal — collects star rating, written review,
 * sentiment, and context tags in one place.
 *
 * Saves to:
 *   user_ratings         → rating (integer 1-10) + review_text
 *   user_movie_feedback  → sentiment + viewing_context_tags + what_stood_out
 *
 * @param {object}  user              - Supabase auth user
 * @param {object}  movie             - TMDB movie object
 * @param {number}  internalMovieId   - Resolved internal DB id (optional; will ensureMovieInDb if absent)
 * @param {number}  initialRating     - Pre-fill star rating from existing record
 * @param {string}  initialReview     - Pre-fill review text from existing record
 * @param {function} onClose
 * @param {function} onSaved          - Called with { rating } after save so parent can refresh display
 */
export default function MovieSentimentWidget({
  user,
  movie,
  internalMovieId: propInternalId = null,
  initialRating = 0,
  initialReview = '',
  initialSentiment = null,
  initialViewingContext = [],
  initialWhatStoodOut = [],
  onClose,
  onSaved,
}) {
  const [rating, setRating]               = useState(initialRating)
  const [reviewText, setReviewText]       = useState(initialReview)
  const [sentiment, setSentiment]         = useState(initialSentiment)
  const [viewingContext, setViewingContext] = useState(initialViewingContext)
  const [whatStoodOut, setWhatStoodOut]   = useState(initialWhatStoodOut)
  const [reflectionText, setReflectionText] = useState('')
  const [submitting, setSubmitting]       = useState(false)
  const [submitted, setSubmitted]         = useState(false)
  const [error, setError]                 = useState(null)

  const { prompt: aiPrompt, loading: promptLoading } = useReflectionPrompt(movie?.id ?? null)

  const toggleTag = (tag, list, setter) =>
    setter(list.includes(tag) ? list.filter(t => t !== tag) : [...list, tag])

  const handleSubmit = async () => {
    if (!user?.id || !movie?.id) return
    setSubmitting(true)
    setError(null)

    try {
      const internalId = propInternalId ?? (await ensureMovieInDb(movie))

      // 1. Save rating + review → user_ratings
      if (rating > 0) {
        const { error: ratingErr } = await supabase
          .from('user_ratings')
          .upsert({
            user_id:     user.id,
            movie_id:    internalId,
            rating,
            review_text: reviewText.trim() || null,
            rated_at:    new Date().toISOString(),
            source:      'movie_detail',
          }, { onConflict: 'user_id,movie_id' })
        if (ratingErr) throw ratingErr
      }

      // 2. Save sentiment + tags → user_movie_feedback (only if sentiment chosen)
      if (sentiment) {
        const { error: feedbackErr } = await supabase
          .from('user_movie_feedback')
          .upsert({
            user_id:              user.id,
            movie_id:             internalId,
            feedback_type:        'sentiment',
            sentiment,
            watched_confirmed:    true,
            viewing_context_tags: viewingContext.length > 0 ? viewingContext : null,
            what_stood_out:       whatStoodOut.length > 0 ? whatStoodOut : null,
          }, { onConflict: 'user_id,movie_id', ignoreDuplicates: false })
        if (feedbackErr) throw feedbackErr
      }

      // 3. Save reflection response → user_movie_sentiment (best-effort)
      if (reflectionText.trim()) {
        await supabase
          .from('user_movie_sentiment')
          .upsert({
            user_id:       user.id,
            movie_id:      internalId,
            sentiment:     sentiment ?? 'meh',
            text_feedback: reflectionText.trim(),
          }, { onConflict: 'user_id,movie_id' })
      }

      setSubmitted(true)
      onSaved?.({
        rating,
        sentiment: sentiment ?? null,
        viewingContextTags: viewingContext.length > 0 ? viewingContext : null,
        whatStoodOut: whatStoodOut.length > 0 ? whatStoodOut : null,
      })
      setTimeout(() => onClose?.(), 1600)
    } catch (err) {
      setError('Could not save. Please try again.')
      console.error('[MovieSentimentWidget]', err)
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = (rating > 0 || sentiment) && !submitting

  if (!user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0"
        onClick={() => onClose?.()}
        aria-label="Close sentiment modal"
      />
      <div className="relative z-10 w-full sm:max-w-lg bg-black border border-white/8 sm:rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="relative h-28 overflow-hidden flex-shrink-0">
          {movie?.backdrop_path && (
            <img
              src={`https://image.tmdb.org/t/p/w780${movie.backdrop_path}`}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/30" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 border border-white/10 hover:bg-black/70 backdrop-blur flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-white/60" />
          </button>
          <div className="absolute bottom-3 left-4 right-12">
            <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-0.5">
              {(initialRating > 0 || initialSentiment) ? 'Edit your take' : 'Your take'}
            </p>
            <h2 className="text-lg font-black text-white leading-tight line-clamp-1">{movie?.title}</h2>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="p-5 space-y-5 overflow-y-auto" style={{ maxHeight: '68vh' }}>
          {submitted ? (
            <div className="py-10 text-center space-y-3">
              <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 items-center justify-center">
                <Check className="h-7 w-7 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Saved!</h3>
              <p className="text-sm text-white/40">Your feedback shapes your recommendations.</p>
            </div>
          ) : (
            <>
              {/* ── Star rating ── */}
              <div>
                <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-3">Rating</p>
                <StarRating
                  value={rating}
                  onChange={setRating}
                  size="md"
                  showLabel
                  showClearButton
                />
              </div>

              {/* ── Written review ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest">
                    Review <span className="normal-case font-normal">(optional)</span>
                  </p>
                  <span className="text-[11px] text-white/20 tabular-nums">
                    {reviewText.length}/{REVIEW_MAX}
                  </span>
                </div>
                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value.slice(0, REVIEW_MAX))}
                  placeholder="What did you think? Any thoughts worth remembering…"
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 transition-all"
                />
              </div>

              {/* ── AI Reflection ── */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/35">
                  Reflect <span className="normal-case font-normal">(optional)</span>
                </p>
                <p className="min-h-[1.4em] text-sm text-white/55">
                  {promptLoading
                    ? <span className="animate-pulse text-white/25">Reflecting on this one…</span>
                    : (aiPrompt ?? 'What stayed with you after the credits?')}
                </p>
                <textarea
                  value={reflectionText}
                  onChange={e => setReflectionText(e.target.value.slice(0, 300))}
                  placeholder="Your thoughts…"
                  rows={2}
                  className="w-full resize-none rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 focus:border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500/10 transition-all"
                />
              </div>

              {/* ── Overall feeling ── */}
              <div>
                <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-3">
                  Overall feeling <span className="normal-case font-normal">(optional)</span>
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  {SENTIMENTS.map(s => {
                    const Icon = s.icon
                    const isSelected = sentiment === s.value
                    return (
                      <button
                        key={s.value}
                        onClick={() => setSentiment(isSelected ? null : s.value)}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all active:scale-95 ${
                          isSelected
                            ? `${s.activeClass} scale-[1.04]`
                            : 'bg-white/[0.03] border-white/8 hover:bg-white/6 hover:border-white/15'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isSelected ? s.iconClass : 'text-white/30'}`} />
                        <span className={`text-[10px] font-semibold leading-tight text-center ${isSelected ? 'text-white' : 'text-white/30'}`}>
                          {s.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── Why you watched ── */}
              <div>
                <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-2.5">
                  Why did you watch? <span className="normal-case font-normal">(optional)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {VIEWING_CONTEXT.map(tag => {
                    const isSelected = viewingContext.includes(tag.value)
                    return (
                      <button
                        key={tag.value}
                        onClick={() => toggleTag(tag.value, viewingContext, setViewingContext)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                            : 'bg-white/[0.03] border-white/8 text-white/40 hover:bg-white/6 hover:border-white/15 hover:text-white/65'
                        }`}
                      >
                        {tag.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── What stood out ── */}
              <div>
                <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-2.5">
                  What stood out? <span className="normal-case font-normal">(optional)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {WHAT_STOOD_OUT.map(tag => {
                    const isSelected = whatStoodOut.includes(tag.value)
                    return (
                      <button
                        key={tag.value}
                        onClick={() => toggleTag(tag.value, whatStoodOut, setWhatStoodOut)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                            : 'bg-white/[0.03] border-white/8 text-white/40 hover:bg-white/6 hover:border-white/15 hover:text-white/65'
                        }`}
                      >
                        {tag.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/8 border border-red-500/15 rounded-xl px-3 py-2.5">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold shadow-lg shadow-purple-500/20 hover:from-purple-400 hover:to-pink-400 disabled:opacity-35 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {submitting ? 'Saving…' : (initialRating > 0 || initialSentiment) ? 'Update your take' : 'Save your take'}
              </button>

              <p className="text-center text-[11px] text-white/15 pb-1">
                Rate or write a review — at least one is needed to save
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
