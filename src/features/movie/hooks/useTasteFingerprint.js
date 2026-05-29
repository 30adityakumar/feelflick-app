// src/features/movie/hooks/useTasteFingerprint.js
// Thin React wrapper around the shared getTasteFingerprint() cache.
// Returns null while loading or when the user has fewer than 5 watched films.

import { useEffect, useState } from 'react'
import { getTasteFingerprint } from '@/shared/services/tasteCache'

export function useTasteFingerprint(userId) {
  const [state, setState] = useState({ fingerprint: null, loading: Boolean(userId) })

  useEffect(() => {
    if (!userId) {
      setState({ fingerprint: null, loading: false })
      return
    }
    let abort = false
    setState({ fingerprint: null, loading: true })
    getTasteFingerprint(userId)
      .then(fp => { if (!abort) setState({ fingerprint: fp, loading: false }) })
      .catch(() => { if (!abort) setState({ fingerprint: null, loading: false }) })
    return () => { abort = true }
  }, [userId])

  return state
}
