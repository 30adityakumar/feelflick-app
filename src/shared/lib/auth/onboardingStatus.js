// Onboarding-status detection from Supabase auth metadata.
//
// WHY: this logic was duplicated — PostAuthGate checked 6 flags (+ camelCase, + a
// DB fallback) while OAuthCallback checked only 3. A user with `onboardingComplete`
// (camelCase) but not `onboarding_complete` would be routed to /onboarding by the
// callback, then bounced to /home by the gate — a redirect flicker. One source of
// truth removes that.

/** Coerce a loosely-typed onboarding flag (bool / 'true' / 1 / '1') to a boolean. */
export function isTruthyFlag(v) {
  return v === true || v === 'true' || v === 1 || v === '1'
}

/**
 * Derive onboarding status from a Supabase user's metadata (no DB round-trip).
 *
 * @param {object|null} user - Supabase auth user (merges app_metadata + user_metadata)
 * @returns {{ hasAny: boolean, isComplete: boolean }}
 *   - `hasAny`: any known onboarding flag is present (lets callers decide whether a
 *     DB fallback is worth a round-trip when metadata is silent).
 *   - `isComplete`: onboarding is marked complete.
 */
export function deriveOnboardingStatus(user) {
  const meta = { ...(user?.app_metadata ?? {}), ...(user?.user_metadata ?? {}) }

  const hasAny =
    meta.onboarding_complete !== undefined ||
    meta.onboardingComplete !== undefined ||
    meta.has_onboarded !== undefined ||
    meta.hasOnboarded !== undefined ||
    meta.onboarded !== undefined ||
    meta.onboarding_completed_at !== undefined

  const isComplete =
    isTruthyFlag(meta.onboarding_complete) ||
    isTruthyFlag(meta.onboardingComplete) ||
    isTruthyFlag(meta.has_onboarded) ||
    isTruthyFlag(meta.hasOnboarded) ||
    isTruthyFlag(meta.onboarded)

  return { hasAny, isComplete }
}
