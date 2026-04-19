// src/shared/hooks/useBriefCandidateCount.js
import { useEffect, useRef, useState } from 'react'

import { supabase } from '@/shared/lib/supabase/client'

/** Module-level cache for the baseline total (no filters). Fetched once. */
let cachedBaseline = null
let baselinePromise = null

/**
 * Fetch the total catalog size (is_valid + poster). Cached module-level.
 * @returns {Promise<number>}
 */
function fetchBaseline() {
  if (cachedBaseline !== null) return Promise.resolve(cachedBaseline)
  if (baselinePromise) return baselinePromise

  baselinePromise = supabase
    .rpc('count_brief_candidates', {})
    .then(({ data, error }) => {
      if (error) throw error
      cachedBaseline = data ?? 0
      return cachedBaseline
    })
    .catch(() => {
      baselinePromise = null
      return 0
    })

  return baselinePromise
}

/**
 * Maps brief answers to RPC params. Only includes set answers.
 * Feeling is excluded (mood_id is scoring-only, not a hard filter).
 *
 * @param {Record<string, any>} answers
 * @returns {Record<string, any>}
 */
function answersToParams(answers) {
  const params = {}
  if (answers.energy !== undefined) params.p_energy = answers.energy
  if (answers.attention !== undefined) params.p_attention = answers.attention
  if (answers.tone !== undefined) params.p_tone = answers.tone
  if (answers.time !== undefined) params.p_time = answers.time
  if (answers.era !== undefined) params.p_era = answers.era
  return params
}

/**
 * Live candidate pool size that updates as the brief narrows.
 * Debounced 250ms after answer commits.
 *
 * @param {{ answers: Record<string, any> }} brief
 * @returns {{ count: number, previousCount: number, loading: boolean }}
 */
export function useBriefCandidateCount(brief) {
  const [count, setCount] = useState(0)
  const [previousCount, setPreviousCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef(null)
  const abortRef = useRef(null)

  // Fetch baseline on mount
  useEffect(() => {
    let cancelled = false
    fetchBaseline().then((total) => {
      if (!cancelled) {
        setCount(total)
        setPreviousCount(total)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  // Debounced count on answer changes
  useEffect(() => {
    const answers = brief?.answers
    if (!answers) return

    // Only count if we have filter-relevant answers (not just feeling)
    const hasFilters = answers.energy !== undefined
      || answers.attention !== undefined
      || answers.tone !== undefined
      || answers.time !== undefined
      || answers.era !== undefined

    if (!hasFilters) return

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      const params = answersToParams(answers)

      try {
        const { data, error } = await supabase.rpc('count_brief_candidates', params)
        if (controller.signal.aborted) return
        if (error) throw error

        setPreviousCount((prev) => prev)
        setCount((prev) => {
          setPreviousCount(prev)
          return data ?? 0
        })
      } catch {
        // Silently continue with previous count
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 250)

    return () => {
      clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [brief?.answers])

  return { count, previousCount, loading }
}

// WHY: Export for testing — allows tests to reset module-level cache
export function _resetBaselineCache() {
  cachedBaseline = null
  baselinePromise = null
}
