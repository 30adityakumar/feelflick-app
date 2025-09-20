import { useEffect, useRef, useState } from 'react'

/**
 * Generic async hook with AbortController support.
 * Usage:
 *   const { data, error, loading, run } = useAsync()
 *   useEffect(() => { run((signal) => fetchSomething({ signal })) }, [run])
 */
export function useAsync() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const abortRef = useRef(null)

  async function run(factory) {
    // cancel any in-flight
    if (abortRef.current) abortRef.current.abort('re-run')
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setLoading(true)
    setError(null)

    try {
      const result = await factory(ctrl.signal)
      setData(result)
      return result
    } catch (err) {
      if (err?.name !== 'AbortError') setError(err)
      return null
    } finally {
      if (abortRef.current === ctrl) abortRef.current = null
      setLoading(false)
    }
  }

  function cancel(reason = 'manual-cancel') {
    if (abortRef.current) abortRef.current.abort(reason)
    abortRef.current = null
  }

  useEffect(() => () => cancel('unmount'), [])

  return { data, error, loading, run, cancel, setData, setError }
}