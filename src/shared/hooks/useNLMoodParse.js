import { useState } from 'react'

const TIMEOUT_MS = 3000

/**
 * One-shot imperative hook for parsing a freetext mood description into dial values.
 *
 * Returns a `parse(moodName, freeText)` function.
 * On success: returns `{ intensity, pacing, viewingContext, experienceType }` with values clamped 1–5.
 * On failure / timeout: returns `null` (caller should keep current dial values).
 *
 * @returns {{ parse: function, loading: boolean }}
 */
export function useNLMoodParse() {
  const [loading, setLoading] = useState(false)

  /**
   * @param {string} moodName
   * @param {string} freeText
   * @returns {Promise<{intensity:number,pacing:number,viewingContext:number,experienceType:number}|null>}
   */
  async function parse(moodName, freeText) {
    if (!freeText?.trim()) return null

    // Read env lazily so test stubs applied before call take effect
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    const edgeFnUrl = supabaseUrl ? `${supabaseUrl}/functions/v1/ai-mood-context` : null

    if (!edgeFnUrl) return null

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    setLoading(true)
    try {
      const res = await fetch(edgeFnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ action: 'parse', mood: moodName, freeText }),
        signal: controller.signal,
      })

      if (!res.ok) return null

      const data = await res.json()
      if (!data || typeof data !== 'object') return null

      // Clamp and validate each field — model output is untrusted
      function clamp(v, fallback = 3) {
        const n = Number(v)
        if (isNaN(n)) return fallback
        return Math.max(1, Math.min(5, Math.round(n)))
      }

      return {
        intensity:      clamp(data.intensity),
        pacing:         clamp(data.pacing),
        viewingContext: clamp(data.viewingContext),
        experienceType: clamp(data.experienceType),
      }
    } catch {
      return null
    } finally {
      clearTimeout(timer)
      setLoading(false)
    }
  }

  return { parse, loading }
}
