// src/features/onboarding/draft.js
// User-scoped onboarding draft persistence (F2.23). The draft lets a mid-flow
// refresh restore selections — but it is keyed PER signed-in user so one account's
// in-progress moods/genres/films/ratings can never rehydrate into another account
// on a shared browser. The pre-F2.23 GLOBAL key (the leak source) is migrated once
// — adopted by the first signed-in user to mount, then deleted — and never read
// again. All access is best-effort (private-mode / quota safe).

const DRAFT_PREFIX = 'ff_onboarding_draft_v1_'
// The pre-F2.23 un-scoped key — every account shared it (the cross-account leak).
export const LEGACY_DRAFT_KEY = 'ff_onboarding_draft_v1'

/** localStorage key for a given user's onboarding draft. */
export function draftKey(userId) {
  return `${DRAFT_PREFIX}${userId}`
}

function safeGet(key) {
  try { return localStorage.getItem(key) } catch { return null }
}
function safeRemove(key) {
  try { localStorage.removeItem(key) } catch { /* private mode / quota — non-fatal */ }
}

/**
 * Load a user's onboarding draft. Reads the SCOPED key first; if it's absent,
 * adopts a legacy global draft ONCE for this user (then deletes the global key so
 * no future user can ever read it). Returns null on absence or malformed JSON.
 *
 * @param {string|null|undefined} userId
 * @returns {object|null}
 */
export function loadDraft(userId) {
  if (!userId) return null
  const key = draftKey(userId)
  let raw = safeGet(key)
  if (raw == null) {
    // One-time migration: a draft left under the old global key is adopted by the
    // first signed-in user to mount across the F2.23 upgrade, then the global key
    // is removed for good. Trade-off: on a shared browser the very first signer-in
    // after the deploy could adopt a stranger's single in-flight legacy draft —
    // a one-time, deploy-window-only edge, after which all drafts are user-scoped.
    const legacy = safeGet(LEGACY_DRAFT_KEY)
    if (legacy != null) {
      try { localStorage.setItem(key, legacy) } catch { /* non-fatal */ }
      safeRemove(LEGACY_DRAFT_KEY)
      raw = legacy
    }
  }
  if (raw == null) return null
  try {
    const draft = JSON.parse(raw)
    return draft && typeof draft === 'object' ? draft : null
  } catch {
    return null
  }
}

/** Persist a user's onboarding draft (carries a `version` stamp). Best-effort. */
export function saveDraft(userId, draft) {
  if (!userId) return
  try {
    localStorage.setItem(draftKey(userId), JSON.stringify({ version: 1, ...draft }))
  } catch { /* private mode / quota — flow still works, just no refresh persistence */ }
}

/** Remove a user's scoped draft AND the legacy global key (sign-out / completion). */
export function clearDraft(userId) {
  if (userId) safeRemove(draftKey(userId))
  safeRemove(LEGACY_DRAFT_KEY)
}
