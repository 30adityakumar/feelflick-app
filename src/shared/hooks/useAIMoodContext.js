import { useEffect, useRef, useState } from 'react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const EDGE_FN_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/ai-mood-context` : null

const DELIMITER_EXPL = '---EXPLANATIONS---'

/**
 * Streams AI mood narration + per-movie explanations from the Edge Function.
 * Silently falls back on any failure — never breaks the main recommendations flow.
 *
 * @param {{ mood: string|null, context: string|null, experience: string|null,
 *           intensity: number, pacing: number, timeOfDay: string,
 *           movies: Array<{tmdbId: number, title: string, vote_average: number, mood_tags?: string[], tone_tags?: string[], fit_profile?: string}>,
 *           top3Genres?: string[],
 *           enabled: boolean }} params
 * @returns {{ narration: string, narrationDone: boolean,
 *             explanations: Map<number, {explanation: string, score: number}>,
 *             loading: boolean, error: string|null }}
 */
export function useAIMoodContext({
  mood,
  context,
  experience,
  intensity,
  pacing,
  timeOfDay,
  movies,
  top3Genres,
  enabled,
}) {
  const [narration, setNarration]           = useState('')
  const [narrationDone, setNarrationDone]   = useState(false)
  const [explanations, setExplanations]     = useState(() => new Map())
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState(null)

  const abortRef = useRef(null)

  useEffect(() => {
    if (!enabled || !mood || !movies || movies.length === 0 || !EDGE_FN_URL) return

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setNarration('')
    setNarrationDone(false)
    setExplanations(new Map())
    setLoading(true)
    setError(null)

    async function run() {
      try {
        const res = await fetch(EDGE_FN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            mood, context, experience, intensity, pacing, timeOfDay, movies,
            top3Genres: top3Genres ?? [],
          }),
          signal: controller.signal,
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        // Parser state: NARRATION → EXPLANATIONS
        let state = 'NARRATION'
        let narrationBuffer = ''
        let expBuffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })

          if (state === 'NARRATION') {
            narrationBuffer += chunk
            const idx = narrationBuffer.indexOf(DELIMITER_EXPL)
            if (idx !== -1) {
              setNarration(narrationBuffer.slice(0, idx).trim())
              setNarrationDone(true)
              expBuffer = narrationBuffer.slice(idx + DELIMITER_EXPL.length)
              state = 'EXPLANATIONS'
            } else {
              setNarration(narrationBuffer)
            }
          } else {
            expBuffer += chunk
          }
        }

        // Stream done — flush explanations buffer
        if (state === 'EXPLANATIONS') {
          parseAndSetExplanations(expBuffer)
        }
      } catch (err) {
        if (err.name === 'AbortError') return
        // Never break the main recommendations flow
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    function parseAndSetExplanations(raw) {
      if (!raw.trim()) return
      try {
        const parsed = JSON.parse(raw.trim())
        if (Array.isArray(parsed)) {
          const map = new Map()
          for (const { movieId, explanation, score } of parsed) {
            map.set(Number(movieId), { explanation, score })
          }
          setExplanations(map)
        }
      } catch {
        // JSON parse failed — silently continue with empty explanations
      }
    }

    run()

    return () => controller.abort()
  }, [enabled, mood, context, experience, intensity, pacing, timeOfDay, movies, top3Genres])

  return { narration, narrationDone, explanations, loading, error }
}