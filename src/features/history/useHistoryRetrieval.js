// src/features/history/useHistoryRetrieval.js
// Owns the Diary retrieval state: local (private) search + URL-addressable Loved filter and sort,
// and the deterministic visible derivation (search → Loved → sort).
//
// • Search text stays in LOCAL React state — never URL/localStorage/analytics/logs (review queries
//   are highly sensitive).
// • Loved filter (?filter=loved) and sort (?sort=rating|runtime) are URL params so refresh / Back /
//   Forward / share restore the view. Default "All" and "recent" are omitted from the URL.
// • Invalid ?filter= / ?sort= fall back safely to All / Most recent.
// • Most recent renders the chronological timeline; Highest rated / Runtime render a flat list.

import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { matchesQuery, sortEntries, isGroupedSort } from './derive/historyDerive'

const SORTS = new Set(['recent', 'rating', 'runtime'])

export function useHistoryRetrieval(entries) {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')

  const rawFilter = params.get('filter')
  const filter = rawFilter === 'loved' ? 'loved' : 'all'
  const rawSort = params.get('sort')
  const sort = SORTS.has(rawSort) ? rawSort : 'recent'

  const update = useCallback((mutate) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      mutate(next)
      return next
    })
  }, [setParams])

  const setFilter = useCallback((next) => {
    update((p) => { if (!next || next === 'all') p.delete('filter'); else p.set('filter', next) })
  }, [update])

  const setSort = useCallback((next) => {
    update((p) => { if (!next || next === 'recent') p.delete('sort'); else p.set('sort', next) })
  }, [update])

  // Show all clears the retrieval CONSTRAINTS (search + Loved) but PRESERVES the current sort.
  const showAll = useCallback(() => {
    setSearch('')
    update((p) => { p.delete('filter') })
  }, [update])

  const visible = useMemo(() => {
    let arr = (entries || []).filter((e) => matchesQuery(e, search))
    if (filter === 'loved') arr = arr.filter((e) => e.fav)
    return sortEntries(arr, sort)
  }, [entries, search, filter, sort])

  const grouped = isGroupedSort(sort)
  const hasConstraints = !!search.trim() || filter !== 'all'

  return { search, setSearch, filter, setFilter, sort, setSort, showAll, visible, grouped, hasConstraints }
}
