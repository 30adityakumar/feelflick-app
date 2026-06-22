// src/features/history/History.jsx
// FeelFlick — Diary. A calm chronological record of films you watched and what you thought.
// All data is derived live from user_history × movies × user_ratings (see ./useHistoryData.jsx);
// one canonical visible row per film (latest valid watch) — no rewatch model, no per-watch rows.
//
// On the Library foundation (warm Ink + Inter), shared with the released Watchlist. Retrieval:
// private LOCAL search + URL-addressable Loved filter / sort (see ./useHistoryRetrieval.js).
// Most recent → chronological timeline; Highest rated / Runtime → truthful flat list.
// Removal is confirmed, settled (the dialog stays open until it resolves), announced, and
// focus-recovered; both the history and ratings reads are required (a failure → sanitized error).

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import PageContainer from '@/shared/ui/PageContainer'
import LibrarySectionNav from '@/features/library/LibrarySectionNav'
import { useLibraryAnnouncement } from '@/features/library/useLibraryAnnouncement'
import { scheduleFocus, findRemoveControl, findFallback, nextFocusId } from '@/features/library/focusAfterRemoval'
import { HistoryDataProvider, useHistoryData } from './useHistoryData'
import { useHistoryRetrieval } from './useHistoryRetrieval'
import DiaryHeader from './components/DiaryHeader'
import DiaryStats from './components/DiaryStats'
import DiaryRetrieval from './components/DiaryRetrieval'
import DiaryTimeline from './components/DiaryTimeline'
import DiaryFlatList from './components/DiaryFlatList'
import DiaryEmpty from './components/DiaryEmpty'
import DiaryFilteredEmpty from './components/DiaryFilteredEmpty'
import DiaryRemovalStatus from './components/DiaryRemovalStatus'
import RemoveDiaryEntryDialog from './components/RemoveDiaryEntryDialog'
import './history.css'

// Honest loading: busy status region + visually-hidden message; placeholders hidden from SR.
// Keeps the Library nav (no data dependency).
function PageSkeleton() {
  return (
    <div className="ff-diary-root">
      <LibrarySectionNav current="diary" />
      <div role="status" aria-busy="true" className="ff-diary-skeleton">
        <span className="sr-only">Loading your diary…</span>
        <div aria-hidden="true" className="ff-diary-skel ff-diary-skel--eyebrow" />
        <div aria-hidden="true" className="ff-diary-skel ff-diary-skel--title" />
        <div aria-hidden="true" className="ff-diary-skel-row">
          {[0, 1, 2, 3].map((i) => <div key={i} aria-hidden="true" className="ff-diary-skel ff-diary-skel--stat" />)}
        </div>
        <div aria-hidden="true" className="ff-diary-skel ff-diary-skel--bar" />
        {[0, 1, 2].map((i) => <div key={i} aria-hidden="true" className="ff-diary-skel ff-diary-skel--entry" />)}
      </div>
    </div>
  )
}

// Sanitized error — fixed safe copy (never a raw backend message); Try again (refresh) + Go to
// Home. role="alert", one <h1>, ≥44px buttons; keeps the Library nav. Used when EITHER the history
// or ratings read fails.
function PageError({ onRetry, onHome }) {
  return (
    <div className="ff-diary-root">
      <LibrarySectionNav current="diary" />
      <div className="ff-diary-error-wrap">
        <div role="alert" className="ff-diary-error">
          <p className="ff-diary-error__eyebrow">Diary</p>
          <h1 className="ff-diary-error__title">We couldn’t load your Diary.</h1>
          <p className="ff-diary-error__body">Your watched films and notes are still safe. Try again in a moment.</p>
          <div className="ff-diary-error__actions">
            <button type="button" onClick={onRetry} className="ff-diary-error__btn ff-diary-error__btn--primary">Try again</button>
            <button type="button" onClick={onHome} className="ff-diary-error__btn">Go to Home</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function HistoryShell() {
  const { entries, stats, loading, error, removeEntry, isRemoving, refresh } = useHistoryData()
  const navigate = useNavigate()
  const { announcement, announce } = useLibraryAnnouncement()
  const containerRef = useRef(null)
  const focusCancelRef = useRef(null)
  const toastTimerRef = useRef(null)
  useEffect(() => () => { focusCancelRef.current?.(); if (toastTimerRef.current) clearTimeout(toastTimerRef.current) }, [])

  const { search, setSearch, filter, setFilter, sort, setSort, showAll, visible, grouped } =
    useHistoryRetrieval(entries)

  // Pending removal awaiting / undergoing confirmation: { entry, triggerEl }.
  const [pendingRemoval, setPendingRemoval] = useState(null)
  // Dialog state machine: 'idle' | 'removing' | 'error'.
  const [removalStatus, setRemovalStatus] = useState('idle')
  // Visual-only success toast (the live region is the SR authority).
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, tone) => {
    setToast({ message, tone })
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 4000)
  }, [])

  const requestRemove = useCallback((entry, triggerEl) => {
    if (isRemoving(entry.id)) return
    setRemovalStatus('idle')
    setPendingRemoval({ entry, triggerEl: triggerEl || document.activeElement })
  }, [isRemoving])

  const cancelRemove = useCallback(() => {
    if (removalStatus === 'removing') return
    const trigger = pendingRemoval?.triggerEl
    setPendingRemoval(null)
    setRemovalStatus('idle')
    focusCancelRef.current?.()
    focusCancelRef.current = scheduleFocus(() => (trigger && trigger.isConnected ? trigger : null))
  }, [pendingRemoval, removalStatus])

  const confirmRemove = useCallback(async () => {
    const p = pendingRemoval
    if (!p || removalStatus === 'removing') return
    const e = p.entry
    setRemovalStatus('removing') // dialog STAYS OPEN, busy, until the delete settles
    const orderedIds = visible.map((x) => x.id)
    const targetId = nextFocusId(orderedIds, e.id)
    const res = await removeEntry(e.id) // deletes only user_history rows for this film; ratings/review untouched
    focusCancelRef.current?.()
    if (res.ok || res.duplicate) {
      setPendingRemoval(null)
      setRemovalStatus('idle')
      announce(`Removed ${e.title} from your Diary.`)
      showToast(`Removed ${e.title} from your Diary.`, 'ok')
      focusCancelRef.current = scheduleFocus(() =>
        findRemoveControl(containerRef.current, targetId, 'diary') || findFallback(containerRef.current))
    } else {
      // Keep the dialog OPEN in the error state; the row is retained.
      setRemovalStatus('error')
      announce(`Could not remove ${e.title} from your Diary. Try again.`)
    }
  }, [pendingRemoval, removalStatus, visible, removeEntry, announce, showToast])

  const handleShowAll = useCallback(() => {
    showAll()
    announce(`Showing all ${stats.totalLogged} ${stats.totalLogged === 1 ? 'film' : 'films'}.`)
    focusCancelRef.current?.()
    focusCancelRef.current = scheduleFocus(() => containerRef.current?.querySelector('input[type="search"]'))
  }, [showAll, announce, stats.totalLogged])

  if (loading) return <PageSkeleton />
  if (error) return <PageError onRetry={refresh} onHome={() => navigate('/home')} />

  // Completely-empty Diary: masthead + nav + zero stats remain; retrieval is hidden.
  if (stats.totalLogged === 0) {
    return (
      <div className="ff-diary-root">
        <LibrarySectionNav current="diary" />
        <DiaryHeader />
        <DiaryStats stats={stats} />
        <DiaryEmpty />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="ff-diary-root">
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announcement}</div>
      <LibrarySectionNav current="diary" />
      <DiaryHeader />
      <DiaryStats stats={stats} />
      <DiaryRetrieval
        search={search}
        onSearch={setSearch}
        onClearSearch={() => setSearch('')}
        filter={filter}
        onFilter={setFilter}
        sort={sort}
        onSort={setSort}
      />
      <div data-library-fallback tabIndex={-1} aria-label="Your diary entries" className="ff-diary-collection">
        {visible.length === 0 ? (
          <DiaryFilteredEmpty hasSearch={!!search.trim()} loved={filter === 'loved'} onShowAll={handleShowAll} />
        ) : grouped ? (
          <DiaryTimeline entries={visible} onRemove={requestRemove} isRemoving={isRemoving} />
        ) : (
          <DiaryFlatList entries={visible} sort={sort} onRemove={requestRemove} isRemoving={isRemoving} />
        )}
      </div>
      <DiaryRemovalStatus message={toast?.message} tone={toast?.tone} />
      {pendingRemoval && (
        <RemoveDiaryEntryDialog
          title={pendingRemoval.entry.title}
          status={removalStatus}
          onConfirm={confirmRemove}
          onCancel={cancelRemove}
        />
      )}
    </div>
  )
}

export default function History() {
  usePageMeta({ title: 'Diary — FeelFlick' })
  return (
    <HistoryDataProvider>
      <div className="ff-history-v2">
        <PageContainer size="wide" padding="none">
          <HistoryShell />
        </PageContainer>
      </div>
    </HistoryDataProvider>
  )
}
