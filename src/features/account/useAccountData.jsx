// src/features/account/useAccountData.jsx
// FeelFlick — Account v2 data layer. Fetches the signed-in user, their
// `users` row, derived stats, and their `user_settings` JSONB (notifications
// + privacy flags). Components consume via `useAccountData()`.
//
// Engine + display prefs live in /preferences ("The dials") and write to the
// same `user_settings.settings.prefs` JSONB — Account no longer owns that
// surface, so updateEnginePrefs has been removed.
//
// Every toggle writes through one of two setters — updateNotifications /
// updatePrivacy — which optimistically mutate the in-memory shape and
// debounce a single upsert into `user_settings` for the signed-in user.
// RLS keeps the row per-user; defaults from ./data.js fill in fields the
// user hasn't touched.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { getTasteFingerprint } from '@/shared/services/tasteCache'
import { computeDnaConfidence } from '@/shared/services/dnaConfidence'
import { SETTINGS as DEFAULT_SETTINGS } from './data'

const AccountDataContext = createContext(null)

const UPSERT_DEBOUNCE_MS = 350

const INITIAL = {
  authUser: null,
  profile: null,
  stats: null,
  provider: null,
  serverSettings: null,         // null while loading; object once loaded
  pendingDeletion: null,        // { scheduled_for, requested_at } or null
  loading: true,
  error: null,
  refresh: () => {},
  updateNotifications: () => {},
  updatePrivacy: () => {},
  requestDeletion: async () => {},
  cancelDeletion: async () => {},
}

// Stats are derived live from the user's actual rows — no fallbacks to
// users.total_movies_watched (which has been observed stale at 0 even when
// user_history has many rows). dnaConfidence reads the SHARED formula in
// @/shared/services/dnaConfidence so /account and /profile never disagree.
function deriveStats({ history, ratings, fingerprint }) {
  const filmsLogged = history.length
  const filmsRated = ratings.length
  const totalRuntime = history.reduce((s, h) => s + (h.movies?.runtime || 0), 0)
  const hoursWatched = Math.round(totalRuntime / 60)
  const distinctMoodTags = fingerprint?.topMoodTags?.length || 0
  const dnaConfidence = computeDnaConfidence({ filmsLogged, filmsRated, distinctMoodTags })
  return { filmsLogged, filmsRated, hoursWatched, dnaConfidence }
}

// Default shape used to backstop any keys the user hasn't set yet.
// `prefs` is intentionally pass-through (no defaults): /preferences-v2 owns
// that JSONB branch — seeding defaults here would clobber its values when
// /account writes a notifications/privacy change.
const DEFAULT_SHAPE = {
  notifications: DEFAULT_SETTINGS.notifications,
  privacy:       DEFAULT_SETTINGS.privacy,
}

function mergeWithDefaults(serverShape) {
  const s = serverShape && typeof serverShape === 'object' ? serverShape : {}
  // Notifications: SETTINGS.notifications is the canonical schema (defines
  // which channels exist + their label/desc/badge). The server row only
  // contributes per-channel `enabled` flags. Channels that disappear from
  // DEFAULT_SHAPE (e.g. trimmed during a refactor) are dropped automatically.
  const savedById = new Map((Array.isArray(s.notifications) ? s.notifications : []).map(n => [n.id, n]))
  const notifications = DEFAULT_SHAPE.notifications.map(def => {
    const saved = savedById.get(def.id)
    return saved ? { ...def, enabled: !!saved.enabled } : def
  })
  return {
    notifications,
    prefs:   s.prefs && typeof s.prefs === 'object' ? s.prefs : {},
    privacy: { ...DEFAULT_SHAPE.privacy, ...(s.privacy || {}) },
  }
}

export function AccountDataProvider({ children }) {
  const { user: authUser } = useAuthSession()
  const [state, setState] = useState(INITIAL)
  const [nonce, setNonce] = useState(0)

  // Debounced upsert state — single timer that flushes the latest settings.
  const pendingRef = useRef(null)        // latest settings shape awaiting flush
  const timerRef = useRef(null)
  const userIdRef = useRef(null)
  userIdRef.current = authUser?.id || null

  const flushUpsert = useCallback(async () => {
    if (!userIdRef.current || !pendingRef.current) return
    const payload = pendingRef.current
    pendingRef.current = null
    timerRef.current = null
    try {
      await supabase
        .from('user_settings')
        .upsert(
          { user_id: userIdRef.current, settings: payload },
          { onConflict: 'user_id' }
        )
    } catch (e) {
      console.warn('[user_settings upsert]', e)
    }
  }, [])

  const queueUpsert = useCallback((nextShape) => {
    pendingRef.current = nextShape
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(flushUpsert, UPSERT_DEBOUNCE_MS)
  }, [flushUpsert])

  // Flush on unmount so the last edit isn't lost.
  useEffect(() => () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      flushUpsert()
    }
  }, [flushUpsert])

  const refresh = useCallback(() => setNonce(n => n + 1), [])

  // Generic merger: takes a top-level key + patch and updates state + queues an upsert.
  const patchSection = useCallback((sectionKey, patch) => {
    setState(prev => {
      const baseline = prev.serverSettings || mergeWithDefaults(null)
      const nextSection = typeof patch === 'function'
        ? patch(baseline[sectionKey])
        : { ...baseline[sectionKey], ...patch }
      const nextShape = { ...baseline, [sectionKey]: nextSection }
      queueUpsert(nextShape)
      return { ...prev, serverSettings: nextShape }
    })
  }, [queueUpsert])

  const updateNotifications = useCallback((nextItems) => {
    setState(prev => {
      const baseline = prev.serverSettings || mergeWithDefaults(null)
      const nextShape = { ...baseline, notifications: nextItems }
      queueUpsert(nextShape)
      return { ...prev, serverSettings: nextShape }
    })
  }, [queueUpsert])

  const updatePrivacy = useCallback((patch) => patchSection('privacy', patch), [patchSection])

  // === Deletion (7-day delayed) ============================================
  // Wraps the request_/cancel_account_deletion RPCs and updates local state
  // optimistically so the DangerZone + AppShell banner reflect immediately.
  const requestDeletion = useCallback(async (reason = null) => {
    const { data, error } = await supabase.rpc('request_account_deletion', { p_reason: reason })
    if (error) throw error
    setState(prev => ({
      ...prev,
      pendingDeletion: data
        ? { scheduled_for: data.scheduled_for, requested_at: data.requested_at }
        : prev.pendingDeletion,
    }))
    return data
  }, [])

  const cancelDeletion = useCallback(async () => {
    const { error } = await supabase.rpc('cancel_account_deletion')
    if (error) throw error
    setState(prev => ({ ...prev, pendingDeletion: null }))
  }, [])

  useEffect(() => {
    if (!authUser?.id) {
      setState({ ...INITIAL, loading: false })
      return
    }
    let abort = false
    setState(s => ({ ...s, loading: true, error: null }))

    ;(async () => {
      try {
        const [profileRes, historyRes, ratingsRes, settingsRes, deletionRes, fingerprint] = await Promise.all([
          supabase
            .from('users')
            // taste_label: column exists but no write path in the codebase
            // and never read for display — dropped from the select in the
            // 2026-05-21 audit. Schema column kept for now; safe to drop in a
            // future migration if confirmed unused org-wide.
            // total_movies_watched dropped: it's been observed stale (0 even
            // when user_history has rows). Stats now derive from history.
            .select('id, name, email, avatar_url, signup_source, joined_at, onboarding_complete, last_active_at')
            .eq('id', authUser.id)
            .maybeSingle(),
          supabase
            .from('user_history')
            // runtime is fetched so deriveStats can sum it for "Hours watched".
            .select('watched_at, movies!inner ( runtime )')
            .eq('user_id', authUser.id),
          supabase
            .from('user_ratings')
            .select('movie_id')
            .eq('user_id', authUser.id),
          supabase
            .from('user_settings')
            .select('settings')
            .eq('user_id', authUser.id)
            .maybeSingle(),
          supabase
            .from('account_deletion_requests')
            .select('scheduled_for, requested_at')
            .eq('user_id', authUser.id)
            .is('cancelled_at', null)
            .maybeSingle(),
          // Cached taste fingerprint — its topMoodTags length feeds the
          // dnaConfidence "fingerprint richness" signal so the Identity
          // stat card matches /profile's QuickStats.
          getTasteFingerprint(authUser.id).catch(() => null),
        ])
        if (abort) return

        const profile = profileRes.data || null
        const history = historyRes.data || []
        const ratings = ratingsRes.data || []
        const stats = deriveStats({ history, ratings, fingerprint })
        const provider = authUser?.app_metadata?.provider || 'email'
        const serverSettings = mergeWithDefaults(settingsRes.data?.settings)
        const pendingDeletion = deletionRes.data || null

        setState({
          authUser,
          profile,
          stats,
          provider,
          serverSettings,
          pendingDeletion,
          loading: false,
          error: null,
          refresh,
          updateNotifications,
          updatePrivacy,
          requestDeletion,
          cancelDeletion,
        })
      } catch (e) {
        if (abort) return
        console.error('[useAccountData]', e)
        setState(s => ({ ...s, loading: false, error: e?.message || 'Failed to load' }))
      }
    })()

    return () => { abort = true }
  }, [authUser, nonce, refresh, updateNotifications, updatePrivacy, requestDeletion, cancelDeletion])

  const value = useMemo(() => state, [state])
  return <AccountDataContext.Provider value={value}>{children}</AccountDataContext.Provider>
}

export function useAccountData() {
  const ctx = useContext(AccountDataContext)
  if (!ctx) throw new Error('useAccountData must be inside AccountDataProvider')
  return ctx
}
