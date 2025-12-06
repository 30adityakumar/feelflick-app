// src/shared/hooks/useQuickPicksPrefetch.js
import { useEffect } from 'react'
import { queryClient } from '@/shared/lib/queryClient' // adjust import
import { fetchQuickPicks } from '@/shared/api/recommendations' // adjust import

export function usePrefetchQuickPicks(nextParams) {
  useEffect(() => {
    if (!nextParams) return
    // Use requestIdleCallback if available
    const run = () => {
      queryClient.prefetchQuery(['quickPicks', nextParams], () =>
        fetchQuickPicks(nextParams)
      )
    }

    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(run, { timeout: 2000 })
      return () => window.cancelIdleCallback(id)
    } else {
      const id = window.setTimeout(run, 500)
      return () => window.clearTimeout(id)
    }
  }, [nextParams])
}
