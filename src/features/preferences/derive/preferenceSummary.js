// src/features/preferences/derive/preferenceSummary.js
// Pure derivation of the "At a glance" summary from real draft state.
// NEVER hard-coded; "Mood emphasis" / "Genres" / "Runtime" come from the user's
// own direct settings, and "FeelFlick learns from" is a separate, read-only
// statement of behavioural sources (not a per-source toggle).

import { MOODS, moodBandOf, genreLabelOf } from '../data'

const moodLabel = (id) => MOODS.find((m) => m.id === id)?.label || id

// Up to three moods the user has explicitly emphasized ("More"). Reduced ("Less")
// moods are not advertised here; if nothing is emphasized we say it's balanced.
export function deriveMoodSummary(draft) {
  const mw = draft?.moodWeights || {}
  const more = MOODS.map((m) => m.id).filter((id) => moodBandOf(mw[id]) === 'more')
  if (more.length === 0) return 'Balanced across moods'
  return 'More ' + more.slice(0, 3).map(moodLabel).join(' · ')
}

export function deriveGenreSummary(draft) {
  const d = draft?.drawnGenreIds?.length || 0
  const a = draft?.avoidGenreIds?.length || 0
  if (d === 0 && a === 0) return 'No direct genre rules'
  const parts = []
  if (d) parts.push(`${d} preferred`)
  if (a) parts.push(`${a} avoided`)
  return parts.join(' · ')
}

export function deriveRuntimeSummary(draft) {
  const f = draft?.runtimeFloor, c = draft?.runtimeCap
  if (!Number.isFinite(f) || !Number.isFinite(c)) return '—'
  return `${f}–${c} min`
}

// Read-only, informational. These are the sources the engine actually learns
// from; they are not individually disableable (yet).
export const LEARNING_SOURCES = ['Watched', 'Ratings', 'Saves', 'Skips']
export function deriveLearningSummary() { return LEARNING_SOURCES.join(' · ') }

export function deriveSummary(draft) {
  return {
    mood: deriveMoodSummary(draft),
    genres: deriveGenreSummary(draft),
    runtime: deriveRuntimeSummary(draft),
    learning: deriveLearningSummary(),
  }
}

// "You told us" items for the read-only recommendation-data dialog — derived
// from explicit settings only (never synthesized learned signals).
export function deriveToldUs(draft) {
  if (!draft) return []
  const items = []
  const more = MOODS.map((m) => m.id).filter((id) => moodBandOf(draft.moodWeights?.[id]) === 'more').map(moodLabel)
  const less = MOODS.map((m) => m.id).filter((id) => moodBandOf(draft.moodWeights?.[id]) === 'less').map(moodLabel)
  if (more.length) items.push({ key: 'mood-more', label: 'Emphasized moods', value: more.join(', '), focus: 'mood' })
  if (less.length) items.push({ key: 'mood-less', label: 'De-emphasized moods', value: less.join(', '), focus: 'mood' })
  if (draft.drawnGenreIds?.length) items.push({ key: 'drawn', label: 'Preferred genres', value: draft.drawnGenreIds.map(genreLabelOf).join(', '), focus: 'genres' })
  if (draft.avoidGenreIds?.length) items.push({ key: 'avoid', label: 'Avoided genres', value: draft.avoidGenreIds.map(genreLabelOf).join(', '), focus: 'genres' })
  if (draft.trustedDirectors?.length) items.push({ key: 'trusted', label: 'Trusted directors', value: draft.trustedDirectors.join(', '), focus: 'directors' })
  if (draft.mutedDirectors?.length) items.push({ key: 'muted', label: 'Down-ranked directors', value: draft.mutedDirectors.join(', '), focus: 'directors' })
  items.push({ key: 'runtime', label: 'Runtime range', value: deriveRuntimeSummary(draft), focus: 'runtime' })
  const onBoundaries = (draft.boundaries ? Object.entries(draft.boundaries).filter(([, v]) => v).map(([k]) => k) : [])
  if (onBoundaries.length) items.push({ key: 'boundaries', label: 'Content boundaries', value: `${onBoundaries.length} active`, focus: 'boundaries' })
  return items
}
