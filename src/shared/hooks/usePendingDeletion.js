// src/shared/hooks/usePendingDeletion.js
// Lightweight, AppShell-level fetch of the calling user's pending
// account_deletion_requests row (if any). Used to render the global
// "deletion scheduled" banner without dragging in the AccountDataProvider.
//
// Returns { pendingDeletion, refresh, cancel }.

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from './useAuthSession'

export function usePendingDeletion() {
  const { user } = useAuthSession()
  const [pendingDeletion, setPendingDeletion] = useState(null)
  const [nonce, setNonce] = useState(0)

  const refresh = useCallback(() => setNonce((n) => n + 1), [])

  const cancel = useCallback(async () => {
    const { error } = await supabase.rpc('cancel_account_deletion')
    if (error) throw error
    setPendingDeletion(null)
  }, [])

  useEffect(() => {
    if (!user?.id) {
      setPendingDeletion(null)
      return
    }
    let abort = false
    ;(async () => {
      const { data } = await supabase
        .from('account_deletion_requests')
        .select('scheduled_for, requested_at')
        .eq('user_id', user.id)
        .is('cancelled_at', null)
        .maybeSingle()
      if (!abort) setPendingDeletion(data || null)
    })()
    return () => {
      abort = true
    }
  }, [user, nonce])

  return { pendingDeletion, refresh, cancel }
}
