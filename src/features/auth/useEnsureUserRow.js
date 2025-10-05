import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

/**
 * Returns { ready, user }.
 * - Reads auth user.
 * - Reads users row if it exists.
 * - Never writes.
 * - Avoids blocking UI on 403/timeout.
 */
export function useEnsureUserRow() {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState(null)
  const once = useRef(false)

  useEffect(() => {
    if (once.current) return
    once.current = true

    let mounted = true
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!mounted) return
        setUser(user || null)

        if (!user) { setReady(true); return }

        // Try to read user row; ignore RLS errors
        const { error } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (error && Number(error.status) !== 406 && Number(error.status) !== 404) {
          // 403/other: don’t block UI — just proceed
          console.warn('users read warning:', error.message)
        }
      } catch (e) {
        console.warn('ensureUserRow', e)
      } finally {
        if (mounted) setReady(true)
      }
    })()

    return () => { mounted = false }
  }, [])

  return { ready, user }
}