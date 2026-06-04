// src/shared/services/recommendationOutcomes.js
/**
 * Recommendation OUTCOME ATTRIBUTION (Phase F8B).
 *
 * The bridge between a user action (save / mark-watched / open) and the
 * recommendation that surfaced the film. F8A found outcome capture was broken:
 * actions wrote to user_watchlist / user_history but never flipped the
 * recommendation_impressions outcome flags, so ~0.5% of impressions recorded a
 * watch. This module closes that loop WITHOUT changing scoring.
 *
 * Contract — "attribute only with real, recent recommendation context":
 *  - We attribute an action to the user's MOST-RECENT impression for that film
 *    (recommendation_impressions, the same table the engine's skip-signal model
 *    reads), via the canonical `updateImpression` writer.
 *  - We attribute ONLY when that impression is RECENT (within
 *    OUTCOME_ATTRIBUTION_WINDOW_HOURS). A film the user saves from search that
 *    was never recommended (no impression) — or was recommended weeks ago
 *    (stale) — is NOT attributed: the generic write to user_watchlist /
 *    user_history still happens, but no impression is falsely flagged.
 *  - Flags are booleans, so repeating an action is idempotent (no double count).
 *  - Fire-and-forget: never throws; returns a small result for tests/telemetry.
 *
 * Why a recency window instead of threading nav-state from every surface: the
 * impression itself IS the recommendation context. If the engine surfaced the
 * film to this user within the window, an action on it is a genuine conversion
 * regardless of which click path the user took to reach it; if it didn't, there
 * is nothing to attribute. This keeps the repair to one choke point and avoids
 * touching scoring, routes, or the schema.
 */

import { supabase } from '@/shared/lib/supabase/client'
import { updateImpression } from './recommendations'

/**
 * How recent the surfacing impression must be for an action to count as a
 * recommendation outcome. 72h aligns with the hero skip-cooldown window
 * (skipSignals.COOLDOWN_DAYS.hero = 3): a film "in play" for the user.
 */
export const OUTCOME_ATTRIBUTION_WINDOW_HOURS = 72

/** Actions `updateImpression` knows how to record as impression outcome flags. */
export const ATTRIBUTABLE_ACTIONS = new Set(['clicked', 'skipped', 'saved', 'watched'])

const MS_PER_HOUR = 3_600_000

/**
 * Attribute a user action to a recent recommendation impression, if one exists.
 *
 * @param {object} args
 * @param {string} args.userId
 * @param {number} args.movieId   - internal movie id (recommendation_impressions.movie_id)
 * @param {('clicked'|'skipped'|'saved'|'watched')} args.action
 * @param {number} [args.withinHours=OUTCOME_ATTRIBUTION_WINDOW_HOURS]
 * @returns {Promise<{ attributed: boolean, reason: string }>}
 *   reason ∈ {attributed, invalid-args, no-impression, stale-impression, error}
 */
export async function recordRecommendationOutcome({
  userId,
  movieId,
  action,
  withinHours = OUTCOME_ATTRIBUTION_WINDOW_HOURS,
} = {}) {
  try {
    if (!userId || movieId == null || !ATTRIBUTABLE_ACTIONS.has(action)) {
      return { attributed: false, reason: 'invalid-args' }
    }

    // Find the most-recent impression for (user, movie). This is the same row
    // `updateImpression` will write; we read shown_at first to gate on recency.
    const { data: impression } = await supabase
      .from('recommendation_impressions')
      .select('id, shown_at')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .order('shown_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!impression) return { attributed: false, reason: 'no-impression' }

    const ageHours = (Date.now() - new Date(impression.shown_at).getTime()) / MS_PER_HOUR
    if (!Number.isFinite(ageHours) || ageHours > withinHours) {
      return { attributed: false, reason: 'stale-impression' }
    }

    await updateImpression(userId, movieId, action)
    return { attributed: true, reason: 'attributed' }
  } catch {
    // Outcome attribution is best-effort instrumentation — never surface to UI.
    return { attributed: false, reason: 'error' }
  }
}
