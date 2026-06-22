// src/features/watchlist/useWatchlistRetrieval.js
// Owns the Watchlist retrieval state: local (private) search text + URL-addressable mood/sort,
// and the deterministic visible derivation (search → mood filter → sort).
//
// • Search text stays in LOCAL React state — never URL/localStorage/analytics (private film intent).
// • Mood + sort are URL search params so refresh / Back / Forward / share restore the view.
//   Default sort ('recent') and "All" mood are omitted from the URL to keep it quiet.
// • Invalid ?mood= / ?sort= fall back safely to All / Recently saved (behaviourally; the URL is
//   left untouched to avoid a render-time history rewrite loop).

import { useCallback, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SORTS, searchItems, sortItems } from './derive/watchlistDerive'

export function useWatchlistRetrieval(items, availableMoods) {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')

  // Validate the URL mood against moods EVER present in the collection, not just the live set.
  // This keeps an invalid deep-link (a mood this user never had) falling back to All, while an
  // active mood whose last film was just removed stays selected (→ filtered-empty, not a silent
  // reset). Accumulating into a ref during render is idempotent + safe.
  const seenMoods = useRef(new Set())
  for (const m of (availableMoods || [])) seenMoods.current.add(m.mood)
  const rawMood = params.get('mood')
  const mood = rawMood && seenMoods.current.has(rawMood) ? rawMood : 'all'
  const rawSort = params.get('sort')
  const sort = SORTS.includes(rawSort) ? rawSort : 'recent'

  const update = useCallback((mutate) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      mutate(next)
      return next
    })
  }, [setParams])

  const setMood = useCallback((next) => {
    update((p) => { if (!next || next === 'all') p.delete('mood'); else p.set('mood', next) })
  }, [update])

  const setSort = useCallback((next) => {
    update((p) => { if (!next || next === 'recent') p.delete('sort'); else p.set('sort', next) })
  }, [update])

  // Show all clears the retrieval CONSTRAINTS (search + mood) but PRESERVES the current sort.
  const showAll = useCallback(() => {
    setSearch('')
    update((p) => { p.delete('mood') })
  }, [update])

  const visible = useMemo(() => {
    let arr = searchItems(items, search)
    if (mood !== 'all') arr = arr.filter((f) => f.mood === mood)
    return sortItems(arr, sort)
  }, [items, search, mood, sort])

  const hasConstraints = !!search.trim() || mood !== 'all'

  return { search, setSearch, mood, setMood, sort, setSort, showAll, visible, hasConstraints }
}
