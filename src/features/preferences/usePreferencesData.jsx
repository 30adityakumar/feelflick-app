// src/features/preferences/usePreferencesData.jsx
// Preferences data provider — the single load + transactional-save authority.
//
//   • Load checks every resolved Supabase .error. A critical read failure
//     (user_settings or user_preferences) yields status='load_error' and does
//     NOT build an editable baseline from defaults (so a failed load can never
//     overwrite real saved preferences on the next Save). An optional director-
//     suggestion failure degrades to status='degraded' (page renders, no
//     suggestions).
//   • Save calls the owner-scoped transactional RPC save_user_preferences_v2
//     with the loaded settings.updated_at as an optimistic-concurrency token.
//     No direct client delete/upsert fallback exists.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { MOODS, GENRES, BOUNDARIES, LANGUAGES, SUBTITLE_MODES, SPOILER_TIERS, STREAMERS } from './data'
import { usePreferenceDraft } from './usePreferenceDraft'
import { buildInitialDraft, buildSavePayload } from './derive/preferencePresentation'
import { validateDraft } from './derive/preferenceValidation'

const PrefsContext = createContext(null)
const CATALOGS = { MOODS, GENRES, BOUNDARIES, LANGUAGES, SUBTITLE_MODES, SPOILER_TIERS, STREAMERS }

export function PreferencesDataProvider({ children }) {
  const { userId } = useAuthSession()
  const d = usePreferenceDraft()

  const [status, setStatus] = useState('loading')        // loading | ready | degraded | load_error
  const [saveStatus, setSaveStatus] = useState('idle')   // idle | saving | saved | save_error | conflict
  const [saveError, setSaveError] = useState('')
  const [savedAt, setSavedAt] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)       // concurrency token
  const [directorSuggestions, setDirectorSuggestions] = useState([])
  const [suggestionsUnavailable, setSuggestionsUnavailable] = useState(false)
  const [liveMessage, setLiveMessage] = useState('')

  const savingRef = useRef(false)
  const loadTokenRef = useRef(0)
  const userIdRef = useRef(userId)
  userIdRef.current = userId // always the latest authed user, for stale-completion guards

  const announce = useCallback((msg) => setLiveMessage(msg), [])

  const runLoad = useCallback(async () => {
    if (!userId) return
    const token = ++loadTokenRef.current
    setStatus('loading')
    setSaveStatus('idle')
    setSaveError('')
    const [settingsRes, prefsRes, historyRes] = await Promise.all([
      supabase.from('user_settings').select('settings, updated_at').eq('user_id', userId).maybeSingle(),
      supabase.from('user_preferences').select('genre_id, excluded').eq('user_id', userId),
      supabase.from('user_history').select('movies!inner(director_name)').eq('user_id', userId).limit(120),
    ])
    if (token !== loadTokenRef.current) return // stale (user switched / remounted)

    // Critical dependencies — a real error must never become editable defaults.
    if (settingsRes.error || prefsRes.error) {
      setStatus('load_error')
      return
    }
    const initial = buildInitialDraft(settingsRes.data?.settings?.prefs, prefsRes.data)
    d.resetTo(initial)
    setUpdatedAt(settingsRes.data?.updated_at ?? null)

    // Optional dependency — degrade gracefully.
    if (historyRes.error) {
      setDirectorSuggestions([])
      setSuggestionsUnavailable(true)
      setStatus('degraded')
      return
    }
    const counts = new Map()
    for (const h of historyRes.data || []) {
      const name = h.movies?.director_name
      if (name) counts.set(name, (counts.get(name) || 0) + 1)
    }
    setDirectorSuggestions([...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([n]) => n))
    setSuggestionsUnavailable(false)
    setStatus('ready')
  }, [userId, d])

  useEffect(() => {
    if (!userId) return
    // runLoad claims a fresh token; a later runLoad (e.g. after a user switch)
    // bumps the token so any in-flight load resolves stale and is ignored.
    runLoad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const save = useCallback(async () => {
    if (!userId || !d.dirty || savingRef.current) return
    const check = validateDraft(d.draft)
    if (!check.ok) {
      setSaveStatus('save_error')
      setSaveError('Could not save your preferences. Try again.')
      announce('Could not save your preferences. Try again.')
      return
    }
    savingRef.current = true
    setSaveStatus('saving')
    setSaveError('')
    const mine = userIdRef.current
    const snapshot = d.draft
    const { genreIds, patch } = buildSavePayload(snapshot)
    const { data, error } = await supabase.rpc('save_user_preferences_v2', {
      p_expected_updated_at: updatedAt,
      p_genre_ids: genreIds,
      p_prefs_patch: patch,
    })
    savingRef.current = false
    if (mine !== userIdRef.current) return // user switched mid-save — ignore stale completion

    if (error) {
      if (error.code === 'PT409') {
        setSaveStatus('conflict')
        announce('Your preferences changed in another tab or session.')
      } else {
        setSaveStatus('save_error')
        setSaveError('Could not save your preferences. Try again.')
        announce('Could not save your preferences. Try again.')
      }
      return // never update baseline on failure
    }
    d.commit(snapshot)
    setUpdatedAt(data?.updated_at ?? null)
    setSavedAt(Date.now())
    setSaveStatus('saved')
    announce('Preferences saved. Recommendations will update as surfaces refresh.')
  }, [userId, d, updatedAt, announce])

  const discard = useCallback(() => {
    d.discard()
    setSaveStatus('idle')
    setSaveError('')
    announce('Changes discarded.')
  }, [d, announce])

  const retry = useCallback(() => { runLoad() }, [runLoad])
  const reloadLatest = useCallback(() => { runLoad() }, [runLoad]) // conflict → re-fetch remote, replace draft
  const keepEditing = useCallback(() => setSaveStatus('idle'), [])

  const value = useMemo(() => ({
    status, saveStatus, saveError, savedAt, updatedAt,
    conflict: saveStatus === 'conflict',
    saving: saveStatus === 'saving',
    draft: d.draft, baseline: d.baseline, dirty: d.dirty,
    directorSuggestions, suggestionsUnavailable,
    liveMessage, announce,
    catalogs: CATALOGS,
    setMoodBand: d.setMoodBand,
    addDrawnGenre: d.addDrawnGenre, removeDrawnGenre: d.removeDrawnGenre,
    addAvoidGenre: d.addAvoidGenre, removeAvoidGenre: d.removeAvoidGenre,
    addTrustedDirector: d.addTrustedDirector, removeTrustedDirector: d.removeTrustedDirector,
    addMutedDirector: d.addMutedDirector, removeMutedDirector: d.removeMutedDirector,
    setRuntimeFloor: d.setRuntimeFloor, setRuntimeCap: d.setRuntimeCap,
    toggleBoundary: d.toggleBoundary, setSubtitles: d.setSubtitles, setSpoilerTier: d.setSpoilerTier,
    addLanguage: d.addLanguage, removeLanguage: d.removeLanguage,
    save, discard, retry, reloadLatest, keepEditing,
  }), [status, saveStatus, saveError, savedAt, updatedAt, d, directorSuggestions, suggestionsUnavailable, liveMessage, announce, save, discard, retry, reloadLatest, keepEditing])

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
}

export function usePreferencesData() {
  const ctx = useContext(PrefsContext)
  if (!ctx) throw new Error('usePreferencesData must be inside PreferencesDataProvider')
  return ctx
}
