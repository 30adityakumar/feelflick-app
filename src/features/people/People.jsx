// src/features/people/People.jsx
// FeelFlick — People: a consent-led taste-discovery surface on the Adaptive Editorial Cinema
// foundation. Reads only the caller's own follows + own similarity pairs + the narrow authenticated
// identity/taste/search/FOF RPCs (no cross-user behavioral reads). Discovery candidates appear ONLY
// when opted in to taste discovery (fail-closed). Follow/Unfollow settle after persistence; Hide is
// session-local with Undo. AppShell owns the page <main> + nav. One visible <h1>.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { useNavigate } from 'react-router-dom'
import { trackEvent, EVENTS } from '@/shared/services/betaEvents'
import { isEnabled } from '@/shared/config/betaFlags'
import { PeopleDataProvider, usePeopleData } from './usePeopleData'
import { usePeopleSearch } from './hooks/usePeopleSearch'
import PeopleUnavailable from './PeopleUnavailable'
import PeopleHeader from './components/PeopleHeader'
import PeopleSearch from './components/PeopleSearch'
import FollowingSection from './components/FollowingSection'
import StrongMatches from './components/StrongMatches'
import MoreMatches from './components/MoreMatches'
import SuggestedPeople from './components/SuggestedPeople'
import PeopleSearchResults from './components/PeopleSearchResults'
import PeopleColdState from './components/PeopleColdState'
import PeopleErrorState from './components/PeopleErrorState'
import PeopleStatus from './components/PeopleStatus'
import MatchingExplainerDialog from './components/MatchingExplainerDialog'
import './people.css'

// Canonical generic invite URL — no raw user id / UUID fragment (attribution needs a separate
// server-issued token contract, not approved here).
const INVITE_URL = 'https://app.feelflick.com/'

function DiscoverySkeleton() {
  return (
    <section className="ff-people-section ff-people-rail" aria-busy="true" aria-label="Loading people">
      <div className="ff-people-grid-4">
        {[0, 1, 2, 3].map((i) => <div key={i} aria-hidden="true" className="ff-people-skel-card animate-pulse" />)}
      </div>
    </section>
  )
}

function PeopleBody() {
  const ctx = usePeopleData()
  const { user: authUser } = useAuthSession()
  const navigate = useNavigate()
  const { query, setQuery, clear, phase, results, active } = usePeopleSearch(authUser?.id)
  const [explainerOpen, setExplainerOpen] = useState(false)
  const [inviteChip, setInviteChip] = useState('')
  const explainerTrigger = useRef(null)
  const inviteTimer = useRef(null)
  useEffect(() => () => { if (inviteTimer.current) clearTimeout(inviteTimer.current) }, [])
  const flashInvite = useCallback((msg) => {
    ctx.announce(msg) // SR via the single live region
    setInviteChip(msg) // visual chip only
    if (inviteTimer.current) clearTimeout(inviteTimer.current)
    inviteTimer.current = setTimeout(() => setInviteChip(''), 2600)
  }, [ctx])

  useEffect(() => { trackEvent(EVENTS.people_opened, { surface: 'people' }) }, [])

  const openExplainer = useCallback((e) => { explainerTrigger.current = e?.currentTarget || null; setExplainerOpen(true) }, [])
  const closeExplainer = useCallback(() => {
    setExplainerOpen(false)
    const t = explainerTrigger.current
    if (t && t.isConnected) requestAnimationFrame(() => t.focus())
    explainerTrigger.current = null
  }, [])

  const onInvite = useCallback(async () => {
    const shareData = { title: 'FeelFlick — Films that know you', text: 'Compare film taste with me on FeelFlick.', url: INVITE_URL }
    try {
      if (typeof navigator !== 'undefined' && navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
        await navigator.share(shareData)
        return
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(INVITE_URL)
        flashInvite('Invite link copied.')
        return
      }
      flashInvite('Invite link copied.')
    } catch (e) {
      if (e?.name === 'AbortError') return // user cancelled the share sheet — silent
      flashInvite('Could not copy the invite link.')
    }
  }, [flashInvite])

  // Complete load error: relationship state unknowable → render the error ALONE (one <h1>).
  if (ctx.status === 'load_error') {
    return (
      <div className="ff-people-v2">
        <PeopleErrorState variant="load_error" onRetry={ctx.retry} onHome={() => navigate('/home')} />
      </div>
    )
  }

  const rawHadCandidates = ctx.strongest.length + ctx.more.length + ctx.suggested.length > 0
  const visibleCount = [...ctx.strongest, ...ctx.more, ...ctx.suggested].filter((p) => !ctx.isHidden(p.id)).length

  let discovery
  if (ctx.status === 'loading') discovery = <DiscoverySkeleton />
  else if (ctx.status === 'discovery_unavailable') discovery = <PeopleErrorState variant="discovery_unavailable" onRetry={ctx.retry} />
  else if (visibleCount === 0) discovery = <PeopleColdState variant={rawHadCandidates ? 'all-hidden' : 'no-matches'} />
  else discovery = (<><StrongMatches onExplain={openExplainer} /><MoreMatches /><SuggestedPeople /></>)

  return (
    <div className="ff-people-v2">
      {/* Single persistent relationship/status live region (follow · unfollow · hide · undo · invite). */}
      <div role="status" aria-live="polite" aria-atomic="true" className="ff-people-sr">{ctx.relStatus}</div>
      <PeopleHeader user={ctx.user} onInvite={onInvite} onExplain={openExplainer} inviteStatus={inviteChip} />
      <PeopleSearch query={query} onChange={setQuery} onClear={clear} />
      {active ? (
        <PeopleSearchResults phase={phase} results={results} onClear={clear} />
      ) : (<><FollowingSection />{discovery}</>)}
      <PeopleStatus />
      <MatchingExplainerDialog open={explainerOpen} onClose={closeExplainer} />
    </div>
  )
}

export default function People() {
  usePageMeta({ title: 'People — FeelFlick' })
  // Kill-switch: when People is disabled for beta, show an honest fallback and load NO data (the
  // provider — and every People RPC — is never mounted). Defaults to enabled.
  if (!isEnabled('people')) return <PeopleUnavailable />
  return (
    <PeopleDataProvider>
      <PeopleBody />
    </PeopleDataProvider>
  )
}
