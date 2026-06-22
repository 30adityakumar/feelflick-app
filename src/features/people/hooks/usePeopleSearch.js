// src/features/people/hooks/usePeopleSearch.js
// Local, authenticated NAME search (separate from taste-match discovery). Owns query state, ≥2-char
// gating, ~300ms debounce, stale-response protection (request sequence), and the explicit state
// machine (idle | searching | results | empty | error). Search text never enters the URL, storage,
// or analytics (only a coarse length bucket). Results are id/name/avatar only — no handles, no taste.

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { trackEvent, EVENTS, queryLengthBucket } from '@/shared/services/betaEvents'
import { avatarBg, initialOf } from '../derive/peopleDiscovery'

const MIN_CHARS = 2
const DEBOUNCE_MS = 300

export function usePeopleSearch(userId) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [phase, setPhase] = useState('idle') // 'idle' | 'searching' | 'results' | 'empty' | 'error'
  const seq = useRef(0)
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

  const trimmed = query.trim()
  const active = trimmed.length >= MIN_CHARS

  useEffect(() => {
    if (!active || !userId) {
      setResults([])
      setPhase('idle')
      return
    }
    setPhase('searching')
    const mySeq = ++seq.current
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc('search_people_by_name', { search_query: trimmed })
      if (!mounted.current || mySeq !== seq.current) return // stale response — drop
      if (error) {
        setResults([])
        setPhase('error') // a failed search must NOT read as "no people found"
        return
      }
      const rows = (data || []).map((u) => ({
        id: u.id,
        name: u.name || 'Anonymous',
        initial: initialOf(u.name),
        avatarBg: avatarBg(u.id),
        avatarUrl: u.avatar_url || null,
      }))
      setResults(rows)
      setPhase(rows.length ? 'results' : 'empty')
      // Coarse telemetry only — never the typed text or any result id/name.
      if (rows.length === 0) trackEvent(EVENTS.people_search_empty, { surface: 'people', query_length_bucket: queryLengthBucket(trimmed.length) })
      else trackEvent(EVENTS.people_search_used, { surface: 'people', result_count: rows.length, result_kind: 'person', query_length_bucket: queryLengthBucket(trimmed.length) })
    }, DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [active, trimmed, userId])

  const clear = useCallback(() => { seq.current++; setQuery(''); setResults([]); setPhase('idle') }, [])

  return { query, setQuery, clear, phase, results, active }
}
