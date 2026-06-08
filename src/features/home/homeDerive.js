// src/features/home/homeDerive.js
// F4.2 — pure Home derivation helpers, extracted (behavior-preserving) from
// useHomeData.jsx (onboarding mood ordering) and sections-top.jsx (daily seed,
// deterministic shuffle, queue construction). No React, no Supabase, no browser
// globals beyond Date (used by todaySeed). NO logic changed, NO dedup added.

// Onboarding's 6-key mood vocabulary → the Briefing's 6-key vocabulary.
// (Moved verbatim from useHomeData.jsx.)
export const ONBOARDING_MOOD_TO_BRIEFING = {
  cozy:   'cozy',
  wired:  'curious',
  tender: 'tender',
  fun:    'witty',
  tense:  'thrilled',
  mythic: 'curious',
}

// Order the Briefing mood keys so the user's onboarding-baseline moods appear
// first, falling back to the original order when there is no baseline. Mechanically
// equivalent to the inline block in useHomeData (called with availableMoodKeys =
// Object.keys(MOOD_BRIDGE), where `available.includes(k)` ⟺ the original
// `k in MOOD_BRIDGE`). Duplicate onboarding mappings are preserved exactly as today
// (NOT deduplicated) — that is an intentional behavior change deferred to a later
// product phase.
export function orderBriefingMoodKeys(baselineKeys, availableMoodKeys) {
  const baseline = Array.isArray(baselineKeys) ? baselineKeys : []
  const available = availableMoodKeys || []
  const baselineBriefingKeys = baseline
    .map(k => ONBOARDING_MOOD_TO_BRIEFING[k])
    .filter(Boolean)
  return [
    ...baselineBriefingKeys.filter(k => available.includes(k)),
    ...available.filter(k => !baselineBriefingKeys.includes(k)),
  ]
}

// Tiny seeded shuffle so each Reshuffle click reorders deterministically.
// (Moved verbatim from sections-top.jsx.)
export function shuffleBySeed(arr, seed) {
  if (!seed) return arr
  const out = arr.slice()
  let s = seed * 9301 + 49297
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// Daily seed: current UTC date as YYYYMMDD integer. Stable for a whole UTC day,
// changes at midnight UTC. (Moved verbatim from sections-top.jsx.)
export function todaySeed() {
  const d = new Date()
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate()
}

// The remaining Briefing queue for a mood — deterministic shuffle, then drop the
// skipped/watched ids. Mechanically equivalent to the inline expression in
// TheBriefing (`shuffleBySeed(moodEntry.films || [], effectiveSeed).filter(f =>
// !hiddenIds.has(f.id))`). Accepts hiddenIds as the live Set form (or any iterable);
// does not mutate the inputs and preserves film object identity + ordering.
export function buildBriefingQueue(films, seed, hiddenIds) {
  const shuffled = shuffleBySeed(films || [], seed)
  const hidden = hiddenIds instanceof Set ? hiddenIds : new Set(hiddenIds || [])
  return shuffled.filter(f => !hidden.has(f.id))
}
