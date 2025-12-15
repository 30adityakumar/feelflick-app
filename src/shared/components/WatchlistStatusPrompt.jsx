// src/shared/components/WatchlistStatusPrompt.jsx

/**
 * WatchlistStatusPrompt Component
 * 
 * Prompts users about movies that have been in their watchlist for a while.
 * Asks: "Did you watch this?" and captures:
 * - Yes/No response
 * - If yes: optional sentiment
 * - If no: update priority or remove
 * 
 * @component
 */

import { useState } from 'react'
import { Clock, CheckCircle, XCircle, Trash2, Star } from 'lucide-react'
import QuickSentimentPicker from './QuickSentimentPicker'
import { useWatchlistActions } from '@/shared/hooks/useWatchlistActions'
import { useFeedback } from '@/shared/hooks/useFeedback'
import './WatchlistStatusPrompt.css'

export default function WatchlistStatusPrompt({
  entry,
  onClose,
  onStatusUpdated,
  className = ''
}) {
  const [step, setStep] = useState('question') // 'question', 'watched', 'not-watched', 'success'
  const [selectedSentiment, setSelectedSentiment] = useState(null)
  const [loading, setLoading] = useState(false)

  const { setStatus, remove } = useWatchlistActions(entry.movie_id)
  const { confirmWatched } = useFeedback(entry.movies?.tmdb_id)

  const movie = entry.movies
  const daysInWatchlist = entry.days_in_watchlist || 0

  /**
   * Handle "Yes, I watched it"
   */
  const handleWatchedYes = () => {
    setStep('watched')
  }

  /**
   * Handle "No, I didn't watch it"
   */
  const handleWatchedNo = () => {
    setStep('not-watched')
  }

  /**
   * Submit watched status with sentiment
   */
  const handleSubmitWatched = async () => {
    setLoading(true)

    try {
      // Update watchlist status to 'watched'
      await setStatus('watched')

      // Submit feedback with sentiment if provided
      if (selectedSentiment) {
        await confirmWatched(selectedSentiment)
      }

      setStep('success')
      onStatusUpdated?.()

      // Auto-close after success
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (error) {
      console.error('[WatchlistStatusPrompt] Error submitting:', error)
      alert('Failed to update status. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Keep in watchlist but lower priority
   */
  const handleKeepLowerPriority = async () => {
    setLoading(true)

    try {
      // Lower priority by 2 (minimum 1)
      const newPriority = Math.max(1, (entry.priority || 5) - 2)
      await setStatus('want_to_watch') // Ensure it stays as want_to_watch
      
      // Note: Priority update would need a separate call if you want to change it
      // For now, just keeping status as want_to_watch
      
      setStep('success')
      onStatusUpdated?.()

      setTimeout(() => {
        onClose()
      }, 1500)

    } catch (error) {
      console.error('[WatchlistStatusPrompt] Error updating:', error)
      alert('Failed to update. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Remove from watchlist
   */
  const handleRemove = async () => {
    if (!confirm('Remove this movie from your watchlist?')) return

    setLoading(true)

    try {
      await remove()
      
      setStep('success')
      onStatusUpdated?.()

      setTimeout(() => {
        onClose()
      }, 1500)

    } catch (error) {
      console.error('[WatchlistStatusPrompt] Error removing:', error)
      alert('Failed to remove. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="watchlist-status-prompt__backdrop"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`watchlist-status-prompt ${className}`}>
        {/* Close button */}
        <button
          className="watchlist-status-prompt__close"
          onClick={onClose}
          disabled={loading}
        >
          ✕
        </button>

        {/* Movie header */}
        <div className="watchlist-status-prompt__header">
          {movie?.poster_path && (
            <img
              src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
              alt={movie.title}
              className="watchlist-status-prompt__poster"
            />
          )}
          <div className="watchlist-status-prompt__movie-info">
            <h2 className="watchlist-status-prompt__title">
              {movie?.title || 'Movie'}
            </h2>
            {movie?.release_year && (
              <p className="watchlist-status-prompt__year">
                {movie.release_year}
              </p>
            )}
            <div className="watchlist-status-prompt__meta">
              <Clock size={14} />
              <span>In watchlist for {daysInWatchlist} days</span>
            </div>
          </div>
        </div>

        {/* Content based on step */}
        <div className="watchlist-status-prompt__content">
          {/* Step 1: Initial question */}
          {step === 'question' && (
            <div className="watchlist-status-prompt__question">
              <div className="watchlist-status-prompt__question-icon">
                🎬
              </div>
              <h3 className="watchlist-status-prompt__question-title">
                Did you watch this movie?
              </h3>
              <p className="watchlist-status-prompt__question-description">
                It's been in your watchlist for {daysInWatchlist} days. 
                Let us know so we can improve your recommendations!
              </p>

              <div className="watchlist-status-prompt__actions">
                <button
                  className="watchlist-status-prompt__button watchlist-status-prompt__button--primary"
                  onClick={handleWatchedYes}
                >
                  <CheckCircle size={20} />
                  Yes, I watched it
                </button>

                <button
                  className="watchlist-status-prompt__button watchlist-status-prompt__button--secondary"
                  onClick={handleWatchedNo}
                >
                  <XCircle size={20} />
                  No, not yet
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Watched - ask for sentiment */}
          {step === 'watched' && (
            <div className="watchlist-status-prompt__sentiment">
              <div className="watchlist-status-prompt__sentiment-icon">
                ⭐
              </div>
              <h3 className="watchlist-status-prompt__sentiment-title">
                Great! How did you feel about it?
              </h3>
              <p className="watchlist-status-prompt__sentiment-description">
                Your feedback helps us recommend better movies
              </p>

              <div className="watchlist-status-prompt__sentiment-picker">
                <QuickSentimentPicker
                  value={selectedSentiment}
                  onChange={setSelectedSentiment}
                  variant="inline"
                  size="lg"
                  showLabels={true}
                  showDescriptions={true}
                />
              </div>

              <div className="watchlist-status-prompt__actions">
                <button
                  className="watchlist-status-prompt__button watchlist-status-prompt__button--primary"
                  onClick={handleSubmitWatched}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : selectedSentiment ? 'Submit Rating' : 'Skip Rating'}
                </button>

                <button
                  className="watchlist-status-prompt__button watchlist-status-prompt__button--text"
                  onClick={() => setStep('question')}
                  disabled={loading}
                >
                  Go Back
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Not watched - what to do? */}
          {step === 'not-watched' && (
            <div className="watchlist-status-prompt__not-watched">
              <div className="watchlist-status-prompt__not-watched-icon">
                📝
              </div>
              <h3 className="watchlist-status-prompt__not-watched-title">
                No problem! What would you like to do?
              </h3>

              <div className="watchlist-status-prompt__options">
                <button
                  className="watchlist-status-prompt__option"
                  onClick={handleKeepLowerPriority}
                  disabled={loading}
                >
                  <div className="watchlist-status-prompt__option-icon">
                    <Star size={24} />
                  </div>
                  <div className="watchlist-status-prompt__option-content">
                    <strong>Keep it, lower priority</strong>
                    <span>I still want to watch it someday</span>
                  </div>
                </button>

                <button
                  className="watchlist-status-prompt__option"
                  onClick={onClose}
                  disabled={loading}
                >
                  <div className="watchlist-status-prompt__option-icon">
                    <Clock size={24} />
                  </div>
                  <div className="watchlist-status-prompt__option-content">
                    <strong>Keep it as is</strong>
                    <span>I'll watch it soon</span>
                  </div>
                </button>

                <button
                  className="watchlist-status-prompt__option watchlist-status-prompt__option--danger"
                  onClick={handleRemove}
                  disabled={loading}
                >
                  <div className="watchlist-status-prompt__option-icon">
                    <Trash2 size={24} />
                  </div>
                  <div className="watchlist-status-prompt__option-content">
                    <strong>Remove it</strong>
                    <span>I'm not interested anymore</span>
                  </div>
                </button>
              </div>

              <button
                className="watchlist-status-prompt__button watchlist-status-prompt__button--text"
                onClick={() => setStep('question')}
                disabled={loading}
              >
                Go Back
              </button>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="watchlist-status-prompt__success">
              <div className="watchlist-status-prompt__success-icon">
                ✅
              </div>
              <h3 className="watchlist-status-prompt__success-title">
                Thanks for the update!
              </h3>
              <p className="watchlist-status-prompt__success-description">
                We'll use this to improve your recommendations
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/**
 * Batch prompt for multiple stale watchlist items
 * Shows one at a time in sequence
 */
export function BatchWatchlistStatusPrompt({
  entries,
  onClose,
  onBatchComplete
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)

  const currentEntry = entries[currentIndex]
  const hasMore = currentIndex < entries.length - 1

  const handleStatusUpdated = () => {
    setCompletedCount(prev => prev + 1)

    if (hasMore) {
      // Move to next entry
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
      }, 1500)
    } else {
      // All done
      setTimeout(() => {
        onBatchComplete?.(completedCount + 1)
        onClose()
      }, 2000)
    }
  }

  if (!currentEntry) return null

  return (
    <div className="batch-watchlist-status-prompt">
      {/* Progress indicator */}
      <div className="batch-watchlist-status-prompt__progress">
        <span>
          {currentIndex + 1} of {entries.length}
        </span>
        <div className="batch-watchlist-status-prompt__progress-bar">
          <div 
            className="batch-watchlist-status-prompt__progress-fill"
            style={{ width: `${((currentIndex + 1) / entries.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current prompt */}
      <WatchlistStatusPrompt
        entry={currentEntry}
        onClose={onClose}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  )
}
