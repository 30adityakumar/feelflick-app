// src/features/movie/hooks/useUserRating.js
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
  const [loadError, setLoadError]        = useState(false)   // hydration read failed → don't show an editable form that could overwrite unknown data
  const [retryNonce, setRetryNonce]      = useState(0)        // bump to re-run hydration after a load error

  const ratingDebounceRef    = useRef(null)
  const reactionDebounceRef  = useRef(null)
  const latestRef = useRef({ stars: 0, reviewText: '', reaction: '' })

  // F5.4 write serialization. Each stream (rating, reaction) keeps ONE write in
  // flight at a time; rapid changes coalesce to the latest pending job (latest-
  // value-wins); a monotonic version guards against a stale completion overwriting
  // the status of a newer write. mountedRef makes every setState unmount-safe.
  const ratingWriteRef   = useRef({ inFlight: false, pending: null, version: 0 })
  const reactionWriteRef = useRef({ inFlight: false, pending: null, version: 0 })
  const savedClearTimerRef = useRef(null)
  const mountedRef = useRef(true)
  useEffect(() => () => { mountedRef.current = false }, [])

  const safeSetStatus = useCallback((next) => {
    if (mountedRef.current) setSaveStatus(next)
  }, [])
  const scheduleSavedClear = useCallback(() => {
    if (savedClearTimerRef.current) clearTimeout(savedClearTimerRef.current)
    savedClearTimerRef.current = setTimeout(
      () => safeSetStatus((s) => (s === 'saved' ? 'idle' : s)),
      1600,
    )
  }, [safeSetStatus])

  // Serialized runner: one in-flight write per stream, latest pending wins, stale
  // completions ignored. Only the latest settled write (no newer pending) drives the
  // saved/error status.
  const runSerial = useCallback(async (streamRef, job) => {
    const st = streamRef.current
    st.pending = job                 // latest-value-wins
    if (st.inFlight) return           // the active drain loop will pick it up
    while (st.pending) {
      const next = st.pending
      st.pending = null
      st.inFlight = true
      const myVersion = ++st.version
      safeSetStatus('saving')
      try {
        await next()
        if (st.version === myVersion && !st.pending) { safeSetStatus('saved'); scheduleSavedClear() }
      } catch (err) {
        console.warn('[useUserRating]', err)
        if (st.version === myVersion && !st.pending) safeSetStatus('error')
      } finally {
        st.inFlight = false
      }
    }
  }, [safeSetStatus, scheduleSavedClear])

  // Hydrate from DB on mount / when the (user, movie) pair changes.
  // On every pair change we FIRST reset the form to empty + cancel any pending
  // debounce and bump the write versions, so a stale completion from the previous
  // (user, movie) can never overwrite the new pair's status, and the previous
  // film's rating/note/reaction can never flash into the next film's form.
  useEffect(() => {
    // Reset to a clean, un-hydrated baseline for the new pair.
    if (ratingDebounceRef.current) { clearTimeout(ratingDebounceRef.current); ratingDebounceRef.current = null }
    if (reactionDebounceRef.current) { clearTimeout(reactionDebounceRef.current); reactionDebounceRef.current = null }
    ratingWriteRef.current.version++; ratingWriteRef.current.pending = null
    reactionWriteRef.current.version++; reactionWriteRef.current.pending = null
    setStarsState(0); setReviewTextState(''); setReactionState('')
    setSaveStatus('idle'); setLoadError(false); setHydrated(false)
    latestRef.current = { stars: 0, reviewText: '', reaction: '' }

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
        // Both reads are checked — a failed feedback read must NOT silently
        // resolve to "no reaction" (that could overwrite a real saved reaction).
        if (ratingRes.error) throw ratingRes.error
        if (feedbackRes.error) throw feedbackRes.error
        let nextStars = 0
        let nextText = ''
        if (ratingRes.data) {
          nextStars = ratingRes.data.rating != null ? ratingRes.data.rating : 0
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
        // Surface a load error so the UI can offer Retry instead of an editable
        // form that could overwrite unknown existing data.
        if (!abort) setLoadError(true)
      } finally {
        if (!abort) setHydrated(true)
      }
    })()
    return () => { abort = true }
  }, [userId, internalId, retryNonce])

  // Manual retry of hydration (used by the UI's load-error state).
  const retryHydrate = useCallback(() => setRetryNonce((n) => n + 1), [])

  // Pure DB writers — byte-identical payloads to before. They now THROW on a
  // Supabase error so the serial runner can surface a real 'error' status (the prior
  // code awaited without checking `error`, so write failures were never detected).
  const writeRating = useCallback(async (nextStars, nextReview) => {
    if (!userId || !internalId) return
    // user_ratings.rating is the 1-10 canonical scale. Sending null when stars==0
    // lets users remove a rating by clicking the same star twice without losing text.
    const rating = nextStars > 0 ? nextStars : null
    const trimmed = (nextReview || '').trim() || null
    if (rating == null && !trimmed) {
      // Nothing to persist — delete the row so we don't leave a ghost record.
      const { error } = await supabase
        .from('user_ratings')
        .delete()
        .eq('user_id', userId)
        .eq('movie_id', internalId)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('user_ratings')
        .upsert({
          user_id: userId,
          movie_id: internalId,
          rating,
          review_text: trimmed,
          rated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,movie_id' })
      if (error) throw error
    }
  }, [userId, internalId])

  const writeReaction = useCallback(async (nextReaction) => {
    if (!userId || !internalId) return
    const sentiment = nextReaction ? REACTION_TO_SENTIMENT[nextReaction] : 'neutral'
    // F6.10: UPSERT, not insert. user_movie_feedback has a UNIQUE (user_id, movie_id), so
    // a plain insert threw 23505 on a later reaction change (false "Could not save"). The
    // reaction is a single film-level reflection — upsert on the same conflict target the
    // rating write uses, so it creates the row when none exists and updates it otherwise,
    // latest-value-wins. Payload fields are unchanged. (No preliminary SELECT.)
    const { error } = await supabase.from('user_movie_feedback').upsert({
      user_id: userId,
      movie_id: internalId,
      sentiment,
      feedback_type: 'sentiment',
      placement: 'movie_detail_v2_your_take',
      watched_confirmed: true,
    }, { onConflict: 'user_id,movie_id' })
    if (error) throw error
  }, [userId, internalId])

  const scheduleRatingSave = useCallback(() => {
    if (ratingDebounceRef.current) clearTimeout(ratingDebounceRef.current)
    ratingDebounceRef.current = setTimeout(() => {
      // Read the LATEST values at fire time (latest-value-wins).
      runSerial(ratingWriteRef, () => writeRating(latestRef.current.stars, latestRef.current.reviewText))
    }, DEBOUNCE_MS)
  }, [runSerial, writeRating])

  const scheduleReactionSave = useCallback(() => {
    if (reactionDebounceRef.current) clearTimeout(reactionDebounceRef.current)
    reactionDebounceRef.current = setTimeout(() => {
      runSerial(reactionWriteRef, () => writeReaction(latestRef.current.reaction))
    }, DEBOUNCE_MS)
  }, [runSerial, writeReaction])

  const setStars = useCallback((next) => {
    setStarsState(next)
    latestRef.current.stars = next
    scheduleRatingSave()
  }, [scheduleRatingSave])

  const setReviewText = useCallback((next) => {
    setReviewTextState(next)
    latestRef.current.reviewText = next
    scheduleRatingSave()
  }, [scheduleRatingSave])

  const setReaction = useCallback((next) => {
    setReactionState(next)
    latestRef.current.reaction = next
    scheduleReactionSave()
  }, [scheduleReactionSave])

  // Flush a pending debounce on unmount (fire-and-forget) so a quick
  // rate-and-navigate doesn't lose input — and clear every timer so no state update
  // is scheduled after unmount. mountedRef already guards any in-flight status set.
  useEffect(() => {
    return () => {
      if (savedClearTimerRef.current) clearTimeout(savedClearTimerRef.current)
      if (ratingDebounceRef.current) {
        clearTimeout(ratingDebounceRef.current)
        writeRating(latestRef.current.stars, latestRef.current.reviewText).catch(() => {})
      }
      if (reactionDebounceRef.current) {
        clearTimeout(reactionDebounceRef.current)
        writeReaction(latestRef.current.reaction).catch(() => {})
      }
    }
  }, [writeRating, writeReaction])

  return {
    stars, reviewText, reaction,
    setStars, setReviewText, setReaction,
    saveStatus, hydrated, loadError, retryHydrate,
  }
}
