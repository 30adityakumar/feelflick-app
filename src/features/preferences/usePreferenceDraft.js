// src/features/preferences/usePreferenceDraft.js
// The single draft/baseline authority. Holds the editable draft + the last
// persisted baseline, exposes intent-named setters, and computes dirty. Pure of
// any I/O — the provider wires load/save around it.

import { useCallback, useMemo, useState } from 'react'
import { MOOD_BAND_VALUE, MAX_GENRES, MAX_DIRECTORS, MAX_DIRECTOR_LEN, MAX_LANGUAGES, LANGUAGES } from './data'
import { DEFAULT_DRAFT, isDirty } from './derive/preferencePresentation'
import { clampRuntimeFloor, clampRuntimeCap } from './derive/preferenceValidation'

const norm = (s) => (s || '').trim().toLowerCase()

export function usePreferenceDraft() {
  const [baseline, setBaseline] = useState(DEFAULT_DRAFT)
  const [draft, setDraft] = useState(DEFAULT_DRAFT)

  const resetTo = useCallback((next) => { setBaseline(next); setDraft(next) }, [])
  const discard = useCallback(() => setDraft(baseline), [baseline])
  const commit = useCallback((saved) => setBaseline(saved), [])

  // Mood — three honest bands; only the changed mood is snapped.
  const setMoodBand = useCallback((id, band) => {
    const v = MOOD_BAND_VALUE[band]
    if (v == null) return
    setDraft((d) => ({ ...d, moodWeights: { ...d.moodWeights, [id]: v } }))
  }, [])

  // Genres — bounded, no cross-membership, no dup.
  const addDrawnGenre = useCallback((id) => setDraft((d) => (
    d.drawnGenreIds.includes(id) || d.avoidGenreIds.includes(id) || d.drawnGenreIds.length >= MAX_GENRES
      ? d : { ...d, drawnGenreIds: [...d.drawnGenreIds, id] }
  )), [])
  const removeDrawnGenre = useCallback((id) => setDraft((d) => ({ ...d, drawnGenreIds: d.drawnGenreIds.filter((x) => x !== id) })), [])
  const addAvoidGenre = useCallback((id) => setDraft((d) => (
    d.avoidGenreIds.includes(id) || d.drawnGenreIds.includes(id) || d.avoidGenreIds.length >= MAX_GENRES
      ? d : { ...d, avoidGenreIds: [...d.avoidGenreIds, id] }
  )), [])
  const removeAvoidGenre = useCallback((id) => setDraft((d) => ({ ...d, avoidGenreIds: d.avoidGenreIds.filter((x) => x !== id) })), [])

  // Directors — trim, length-limit, bounded, no normalized overlap, no dup.
  const addDirectorTo = useCallback((name, field, other) => {
    const n = (name || '').trim()
    if (!n || n.length > MAX_DIRECTOR_LEN) return
    setDraft((d) => {
      const exists = d[field].some((x) => norm(x) === norm(n)) || d[other].some((x) => norm(x) === norm(n))
      if (exists || d[field].length >= MAX_DIRECTORS) return d
      return { ...d, [field]: [...d[field], n] }
    })
  }, [])
  const addTrustedDirector = useCallback((name) => addDirectorTo(name, 'trustedDirectors', 'mutedDirectors'), [addDirectorTo])
  const removeTrustedDirector = useCallback((name) => setDraft((d) => ({ ...d, trustedDirectors: d.trustedDirectors.filter((x) => x !== name) })), [])
  const addMutedDirector = useCallback((name) => addDirectorTo(name, 'mutedDirectors', 'trustedDirectors'), [addDirectorTo])
  const removeMutedDirector = useCallback((name) => setDraft((d) => ({ ...d, mutedDirectors: d.mutedDirectors.filter((x) => x !== name) })), [])

  // Runtime — clamped, minimum 5-min gap enforced both directions.
  const setRuntimeFloor = useCallback((n) => setDraft((d) => ({ ...d, runtimeFloor: clampRuntimeFloor(n, d.runtimeCap) })), [])
  const setRuntimeCap = useCallback((n) => setDraft((d) => ({ ...d, runtimeCap: clampRuntimeCap(n, d.runtimeFloor) })), [])

  const toggleBoundary = useCallback((id) => setDraft((d) => ({ ...d, boundaries: { ...d.boundaries, [id]: !d.boundaries[id] } })), [])
  const setSubtitles = useCallback((v) => setDraft((d) => ({ ...d, subtitles: v })), [])
  const setSpoilerTier = useCallback((v) => setDraft((d) => ({ ...d, spoilerTier: v })), [])
  const addLanguage = useCallback((name) => setDraft((d) => (
    !LANGUAGES.includes(name) || d.languages.includes(name) || d.languages.length >= MAX_LANGUAGES
      ? d : { ...d, languages: [...d.languages, name] }
  )), [])
  const removeLanguage = useCallback((name) => setDraft((d) => ({ ...d, languages: d.languages.filter((x) => x !== name) })), [])

  const dirty = useMemo(() => isDirty(draft, baseline), [draft, baseline])

  return {
    draft, baseline, dirty,
    resetTo, discard, commit,
    setMoodBand,
    addDrawnGenre, removeDrawnGenre, addAvoidGenre, removeAvoidGenre,
    addTrustedDirector, removeTrustedDirector, addMutedDirector, removeMutedDirector,
    setRuntimeFloor, setRuntimeCap,
    toggleBoundary, setSubtitles, setSpoilerTier, addLanguage, removeLanguage,
  }
}
