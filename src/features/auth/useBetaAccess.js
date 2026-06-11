import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { isBetaGateEnabled } from '@/shared/config/betaFlags'

/**
 * B1.4 — resolve the CURRENT user's private-beta access from the server-side `beta_members` table.
 * RLS scopes the read to the caller's OWN row, so this can never reveal anyone else's membership.
 *
 * When the gate is disabled (the default — VITE_ENABLE_BETA_GATE unset), returns 'allowed'
 * immediately with NO query, so dev/CI/E2E and current users are unaffected.
 *
 * @returns {'loading'|'allowed'|'denied'|'error'}
 */
export function useBetaAccess() {
  const [status, setStatus] = useState(isBetaGateEnabled() ? 'loading' : 'allowed')

  useEffect(() => {
    if (!isBetaGateEnabled()) { setStatus('allowed'); return }
    let cancelled = false
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (cancelled) return
        if (!user) { setStatus('denied'); return }
        const { data, error } = await supabase
          .from('beta_members')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle()
        if (cancelled) return
        if (error) { setStatus('error'); return }      // safe fallback — never surface raw error
        setStatus(data?.status === 'active' ? 'allowed' : 'denied')
      } catch {
        if (!cancelled) setStatus('error')
      }
    })()
    return () => { cancelled = true }
  }, [])

  return status
}
