// src/features/account-v2/useAccountData.jsx
// FeelFlick — Account v2 data layer. Fetches the signed-in user, their
// `users` row, derived stats, and their `user_settings` JSONB (notifications
// + engine prefs + privacy flags). Components consume via `useAccountData()`.
//
// Server-backed settings: PR 3 swap. Every toggle / slider / chip writes
// through three setters — updateNotifications / updateEnginePrefs / updatePrivacy
// — which optimistically mutate the in-memory shape and debounce a single
// upsert into `user_settings` for the signed-in user. RLS keeps the row
// per-user; defaults from ./data.js fill in fields the user hasn't touched.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { SETTINGS as DEFAULT_SETTINGS } from './data'

const AccountDataContext = createContext(null)

const UPSERT_DEBOUNCE_MS = 350

const INITIAL = {
  authUser: null,
  profile: null,
  stats: null,
  provider: null,
  serverSettings: null,         // null while loading; object once loaded
  loading: true,
  error: null,
  refresh: () => {},
  updateNotifications: () => {},
  updateEnginePrefs: () => {},
  updatePrivacy: () => {},
}

function deriveStats({ history, ratings, profile }) {
  const filmsLogged = profile?.total_movies_watched ?? history.length
  const filmsRated = ratings.length
  const uniqDays = new Set()
  for (const h of history) {
    if (!h.watched_at) continue
    uniqDays.add(new Date(h.watched_at).toISOString().slice(0, 10))
  }
  const daysActive = uniqDays.size
  const dnaConfidence = Math.min(100, Math.round((filmsRated / 50) * 100))
  return { filmsLogged, filmsRated, daysActive, dnaConfidence }
}

// Default shape used to backstop any keys the user hasn't set yet.
const DEFAULT_SHAPE = {
  notifications: DEFAULT_SETTINGS.notifications,
  prefs:         DEFAULT_SETTINGS.prefs,
  privacy:       DEFAULT_SETTINGS.privacy,
}

function mergeWithDefaults(serverShape) {
  const s = serverShape && typeof serverShape === 'object' ? serverShape : {}
  return {
    notifications: Array.isArray(s.notifications) ? s.notifications : DEFAULT_SHAPE.notifications,
    prefs:         { ...DEFAULT_SHAPE.prefs,   ...(s.prefs   || {}) },
    privacy:       { ...DEFAULT_SHAPE.privacy, ...(s.privacy || {}) },
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

  const updateEnginePrefs = useCallback((patch) => patchSection('prefs', patch), [patchSection])
  const updatePrivacy = useCallback((patch) => patchSection('privacy', patch), [patchSection])

  useEffect(() => {
    if (!authUser?.id) {
      setState({ ...INITIAL, loading: false })
      return
    }
    let abort = false
    setState(s => ({ ...s, loading: true, error: null }))

    ;(async () => {
      try {
        const [profileRes, historyRes, ratingsRes, settingsRes] = await Promise.all([
          supabase
            .from('users')
            .select('id, name, email, avatar_url, signup_source, joined_at, onboarding_complete, total_movies_watched, last_active_at, taste_label')
            .eq('id', authUser.id)
            .maybeSingle(),
          supabase
            .from('user_history')
            .select('watched_at')
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
        ])
        if (abort) return

        const profile = profileRes.data || null
        const history = historyRes.data || []
        const ratings = ratingsRes.data || []
        const stats = deriveStats({ history, ratings, profile })
        const provider = authUser?.app_metadata?.provider || 'email'
        const serverSettings = mergeWithDefaults(settingsRes.data?.settings)

        setState({
          authUser,
          profile,
          stats,
          provider,
          serverSettings,
          loading: false,
          error: null,
          refresh,
          updateNotifications,
          updateEnginePrefs,
          updatePrivacy,
        })
      } catch (e) {
        if (abort) return
        console.error('[useAccountData]', e)
        setState(s => ({ ...s, loading: false, error: e?.message || 'Failed to load' }))
      }
    })()

    return () => { abort = true }
  }, [authUser, nonce, refresh, updateNotifications, updateEnginePrefs, updatePrivacy])

  const value = useMemo(() => state, [state])
  return <AccountDataContext.Provider value={value}>{children}</AccountDataContext.Provider>
}

export function useAccountData() {
  const ctx = useContext(AccountDataContext)
  if (!ctx) throw new Error('useAccountData must be inside AccountDataProvider')
  return ctx
}
