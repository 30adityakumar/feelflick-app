// src/features/movie-v2/hooks/useUserRating.js
//
// Loads + persists the current user's rating + review + reaction for THIS film.
// Returns a hook value that mirrors a controlled form:
//   { stars, reviewText, reaction, setStars, setReviewText, setReaction,
//     saveStatus, hydrated }
//
// Persistence:
//   • Stars + reviewText: upsert to user_ratings keyed by (user_id, movie_id).
//     Display stars are 1-5, doubled to the canonical 1-10 user_ratings.rating.
//     Deleting both (stars=0 + empty text) removes the row.
//   • Reaction: append-only event log to user_movie_feedback (we read the
//     latest row on mount). Stored on the `sentiment` enum column. Clearing
//     the reaction inserts a 'neutral' row so the read path resolves back to
//     "no active reaction" the next time the page hydrates.
//   • Both writes are debounced together (600 ms) so a rapid click+type
//     batches into a single round-trip per stream.
//   • saveStatus exposes 'idle' | 'saving' | 'saved' | 'error' so the
//     section can render a quiet "Saved ✓" indicator after each write.

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

const DEBOUNCE_MS = 600

// Maps the UI reaction chips to sentiment_type enum values. Clearing a
// reaction maps to 'neutral' — represented as no-active-chip in the UI
// but lets the hydration query resolve to a known state.
export const REACTION_TO_SENTIMENT = {
  'Loved it':       'loved',
  'Liked it':       'liked',
  'Mixed':          'neutral',
  "Didn't connect": 'disliked',
}
const SENTIMENT_TO_REACTION = Object.fromEntries(
  Object.entries(REACTION_TO_SENTIMENT).map(([k, v]) => [v, k])
)

export function useUserRating({ userId, internalId }) {
  const [stars, setStarsState]           = useState(0)       // 1-5 display scale
  const [reviewText, setReviewTextState] = useState('')
  const [reaction, setReactionState]     = useState('')      // one of REACTION_TO_SENTIMENT keys
  const [saveStatus, setSaveStatus]      = useState('idle')  // idle|saving|saved|error
  const [hydrated, setHydrated]          = useState(false)

  const ratingDebounceRef    = useRef(null)
  const reactionDebounceRef  = useRef(null)
  const latestRef = useRef({ stars: 0, reviewText: '', reaction: '' })

  // Hydrate from DB on mount / when the (user, movie) pair changes.
  useEffect(() => {
    if (!userId || !internalId) {
      setHydrated(true)
      return
    }
    let abort = false
    ;(async () => {
      try {
        // Parallel: ratings + latest feedback for sentiment.
        const [ratingRes, feedbackRes] = await Promise.all([
          supabase
            .from('user_ratings')
            .select('rating, review_text')
            .eq('user_id', userId)
            .eq('movie_id', internalId)
            .maybeSingle(),
          supabase
            .from('user_movie_feedback')
            .select('sentiment, created_at')
            .eq('user_id', userId)
            .eq('movie_id', internalId)
            .not('sentiment', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ])
        if (abort) return
        if (ratingRes.error) throw ratingRes.error
        let nextStars = 0
        let nextText = ''
        if (ratingRes.data) {
          nextStars = ratingRes.data.rating != null ? Math.round(ratingRes.data.rating / 2) : 0
          nextText = ratingRes.data.review_text || ''
          setStarsState(nextStars)
          setReviewTextState(nextText)
        }
        let nextReaction = ''
        if (feedbackRes.data?.sentiment) {
          nextReaction = SENTIMENT_TO_REACTION[feedbackRes.data.sentiment] || ''
          // 'neutral' is the cleared-reaction sentinel — don't surface it as
          // an active chip in the UI.
          if (feedbackRes.data.sentiment === 'neutral') nextReaction = ''
          setReactionState(nextReaction)
        }
        latestRef.current = { stars: nextStars, reviewText: nextText, reaction: nextReaction }
      } catch (err) {
        console.warn('[useUserRating.load]', err)
      } finally {
        if (!abort) setHydrated(true)
      }
    })()
    return () => { abort = true }
  }, [userId, internalId])

  const persistRating = useCallback(async (nextStars, nextReview) => {
    if (!userId || !internalId) return
    setSaveStatus('saving')
    try {
      // user_ratings.rating is the 1-10 canonical scale. Sending null when
      // stars==0 lets users remove a rating by clicking the same star twice
      // without losing the review text.
      const rating = nextStars > 0 ? nextStars * 2 : null
      const trimmed = (nextReview || '').trim() || null
      if (rating == null && !trimmed) {
        // Nothing to persist — delete the row so we don't leave a ghost
        // record in user_ratings with both fields null.
        await supabase
          .from('user_ratings')
          .delete()
          .eq('user_id', userId)
          .eq('movie_id', internalId)
      } else {
        await supabase
          .from('user_ratings')
          .upsert({
            user_id: userId,
            movie_id: internalId,
            rating,
            review_text: trimmed,
            rated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,movie_id' })
      }
      setSaveStatus('saved')
      // Auto-clear the "Saved ✓" pip after a short beat.
      setTimeout(() => setSaveStatus((s) => (s === 'saved' ? 'idle' : s)), 1600)
    } catch (err) {
      console.warn('[useUserRating.persistRating]', err)
      setSaveStatus('error')
    }
  }, [userId, internalId])

  const persistReaction = useCallback(async (nextReaction) => {
    if (!userId || !internalId) return
    setSaveStatus('saving')
    try {
      const sentiment = nextReaction ? REACTION_TO_SENTIMENT[nextReaction] : 'neutral'
      // Append-only — each chip click logs a new feedback row. Hydration
      // reads the latest, so the most-recent value wins.
      await supabase.from('user_movie_feedback').insert({
        user_id: userId,
        movie_id: internalId,
        sentiment,
        feedback_type: 'sentiment',
        placement: 'movie_detail_v2_your_take',
        watched_confirmed: true,
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus((s) => (s === 'saved' ? 'idle' : s)), 1600)
    } catch (err) {
      console.warn('[useUserRating.persistReaction]', err)
      setSaveStatus('error')
    }
  }, [userId, internalId])

  const scheduleRatingSave = useCallback((nextStars, nextReview) => {
    if (ratingDebounceRef.current) clearTimeout(ratingDebounceRef.current)
    ratingDebounceRef.current = setTimeout(() => {
      persistRating(nextStars, nextReview)
    }, DEBOUNCE_MS)
  }, [persistRating])

  const scheduleReactionSave = useCallback((nextReaction) => {
    if (reactionDebounceRef.current) clearTimeout(reactionDebounceRef.current)
    reactionDebounceRef.current = setTimeout(() => {
      persistReaction(nextReaction)
    }, DEBOUNCE_MS)
  }, [persistReaction])

  const setStars = useCallback((next) => {
    setStarsState(next)
    latestRef.current.stars = next
    scheduleRatingSave(next, latestRef.current.reviewText)
  }, [scheduleRatingSave])

  const setReviewText = useCallback((next) => {
    setReviewTextState(next)
    latestRef.current.reviewText = next
    scheduleRatingSave(latestRef.current.stars, next)
  }, [scheduleRatingSave])

  const setReaction = useCallback((next) => {
    setReactionState(next)
    latestRef.current.reaction = next
    scheduleReactionSave(next)
  }, [scheduleReactionSave])

  // Flush pending debounce on unmount so a quick rate-and-navigate doesn't
  // lose the user's input.
  useEffect(() => {
    return () => {
      if (ratingDebounceRef.current) {
        clearTimeout(ratingDebounceRef.current)
        persistRating(latestRef.current.stars, latestRef.current.reviewText)
      }
      if (reactionDebounceRef.current) {
        clearTimeout(reactionDebounceRef.current)
        persistReaction(latestRef.current.reaction)
      }
    }
  }, [persistRating, persistReaction])

  return {
    stars, reviewText, reaction,
    setStars, setReviewText, setReaction,
    saveStatus, hydrated,
  }
}
