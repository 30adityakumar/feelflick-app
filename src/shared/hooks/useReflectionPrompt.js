import { useEffect, useState } from 'react'

const FALLBACK = 'What stayed with you after the credits?'
const TIMEOUT_MS = 3000

/**
 * Fetches an AI-generated reflection question for the given movie.
 * Fires once when tmdbId becomes non-null.
 * Falls back to a generic question on any failure or timeout.
 *
 * @param {number|null} tmdbId
 * @returns {{ prompt: string|null, loading: boolean }}
 */
export function useReflectionPrompt(tmdbId) {
  const [prompt, setPrompt] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Read env lazily so test stubs applied before render take effect
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    const edgeFnUrl = supabaseUrl
      ? `${supabaseUrl}/functions/v1/generate-reflection-prompt`
      : null

    if (!tmdbId || !edgeFnUrl) return

    let cancelled = false
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    async function fetchPrompt() {
      setLoading(true)
      try {
        const res = await fetch(edgeFnUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify({ tmdbId }),
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!cancelled) setPrompt(data?.prompt || FALLBACK)
      } catch {
        if (!cancelled) setPrompt(FALLBACK)
      } finally {
        clearTimeout(timer)
        if (!cancelled) setLoading(false)
      }
    }

    fetchPrompt()
    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timer)
    }
  }, [tmdbId])

  return { prompt, loading }
}
