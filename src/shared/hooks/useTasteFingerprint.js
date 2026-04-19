import { useState, useEffect } from 'react'

import { getTasteFingerprint } from '@/shared/services/tasteCache'

/**
 * Hook to fetch cached taste fingerprint for a user.
 * Returns server-cached aggregates; falls back to null while loading.
 * @param {string|null} userId
 * @returns {{ fingerprint: object|null, loading: boolean }}
 */
export function useTasteFingerprint(userId) {
  const [fingerprint, setFingerprint] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    getTasteFingerprint(userId).then(result => {
      if (cancelled) return
      setFingerprint(result)
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [userId])

  return { fingerprint, loading }
}
