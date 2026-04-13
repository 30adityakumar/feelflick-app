import { useSyncExternalStore } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

const AUTH_STORE_KEY = '__feelflick_auth_session_store_v1__'

function getInitialSnapshot() {
  return {
    ready: false,
    session: null,
    user: null,
    userId: null,
  }
}

function getStore() {
  if (!globalThis[AUTH_STORE_KEY]) {
    globalThis[AUTH_STORE_KEY] = {
      initialized: false,
      snapshot: getInitialSnapshot(),
      listeners: new Set(),
      subscription: null,
    }
  }

  return globalThis[AUTH_STORE_KEY]
}

function emit(snapshot) {
  const store = getStore()
  store.snapshot = snapshot

  store.listeners.forEach((listener) => {
    try {
      listener()
    } catch (error) {
      console.warn('[useAuthSession] listener error:', error)
    }
  })
}

function applySession(session) {
  emit({
    ready: true,
    session: session ?? null,
    user: session?.user ?? null,
    userId: session?.user?.id ?? null,
  })
}

function initStore() {
  const store = getStore()
  if (store.initialized) return

  store.initialized = true

  // Safety timeout: if Supabase is unreachable, resolve as unauthenticated
  // after 5 seconds so the landing page can render instead of spinning forever.
  const timeoutId = setTimeout(() => {
    if (!getStore().snapshot.ready) {
      console.warn('[useAuthSession] auth timed out after 5s — treating as unauthenticated')
      applySession(null)
    }
  }, 5000)

  supabase.auth
    .getSession()
    .then(({ data: { session }, error }) => {
      clearTimeout(timeoutId)
      if (error) {
        console.warn('[useAuthSession] getSession error:', error)
      }

      applySession(session)
    })
    .catch((error) => {
      clearTimeout(timeoutId)
      console.warn('[useAuthSession] unexpected getSession error:', error)
      applySession(null)
    })

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    applySession(session)
  })

  store.subscription = data?.subscription ?? null
}

function subscribe(listener) {
  const store = getStore()
  initStore()
  store.listeners.add(listener)

  return () => {
    store.listeners.delete(listener)
  }
}

function getSnapshot() {
  return getStore().snapshot
}

export function useAuthSession() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return {
    ...snapshot,
    isAuthenticated: Boolean(snapshot.user),
  }
}
