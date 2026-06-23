// src/features/preferences/derive/preferencePresentation.js
// Pure transforms between the persisted shape and the editable draft, plus the
// RPC payload builder and the deep-stable dirty key.

import { MOOD_IDS, BOUNDARY_IDS, genreIdOf, genreLabelOf } from '../data'

export const DEFAULT_DRAFT = {
  moodWeights: Object.fromEntries(MOOD_IDS.map((id) => [id, 0.5])),
  drawnGenreIds: [],
  avoidGenreIds: [],
  trustedDirectors: [],
  mutedDirectors: [],
  runtimeFloor: 90,
  runtimeCap: 180,
  boundaries: { graphic: false, sexual: false, animals: false, noise: false },
  subtitles: 'always-welcome',
  spoilerTier: 'brief',
  languages: ['English'],
}

// Build the editable draft from settings.prefs + user_preferences rows.
// Mood weights are kept RAW (not snapped) so untouched values never change just
// by loading; the UI only snaps a mood when the user changes that mood.
export function buildInitialDraft(settingsPrefs, prefRows) {
  const p = settingsPrefs || {}
  const drawn = []
  const legacyAvoid = []
  for (const r of prefRows || []) {
    if (r.excluded) legacyAvoid.push(r.genre_id)
    else drawn.push(r.genre_id)
  }
  const avoidFromSettings = Array.isArray(p.avoidGenres) ? p.avoidGenres.map(genreIdOf).filter((x) => x != null) : []
  const avoid = Array.from(new Set([...avoidFromSettings, ...legacyAvoid]))
  const avoidSet = new Set(avoid)
  const drawnDeduped = Array.from(new Set(drawn.filter((id) => !avoidSet.has(id))))

  const moodWeights = { ...DEFAULT_DRAFT.moodWeights }
  if (p.moodWeights && typeof p.moodWeights === 'object') {
    for (const id of MOOD_IDS) {
      const v = p.moodWeights[id]
      if (typeof v === 'number' && Number.isFinite(v)) moodWeights[id] = Math.max(0, Math.min(1, v))
    }
  }
  const boundaries = { ...DEFAULT_DRAFT.boundaries }
  if (p.boundaries && typeof p.boundaries === 'object') {
    for (const id of BOUNDARY_IDS) boundaries[id] = !!p.boundaries[id]
  }
  return {
    moodWeights,
    drawnGenreIds: drawnDeduped,
    avoidGenreIds: avoid,
    trustedDirectors: Array.isArray(p.trustedDirectors) ? p.trustedDirectors.filter((s) => typeof s === 'string') : [],
    mutedDirectors: Array.isArray(p.mutedDirectors) ? p.mutedDirectors.filter((s) => typeof s === 'string') : [],
    runtimeFloor: typeof p.runtimeFloor === 'number' ? p.runtimeFloor : DEFAULT_DRAFT.runtimeFloor,
    runtimeCap: typeof p.runtimeCap === 'number' ? p.runtimeCap : DEFAULT_DRAFT.runtimeCap,
    boundaries,
    subtitles: typeof p.subtitles === 'string' ? p.subtitles : DEFAULT_DRAFT.subtitles,
    spoilerTier: typeof p.spoilerTier === 'string' ? p.spoilerTier : DEFAULT_DRAFT.spoilerTier,
    languages: Array.isArray(p.languages) && p.languages.length ? p.languages : DEFAULT_DRAFT.languages,
  }
}

// The validated prefs patch + preferred genre IDs sent to save_user_preferences_v2.
// Only the approved keys are included; daypart/subscriptions and any unknown keys
// are preserved server-side (the RPC merges this patch onto existing prefs).
export function buildSavePayload(draft) {
  return {
    genreIds: [...(draft.drawnGenreIds || [])],
    patch: {
      moodWeights: draft.moodWeights,
      avoidGenres: (draft.avoidGenreIds || []).map(genreLabelOf),
      trustedDirectors: draft.trustedDirectors || [],
      mutedDirectors: draft.mutedDirectors || [],
      runtimeFloor: draft.runtimeFloor,
      runtimeCap: draft.runtimeCap,
      boundaries: draft.boundaries,
      subtitles: draft.subtitles,
      spoilerTier: draft.spoilerTier,
      languages: draft.languages,
    },
  }
}

// Deep-stable JSON (recursively key-sorted) for order-insensitive dirty checks.
export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']'
  return '{' + Object.keys(value).sort().map((k) => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}'
}

export function isDirty(draft, baseline) {
  return stableStringify(draft) !== stableStringify(baseline)
}
