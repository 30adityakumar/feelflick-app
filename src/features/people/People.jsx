// src/features/people/People.jsx
// FeelFlick — People: consent-led taste-match discovery (F8.2–F8.7). Reads only the caller's own
// follows + own similarity pairs + the narrow authenticated identity/search/FOF RPCs (no cross-user
// behavioral reads). Follow/Unfollow settle only after persistence (F8.4); Hide is session-local.
// AppShell owns the page <main> + nav.

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import Eyebrow from '@/shared/ui/Eyebrow'
import { HP, HP_GRAD } from './data'
import { PeopleDataProvider, usePeopleData } from './usePeopleData'
import { trackEvent, EVENTS, queryLengthBucket } from '@/shared/services/betaEvents'
import { isEnabled } from '@/shared/config/betaFlags'
import PeopleUnavailable from './PeopleUnavailable'
import { nextFocusId, scheduleFocus } from './hooks/usePeopleFollowActions'
import './people.css'

const RESET_BTN = { background: 'none', border: 'none', padding: 0, margin: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left' }

// F8.7: hardened muted label colour for small (10–12px) load-bearing People text. The HP.textMuted
// token (rgba(250,250,250,0.45)) is ~4.1:1 on the #06060a canvas → fails WCAG AA for small text; INK
// at 0.62 is ~7.3:1 (AA + AAA), matching Profile's proven INK_LABEL value without coupling to it.
const INK = 'rgba(250,250,250,0.62)'

// Avatar — renders the user's uploaded image when available, falls back to a colored initial circle.
// Used by every twin/rising/suggested/search card; decorative within cards (alt="" — the name is
// adjacent text), so it renders as a plain image, not an interactive control.
function Avatar({ url, initial, bg, size = 48, onClick, alt }) {
  const dim = { width: size, height: size }
  const ring = { ...dim, borderRadius: 999, overflow: 'hidden', flex: 'none' }
  const fallback = (
    <div style={{ ...ring, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit', fontWeight: 700, color: '#0a0510', fontSize: Math.round(size * 0.42) }}>
      {initial}
    </div>
  )
  const inner = url
    ? <img src={url} alt={alt || ''} referrerPolicy="no-referrer" style={{ ...dim, objectFit: 'cover', display: 'block', borderRadius: 999 }} />
    : fallback
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-label={alt} style={{ ...RESET_BTN, ...ring, padding: 0 }}>
        {inner}
      </button>
    )
  }
  return inner
}

function Masthead({ onSearch, query, setQuery }) {
  const { user } = usePeopleData()
  const { user: authUser } = useAuthSession()
  const [inviteToast, setInviteToast] = useState(null)

  async function handleInvite() {
    // Real wire: Web Share API on supporting devices (mobile), clipboard
    // copy elsewhere. `?ref=<uid>` is a tracking marker for an attribution
    // attempt — future server can credit the referrer when the visitor
    // signs up. For now the URL is just shared; nothing breaks if the
    // server doesn't act on it yet.
    const url = authUser?.id
      ? `https://feelflick.com/?ref=${authUser.id}`
      : 'https://feelflick.com/'
    const shareData = {
      title: 'FeelFlick — Films that know you',
      text: `${user.name || 'A friend'} thinks you'd like FeelFlick. Want to compare taste?`,
      url,
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
        await navigator.share(shareData)
        return
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        setInviteToast('Invite link copied')
        setTimeout(() => setInviteToast(null), 2400)
        return
      }
      // Last-ditch fallback: prompt the user with the URL
      if (typeof window !== 'undefined') window.prompt('Copy this invite link', url)
    } catch (e) {
      // share() throws AbortError when user cancels — silent
      if (e?.name !== 'AbortError') {
        setInviteToast('Couldn’t copy')
        setTimeout(() => setInviteToast(null), 2400)
      }
    }
  }

  return (
    <section className="ff-people-section ff-people-masthead" style={{ padding: '72px 88px 32px', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 50% 30% at 10% 0%, rgba(236,72,153,0.10), transparent 60%)' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
          <Eyebrow spacing="0.32em" size={10}>People</Eyebrow>
          <div style={{ height: 1, width: 38, background: HP.purple, opacity: 0.5 }} />
          <Eyebrow tone="meta" weight={500} size={10}>{user.following} following · {user.followers} followers</Eyebrow>
        </div>
        <h1 className="ff-people-hero" style={{ fontFamily: 'Outfit', fontSize: 88, lineHeight: 0.92, fontWeight: 300, letterSpacing: '-0.05em', color: HP.text, margin: 0, textWrap: 'balance' }}>
          Your <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>taste matches.</em>
        </h1>
        <p style={{ marginTop: 18, fontFamily: 'Outfit, Inter, sans-serif', fontSize: 17, color: HP.textSoft, fontStyle: 'italic', maxWidth: 680, lineHeight: 1.55 }}>
          People whose film taste overlaps with yours — an estimate from your film activity, not a relationship.
        </p>
        <form
          onSubmit={(e) => { e.preventDefault(); onSearch(query) }}
          className="ff-people-search-form"
          style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            aria-label="Search for users by name"
            className="ff-people-search-input"
            style={{ flex: 1, minWidth: 200, maxWidth: 480, minHeight: 44, padding: '12px 18px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${HP.border}`, color: HP.text, fontFamily: 'Outfit, Inter, sans-serif', fontSize: 14 }}
          />
          <button
            type="button"
            onClick={handleInvite}
            aria-label="Invite a friend to FeelFlick"
            className="ff-people-invite-btn"
            style={{ minHeight: 44, padding: '0 20px', borderRadius: 8, background: HP_GRAD, border: 'none', color: '#fff', fontFamily: 'Outfit', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', cursor: 'pointer' }}
          >
            Invite a friend
          </button>
          {inviteToast && (
            <span aria-live="polite" style={{ fontSize: 11, color: HP.green, fontFamily: 'Outfit', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
              ✓ {inviteToast}
            </span>
          )}
        </form>
      </div>
    </section>
  )
}

function MatchBar({ pct, hex = '#A78BFA' }) {
  return (
    <div style={{ height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${hex}, ${HP.pink})` }} />
    </div>
  )
}

function FollowBtn({ id, following, pending, errored, name, onFollow, onUnfollow, style }) {
  // Text reflects the SETTLED state: it never reads "Following" until the DB write succeeds.
  const label = pending ? (following ? 'Unfollowing…' : 'Following…') : errored ? 'Try again' : following ? 'Following' : 'Follow'
  return (
    <button
      type="button"
      onClick={() => (following ? onUnfollow() : onFollow())}
      disabled={pending}
      aria-pressed={following}
      aria-busy={pending}
      aria-label={`${following ? 'Unfollow' : 'Follow'} ${name || 'this person'}`}
      data-follow-target={id}
      className="ff-people-followbtn"
      style={{
        minHeight: 44,
        minWidth: 44,
        padding: '0 16px',
        borderRadius: 999,
        background: following ? 'transparent' : HP_GRAD,
        border: following ? `1px solid ${HP.border}` : 'none',
        color: following ? HP.textSoft : '#fff',
        fontFamily: 'Outfit',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: pending ? 'wait' : 'pointer',
        opacity: pending ? 0.7 : 1,
        ...style,
      }}
    >
      {label}
    </button>
  )
}

// Quiet tertiary "Hide" on discovery cards. NOT a block: it only removes the suggestion from the
// caller's current People session (no account change, no notification, no relationship/similarity change).
function HideBtn({ onHide, name }) {
  return (
    <button
      type="button"
      onClick={onHide}
      aria-label={`Hide ${name || 'this person'} from your suggestions`}
      className="ff-people-hidebtn"
      style={{ minHeight: 44, minWidth: 44, padding: '0 10px', background: 'transparent', border: 'none', color: INK, fontFamily: 'Outfit', fontSize: 10, letterSpacing: '0.04em', cursor: 'pointer' }}
    >
      Hide
    </button>
  )
}

// Coordinates session-local hide + deterministic focus recovery for one rail of visible cards.
// Returns a container ref (stamped on the rail's grid) + an onHide(id) handler.
function useRailHide(visibleCards) {
  const { hideSuggestion } = usePeopleData()
  const containerRef = useRef(null)
  const cancelFocus = useRef(null)
  useEffect(() => () => { if (cancelFocus.current) cancelFocus.current() }, [])
  const onHide = useCallback((id) => {
    const nextId = nextFocusId(visibleCards.map(c => c.id), id)
    hideSuggestion(id)
    if (cancelFocus.current) cancelFocus.current()
    cancelFocus.current = scheduleFocus(() => {
      const c = containerRef.current
      if (!c) return null
      // focus the next card's Follow control (stable id, never name); else the rail container.
      return (nextId && c.querySelector(`[data-follow-target="${nextId}"]`)) || c
    })
  }, [visibleCards, hideSuggestion])
  return { containerRef, onHide }
}

function TwinsRail() {
  const { twins, follow, unfollow, isPending, isErrored, isHidden, loading } = usePeopleData()
  const visibleTwins = twins.filter(p => !isHidden(p.id))
  const { containerRef, onHide } = useRailHide(visibleTwins)

  return (
    <section className="ff-people-section ff-people-twins" aria-labelledby="ff-people-twins-h" style={{ padding: '24px 88px 56px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <Eyebrow rule size={10} style={{ marginBottom: 12 }}>Strongest matches</Eyebrow>
          <h2 id="ff-people-twins-h" className="ff-people-h2" style={{ fontFamily: 'Outfit', fontSize: 36, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0 }}>
            People who <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>get it.</em>
          </h2>
        </div>
      </div>
      {loading ? (
        <div className="ff-people-grid-4" aria-busy="true" aria-label="Loading people" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} aria-hidden="true" style={{ height: 220, borderRadius: 8, background: 'rgba(255,255,255,0.025)', border: `1px solid ${HP.border}` }} className="animate-pulse" />
          ))}
        </div>
      ) : visibleTwins.length === 0 ? (
        // F8.5: no fabricated Popular fallback — when nobody is discoverable (or all are hidden), show
        // the honest empty state rather than a dead popularity rail.
        <ColdStartHero />
      ) : (
        <div ref={containerRef} tabIndex={-1} className="ff-people-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, outline: 'none' }}>
          {visibleTwins.map(p => (
            <article key={p.id} className="ff-people-twin-card" style={{ padding: '26px 24px', borderRadius: 8, background: 'rgba(255,255,255,0.025)', border: `1px solid ${HP.border}`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 999, background: `radial-gradient(circle, ${p.avatarBg}33, transparent 70%)`, filter: 'blur(8px)' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 12 }}>
                  <Avatar url={p.avatarUrl} initial={p.initial} bg={p.avatarBg} size={48} alt="" />
                  <div style={{ textAlign: 'right', maxWidth: 150 }}>
                    <div style={{ fontFamily: 'Outfit', fontSize: 14, fontWeight: 500, color: p.matchPresentation.qualified ? HP.text : INK, letterSpacing: '-0.01em', lineHeight: 1.25 }}>{p.matchPresentation.band || p.matchPresentation.caption}</div>
                    {p.matchPresentation.evidence && <div style={{ fontSize: 10, color: INK, fontFamily: 'Outfit', marginTop: 3 }}>{p.matchPresentation.evidence}</div>}
                  </div>
                </div>
                {p.matchPresentation.qualified && <div aria-hidden="true"><MatchBar pct={p.match} hex={p.avatarBg} /></div>}
                <div style={{ marginTop: 16, fontFamily: 'Outfit', fontSize: 18, fontWeight: 500, color: HP.text, letterSpacing: '-0.015em' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: INK, fontFamily: 'Outfit', marginTop: 2 }}>{p.handle}</div>
                {p.bio && <p style={{ margin: '12px 0 0 0', fontSize: 12, color: HP.textSoft, fontFamily: 'Outfit, Inter, sans-serif', lineHeight: 1.5 }}>{p.bio}</p>}
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${HP.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  {!p.following && <HideBtn onHide={() => onHide(p.id)} name={p.name} />}
                  <FollowBtn id={p.id} following={p.following} pending={isPending(p.id)} errored={isErrored(p.id)} name={p.name} onFollow={() => follow(p.id, p.name)} onUnfollow={() => unfollow(p.id, p.name)} style={{ marginLeft: 'auto' }} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

// F8.5: honest empty state — no one discoverable yet (or all suggestions hidden this session). No
// fabricated Popular/Activity fallback is shown to avoid an empty page.
function ColdStartHero() {
  return (
    <EmptyState
      label="No taste matches yet"
      body="Rate a dozen films and we'll surface people whose film taste overlaps with yours."
    />
  )
}

function Rising() {
  const { rising, follow, unfollow, isPending, isErrored, isHidden, loading } = usePeopleData()
  const visibleRising = rising.filter(p => !isHidden(p.id))
  if (!loading && visibleRising.length === 0) return null

  return (
    <section className="ff-people-section ff-people-rising" aria-labelledby="ff-people-rising-h" style={{ padding: '48px 88px', borderTop: `1px solid ${HP.border}`, background: 'rgba(255,255,255,0.012)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Eyebrow rule size={10} style={{ marginBottom: 12 }}>More matches</Eyebrow>
          <h2 id="ff-people-rising-h" className="ff-people-h2-sm" style={{ fontFamily: 'Outfit', fontSize: 30, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0 }}>More people to <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>discover.</em></h2>
        </div>
      </div>
      <div className="ff-people-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {visibleRising.map(p => (
          <div key={p.id} style={{ padding: '18px 20px', borderRadius: 6, background: 'rgba(255,255,255,0.025)', border: `1px solid ${HP.border}`, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 16, alignItems: 'center' }}>
            <Avatar url={p.avatarUrl} initial={p.initial} bg={p.avatarBg} size={42} alt="" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'Outfit', fontSize: 14, fontWeight: 500, color: HP.text }}>{p.name}</div>
              <div style={{ fontSize: 11, color: INK, fontFamily: 'Outfit', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.bio}</div>
              {p.matchPresentation.qualified && <div style={{ marginTop: 8 }} aria-hidden="true"><MatchBar pct={p.match} hex={p.avatarBg} /></div>}
              <div style={{ marginTop: 6, fontSize: 10, color: INK, fontFamily: 'Outfit', letterSpacing: '0.04em' }}>{p.matchPresentation.evidence || p.matchPresentation.band || p.matchPresentation.caption}</div>
            </div>
            <FollowBtn id={p.id} following={p.following} pending={isPending(p.id)} errored={isErrored(p.id)} name={p.name} onFollow={() => follow(p.id, p.name)} onUnfollow={() => unfollow(p.id, p.name)} />
          </div>
        ))}
      </div>
    </section>
  )
}

function Suggested() {
  const { suggested, follow, unfollow, isPending, isErrored, isHidden, loading } = usePeopleData()
  const visibleSuggested = suggested.filter(p => !isHidden(p.id))
  const { containerRef, onHide } = useRailHide(visibleSuggested)
  if (!loading && visibleSuggested.length === 0) return null

  return (
    <section className="ff-people-section ff-people-suggested" aria-labelledby="ff-people-suggested-h" style={{ padding: '56px 88px', borderTop: `1px solid ${HP.border}` }}>
      <div style={{ marginBottom: 24 }}>
        <Eyebrow size={10} style={{ marginBottom: 12 }}>Suggested</Eyebrow>
        <h2 id="ff-people-suggested-h" className="ff-people-h2-sm" style={{ fontFamily: 'Outfit', fontSize: 30, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0 }}>People you <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>might know.</em></h2>
      </div>
      <div ref={containerRef} tabIndex={-1} className="ff-people-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, outline: 'none' }}>
        {visibleSuggested.map(p => (
          <div key={p.id} style={{ padding: '18px 20px', borderRadius: 6, background: 'rgba(255,255,255,0.025)', border: `1px solid ${HP.border}`, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 16, alignItems: 'center' }}>
            <Avatar url={p.avatarUrl} initial={p.initial} bg={p.avatarBg} size={42} alt="" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'Outfit', fontSize: 15, fontWeight: 500, color: HP.text }}>{p.name}</div>
              <div style={{ fontSize: 11, color: INK, fontFamily: 'Outfit', marginTop: 2 }}>
                {p.viaFriend
                  ? <>via <span style={{ color: HP.text }}>{p.viaFriend}</span>{p.matchPresentation?.band ? <> · {p.matchPresentation.band}</> : null}</>
                  : <>{p.matchPresentation?.evidence || p.matchPresentation?.band || p.matchPresentation?.caption || 'Suggested for you'}</>}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
              <FollowBtn id={p.id} following={false} pending={isPending(p.id)} errored={isErrored(p.id)} name={p.name} onFollow={() => follow(p.id, p.name)} onUnfollow={() => unfollow(p.id, p.name)} />
              <HideBtn onHide={() => onHide(p.id)} name={p.name} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function SearchResults({ results, loading, onClear }) {
  const { followingIds, follow, unfollow, isPending, isErrored } = usePeopleData()
  return (
    <section className="ff-people-section ff-people-search-results" aria-labelledby="ff-people-search-h" style={{ padding: '24px 88px 56px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
        <div>
          <Eyebrow size={10} style={{ marginBottom: 12 }}>Search results</Eyebrow>
          <h2 id="ff-people-search-h" className="ff-people-h2-sm" style={{ fontFamily: 'Outfit', fontSize: 30, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0 }}>{results.length} match{results.length === 1 ? '' : 'es'}</h2>
        </div>
        <button type="button" onClick={onClear} aria-label="Clear search results" className="ff-people-clear-btn" style={{ ...RESET_BTN, minHeight: 44, minWidth: 44, padding: '0 12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: INK, fontFamily: 'Outfit', letterSpacing: '0.08em', textTransform: 'uppercase', flex: 'none' }}>Clear ×</button>
      </div>
      {loading ? (
        <div style={{ fontSize: 13, color: INK, fontFamily: 'Outfit, Inter, sans-serif' }}>Searching…</div>
      ) : results.length === 0 ? (
        <div style={{ fontSize: 14, color: INK, fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic' }}>No people found. Try a different name.</div>
      ) : (
        <div className="ff-people-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {results.map(u => (
            <div key={u.id} style={{ padding: '18px 20px', borderRadius: 6, background: 'rgba(255,255,255,0.025)', border: `1px solid ${HP.border}`, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, alignItems: 'center' }}>
              <Avatar url={u.avatarUrl} initial={u.initial} bg={u.avatarBg} size={42} alt="" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'Outfit', fontSize: 15, fontWeight: 500, color: HP.text }}>{u.name}</div>
                <div style={{ fontSize: 11, color: INK, fontFamily: 'Outfit', marginTop: 2 }}>{u.handle}</div>
              </div>
              <FollowBtn id={u.id} following={followingIds.has(u.id)} pending={isPending(u.id)} errored={isErrored(u.id)} name={u.name} onFollow={() => follow(u.id, u.name)} onUnfollow={() => unfollow(u.id, u.name)} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function EmptyState({ label, body }) {
  return (
    <div style={{ border: `1px dashed ${HP.border}`, borderRadius: 12, padding: '32px 24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ fontFamily: 'Outfit', fontSize: 14, fontWeight: 500, color: HP.text, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'Outfit, Inter, sans-serif', fontSize: 13, color: INK, maxWidth: 420, margin: '0 auto', lineHeight: 1.55 }}>{body}</div>
    </div>
  )
}

function avatarBg(id) {
  const palette = ['#A78BFA', '#F472B6', '#7DD3FC', '#FBBF24', '#34D399', '#C084FC', '#F59FA8']
  if (!id) return palette[0]
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
  return palette[Math.abs(hash) % palette.length]
}

function PeopleV2Body() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const { user: authUser } = useAuthSession()
  const { relStatus } = usePeopleData()

  // B1.3: privacy-safe open signal (no ids/names).
  useEffect(() => { trackEvent(EVENTS.people_opened, { surface: 'people' }) }, [])

  // Debounce 300ms
  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery('')
      setResults([])
      return
    }
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  // Run search
  useEffect(() => {
    if (!debouncedQuery || !authUser?.id) {
      setResults([])
      return
    }
    let abort = false
    setSearching(true)
    ;(async () => {
      try {
        // F8.2: name search goes through the narrow authenticated RPC (id/name/avatar only) — the
        // users table is now owner-only, so a direct cross-user name query is no longer possible.
        const { data, error } = await supabase.rpc('search_people_by_name', { search_query: debouncedQuery })
        if (error) throw error
        if (!abort) {
          // B1.3: search telemetry — coarse only, NEVER the typed query text or any result id/name.
          const n = (data || []).length
          if (n === 0) trackEvent(EVENTS.people_search_empty, { surface: 'people', query_length_bucket: queryLengthBucket(debouncedQuery.length) })
          else trackEvent(EVENTS.people_search_used, { surface: 'people', result_count: n, result_kind: 'person', query_length_bucket: queryLengthBucket(debouncedQuery.length) })
          setResults((data || []).map(u => ({
            id: u.id,
            name: u.name || 'Anonymous',
            initial: (u.name || '?').charAt(0).toUpperCase(),
            avatarBg: avatarBg(u.id),
            avatarUrl: u.avatar_url || null,
            handle: (() => {
              const slug = (u.name || 'user').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 14) || 'user'
              return `@${slug}-${u.id.slice(0, 4)}`
            })(),
          })))
        }
      } catch (e) {
        console.error('[People search]', e)
      } finally {
        if (!abort) setSearching(false)
      }
    })()
    return () => { abort = true }
  }, [debouncedQuery, authUser])

  const hasQuery = useMemo(() => debouncedQuery.length > 0, [debouncedQuery])

  return (
    <div className="ff-people-v2" style={{ minHeight: '100vh', background: HP.bgDeep, color: HP.text, fontFamily: 'Inter, sans-serif' }}>
      {/* F8.4: single persistent People relationship-status live region — settlement-driven; never
          announces raw backend text, percentages, or relationship state on unrelated rerenders. */}
      <div role="status" aria-live="polite" aria-atomic="true" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>{relStatus}</div>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <Masthead query={query} setQuery={setQuery} onSearch={setQuery} />
        {hasQuery ? (
          <SearchResults results={results} loading={searching} onClear={() => setQuery('')} />
        ) : (
          <>
            <TwinsRail />
            <Rising />
            <Suggested />
          </>
        )}
      </div>
    </div>
  )
}

export default function People() {
  usePageMeta({ title: 'People — FeelFlick' })
  // B1.3 kill-switch: when People is disabled for beta, show an honest fallback and load NO data
  // (the provider — and every People RPC — is never mounted). Defaults to enabled (no behavior change).
  if (!isEnabled('people')) return <PeopleUnavailable />
  return (
    <PeopleDataProvider>
      <PeopleV2Body />
    </PeopleDataProvider>
  )
}
