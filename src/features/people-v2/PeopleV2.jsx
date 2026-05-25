// src/features/people-v2/PeopleV2.jsx
// FeelFlick — People v2 ("Taste twins"). Editorial social surface backed by
// live user_follows × user_similarity × user_ratings × user_history. Drops
// the internal Nav (AppShell owns nav). All follow/unfollow flows through
// the provider's optimistic toggleFollow.

import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { HP, HP_GRAD } from './data'
import { PeopleDataProvider, usePeopleData } from './usePeopleData'
import './people-v2.css'

const RESET_BTN = { background: 'none', border: 'none', padding: 0, margin: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left' }

// Avatar — renders the user's uploaded image when available, falls back to
// a colored initial circle. Used by every twin/rising/suggested/activity card.
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
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.32em', textTransform: 'uppercase', color: HP.purple }}>People</div>
          <div style={{ height: 1, width: 38, background: HP.purple, opacity: 0.5 }} />
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: HP.textMuted, fontFamily: 'Outfit' }}>{user.following} following · {user.followers} followers</div>
        </div>
        <h1 className="ff-people-hero" style={{ fontFamily: 'Outfit', fontSize: 88, lineHeight: 0.92, fontWeight: 300, letterSpacing: '-0.05em', color: HP.text, margin: 0, textWrap: 'balance' }}>
          Your <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>taste twins.</em>
        </h1>
        <p style={{ marginTop: 18, fontFamily: 'Outfit, Inter, sans-serif', fontSize: 17, color: HP.textSoft, fontStyle: 'italic', maxWidth: 680, lineHeight: 1.55 }}>
          Compatibility, not popularity. Friends whose ratings actually predict yours.
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
            style={{ flex: 1, minWidth: 200, maxWidth: 480, padding: '12px 18px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${HP.border}`, color: HP.text, fontFamily: 'Outfit, Inter, sans-serif', fontSize: 14, outline: 'none' }}
          />
          <button
            type="button"
            onClick={handleInvite}
            aria-label="Invite a friend to FeelFlick"
            style={{ padding: '12px 20px', borderRadius: 8, background: HP_GRAD, border: 'none', color: '#fff', fontFamily: 'Outfit', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', cursor: 'pointer' }}
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

function FollowBtn({ following, onToggle, style }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={following ? 'Unfollow' : 'Follow'}
      style={{
        padding: '7px 14px',
        borderRadius: 999,
        background: following ? 'transparent' : HP_GRAD,
        border: following ? `1px solid ${HP.border}` : 'none',
        color: following ? HP.textSoft : '#fff',
        fontFamily: 'Outfit',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        ...style,
      }}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  )
}

function TwinsRail() {
  const { twins, popular, toggleFollow, loading } = usePeopleData()
  const navigate = useNavigate()

  return (
    <section className="ff-people-section ff-people-twins" style={{ padding: '24px 88px 56px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span style={{ height: 1, width: 22, background: HP.purple, opacity: 0.6 }} />{twins.length === 0 && popular.length > 0 ? 'Popular on FeelFlick' : 'Strongest matches'}
          </div>
          <h2 className="ff-people-h2" style={{ fontFamily: 'Outfit', fontSize: 36, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0 }}>
            {twins.length === 0 && popular.length > 0
              ? <>Start with the <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>most-watched.</em></>
              : <>People who <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>get it.</em></>}
          </h2>
        </div>
      </div>
      {loading ? (
        <div className="ff-people-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ height: 220, borderRadius: 8, background: 'rgba(255,255,255,0.025)', border: `1px solid ${HP.border}` }} className="animate-pulse" />
          ))}
        </div>
      ) : twins.length === 0 && popular.length === 0 ? (
        <ColdStartHero />
      ) : twins.length === 0 ? (
        // Cold-start: substitute Popular cards. Different shape from twins
        // (no match%) so the user knows these aren't compatibility-matched.
        <>
          <ColdStartHint />
          <div className="ff-people-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 20 }}>
            {popular.map(p => (
              <article key={p.id} style={{ padding: '18px 20px', borderRadius: 6, background: 'rgba(255,255,255,0.025)', border: `1px solid ${HP.border}`, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, alignItems: 'center' }}>
                <Avatar url={p.avatarUrl} initial={p.initial} bg={p.avatarBg} size={42} onClick={() => navigate(`/profile/${p.id}`)} alt={`View ${p.name}'s profile`} />
                <div style={{ minWidth: 0 }}>
                  <button type="button" onClick={() => navigate(`/profile/${p.id}`)} style={{ ...RESET_BTN, fontFamily: 'Outfit', fontSize: 15, fontWeight: 500, color: HP.text, display: 'block', width: '100%', textAlign: 'left' }}>{p.name}</button>
                  <div style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.bio}</div>
                </div>
                <FollowBtn following={false} onToggle={() => toggleFollow(p.id)} />
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="ff-people-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
          {twins.map(p => (
            <article key={p.id} className="ff-people-twin-card" style={{ padding: '26px 24px', borderRadius: 8, background: 'rgba(255,255,255,0.025)', border: `1px solid ${HP.border}`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 999, background: `radial-gradient(circle, ${p.avatarBg}33, transparent 70%)`, filter: 'blur(8px)' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <Avatar url={p.avatarUrl} initial={p.initial} bg={p.avatarBg} size={48} onClick={() => navigate(`/profile/${p.id}`)} alt={`View ${p.name}'s profile`} />
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Outfit', fontSize: 34, fontWeight: 200, color: HP.text, letterSpacing: '-0.045em', lineHeight: 1 }}>{p.match}<span style={{ fontSize: 12, color: HP.textMuted, marginLeft: 1 }}>%</span></div>
                    <div style={{ fontSize: 9, color: HP.textFaint, fontFamily: 'Outfit', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>Match</div>
                  </div>
                </div>
                <MatchBar pct={p.match} hex={p.avatarBg} />
                <button
                  type="button"
                  onClick={() => navigate(`/profile/${p.id}`)}
                  style={{ ...RESET_BTN, marginTop: 16, fontFamily: 'Outfit', fontSize: 18, fontWeight: 500, color: HP.text, letterSpacing: '-0.015em', display: 'block', width: '100%' }}
                >
                  {p.name}
                </button>
                <div style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', marginTop: 2 }}>{p.handle} · {p.films} film{p.films === 1 ? '' : 's'}</div>
                {p.bio && <p style={{ margin: '12px 0 0 0', fontSize: 12, color: HP.textSoft, fontFamily: 'Outfit, Inter, sans-serif', lineHeight: 1.5 }}>{p.bio}</p>}
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${HP.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', fontStyle: 'italic' }}>{p.recent}</div>
                  <FollowBtn following={p.following} onToggle={() => toggleFollow(p.id)} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

// Cold-start guidance that sits above the Popular rail. Tells the user
// "twins are computed from your ratings — here's a head start while you log."
function ColdStartHint() {
  return (
    <div style={{ padding: '14px 18px', borderRadius: 6, background: 'rgba(167,139,250,0.06)', border: `1px solid ${HP.purple}33`, fontSize: 13, color: HP.textSoft, fontFamily: 'Outfit, Inter, sans-serif', lineHeight: 1.55 }}>
      <strong style={{ color: HP.text, fontWeight: 500 }}>Twins unlock as you rate.</strong>{' '}
      Rate ~12 films and we&rsquo;ll match you with people whose ratings actually predict yours. Until then, here&rsquo;s who&rsquo;s watching the most.
    </div>
  )
}

// Wholly empty state — no twins AND no Popular fallback (means no other
// active users on the platform at all). Rare, but render gracefully.
function ColdStartHero() {
  return (
    <EmptyState
      label="No taste twins yet"
      body="Rate a dozen films and we'll match you with people whose taste actually predicts yours."
    />
  )
}

function Rising() {
  const { rising, toggleFollow, loading } = usePeopleData()
  const navigate = useNavigate()
  if (!loading && rising.length === 0) return null

  return (
    <section className="ff-people-section ff-people-rising" style={{ padding: '48px 88px', borderTop: `1px solid ${HP.border}`, background: 'rgba(255,255,255,0.012)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span style={{ height: 1, width: 22, background: HP.purple, opacity: 0.6 }} />On the rise
          </div>
          <h2 className="ff-people-h2-sm" style={{ fontFamily: 'Outfit', fontSize: 30, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0 }}>Building taste in <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>your direction.</em></h2>
        </div>
      </div>
      <div className="ff-people-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {rising.map(p => (
          <div key={p.id} style={{ padding: '18px 20px', borderRadius: 6, background: 'rgba(255,255,255,0.025)', border: `1px solid ${HP.border}`, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 16, alignItems: 'center' }}>
            <Avatar url={p.avatarUrl} initial={p.initial} bg={p.avatarBg} size={42} onClick={() => navigate(`/profile/${p.id}`)} alt={`View ${p.name}'s profile`} />
            <div style={{ minWidth: 0 }}>
              <button
                type="button"
                onClick={() => navigate(`/profile/${p.id}`)}
                style={{ ...RESET_BTN, fontFamily: 'Outfit', fontSize: 14, fontWeight: 500, color: HP.text, display: 'block', width: '100%' }}
              >
                {p.name}
              </button>
              <div style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.bio}</div>
              <div style={{ marginTop: 8 }}><MatchBar pct={p.match} hex={p.avatarBg} /></div>
              <div style={{ marginTop: 6, fontSize: 10, color: HP.textFaint, fontFamily: 'Outfit', letterSpacing: '0.06em' }}>{p.match}% match · {p.recent}</div>
            </div>
            <FollowBtn following={p.following} onToggle={() => toggleFollow(p.id)} />
          </div>
        ))}
      </div>
    </section>
  )
}

function Activity() {
  const { activity, loading, user, followingIds } = usePeopleData()
  const navigate = useNavigate()
  if (!loading && activity.length === 0) return null
  // Section title reflects the data source: when the user has 0 follows we
  // fall back to twin-derived activity, so call it "in your network" — true
  // for both modes. (When they DO follow people, those events still appear
  // because followingIds takes precedence in the data layer.)
  const heading = user.following > 0
    ? <>What your <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>circle watched.</em></>
    : <>What your <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>twins watched.</em></>
  return (
    <section className="ff-people-section ff-people-activity" style={{ padding: '56px 88px', borderTop: `1px solid ${HP.border}` }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span style={{ height: 1, width: 22, background: HP.purple, opacity: 0.6 }} />Activity
        </div>
        <h2 className="ff-people-h2" style={{ fontFamily: 'Outfit', fontSize: 36, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0 }}>{heading}</h2>
        {followingIds.size === 0 && (
          <p style={{ marginTop: 10, fontSize: 12, color: HP.textMuted, fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic' }}>
            Follow your twins to surface their activity here.
          </p>
        )}
      </div>
      <div style={{ borderTop: `1px solid ${HP.border}` }}>
        {activity.map((a, i) => (
          <div key={i} className="ff-people-activity-row" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 18, alignItems: 'flex-start', padding: '20px 0', borderBottom: `1px solid ${HP.border}` }}>
            <Avatar url={a.whoAvatarUrl} initial={a.who.charAt(0).toUpperCase()} bg={a.whoBg} size={36} onClick={a.whoId ? () => navigate(`/profile/${a.whoId}`) : undefined} alt={`View ${a.who}'s profile`} />
            <div>
              <div style={{ fontFamily: 'Outfit, Inter, sans-serif', fontSize: 14, color: HP.textSoft }}>
                <span style={{ color: HP.text, fontWeight: 600, fontFamily: 'Outfit' }}>{a.who}</span> {a.action} <span style={{ color: HP.text, fontWeight: 600, fontStyle: 'italic' }}>{a.film}</span>
                {a.rating && (
                  <span style={{ marginLeft: 10, display: 'inline-flex', gap: 2, verticalAlign: 'middle' }}>
                    {[1, 2, 3, 4, 5].map(i => <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i <= a.rating ? HP.amber : 'transparent'} stroke={i <= a.rating ? HP.amber : HP.textFaint} strokeWidth="1.5"><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" /></svg>)}
                  </span>
                )}
              </div>
              {a.sub && <div style={{ marginTop: 4, fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', fontStyle: 'italic' }}>{a.sub}</div>}
              {a.note && <p style={{ margin: '10px 0 0 0', fontSize: 13, lineHeight: 1.55, color: HP.textSoft, fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic', borderLeft: `2px solid ${a.whoBg}55`, paddingLeft: 12 }}>&ldquo;{a.note}&rdquo;</p>}
            </div>
            <div style={{ fontSize: 10, color: HP.textFaint, fontFamily: 'Outfit', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{a.when}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function CrewOverlap() {
  const { crewOverlap, loading, followingIds } = usePeopleData()
  if (!loading && crewOverlap.length === 0) return null
  const sub = followingIds.size > 0
    ? 'Where your taste graph overlaps with the people you follow.'
    : 'Where your taste graph overlaps with your taste twins. Follow them to lock these in.'
  return (
    <section className="ff-people-section ff-people-crew" style={{ padding: '56px 88px', borderTop: `1px solid ${HP.border}`, background: 'rgba(255,255,255,0.012)' }}>
      <div className="ff-people-crew-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 64, alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 12 }}>Shared lineage</div>
          <h2 className="ff-people-h2" style={{ fontFamily: 'Outfit', fontSize: 32, lineHeight: 1.05, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0 }}>Directors your <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>circle loves.</em></h2>
          <p style={{ marginTop: 14, fontSize: 13, color: HP.textMuted, fontFamily: 'Outfit, Inter, sans-serif', lineHeight: 1.55, maxWidth: 320 }}>{sub}</p>
        </div>
        <div style={{ borderTop: `1px solid ${HP.border}` }}>
          {crewOverlap.map(c => (
            <div key={c.name} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center', padding: '16px 0', borderBottom: `1px solid ${HP.border}` }}>
              <div style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 500, color: HP.text, letterSpacing: '-0.015em' }}>{c.name}</div>
              <div style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.04em', textAlign: 'right' }}>{c.friends} {followingIds.size > 0 ? 'friend' : 'twin'}{c.friends === 1 ? '' : 's'} · {c.you}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Suggested() {
  const { suggested, toggleFollow, loading } = usePeopleData()
  const navigate = useNavigate()
  if (!loading && suggested.length === 0) return null

  return (
    <section className="ff-people-section ff-people-suggested" style={{ padding: '56px 88px', borderTop: `1px solid ${HP.border}` }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 12 }}>Suggested</div>
        <h2 className="ff-people-h2-sm" style={{ fontFamily: 'Outfit', fontSize: 30, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0 }}>People you <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>might know.</em></h2>
      </div>
      <div className="ff-people-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {suggested.map(p => (
          <div key={p.id} style={{ padding: '18px 20px', borderRadius: 6, background: 'rgba(255,255,255,0.025)', border: `1px solid ${HP.border}`, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 16, alignItems: 'center' }}>
            <Avatar url={p.avatarUrl} initial={p.initial} bg={p.avatarBg} size={42} onClick={() => navigate(`/profile/${p.id}`)} alt={`View ${p.name}'s profile`} />
            <div style={{ minWidth: 0 }}>
              <button
                type="button"
                onClick={() => navigate(`/profile/${p.id}`)}
                style={{ ...RESET_BTN, fontFamily: 'Outfit', fontSize: 15, fontWeight: 500, color: HP.text, display: 'block', width: '100%' }}
              >
                {p.name}
              </button>
              <div style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', marginTop: 2 }}>
                {p.viaFriend
                  ? <>via <span style={{ color: HP.text }}>{p.viaFriend}</span> · {p.mood}</>
                  : <>{p.mutuals} films in common · {p.mood}</>}
              </div>
            </div>
            <FollowBtn following={false} onToggle={() => toggleFollow(p.id)} />
          </div>
        ))}
      </div>
    </section>
  )
}

function SearchResults({ results, loading, onClear }) {
  const navigate = useNavigate()
  const { followingIds, toggleFollow } = usePeopleData()
  return (
    <section className="ff-people-section ff-people-search-results" style={{ padding: '24px 88px 56px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 12 }}>Search results</div>
          <h2 className="ff-people-h2-sm" style={{ fontFamily: 'Outfit', fontSize: 30, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0 }}>{results.length} match{results.length === 1 ? '' : 'es'}</h2>
        </div>
        <button type="button" onClick={onClear} style={{ ...RESET_BTN, fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Clear ×</button>
      </div>
      {loading ? (
        <div style={{ fontSize: 13, color: HP.textMuted, fontFamily: 'Outfit, Inter, sans-serif' }}>Searching…</div>
      ) : results.length === 0 ? (
        <div style={{ fontSize: 14, color: HP.textMuted, fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic' }}>No people found. Try a different name.</div>
      ) : (
        <div className="ff-people-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {results.map(u => (
            <div key={u.id} style={{ padding: '18px 20px', borderRadius: 6, background: 'rgba(255,255,255,0.025)', border: `1px solid ${HP.border}`, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, alignItems: 'center' }}>
              <Avatar url={u.avatarUrl} initial={u.initial} bg={u.avatarBg} size={42} onClick={() => navigate(`/profile/${u.id}`)} alt={`View ${u.name}'s profile`} />
              <div style={{ minWidth: 0 }}>
                <button
                  type="button"
                  onClick={() => navigate(`/profile/${u.id}`)}
                  style={{ ...RESET_BTN, fontFamily: 'Outfit', fontSize: 15, fontWeight: 500, color: HP.text, display: 'block', width: '100%', textAlign: 'left' }}
                >
                  {u.name}
                </button>
                <div style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', marginTop: 2 }}>{u.handle}</div>
              </div>
              <FollowBtn following={followingIds.has(u.id)} onToggle={() => toggleFollow(u.id)} />
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
      <div style={{ fontFamily: 'Outfit, Inter, sans-serif', fontSize: 13, color: HP.textMuted, maxWidth: 420, margin: '0 auto', lineHeight: 1.55 }}>{body}</div>
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
        const { data, error } = await supabase
          .from('users')
          .select('id, name, avatar_url')
          .ilike('name', `%${debouncedQuery}%`)
          .neq('id', authUser.id)
          .limit(20)
        if (error) throw error
        if (!abort) {
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
        console.error('[PeopleV2 search]', e)
      } finally {
        if (!abort) setSearching(false)
      }
    })()
    return () => { abort = true }
  }, [debouncedQuery, authUser])

  const hasQuery = useMemo(() => debouncedQuery.length > 0, [debouncedQuery])

  return (
    <div className="ff-people-v2" style={{ minHeight: '100vh', background: HP.bgDeep, color: HP.text, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <Masthead query={query} setQuery={setQuery} onSearch={setQuery} />
        {hasQuery ? (
          <SearchResults results={results} loading={searching} onClear={() => setQuery('')} />
        ) : (
          <>
            <TwinsRail />
            <Rising />
            <Activity />
            <CrewOverlap />
            <Suggested />
          </>
        )}
      </div>
    </div>
  )
}

export default function PeopleV2() {
  usePageMeta({ title: 'People — FeelFlick' })
  return (
    <PeopleDataProvider>
      <PeopleV2Body />
    </PeopleDataProvider>
  )
}
