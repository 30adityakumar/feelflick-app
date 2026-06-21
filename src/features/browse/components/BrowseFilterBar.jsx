// src/features/browse/components/BrowseFilterBar.jsx
// Sticky control bar.
//   Desktop: primary filter popovers (Genre / Era / Language / Runtime) + a
//   "More filters" button (advanced drawer) on the left; a separate Sort group on
//   the right (the four primary sorts as tabs — visually distinct from filters so
//   "what's shown" and "how it's ordered" never blur).
//   Mobile: only "Filters · N" (opens the sheet) + a compact Sort menu.
// A second row shows active-scope chips. The bar owns which popover is open so
// just one opens at a time, Escape closes + restores focus, outside-click closes.

import { useCallback, useEffect, useRef, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import BrowseFilterPopover from './BrowseFilterPopover'
import BrowseActiveFilters from './BrowseActiveFilters'
import { PRIMARY_SORTS } from '../browsePresentation'
import { GENRE_OPTIONS, DECADE_OPTIONS, LANG_OPTIONS, RUNTIME_OPTIONS } from '../data'

const toPairs = (opts) => opts.map((o) => [o.value, o.label])
const labelFor = (opts, val) => opts.find((o) => o.value === val)?.label || ''

export default function BrowseFilterBar({
  genre, decade, lang, runtime, onSetFilter,
  sort, onSetSort, advancedCount, onOpenDrawer,
  chips, onClearAll, isSearchMode,
}) {
  const [openId, setOpenId] = useState(null)
  const triggerRefs = useRef({})

  const setRef = (id) => (el) => { if (el) triggerRefs.current[id] = el }
  const close = useCallback((restoreFocus = true) => {
    setOpenId((cur) => {
      if (cur && restoreFocus) triggerRefs.current[cur]?.focus()
      return null
    })
  }, [])
  const toggle = useCallback((id) => setOpenId((cur) => (cur === id ? null : id)), [])

  useEffect(() => {
    if (!openId) return undefined
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(true) } }
    const onDown = (e) => { if (!e.target.closest?.('.ff-filter-wrap')) close(false) }
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('mousedown', onDown)
    return () => { document.removeEventListener('keydown', onKey, true); document.removeEventListener('mousedown', onDown) }
  }, [openId, close])

  const pick = (key) => (value) => { onSetFilter(key, value); close(true) }

  return (
    <div className="ff-browse-filterbar">
      <div className="ff-browse-filterbar__row">
        {/* Desktop primary filters */}
        <div className="ff-browse-filterbar__filters">
          <BrowseFilterPopover id="genre" label="Genre" valueText={labelFor(GENRE_OPTIONS, genre).replace(/^All genres$/, '')}
            active={!!genre} open={openId === 'genre'} onToggle={toggle} triggerRef={setRef('genre')}
            options={toPairs(GENRE_OPTIONS)} selected={genre} onSelect={pick('genre')} />
          <BrowseFilterPopover id="decade" label="Era" valueText={labelFor(DECADE_OPTIONS, decade).replace(/^Any era$/, '')}
            active={!!decade} open={openId === 'decade'} onToggle={toggle} triggerRef={setRef('decade')}
            options={toPairs(DECADE_OPTIONS)} selected={decade} onSelect={pick('decade')} />
          <BrowseFilterPopover id="lang" label="Language" valueText={labelFor(LANG_OPTIONS, lang).replace(/^Any language$/, '')}
            active={!!lang} open={openId === 'lang'} onToggle={toggle} triggerRef={setRef('lang')}
            options={toPairs(LANG_OPTIONS)} selected={lang} onSelect={pick('lang')} />
          <BrowseFilterPopover id="runtime" label="Runtime" valueText={labelFor(RUNTIME_OPTIONS, runtime).replace(/^Any length$/, '')}
            active={!!runtime} open={openId === 'runtime'} onToggle={toggle} triggerRef={setRef('runtime')}
            options={toPairs(RUNTIME_OPTIONS)} selected={runtime} onSelect={pick('runtime')} />
          <button type="button" className={`ff-filter-button ff-filter-button--more${advancedCount > 0 ? ' is-active' : ''}`} onClick={onOpenDrawer}>
            <SlidersHorizontal className="h-[15px] w-[15px]" aria-hidden="true" />
            More filters{advancedCount > 0 ? <span className="ff-filter-button__count">{advancedCount}</span> : null}
          </button>
        </div>

        {/* Mobile filters trigger */}
        <button type="button" className="ff-browse-filterbar__mobile-filters" onClick={onOpenDrawer}>
          <SlidersHorizontal className="h-[16px] w-[16px]" aria-hidden="true" />
          Filters{(advancedCount + chips.length) > 0 ? ` · ${advancedCount + chips.length}` : ''}
        </button>

        {/* Sort — desktop tabs */}
        <div className="ff-browse-sorttabs" role="group" aria-label="Sort order">
          {PRIMARY_SORTS.map((s) => (
            <button key={s.value} type="button" disabled={isSearchMode}
              className={`ff-browse-sorttab${sort === s.value ? ' is-active' : ''}`}
              aria-pressed={sort === s.value} onClick={() => onSetSort(s.value)}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Sort — mobile menu */}
        <div className="ff-browse-sort-mobile">
          <BrowseFilterPopover id="sortm" label="Sort" valueText={PRIMARY_SORTS.find((s) => s.value === sort)?.label || ''}
            active open={openId === 'sortm'} onToggle={toggle} align="right" triggerRef={setRef('sortm')}
            options={PRIMARY_SORTS.map((s) => [s.value, s.label])} selected={sort}
            onSelect={(v) => { onSetSort(v); close(true) }} />
        </div>
      </div>

      <BrowseActiveFilters chips={chips} onClearAll={onClearAll} />
    </div>
  )
}
