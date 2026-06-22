// src/features/watchlist/Watchlist.jsx
// FeelFlick — Watchlist: a calm, private RETRIEVAL surface for films saved for another moment.
// NOT a recommendation feed: no match %, rank, "perfect for tonight", priority, or stale/guilt
// framing, and opening /watchlist performs no profile/fingerprint compute or recommendation-cache
// write — only its saved-film query. Removal reliability (settled delete, single live-region
// announcement, focus recovery, per-film pending) is preserved. The redesign adds a sticky local
// retrieval surface (search + collection-derived mood filters + deterministic sort), an Apple-
// inspired denser poster grid, and a poster-overlay remove control — all on the route's existing
// Thoughtful-Seatmate (Adaptive Editorial Cinema) foundation.

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import Eyebrow from '@/shared/ui/Eyebrow'
import Button from '@/shared/ui/Button'
import { ThoughtfulRoot, PageDepth } from '@/shared/ui/thoughtful-seatmate'
// TEMPORARY visual-compatibility import: Watchlist renders the canonical <Button variant="primary">
// directly; the PrimaryAction *component* is retired from this route, but its stylesheet still loads
// HERE so the two migrated primary buttons keep their exact pre-migration pixels (the legacy
// flat-ivory recipe applied via .ts-action-primary* compat classes). Removed when the neutral-
// primary visual recipe is reconciled.
import '@/shared/ui/thoughtful-seatmate/PrimaryAction.css'
import { WatchlistDataProvider, useWatchlistData } from './useWatchlistData'
import { useWatchlistRetrieval } from './useWatchlistRetrieval'
import { useLibraryAnnouncement } from '@/features/library/useLibraryAnnouncement'
import { scheduleFocus, findRemoveControl, findFallback, nextFocusId } from '@/features/library/focusAfterRemoval'
import LibrarySectionNav from '@/features/library/LibrarySectionNav'
import WatchlistHeader from './components/WatchlistHeader'
import WatchlistRetrieval from './components/WatchlistRetrieval'
import WatchlistGrid from './components/WatchlistGrid'
import WatchlistFilteredEmpty from './components/WatchlistFilteredEmpty'
import WatchlistRemovalStatus from './components/WatchlistRemovalStatus'
import './watchlist.css'

// TEMPORARY compatibility class string (NOT a component/hook) — reproduces the retired
// PrimaryAction wrapper's class output so the migrated primary <Button>s keep the legacy recipe
// (via PrimaryAction.css) until the neutral-primary recipe is reconciled.
const WATCHLIST_PRIMARY_COMPAT_CLASS = 'ts-action-primary ts-action-primary--md'

// ── Empty (whole collection) ───────────────────────────────────
function EmptyState() {
  const navigate = useNavigate()
  return (
    <section className="ff-wl-section ff-wl-empty">
      <div className="ff-wl-empty__inner">
        <Eyebrow color="var(--ts-text-secondary, #beb8ad)" size={10} style={{ marginBottom: 16 }}>Watchlist</Eyebrow>
        <h2 className="ff-wl-empty__title">Your Watchlist is open.</h2>
        <p className="ff-wl-empty__sub">Save a film when you want to remember it for another time.</p>
        <div className="ff-wl-empty__actions">
          <Button variant="primary" size="md" className={WATCHLIST_PRIMARY_COMPAT_CLASS} onClick={() => navigate('/discover')}>
            <span>Open Discover →</span>
          </Button>
          <button type="button" className="ff-wl-cta" onClick={() => navigate('/browse')}>Browse films</button>
        </div>
      </div>
    </section>
  )
}

// ── Loading ────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div role="status" aria-busy="true" className="ff-wl-section ff-wl-skeleton">
      <span className="sr-only">Loading your watchlist…</span>
      <div aria-hidden="true" className="ff-wl-skel ff-wl-skel--eyebrow animate-pulse" />
      <div aria-hidden="true" className="ff-wl-skel ff-wl-skel--title animate-pulse" />
      <div aria-hidden="true" className="ff-wl-grid">
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className="ff-wl-skel ff-wl-skel--poster animate-pulse" />)}
      </div>
    </div>
  )
}

// ── Sanitized error ────────────────────────────────────────────
function PageError({ onRetry, onHome }) {
  return (
    <div className="ff-wl-errwrap">
      <div role="alert" className="ff-wl-err">
        <Eyebrow color="var(--ts-text-secondary, #beb8ad)" size={10} style={{ marginBottom: 16 }}>Watchlist</Eyebrow>
        <h1 className="ff-wl-err__title">We couldn&rsquo;t load your Watchlist.</h1>
        <p className="ff-wl-err__sub">Your saved films are still safe. Try again in a moment.</p>
        <div className="ff-wl-err__actions">
          <Button variant="primary" size="md" className={WATCHLIST_PRIMARY_COMPAT_CLASS} onClick={onRetry}>
            <span>Try again</span>
          </Button>
          <button type="button" className="ff-wl-cta" onClick={onHome}>Go to Home</button>
        </div>
      </div>
    </div>
  )
}

// ── Shell ──────────────────────────────────────────────────────
function WatchlistShell() {
  const { items, total, availableMoods, loading, error, removeFromWatchlist, isRemoving, refresh } = useWatchlistData()
  const navigate = useNavigate()
  const { announcement, announce } = useLibraryAnnouncement()
  const { search, setSearch, mood, setMood, sort, setSort, showAll, visible } = useWatchlistRetrieval(items, availableMoods)
  const containerRef = useRef(null)
  const focusCancelRef = useRef(null)
  useEffect(() => () => focusCancelRef.current?.(), [])

  const onRemove = useCallback(async (f, triggerEl) => {
    if (isRemoving(f.id)) return
    const orderedIds = visible.map((it) => it.id)
    const targetId = nextFocusId(orderedIds, f.id)
    const res = await removeFromWatchlist(f.id)
    focusCancelRef.current?.()
    if (res.ok) {
      announce(`Removed ${f.title} from your Watchlist.`)
      focusCancelRef.current = scheduleFocus(() => findRemoveControl(containerRef.current, targetId, 'grid') || findFallback(containerRef.current))
    } else if (!res.duplicate) {
      announce(`Could not remove ${f.title}. Try again.`)
      focusCancelRef.current = scheduleFocus(() => (triggerEl && triggerEl.isConnected ? triggerEl : findRemoveControl(containerRef.current, f.id, 'grid')) || findFallback(containerRef.current))
    }
  }, [isRemoving, visible, removeFromWatchlist, announce])

  const onShowAll = useCallback(() => {
    showAll()
    announce(`${total} ${total === 1 ? 'saved film' : 'saved films'}`)
    focusCancelRef.current?.()
    focusCancelRef.current = scheduleFocus(() => containerRef.current?.querySelector('.ff-wl-search__input') || findFallback(containerRef.current))
  }, [showAll, announce, total])

  const resultCount = useMemo(() => `${visible.length} ${visible.length === 1 ? 'saved film' : 'saved films'}`, [visible.length])

  if (loading) return <PageSkeleton />
  if (error) {
    return (
      <>
        <section className="ff-wl-section ff-wl-navbar"><LibrarySectionNav current="watchlist" /></section>
        <PageError onRetry={refresh} onHome={() => navigate('/home')} />
      </>
    )
  }

  return (
    <div ref={containerRef}>
      <WatchlistRemovalStatus message={announcement} />
      <section className="ff-wl-section ff-wl-navbar"><LibrarySectionNav current="watchlist" /></section>
      <WatchlistHeader total={total} />
      {total === 0 ? (
        <EmptyState />
      ) : (
        <>
          <WatchlistRetrieval
            search={search}
            onSearch={setSearch}
            onClearSearch={() => setSearch('')}
            availableMoods={availableMoods}
            mood={mood}
            onMood={setMood}
            sort={sort}
            onSort={setSort}
          />
          <section className="ff-wl-section ff-wl-summary">
            <p className="ff-wl-summary__count">{resultCount}</p>
            <p className="ff-wl-summary__hint">Open a poster to view its Film File</p>
          </section>
          <div data-library-fallback tabIndex={-1} aria-label="Your saved films" style={{ outline: 'none' }}>
            {visible.length === 0 ? (
              <WatchlistFilteredEmpty hasSearch={!!search.trim()} hasMood={mood !== 'all'} onShowAll={onShowAll} />
            ) : (
              <section className="ff-wl-section ff-wl-collection">
                <WatchlistGrid items={visible} onRemove={onRemove} isRemoving={isRemoving} />
              </section>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function Watchlist() {
  usePageMeta({ title: 'Watchlist — FeelFlick' })
  return (
    <WatchlistDataProvider>
      <ThoughtfulRoot>
        <PageDepth depth="radial" className="ff-watchlist-v2" style={{ minHeight: '100vh', color: 'var(--ts-text-primary, #f3ecdf)', fontFamily: 'Inter, system-ui, sans-serif' }}>
          <div className="ff-wl-page">
            <WatchlistShell />
          </div>
        </PageDepth>
      </ThoughtfulRoot>
    </WatchlistDataProvider>
  )
}
