// src/shared/components/AddToWatchlistPrompt.jsx

/**
 * AddToWatchlistPrompt Component
 * 
 * Prompts users when adding a movie to watchlist.
 * Captures:
 * - Why they're adding it (mood_match, great_reviews, etc.)
 * - Priority level (1-10)
 * - Source (where they're adding from)
 * 
 * @component
 */

import { useState } from 'react'
import { Star, Zap, Users, TrendingUp, Heart, Sparkles, Clock, Award } from 'lucide-react'
import { useWatchlistActions } from '@/shared/hooks/useWatchlistActions'
import { trackEvent } from '@/shared/services/events-tracker'
import './AddToWatchlistPrompt.css'

// Reason options with icons and descriptions
const REASON_OPTIONS = [
  {
    value: 'mood_match',
    label: 'Mood Match',
    icon: Heart,
    description: 'Matches my current mood',
    color: '#ec4899' // pink-500
  },
  {
    value: 'great_reviews',
    label: 'Great Reviews',
    icon: Award,
    description: 'High ratings and reviews',
    color: '#f59e0b' // amber-500
  },
  {
    value: 'recommended_by_friend',
    label: 'Friend\'s Rec',
    icon: Users,
    description: 'Recommended by someone',
    color: '#8b5cf6' // purple-500
  },
  {
    value: 'trending',
    label: 'Trending',
    icon: TrendingUp,
    description: 'Popular right now',
    color: '#ef4444' // red-500
  },
  {
    value: 'curiosity',
    label: 'Just Curious',
    icon: Sparkles,
    description: 'Seems interesting',
    color: '#06b6d4' // cyan-500
  },
  {
    value: 'similar_to_favorite',
    label: 'Similar to Favorite',
    icon: Star,
    description: 'Like movies I love',
    color: '#eab308' // yellow-500
  },
  {
    value: 'quick_watch',
    label: 'Quick Watch',
    icon: Zap,
    description: 'Short runtime',
    color: '#10b981' // green-500
  },
  {
    value: 'save_for_later',
    label: 'Save for Later',
    icon: Clock,
    description: 'Not ready to watch yet',
    color: '#6b7280' // gray-500
  }
]

// Priority levels
const PRIORITY_LEVELS = [
  { value: 9, label: 'Must Watch ASAP', emoji: '🔥', color: '#ef4444' },
  { value: 7, label: 'Watch Soon', emoji: '⭐', color: '#f59e0b' },
  { value: 5, label: 'Normal Priority', emoji: '📌', color: '#3b82f6' },
  { value: 3, label: 'Someday', emoji: '💭', color: '#8b5cf6' },
  { value: 1, label: 'Low Priority', emoji: '🕐', color: '#6b7280' }
]

export default function AddToWatchlistPrompt({
  movie,
  source = 'unknown',
  onClose,
  onAdded,
  preselectedReasons = [],
  preselectedPriority = 5,
  skipPrompt = false, // For quick add without prompt
  className = ''
}) {
  const [selectedReasons, setSelectedReasons] = useState(preselectedReasons)
  const [selectedPriority, setSelectedPriority] = useState(preselectedPriority)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('reasons') // 'reasons', 'priority', 'success'

  const { add } = useWatchlistActions(movie.id)

  // If skipPrompt, add immediately
  if (skipPrompt) {
    handleSubmit()
    return null
  }

  /**
   * Toggle reason selection
   */
  const toggleReason = (reason) => {
    setSelectedReasons(prev => {
      if (prev.includes(reason)) {
        return prev.filter(r => r !== reason)
      } else {
        // Limit to 3 reasons
        if (prev.length >= 3) {
          return [...prev.slice(1), reason]
        }
        return [...prev, reason]
      }
    })
  }

  /**
   * Handle next step
   */
  const handleNext = () => {
    if (step === 'reasons') {
      setStep('priority')
    }
  }

  /**
   * Handle submit
   */
  async function handleSubmit() {
    setLoading(true)

    try {
      // Add to watchlist with context
      await add({
        status: 'want_to_watch',
        reasonAdded: selectedReasons,
        priority: selectedPriority,
        source: source
      })

      // Track event
      trackEvent(
        movie.user_id,
        'add_to_watchlist',
        movie.tmdb_id,
        {
          reasons: selectedReasons,
          priority: selectedPriority,
          source: source
        }
      )

      setStep('success')
      onAdded?.()

      // Auto-close after success
      setTimeout(() => {
        onClose()
      }, 1500)

    } catch (error) {
      console.error('[AddToWatchlistPrompt] Error adding:', error)
      alert('Failed to add to watchlist. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Skip and add with defaults
   */
  const handleSkip = async () => {
    setSelectedReasons([])
    setSelectedPriority(5)
    await handleSubmit()
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="add-watchlist-prompt__backdrop"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`add-watchlist-prompt ${className}`}>
        {/* Close button */}
        <button
          className="add-watchlist-prompt__close"
          onClick={onClose}
          disabled={loading}
        >
          ✕
        </button>

        {/* Movie header */}
        <div className="add-watchlist-prompt__header">
          {movie?.poster_path && (
            <img
              src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
              alt={movie.title}
              className="add-watchlist-prompt__poster"
            />
          )}
          <div className="add-watchlist-prompt__movie-info">
            <h2 className="add-watchlist-prompt__title">
              {movie?.title || 'Movie'}
            </h2>
            {movie?.release_year && (
              <p className="add-watchlist-prompt__year">
                {movie.release_year}
              </p>
            )}
            {movie?.genres && (
              <div className="add-watchlist-prompt__genres">
                {movie.genres.slice(0, 3).join(' • ')}
              </div>
            )}
          </div>
        </div>

        {/* Content based on step */}
        <div className="add-watchlist-prompt__content">
          {/* Step 1: Reasons */}
          {step === 'reasons' && (
            <div className="add-watchlist-prompt__reasons">
              <div className="add-watchlist-prompt__step-header">
                <h3 className="add-watchlist-prompt__step-title">
                  Why are you adding this?
                </h3>
                <p className="add-watchlist-prompt__step-description">
                  Select up to 3 reasons (helps us recommend better!)
                </p>
              </div>

              <div className="add-watchlist-prompt__reason-grid">
                {REASON_OPTIONS.map((reason) => {
                  const Icon = reason.icon
                  const isSelected = selectedReasons.includes(reason.value)

                  return (
                    <button
                      key={reason.value}
                      type="button"
                      className={`
                        add-watchlist-prompt__reason
                        ${isSelected ? 'add-watchlist-prompt__reason--selected' : ''}
                      `}
                      onClick={() => toggleReason(reason.value)}
                      disabled={loading}
                      style={{
                        '--reason-color': reason.color
                      }}
                    >
                      <div className="add-watchlist-prompt__reason-icon">
                        <Icon size={20} />
                      </div>
                      <div className="add-watchlist-prompt__reason-content">
                        <strong>{reason.label}</strong>
                        <span>{reason.description}</span>
                      </div>
                      {isSelected && (
                        <div className="add-watchlist-prompt__reason-check">
                          ✓
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="add-watchlist-prompt__actions">
                <button
                  className="add-watchlist-prompt__button add-watchlist-prompt__button--primary"
                  onClick={handleNext}
                  disabled={loading || selectedReasons.length === 0}
                >
                  Next: Set Priority
                </button>
                <button
                  className="add-watchlist-prompt__button add-watchlist-prompt__button--text"
                  onClick={handleSkip}
                  disabled={loading}
                >
                  Skip & Add Anyway
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Priority */}
          {step === 'priority' && (
            <div className="add-watchlist-prompt__priority">
              <div className="add-watchlist-prompt__step-header">
                <h3 className="add-watchlist-prompt__step-title">
                  How urgent is it?
                </h3>
                <p className="add-watchlist-prompt__step-description">
                  We'll prioritize it in your watchlist
                </p>
              </div>

              <div className="add-watchlist-prompt__priority-options">
                {PRIORITY_LEVELS.map((level) => {
                  const isSelected = selectedPriority === level.value

                  return (
                    <button
                      key={level.value}
                      type="button"
                      className={`
                        add-watchlist-prompt__priority-option
                        ${isSelected ? 'add-watchlist-prompt__priority-option--selected' : ''}
                      `}
                      onClick={() => setSelectedPriority(level.value)}
                      disabled={loading}
                      style={{
                        '--priority-color': level.color
                      }}
                    >
                      <span className="add-watchlist-prompt__priority-emoji">
                        {level.emoji}
                      </span>
                      <span className="add-watchlist-prompt__priority-label">
                        {level.label}
                      </span>
                      {isSelected && (
                        <span className="add-watchlist-prompt__priority-check">
                          ✓
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Summary */}
              <div className="add-watchlist-prompt__summary">
                <h4>Summary:</h4>
                <div className="add-watchlist-prompt__summary-item">
                  <strong>Reasons:</strong>
                  <span>
                    {selectedReasons
                      .map(r => REASON_OPTIONS.find(opt => opt.value === r)?.label)
                      .join(', ')}
                  </span>
                </div>
                <div className="add-watchlist-prompt__summary-item">
                  <strong>Priority:</strong>
                  <span>
                    {PRIORITY_LEVELS.find(l => l.value === selectedPriority)?.label}
                  </span>
                </div>
              </div>

              <div className="add-watchlist-prompt__actions">
                <button
                  className="add-watchlist-prompt__button add-watchlist-prompt__button--primary"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add to Watchlist'}
                </button>
                <button
                  className="add-watchlist-prompt__button add-watchlist-prompt__button--text"
                  onClick={() => setStep('reasons')}
                  disabled={loading}
                >
                  Go Back
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="add-watchlist-prompt__success">
              <div className="add-watchlist-prompt__success-icon">
                ✅
              </div>
              <h3 className="add-watchlist-prompt__success-title">
                Added to Watchlist!
              </h3>
              <p className="add-watchlist-prompt__success-description">
                We'll use this to personalize your recommendations
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/**
 * Compact version (inline on movie card)
 * Shows reasons as chips without modal
 */
export function AddToWatchlistInline({
  movie,
  source = 'unknown',
  onAdded,
  className = ''
}) {
  const [selectedReasons, setSelectedReasons] = useState([])
  const [loading, setLoading] = useState(false)

  const { add } = useWatchlistActions(movie.id)

  const toggleReason = (reason) => {
    setSelectedReasons(prev => {
      if (prev.includes(reason)) {
        return prev.filter(r => r !== reason)
      } else {
        return [...prev, reason]
      }
    })
  }

  const handleAdd = async () => {
    if (selectedReasons.length === 0) {
      alert('Please select at least one reason')
      return
    }

    setLoading(true)

    try {
      await add({
        status: 'want_to_watch',
        reasonAdded: selectedReasons,
        priority: 5,
        source: source
      })

      onAdded?.()
    } catch (error) {
      console.error('[AddToWatchlistInline] Error:', error)
      alert('Failed to add. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`add-watchlist-inline ${className}`}>
      <p className="add-watchlist-inline__label">Why adding?</p>
      
      <div className="add-watchlist-inline__reasons">
        {REASON_OPTIONS.slice(0, 6).map((reason) => {
          const Icon = reason.icon
          const isSelected = selectedReasons.includes(reason.value)

          return (
            <button
              key={reason.value}
              type="button"
              className={`
                add-watchlist-inline__chip
                ${isSelected ? 'add-watchlist-inline__chip--selected' : ''}
              `}
              onClick={() => toggleReason(reason.value)}
              disabled={loading}
              title={reason.description}
              style={{
                '--chip-color': reason.color
              }}
            >
              <Icon size={14} />
              <span>{reason.label}</span>
            </button>
          )
        })}
      </div>

      <button
        className="add-watchlist-inline__button"
        onClick={handleAdd}
        disabled={loading || selectedReasons.length === 0}
      >
        {loading ? 'Adding...' : 'Add to Watchlist'}
      </button>
    </div>
  )
}
