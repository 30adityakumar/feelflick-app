// src/features/preferences-v2/usePreferencesData.jsx
// FeelFlick — Preferences v2 ("The dials") data layer.
//
// Persistence model:
//   • Drawn-to genres → user_preferences (user_id, genre_id, excluded=false).
//     Engine + /home gating read this table via .select('genre_id') — they
//     ignore the `excluded` flag entirely, so we don't write avoid rows here
//     (would cause the engine to treat avoided genres as PREFERRED).
//   • Avoid genres → user_settings.settings.prefs.avoidGenres (label array).
//     Discover engine reads this; this is the only place anything checks
//     "did the user say avoid".
//   • Everything else (mood weights, directors trusted/muted, runtime band,
//     daypart, subscriptions, boundaries, display knobs) → settings.prefs.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'

const PrefsContext = createContext(null)

// === Static catalogs ===================================================

export const MOODS = [
  { id: 'tense',       label: 'Tense',       hex: '#EF4444' },
  { id: 'tender',      label: 'Tender',      hex: '#F472B6' },
  { id: 'slow-burn',   label: 'Slow-burn',   hex: '#A78BFA' },
  { id: 'cerebral',    label: 'Cerebral',    hex: '#7DD3FC' },
  { id: 'bittersweet', label: 'Bittersweet', hex: '#F472B6' },
  { id: 'cozy',        label: 'Cozy',        hex: '#FBBF24' },
  { id: 'dark-comic',  label: 'Dark-comic',  hex: '#34D399' },
  { id: 'hopeful',     label: 'Hopeful',     hex: '#34D399' },
  { id: 'mythic',      label: 'Mythic',      hex: '#0EA5E9' },
]

// TMDB genre catalog — must match the IDs the engine + v1 /preferences use.
export const GENRES = [
  { id: 28,    label: 'Action' },
  { id: 12,    label: 'Adventure' },
  { id: 16,    label: 'Animation' },
  { id: 35,    label: 'Comedy' },
  { id: 80,    label: 'Crime' },
  { id: 99,    label: 'Documentary' },
  { id: 18,    label: 'Drama' },
  { id: 10751, label: 'Family' },
  { id: 14,    label: 'Fantasy' },
  { id: 36,    label: 'History' },
  { id: 27,    label: 'Horror' },
  { id: 10402, label: 'Music' },
  { id: 9648,  label: 'Mystery' },
  { id: 10749, label: 'Romance' },
  { id: 878,   label: 'Sci-Fi' },
  { id: 53,    label: 'Thriller' },
]

const GENRE_LABEL_BY_ID = new Map(GENRES.map(g => [g.id, g.label]))
const GENRE_ID_BY_LABEL = new Map(GENRES.map(g => [g.label.toLowerCase(), g.id]))

export const STREAMERS = [
  { id: 'netflix',  name: 'Netflix',     logo: 'N', tint: '#e50914' },
  { id: 'max',      name: 'Max',         logo: 'M', tint: '#0046ff' },
  { id: 'hulu',     name: 'Hulu',        logo: 'H', tint: '#1ce783' },
  { id: 'amazon',   name: 'Prime Video', logo: 'P', tint: '#00a8e1' },
  { id: 'apple',    name: 'Apple TV+',   logo: 'A', tint: '#ffffff' },
  { id: 'crite',    name: 'Criterion',   logo: 'C', tint: '#ffd700' },
  { id: 'mubi',     name: 'MUBI',        logo: 'M', tint: '#ffffff' },
  { id: 'disney',   name: 'Disney+',     logo: 'D', tint: '#0072d2' },
]

export const DAYPARTS = [
  { id: 'morning',   label: 'Morning'   },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening',   label: 'Evening'   },
  { id: 'late',      label: 'Late'      },
]

export const BOUNDARIES = [
  { id: 'graphic', label: 'Graphic violence',         desc: 'Filter explicit / gore content.' },
  { id: 'sexual',  label: 'Explicit sexual content',  desc: 'Filter NC-17 / unrated explicit.' },
  { id: 'animals', label: 'Harm to animals',          desc: 'Flag depictions in films.' },
  { id: 'noise',   label: 'Sensory-heavy films',      desc: 'Flicker, jump-cuts, strobe.' },
]

// Display-side knobs (formerly under /account → "Engine preferences").
// They steer how content is presented, not what gets recommended, but they
// belong here so a single page owns every "how I want films delivered to me"
// setting.
export const LANGUAGES = [
  'English', 'Korean', 'Japanese', 'French', 'Spanish', 'Italian',
  'German', 'Mandarin', 'Cantonese', 'Hindi', 'Portuguese', 'Russian',
  'Arabic', 'Turkish', 'Persian', 'Swedish', 'Danish', 'Norwegian',
  'Polish', 'Dutch', 'Thai', 'Vietnamese',
]

export const SUBTITLE_MODES = [
  { v: 'never',          l: 'Never' },
  { v: 'sometimes',      l: 'Sometimes' },
  { v: 'always-welcome', l: 'Always welcome' },
]

export const SPOILER_TIERS = [
  { v: 'brief',    l: 'Brief' },
  { v: 'standard', l: 'Standard' },
  { v: 'detailed', l: 'Detailed' },
]

// === Default shape =====================================================

const DEFAULT_DRAFT = {
  moodWeights: Object.fromEntries(MOODS.map(m => [m.id, 0.5])),
  drawnGenreIds: [],
  avoidGenreIds: [],
  trustedDirectors: [],
  mutedDirectors: [],
  runtimeFloor: 90,
  runtimeCap: 180,
  daypart: { morning: false, afternoon: false, evening: true, late: false },
  subscriptions: {},
  boundaries: { graphic: false, sexual: false, animals: false, noise: false },
  // Display knobs (migrated from /account EnginePrefs)
  subtitles: 'always-welcome',
  spoilerTier: 'brief',
  languages: ['English'],
}

function buildInitialDraft(settingsPrefs, prefRows) {
  const p = settingsPrefs || {}
  const drawn = []
  const legacyAvoid = []
  for (const r of prefRows || []) {
    if (r.excluded) legacyAvoid.push(r.genre_id)
    else drawn.push(r.genre_id)
  }
  // Avoid is sourced from settings.prefs.avoidGenres (the canonical store the
  // Discover engine reads). For pre-fix users we union in any legacy
  // user_preferences.excluded=true rows so we don't lose their data — the
  // next save normalises them out of user_preferences.
  const avoidFromSettings = Array.isArray(p.avoidGenres)
    ? p.avoidGenres.map(genreIdOf).filter(Boolean)
    : []
  const avoid = Array.from(new Set([...avoidFromSettings, ...legacyAvoid]))
  // If a genre ended up in both drawn and avoid (data corruption), avoid wins.
  const avoidSet = new Set(avoid)
  const drawnDeduped = drawn.filter(id => !avoidSet.has(id))
  return {
    moodWeights: { ...DEFAULT_DRAFT.moodWeights, ...(p.moodWeights || {}) },
    drawnGenreIds: drawnDeduped,
    avoidGenreIds: avoid,
    trustedDirectors: Array.isArray(p.trustedDirectors) ? p.trustedDirectors : [],
    mutedDirectors:   Array.isArray(p.mutedDirectors)   ? p.mutedDirectors   : [],
    runtimeFloor: typeof p.runtimeFloor === 'number' ? p.runtimeFloor : DEFAULT_DRAFT.runtimeFloor,
    runtimeCap:   typeof p.runtimeCap === 'number'   ? p.runtimeCap   : DEFAULT_DRAFT.runtimeCap,
    daypart: { ...DEFAULT_DRAFT.daypart, ...(p.daypart || {}) },
    subscriptions: { ...DEFAULT_DRAFT.subscriptions, ...(p.subscriptions || {}) },
    boundaries: { ...DEFAULT_DRAFT.boundaries, ...(p.boundaries || {}) },
    subtitles:   typeof p.subtitles   === 'string' ? p.subtitles   : DEFAULT_DRAFT.subtitles,
    spoilerTier: typeof p.spoilerTier === 'string' ? p.spoilerTier : DEFAULT_DRAFT.spoilerTier,
    languages:   Array.isArray(p.languages) && p.languages.length ? p.languages : DEFAULT_DRAFT.languages,
  }
}

// === Helpers ===========================================================

export function genreLabelOf(id) { return GENRE_LABEL_BY_ID.get(id) || `Genre ${id}` }
export function genreIdOf(label) { return GENRE_ID_BY_LABEL.get((label || '').toLowerCase()) || null }

// Deep-stable JSON. Sorts keys at every nesting level so dirty comparison
// ignores insertion-order differences. (Passing an array replacer to
// JSON.stringify acts as a key whitelist at all levels — that's the wrong
// tool for this job.)
function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']'
  const keys = Object.keys(value).sort()
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}'
}

// === Provider ==========================================================

export function PreferencesDataProvider({ children }) {
  const { user } = useAuthSession()
  const userId = user?.id

  const [baseline, setBaseline] = useState(DEFAULT_DRAFT)
  const [draft, setDraft] = useState(DEFAULT_DRAFT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null) // for toast / dot

  // Watch-history-derived director suggestions (so "+ Director" picker is real)
  const [directorSuggestions, setDirectorSuggestions] = useState([])

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    let abort = false
    setLoading(true)
    ;(async () => {
      try {
        const [settingsRes, prefsRes, historyRes] = await Promise.all([
          supabase.from('user_settings').select('settings').eq('user_id', userId).maybeSingle(),
          supabase.from('user_preferences').select('genre_id, excluded').eq('user_id', userId),
          supabase
            .from('user_history')
            .select('movies!inner(director_name)')
            .eq('user_id', userId)
            .limit(120),
        ])
        if (abort) return

        const initial = buildInitialDraft(settingsRes.data?.settings?.prefs, prefsRes.data)
        setBaseline(initial)
        setDraft(initial)

        // Top directors from your own history → suggestion pool for the picker
        const counts = new Map()
        for (const h of historyRes.data || []) {
          const d = h.movies?.director_name
          if (d) counts.set(d, (counts.get(d) || 0) + 1)
        }
        const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([d]) => d)
        setDirectorSuggestions(top)
      } catch (e) {
        console.error('[usePreferencesData.load]', e)
      } finally {
        if (!abort) setLoading(false)
      }
    })()
    return () => { abort = true }
  }, [userId])

  // === Draft mutations (don't persist) ===
  const update = useCallback((patch) => setDraft(d => ({ ...d, ...patch })), [])
  const setMoodWeight   = useCallback((id, w) => setDraft(d => ({ ...d, moodWeights: { ...d.moodWeights, [id]: w } })), [])
  const addDrawnGenre   = useCallback((id) => setDraft(d => d.drawnGenreIds.includes(id) || d.avoidGenreIds.includes(id) ? d : ({ ...d, drawnGenreIds: [...d.drawnGenreIds, id] })), [])
  const removeDrawnGenre = useCallback((id) => setDraft(d => ({ ...d, drawnGenreIds: d.drawnGenreIds.filter(x => x !== id) })), [])
  const addAvoidGenre   = useCallback((id) => setDraft(d => d.avoidGenreIds.includes(id) || d.drawnGenreIds.includes(id) ? d : ({ ...d, avoidGenreIds: [...d.avoidGenreIds, id] })), [])
  const removeAvoidGenre = useCallback((id) => setDraft(d => ({ ...d, avoidGenreIds: d.avoidGenreIds.filter(x => x !== id) })), [])
  const addTrustedDirector = useCallback((name) => {
    const n = (name || '').trim()
    if (!n) return
    setDraft(d => d.trustedDirectors.includes(n) || d.mutedDirectors.includes(n) ? d : ({ ...d, trustedDirectors: [...d.trustedDirectors, n] }))
  }, [])
  const removeTrustedDirector = useCallback((name) => setDraft(d => ({ ...d, trustedDirectors: d.trustedDirectors.filter(x => x !== name) })), [])
  const addMutedDirector = useCallback((name) => {
    const n = (name || '').trim()
    if (!n) return
    setDraft(d => d.mutedDirectors.includes(n) || d.trustedDirectors.includes(n) ? d : ({ ...d, mutedDirectors: [...d.mutedDirectors, n] }))
  }, [])
  const removeMutedDirector = useCallback((name) => setDraft(d => ({ ...d, mutedDirectors: d.mutedDirectors.filter(x => x !== name) })), [])
  const setRuntimeFloor = useCallback((n) => setDraft(d => ({ ...d, runtimeFloor: Math.min(d.runtimeCap, n) })), [])
  const setRuntimeCap   = useCallback((n) => setDraft(d => ({ ...d, runtimeCap: Math.max(d.runtimeFloor, n) })), [])
  const toggleDaypart = useCallback((id) => setDraft(d => ({ ...d, daypart: { ...d.daypart, [id]: !d.daypart[id] } })), [])
  const toggleSubscription = useCallback((id) => setDraft(d => ({ ...d, subscriptions: { ...d.subscriptions, [id]: !d.subscriptions[id] } })), [])
  const toggleBoundary = useCallback((id) => setDraft(d => ({ ...d, boundaries: { ...d.boundaries, [id]: !d.boundaries[id] } })), [])
  const setSubtitles   = useCallback((v) => setDraft(d => ({ ...d, subtitles: v })), [])
  const setSpoilerTier = useCallback((v) => setDraft(d => ({ ...d, spoilerTier: v })), [])
  const addLanguage    = useCallback((name) => {
    const n = (name || '').trim()
    if (!n) return
    setDraft(d => d.languages.includes(n) ? d : ({ ...d, languages: [...d.languages, n] }))
  }, [])
  const removeLanguage = useCallback((name) => setDraft(d => ({ ...d, languages: d.languages.filter(x => x !== name) })), [])

  const discard = useCallback(() => setDraft(baseline), [baseline])

  const dirty = useMemo(() => stableStringify(draft) !== stableStringify(baseline), [draft, baseline])

  // === Save (writes to user_preferences + user_settings.settings.prefs) ===
  const save = useCallback(async () => {
    if (!userId || !dirty || saving) return
    setSaving(true)
    try {
      // 1) Replace drawn-to genre rows. We deliberately do NOT write avoid
      //    rows here — the engine selects only `genre_id` from this table
      //    and treats every row as PREFERRED. Avoid lives in
      //    settings.prefs.avoidGenres (written below), which is what the
      //    Discover engine actually reads.
      await supabase.from('user_preferences').delete().eq('user_id', userId)
      const rows = draft.drawnGenreIds.map(id => ({ user_id: userId, genre_id: id, excluded: false }))
      if (rows.length) {
        await supabase
          .from('user_preferences')
          .upsert(rows, { onConflict: 'user_id,genre_id' })
      }

      // 2) Merge our prefs into user_settings.settings.prefs without clobbering
      //    other keys (account-v2 may also write `notifications` / `privacy`).
      const { data: existing } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', userId)
        .maybeSingle()
      const existingSettings = existing?.settings || {}
      const existingPrefs = existingSettings.prefs || {}
      const nextSettings = {
        ...existingSettings,
        prefs: {
          ...existingPrefs,
          moodWeights: draft.moodWeights,
          trustedDirectors: draft.trustedDirectors,
          mutedDirectors: draft.mutedDirectors,
          runtimeFloor: draft.runtimeFloor,
          runtimeCap: draft.runtimeCap,
          daypart: draft.daypart,
          subscriptions: draft.subscriptions,
          boundaries: draft.boundaries,
          // Display knobs (migrated from /account EnginePrefs — same JSONB
          // path so any pre-existing values survive the move).
          subtitles: draft.subtitles,
          spoilerTier: draft.spoilerTier,
          languages: draft.languages,
          // Genre labels — kept in JSONB as a denormalised mirror of
          // user_preferences (which is what the engine actually reads).
          drawnGenres: draft.drawnGenreIds.map(genreLabelOf),
          avoidGenres: draft.avoidGenreIds.map(genreLabelOf),
        },
      }

      await supabase
        .from('user_settings')
        .upsert({ user_id: userId, settings: nextSettings }, { onConflict: 'user_id' })

      // Invalidate the cached recommendation profile so the engine picks up
      // the just-saved prefs on the next surface visit (computeUserProfile
      // gates on user_profiles_computed.computed_at — null forces recompute).
      // Best-effort; failure doesn't block the save itself.
      try {
        await supabase
          .from('user_profiles_computed')
          .update({ computed_at: null })
          .eq('user_id', userId)
      } catch (e) {
        console.warn('[usePreferencesData.save] profile cache invalidate failed:', e)
      }

      setBaseline(draft)
      setSavedAt(Date.now())
    } catch (e) {
      console.error('[usePreferencesData.save]', e)
    } finally {
      setSaving(false)
    }
  }, [userId, dirty, saving, draft])

  const value = useMemo(() => ({
    loading, saving, savedAt, dirty,
    draft, baseline,
    directorSuggestions,
    catalogs: { MOODS, GENRES, STREAMERS, DAYPARTS, BOUNDARIES, LANGUAGES, SUBTITLE_MODES, SPOILER_TIERS },
    // setters
    update, setMoodWeight,
    addDrawnGenre, removeDrawnGenre,
    addAvoidGenre, removeAvoidGenre,
    addTrustedDirector, removeTrustedDirector,
    addMutedDirector, removeMutedDirector,
    setRuntimeFloor, setRuntimeCap,
    toggleDaypart, toggleSubscription, toggleBoundary,
    setSubtitles, setSpoilerTier, addLanguage, removeLanguage,
    discard, save,
  }), [
    loading, saving, savedAt, dirty, draft, baseline, directorSuggestions,
    update, setMoodWeight,
    addDrawnGenre, removeDrawnGenre, addAvoidGenre, removeAvoidGenre,
    addTrustedDirector, removeTrustedDirector,
    addMutedDirector, removeMutedDirector,
    setRuntimeFloor, setRuntimeCap,
    toggleDaypart, toggleSubscription, toggleBoundary,
    setSubtitles, setSpoilerTier, addLanguage, removeLanguage,
    discard, save,
  ])

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
}

export function usePreferencesData() {
  const ctx = useContext(PrefsContext)
  if (!ctx) throw new Error('usePreferencesData must be inside PreferencesDataProvider')
  return ctx
}
