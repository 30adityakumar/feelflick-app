// src/features/account/useAccountData.jsx
// FeelFlick — Account data layer. Fetches the signed-in user, their `users` row, their
// `user_settings` JSONB (notifications + privacy), and any pending account-deletion request.
// Components consume via `useAccountData()`.
//
// Engine + display prefs live in /preferences ("The dials") and write to the same
// `user_settings.settings.prefs` JSONB — Account never owns that surface.
//
// Persistence model (replaces the old silent debounced upsert):
//   • Every setting mutation flows through `saveSection(key, value)`.
//   • Per-section state machine: idle → saving → saved → error (see `saveStatus`).
//   • Writes are read-modify-write so a concurrent /preferences write to `prefs`
//     (or any unknown top-level key) is never clobbered. Same-section writes are
//     serialised (a per-section loop) so rapid toggles can't race.
//   • Supabase `.error` is ALWAYS checked. On failure the section is rolled back to the
//     last server-confirmed value and `error` is exposed for an inline retry.
//   • Privacy/analytics never remains visually changed after a failed save; the PostHog
//     runtime opt-out is coordinated with the persisted result.
// Remaining limitation (documented): cross-TAB last-write-wins between this RMW read and its
// write — acceptable without a new RPC/migration.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { setAnalyticsOptOut } from '@/shared/services/analytics'
import { SETTINGS as DEFAULT_SETTINGS } from './data'

const AccountDataContext = createContext(null)
const SAVED_RESET_MS = 1800 // how long a section shows "saved" before returning to idle

const INITIAL = {
  authUser: null,
  profile: null,
  provider: null,
  serverSettings: null,
  pendingDeletion: null,
  loading: true,
  error: null,
  saveStatus: {}, // { [section]: 'idle'|'saving'|'saved'|'error' }
}

// /preferences owns `prefs` — never seed defaults for it (would clobber engine prefs).
const DEFAULT_SHAPE = { notifications: DEFAULT_SETTINGS.notifications, privacy: DEFAULT_SETTINGS.privacy }

export function mergeWithDefaults(serverShape) {
  const s = serverShape && typeof serverShape === 'object' ? serverShape : {}
  const savedById = new Map((Array.isArray(s.notifications) ? s.notifications : []).map((n) => [n.id, n]))
  const notifications = DEFAULT_SHAPE.notifications.map((def) => {
    const saved = savedById.get(def.id)
    return saved ? { ...def, enabled: !!saved.enabled } : def
  })
  return {
    notifications,
    prefs: s.prefs && typeof s.prefs === 'object' ? s.prefs : {},
    privacy: { ...DEFAULT_SHAPE.privacy, ...(s.privacy || {}) },
    // Preserve any unknown top-level keys verbatim so we never drop forward-written data.
    ...Object.fromEntries(Object.entries(s).filter(([k]) => !['notifications', 'prefs', 'privacy'].includes(k))),
  }
}

export function AccountDataProvider({ children }) {
  const { user: authUser } = useAuthSession()
  const [state, setState] = useState(INITIAL)
  const [nonce, setNonce] = useState(0)

  const userIdRef = useRef(null)
  userIdRef.current = authUser?.id || null
  const authUserRef = useRef(null)
  authUserRef.current = authUser
  const confirmedRef = useRef({})   // last server-confirmed value per section (rollback target)
  const pendingRef = useRef({})      // latest desired value awaiting write, per section
  const runningRef = useRef({})      // whether a write loop is running, per section
  const settingsRef = useRef(null)   // mirror of state.serverSettings for stable reads
  const savedTimers = useRef({})
  settingsRef.current = state.serverSettings

  useEffect(() => () => Object.values(savedTimers.current).forEach(clearTimeout), [])

  const refresh = useCallback(() => setNonce((n) => n + 1), [])

  const setSaveStatus = useCallback((key, status) => {
    setState((prev) => ({ ...prev, saveStatus: { ...prev.saveStatus, [key]: status } }))
    if (status === 'saved') {
      clearTimeout(savedTimers.current[key])
      savedTimers.current[key] = setTimeout(() => {
        setState((prev) => (prev.saveStatus[key] === 'saved' ? { ...prev, saveStatus: { ...prev.saveStatus, [key]: 'idle' } } : prev))
      }, SAVED_RESET_MS)
    }
  }, [])

  // Read-modify-write a single owned section, preserving prefs + unknown keys.
  const writeSection = useCallback(async (key, value) => {
    const uid = userIdRef.current
    if (!uid) throw new Error('no_user')
    const { data, error: readErr } = await supabase.from('user_settings').select('settings').eq('user_id', uid).maybeSingle()
    if (readErr) throw readErr
    const fresh = mergeWithDefaults(data?.settings)
    const merged = { ...fresh, [key]: value }
    const { error: writeErr } = await supabase.from('user_settings').upsert({ user_id: uid, settings: merged }, { onConflict: 'user_id' })
    if (writeErr) throw writeErr
  }, [])

  // Per-section serialised write loop. Coalesces rapid toggles to the latest value.
  const runLoop = useCallback((key, onSettle) => {
    if (runningRef.current[key]) return
    runningRef.current[key] = true
    ;(async () => {
      while (pendingRef.current[key] !== undefined) {
        const value = pendingRef.current[key]
        pendingRef.current[key] = undefined
        setSaveStatus(key, 'saving')
        try {
          await writeSection(key, value)
          confirmedRef.current[key] = value
          if (pendingRef.current[key] === undefined) setSaveStatus(key, 'saved')
          onSettle?.(true, value)
        } catch {
          // Roll the section back to the last server-confirmed value + surface error.
          const rollbackTo = confirmedRef.current[key]
          pendingRef.current[key] = undefined
          setState((prev) => ({ ...prev, serverSettings: { ...prev.serverSettings, [key]: rollbackTo }, saveStatus: { ...prev.saveStatus, [key]: 'error' } }))
          onSettle?.(false, rollbackTo)
          break
        }
      }
      runningRef.current[key] = false
    })()
  }, [writeSection, setSaveStatus])

  const saveSection = useCallback((key, value, onSettle) => {
    pendingRef.current[key] = value
    setState((prev) => ({ ...prev, serverSettings: { ...prev.serverSettings, [key]: value }, saveStatus: { ...prev.saveStatus, [key]: 'saving' } }))
    runLoop(key, onSettle)
  }, [runLoop])

  const updateNotifications = useCallback((nextItems) => saveSection('notifications', nextItems), [saveSection])

  // Privacy: analytics runtime is coordinated with the persisted result. Turning OFF stops
  // capture immediately (so nothing is captured mid-save); a failed save restores both the
  // stored/UI state AND the runtime PostHog state. Turning ON only opts in after success.
  const updatePrivacy = useCallback((patch) => {
    const key = Object.keys(patch)[0]
    const current = pendingRef.current.privacy || settingsRef.current?.privacy || DEFAULT_SHAPE.privacy
    const next = { ...current, [key]: patch[key] }
    const analyticsChanged = key === 'analytics'
    if (analyticsChanged && next.analytics === false) setAnalyticsOptOut(true) // stop capture during save
    saveSection('privacy', next, (ok) => {
      if (!analyticsChanged) return
      if (ok) setAnalyticsOptOut(!next.analytics)
      else setAnalyticsOptOut(!(confirmedRef.current.privacy?.analytics ?? true)) // restore runtime
    })
  }, [saveSection])

  const retrySection = useCallback((key) => {
    const last = pendingRef.current[key] ?? settingsRef.current?.[key]
    if (last !== undefined) saveSection(key, last)
  }, [saveSection])

  // === Deletion (7-day delayed) — RPCs throw on error so callers surface it. ===
  const requestDeletion = useCallback(async (reason = null) => {
    const { data, error } = await supabase.rpc('request_account_deletion', { p_reason: reason })
    if (error) throw error
    setState((prev) => ({ ...prev, pendingDeletion: data ? { scheduled_for: data.scheduled_for, requested_at: data.requested_at } : prev.pendingDeletion }))
    return data
  }, [])

  const cancelDeletion = useCallback(async () => {
    const { error } = await supabase.rpc('cancel_account_deletion')
    if (error) throw error
    setState((prev) => ({ ...prev, pendingDeletion: null }))
  }, [])

  // Re-fetch only when the user IDENTITY changes (or on refresh) — not on every upstream object
  // re-creation. The auth object itself is read through a ref so its identity churn can't loop us.
  const authUserId = authUser?.id || null
  useEffect(() => {
    const u = authUserRef.current
    if (!authUserId) { setState({ ...INITIAL, loading: false }); return undefined }
    let abort = false
    setState((s) => ({ ...s, loading: true, error: null }))
    ;(async () => {
      try {
        const [profileRes, settingsRes, deletionRes] = await Promise.all([
          supabase.from('users').select('id, name, email, avatar_url, signup_source, joined_at, onboarding_complete, last_active_at').eq('id', authUserId).maybeSingle(),
          supabase.from('user_settings').select('settings').eq('user_id', authUserId).maybeSingle(),
          supabase.from('account_deletion_requests').select('scheduled_for, requested_at').eq('user_id', authUserId).is('cancelled_at', null).maybeSingle(),
        ])
        if (abort) return
        const serverSettings = mergeWithDefaults(settingsRes.data?.settings)
        confirmedRef.current = { notifications: serverSettings.notifications, privacy: serverSettings.privacy }
        setState({
          authUser: u,
          profile: profileRes.data || null,
          provider: u?.app_metadata?.provider || 'email',
          serverSettings,
          pendingDeletion: deletionRes.data || null,
          loading: false,
          error: null,
          saveStatus: {},
        })
      } catch (e) {
        if (abort) return
        console.error('[useAccountData]', e)
        setState((s) => ({ ...s, loading: false, error: e?.message || 'Failed to load' }))
      }
    })()
    return () => { abort = true }
  }, [authUserId, nonce])

  const value = useMemo(
    () => ({ ...state, refresh, updateNotifications, updatePrivacy, retrySection, requestDeletion, cancelDeletion }),
    [state, refresh, updateNotifications, updatePrivacy, retrySection, requestDeletion, cancelDeletion],
  )
  return <AccountDataContext.Provider value={value}>{children}</AccountDataContext.Provider>
}

export function useAccountData() {
  const ctx = useContext(AccountDataContext)
  if (!ctx) throw new Error('useAccountData must be inside AccountDataProvider')
  return ctx
}
