// src/features/dna/DnaPage.jsx
// /profile + /profile/:userId — the cinematic social profile. Renders inside AppShell (which owns the
// shared header + bottom nav), so there is NO second top bar. Owner reads their own data directly;
// a visitor reads a profilePublic-gated projection via RPC. "View as visitor" previews the owner's
// own public projection locally. All data is real or honest-empty.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { trackEvent, EVENTS } from '@/shared/services/betaEvents'
import { AccountDataProvider, useAccountData } from '@/features/account/useAccountData'
import { PeopleDataProvider, usePeopleData } from '@/features/people/usePeopleData'
import { resolveSectionVisibility } from './derive/dnaProfileDerivations'
import { useDnaProfileData } from './useDnaProfileData'
import { useDnaSocialActions } from './useDnaSocialActions'
import DnaCover from './components/DnaCover'
import DnaIdentityHeader from './components/DnaIdentityHeader'
import DnaSignature from './components/DnaSignature'
import DnaHighlights from './components/DnaHighlights'
import DnaTabs from './components/DnaTabs'
import DnaStats from './components/DnaStats'
import DnaFeatured from './components/DnaFeatured'
import DnaReputation from './components/DnaReputation'
import DnaActivity from './components/DnaActivity'
import DnaFilmsTab from './components/DnaFilmsTab'
import DnaDiaryTab from './components/DnaDiaryTab'
import DnaReviewsTab from './components/DnaReviewsTab'
import DnaListsTab from './components/DnaListsTab'
import DnaFullTab from './components/DnaFullTab'
import DnaConnectionsTab from './components/DnaConnectionsTab'
import DnaEditSheet from './components/DnaEditSheet'
import DnaHighlightViewer from './components/DnaHighlightViewer'
import DnaCompareDialog from './components/DnaCompareDialog'
import DnaShareDialog from './components/DnaShareDialog'
import './dna.css'

const TABS = [
  { id: 'profile', label: 'Profile' }, { id: 'films', label: 'Films' }, { id: 'diary', label: 'Diary' },
  { id: 'reviews', label: 'Reviews' }, { id: 'lists', label: 'Lists' }, { id: 'dna', label: 'DNA' },
  { id: 'connections', label: 'Connections' },
]
const VALID_TABS = new Set(TABS.map((t) => t.id))
const first = (name) => (name || '').trim().split(/\s+/)[0] || ''

function StateShell({ children, label }) {
  return <div className="dna"><div className="dna__shell dna-state" role="status" aria-live="polite" aria-label={label}>{children}</div></div>
}

function DnaInner() {
  const { userId } = useParams()
  const { user: viewer } = useAuthSession()
  const { serverSettings, profile: ownerProfile } = useAccountData()
  const people = usePeopleData()
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewAsVisitor, setViewAsVisitor] = useState(false)
  const [dialog, setDialog] = useState(null) // 'edit' | 'compare' | 'share' | 'highlight'
  const [highlightIdx, setHighlightIdx] = useState(0)
  const [toast, setToast] = useState(null)

  const { status, model, isSelf, retry } = useDnaProfileData({ userId, viewer, ownerSettings: serverSettings, ownerProfile })
  // Real social-proof actions (endorse / like / save). Owner (or self-in-preview) can't self-act.
  const social = useDnaSocialActions({ targetId: userId || viewer?.id, viewerId: viewer?.id, isOwner: isSelf, initial: model?.social })

  const showToast = useCallback((msg) => {
    setToast(msg); window.clearTimeout(showToast._t); showToast._t = window.setTimeout(() => setToast(null), 2400)
  }, [])

  const activeTab = VALID_TABS.has(searchParams.get('tab')) ? searchParams.get('tab') : 'profile'
  const setTab = useCallback((id) => {
    setSearchParams((prev) => { const n = new URLSearchParams(prev); if (id === 'profile') n.delete('tab'); else n.set('tab', id); return n }, { replace: false })
    trackEvent(EVENTS.dna_profile_tab_changed, { tab: id, is_owner: isSelf })
  }, [setSearchParams, isSelf])

  usePageMeta({ title: model?.identity?.name ? `${isSelf ? 'Your' : `${first(model.identity.name)}’s`} Cinematic DNA — FeelFlick` : 'Cinematic DNA — FeelFlick' })

  useEffect(() => { if (status === 'ready') trackEvent(EVENTS.dna_profile_viewed, { is_owner: isSelf }) }, [status, isSelf])

  // Viewer↔target relationship (from the viewer's own similarity graph) — for a visitor view.
  const rel = useMemo(() => {
    if (isSelf || !userId) return null
    const found = [...(people.strongest || []), ...(people.more || [])].find((c) => c.id === userId)
    return found ? { overlap: found.match ?? null, filmsInCommon: found.inCommon ?? null } : null
  }, [isSelf, userId, people.strongest, people.more])

  if (status === 'loading') {
    return (
      <div className="dna">
        <div className="dna-skel" style={{ height: 'clamp(220px,30vw,400px)' }} />
        <div className="dna__shell" style={{ marginTop: 24, display: 'grid', gap: 16 }}>
          <div className="dna-skel" style={{ height: 120 }} /><div className="dna-skel" style={{ height: 320 }} />
        </div>
      </div>
    )
  }
  if (status === 'private') {
    return <StateShell label="Private profile"><div><p className="dna__eyebrow">Cinematic DNA</p><h1>This member keeps their profile private.</h1><p>Only members who’ve made their DNA profile public appear here.</p></div></StateShell>
  }
  if (status === 'error' || !model) {
    return <StateShell label="Profile error"><div><p className="dna__eyebrow">Cinematic DNA</p><h1>This profile couldn’t be loaded.</h1><button type="button" className="dna-btn dna-btn--primary" onClick={retry}>Try again</button></div></StateShell>
  }

  const ownerChrome = isSelf && !viewAsVisitor
  const sections = ownerChrome ? model.sections : resolveSectionVisibility({ visibility: model.visibility, isOwner: false })
  const fn = first(model.identity.name)
  const highlights = model.highlights || []

  const actions = ownerChrome ? (
    <>
      <button type="button" className="dna-btn dna-btn--primary" onClick={() => { setDialog('edit'); trackEvent(EVENTS.dna_profile_edit_opened) }}>Edit profile</button>
      <button type="button" className="dna-btn dna-btn--secondary" onClick={() => setViewAsVisitor(true)}>View as visitor</button>
      <button type="button" className="dna-iconbtn" onClick={() => setDialog('share')} aria-label="Share profile">↗</button>
    </>
  ) : isSelf ? (
    <button type="button" className="dna-btn dna-btn--secondary" onClick={() => setViewAsVisitor(false)}>Exit visitor view</button>
  ) : (
    <>
      <FollowButton people={people} targetId={userId} name={model.identity.name} onDone={() => trackEvent(EVENTS.dna_profile_follow_succeeded)} />
      <button type="button" className="dna-btn dna-btn--secondary" onClick={() => { setDialog('compare'); trackEvent(EVENTS.dna_profile_compare_opened) }}>Compare taste</button>
      <button type="button" className="dna-iconbtn" onClick={() => setDialog('share')} aria-label="Share profile">↗</button>
    </>
  )

  const openHighlight = (h) => { setHighlightIdx(Math.max(0, highlights.findIndex((x) => x.key === h.key))); setDialog('highlight') }

  // followers/following: owner (or self-in-preview) from the viewer's own social graph; visitor
  // from the profilePublic-gated RPC counts.
  const followersCount = isSelf ? (people.user?.followers ?? 0) : (model.identity.followersTotal ?? 0)
  const followingCount = isSelf ? (people.user?.following ?? 0) : (model.identity.followingTotal ?? 0)
  const identityStats = { films: model.stats.filmsWatched, reviews: model.stats.reviews, followers: followersCount, following: followingCount }

  return (
    <div className="dna">
      {isSelf && viewAsVisitor && (
        <div className="dna-preview-banner" role="status">
          <span>Preview — how your profile looks to others with your current publication settings.</span>
          <button type="button" className="dna-btn dna-btn--secondary" onClick={() => setViewAsVisitor(false)}>Exit preview</button>
        </div>
      )}
      <DnaCover films={model.featured?.cover || []} curated={(model.dnaProfile?.coverMovieIds?.length || 0) > 0} firstName={fn} isOwner={ownerChrome} chapter={model.currentChapter} />
      <DnaIdentityHeader identity={model.identity} stats={identityStats} actions={actions} />
      <DnaSignature dna={model.dna} stats={model.stats} isOwner={ownerChrome} onOpenDna={() => setTab('dna')} />
      <DnaHighlights highlights={highlights} onOpen={openHighlight} />

      <DnaTabs tabs={TABS} active={activeTab} onChange={setTab} />

      <div role="tabpanel" id={`dna-panel-${activeTab}`} aria-labelledby={`dna-tab-${activeTab}`} tabIndex={-1}>
        {activeTab === 'profile' && (
          <>
            <DnaStats firstName={fn} stats={model.stats} charts={model.charts} isOwner={ownerChrome} sections={sections} />
            <DnaFeatured featured={model.featured} firstName={fn} isOwner={ownerChrome} social={social} />
            <DnaReputation firstName={fn} isOwner={ownerChrome} knownFor={model.reputationKnownFor} directors={model.directors}
              social={social} followers={followersCount} />
            <DnaActivity activity={model.activity} firstName={fn} isOwner={ownerChrome} />
          </>
        )}
        {activeTab === 'films' && <DnaFilmsTab films={model.films} visible={sections.films} isOwner={ownerChrome} />}
        {activeTab === 'diary' && <DnaDiaryTab diary={model.diary} visible={sections.diary} isOwner={ownerChrome} />}
        {activeTab === 'reviews' && <DnaReviewsTab reviews={model.reviews} visible={sections.reviews} isOwner={ownerChrome} social={social} />}
        {activeTab === 'lists' && <DnaListsTab lists={model.lists} visible={sections.lists} isOwner={ownerChrome} social={social} />}
        {activeTab === 'dna' && <DnaFullTab dna={model.dna} moods={model.moods} directors={model.directors} ratingLanguage={model.charts.ratingLanguage} currentChapter={model.currentChapter} emergingEdge={model.emergingEdge} stats={model.stats} joinedAt={model.identity.joinedAt} isOwner={ownerChrome} firstName={fn} />}
        {activeTab === 'connections' && (
          <DnaConnectionsTab visible={sections.connections} isOwner={ownerChrome}
            connections={ownerChrome
              ? { strongest: (people.strongest || []).slice(0, 6).map((c) => ({ id: c.id, name: c.name, overlap: c.match ?? null, filmsInCommon: null })), following: people.followingList || [] }
              : { strongest: rel ? [{ id: userId, name: model.identity.name, overlap: rel.overlap, filmsInCommon: rel.filmsInCommon }] : [], following: [] }} />
        )}
      </div>

      {ownerChrome && <DnaEditSheet open={dialog === 'edit'} onClose={() => setDialog(null)} films={model.films} reviews={model.reviews} lists={model.lists} onToast={showToast} />}
      <DnaHighlightViewer open={dialog === 'highlight'} highlights={highlights} index={highlightIdx} onIndex={setHighlightIdx} onClose={() => setDialog(null)} />
      {!isSelf && <DnaCompareDialog open={dialog === 'compare'} onClose={() => setDialog(null)} viewerName={first(viewer?.user_metadata?.full_name || viewer?.user_metadata?.name || 'You')} targetName={fn} compare={{ overlap: rel?.overlap ?? null, filmsInCommon: rel?.filmsInCommon ?? null, shared: [], different: [] }} />}
      <DnaShareDialog open={dialog === 'share'} onClose={() => setDialog(null)} identity={model.identity} dna={model.dna} isOwner={ownerChrome} targetUserId={userId || viewer?.id} onToast={showToast} />

      <div aria-live="polite" role="status" style={{ position: 'fixed', bottom: 90, left: '50%', transform: `translateX(-50%) translateY(${toast ? 0 : 20}px)`, opacity: toast ? 1 : 0, transition: 'opacity .2s, transform .2s', pointerEvents: 'none', background: 'var(--color-action-primary-fill,#f0ece4)', color: 'var(--color-action-primary-text,#0f1010)', padding: '10px 14px', borderRadius: 10, fontSize: '.78rem', fontWeight: 700, zIndex: 60 }}>{toast}</div>
    </div>
  )
}

function FollowButton({ people, targetId, name, onDone }) {
  const isFollowing = people.followingIds?.has(targetId)
  return (
    <button type="button" className={`dna-btn ${isFollowing ? 'dna-btn--secondary' : 'dna-btn--primary'}`}
      aria-pressed={isFollowing}
      onClick={() => { isFollowing ? people.unfollow(targetId, name) : people.follow(targetId, name); onDone?.() }}>
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}

export default function DnaPage() {
  return (
    <AccountDataProvider>
      <PeopleDataProvider>
        <DnaInner />
      </PeopleDataProvider>
    </AccountDataProvider>
  )
}
