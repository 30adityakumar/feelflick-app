// src/features/people-v2/PeopleV2.jsx
// FeelFlick — People v2 ("Taste twins"). Editorial social surface backed by
// live user_follows × user_similarity × user_ratings × user_history. Drops
// the internal Nav (AppShell owns nav). All follow/unfollow flows through
// the provider's optimistic toggleFollow.

import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { HP, HP_GRAD } from './data'
import { PeopleDataProvider, usePeopleData } from './usePeopleData'
import './people-v2.css'

const RESET_BTN = { background: 'none', border: 'none', padding: 0, margin: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left' }

function Masthead({ onSearch, query, setQuery }) {
  const { user } = usePeopleData()
  return (
    <section style={{ padding: '72px 88px 32px', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 50% 30% at 10% 0%, rgba(236,72,153,0.10), transparent 60%)' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.32em', textTransform: 'uppercase', color: HP.purple }}>People</div>
          <div style={{ height: 1, width: 38, background: HP.purple, opacity: 0.5 }} />
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: HP.textMuted, fontFamily: 'Outfit' }}>{user.following} following · {user.followers} followers</div>
        </div>
        <h1 style={{ fontFamily: 'Outfit', fontSize: 88, lineHeight: 0.92, fontWeight: 300, letterSpacing: '-0.05em', color: HP.text, margin: 0, textWrap: 'balance' }}>
          Your <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>taste twins.</em>
        </h1>
        <p style={{ marginTop: 18, fontFamily: 'Outfit, Inter, sans-serif', fontSize: 17, color: HP.textSoft, fontStyle: 'italic', maxWidth: 680, lineHeight: 1.55 }}>
          Compatibility, not popularity. Friends whose ratings actually predict yours.
        </p>
        <form
          onSubmit={(e) => { e.preventDefault(); onSearch(query) }}
          style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            aria-label="Search for users by name"
            style={{ flex: 1, maxWidth: 480, padding: '12px 18px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${HP.border}`, color: HP.text, fontFamily: 'Outfit, Inter, sans-serif', fontSize: 14, outline: 'none' }}
          />
          <button
            type="button"
            disabled
            title="Invite flow ships with the next release."
            style={{ padding: '12px 20px', borderRadius: 8, background: HP_GRAD, border: 'none', color: '#fff', fontFamily: 'Outfit', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', cursor: 'not-allowed', opacity: 0.55 }}
          >
            Invite a friend
          </button>
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
  const { twins, toggleFollow, loading } = usePeopleData()
  const navigate = useNavigate()

  return (
    <section style={{ padding: '24px 88px 56px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span style={{ height: 1, width: 22, background: HP.purple, opacity: 0.6 }} />Strongest matches
          </div>
          <h2 style={{ fontFamily: 'Outfit', fontSize: 36, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0 }}>People who <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>get it.</em></h2>
        </div>
      </div>
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ height: 220, borderRadius: 8, background: 'rgba(255,255,255,0.025)', border: `1px solid ${HP.border}` }} className="animate-pulse" />
          ))}
        </div>
      ) : twins.length === 0 ? (
        <EmptyState
          label="No taste twins yet"
          body="Rate a dozen films and we'll match you with people whose taste actually predicts yours."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
          {twins.map(p => (
            <article key={p.id} style={{ padding: '26px 24px', borderRadius: 8, background: 'rgba(255,255,255,0.025)', border: `1px solid ${HP.border}`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 999, background: `radial-gradient(circle, ${p.avatarBg}33, transparent 70%)`, filter: 'blur(8px)' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${p.id}`)}
                    aria-label={`View ${p.name}'s profile`}
                    style={{ ...RESET_BTN, width: 48, height: 48, borderRadius: 999, background: p.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit', fontWeight: 700, color: '#0a0510', fontSize: 18 }}
                  >
                    {p.initial}
                  </button>
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
                <div style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', marginTop: 2 }}>{p.handle} · {p.films} films · {p.mood}</div>
                {p.bio && <p style={{ margin: '12px 0 0 0', fontSize: 12, color: HP.textSoft, fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic', lineHeight: 1.5 }}>&ldquo;{p.bio}&rdquo;</p>}
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

function Rising() {
  const { rising, toggleFollow, loading } = usePeopleData()
  const navigate = useNavigate()
  if (!loading && rising.length === 0) return null

  return (
    <section style={{ padding: '48px 88px', borderTop: `1px solid ${HP.border}`, background: 'rgba(255,255,255,0.012)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span style={{ height: 1, width: 22, background: HP.purple, opacity: 0.6 }} />On the rise
          </div>
          <h2 style={{ fontFamily: 'Outfit', fontSize: 30, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0 }}>Building taste in <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>your direction.</em></h2>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {rising.map(p => (
          <div key={p.id} style={{ padding: '18px 20px', borderRadius: 6, background: 'rgba(255,255,255,0.025)', border: `1px solid ${HP.border}`, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 16, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => navigate(`/profile/${p.id}`)}
              aria-label={`View ${p.name}'s profile`}
              style={{ ...RESET_BTN, width: 42, height: 42, borderRadius: 999, background: p.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit', fontWeight: 700, color: '#0a0510', fontSize: 16 }}
            >
              {p.initial}
            </button>
            <div style={{ minWidth: 0 }}>
              <button
                type="button"
                onClick={() => navigate(`/profile/${p.id}`)}
                style={{ ...RESET_BTN, fontFamily: 'Outfit', fontSize: 14, fontWeight: 500, color: HP.text, display: 'block', width: '100%' }}
              >
                {p.name}
              </button>
              <div style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.films} films · {p.mood}</div>
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
  const { activity, loading } = usePeopleData()
  if (!loading && activity.length === 0) return null

  return (
    <section style={{ padding: '56px 88px', borderTop: `1px solid ${HP.border}` }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span style={{ height: 1, width: 22, background: HP.purple, opacity: 0.6 }} />Activity
        </div>
        <h2 style={{ fontFamily: 'Outfit', fontSize: 36, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0 }}>What your <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>twins watched.</em></h2>
      </div>
      <div style={{ borderTop: `1px solid ${HP.border}` }}>
        {activity.map((a, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 18, alignItems: 'flex-start', padding: '20px 0', borderBottom: `1px solid ${HP.border}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 999, background: a.whoBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit', fontWeight: 700, color: '#0a0510', fontSize: 14 }}>{a.who.charAt(0)}</div>
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
  const { crewOverlap, loading } = usePeopleData()
  if (!loading && crewOverlap.length === 0) return null

  return (
    <section style={{ padding: '56px 88px', borderTop: `1px solid ${HP.border}`, background: 'rgba(255,255,255,0.012)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 64, alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 12 }}>Shared lineage</div>
          <h2 style={{ fontFamily: 'Outfit', fontSize: 32, lineHeight: 1.05, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0 }}>Directors your <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>circle loves.</em></h2>
          <p style={{ marginTop: 14, fontSize: 13, color: HP.textMuted, fontFamily: 'Outfit, Inter, sans-serif', lineHeight: 1.55, maxWidth: 320 }}>Where your taste graph overlaps with the people you follow.</p>
        </div>
        <div style={{ borderTop: `1px solid ${HP.border}` }}>
          {crewOverlap.map(c => (
            <div key={c.name} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center', padding: '16px 0', borderBottom: `1px solid ${HP.border}` }}>
              <div style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 500, color: HP.text, letterSpacing: '-0.015em' }}>{c.name}</div>
              <div style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.04em', textAlign: 'right' }}>{c.friends} friend{c.friends === 1 ? '' : 's'} · {c.you}</div>
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
    <section style={{ padding: '56px 88px', borderTop: `1px solid ${HP.border}` }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 12 }}>Suggested</div>
        <h2 style={{ fontFamily: 'Outfit', fontSize: 30, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0 }}>People you <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>might know.</em></h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {suggested.map(p => (
          <div key={p.id} style={{ padding: '18px 20px', borderRadius: 6, background: 'rgba(255,255,255,0.025)', border: `1px solid ${HP.border}`, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 16, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => navigate(`/profile/${p.id}`)}
              aria-label={`View ${p.name}'s profile`}
              style={{ ...RESET_BTN, width: 42, height: 42, borderRadius: 999, background: p.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit', fontWeight: 700, color: '#0a0510', fontSize: 16 }}
            >
              {p.initial}
            </button>
            <div style={{ minWidth: 0 }}>
              <button
                type="button"
                onClick={() => navigate(`/profile/${p.id}`)}
                style={{ ...RESET_BTN, fontFamily: 'Outfit', fontSize: 15, fontWeight: 500, color: HP.text, display: 'block', width: '100%' }}
              >
                {p.name}
              </button>
              <div style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', marginTop: 2 }}>{p.mutuals} films in common · {p.mood}</div>
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
  return (
    <section style={{ padding: '24px 88px 56px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 12 }}>Search results</div>
          <h2 style={{ fontFamily: 'Outfit', fontSize: 30, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0 }}>{results.length} match{results.length === 1 ? '' : 'es'}</h2>
        </div>
        <button type="button" onClick={onClear} style={{ ...RESET_BTN, fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Clear ×</button>
      </div>
      {loading ? (
        <div style={{ fontSize: 13, color: HP.textMuted, fontFamily: 'Outfit, Inter, sans-serif' }}>Searching…</div>
      ) : results.length === 0 ? (
        <div style={{ fontSize: 14, color: HP.textMuted, fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic' }}>No people found.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {results.map(u => (
            <div key={u.id} style={{ padding: '18px 20px', borderRadius: 6, background: 'rgba(255,255,255,0.025)', border: `1px solid ${HP.border}`, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 42, height: 42, borderRadius: 999, background: u.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit', fontWeight: 700, color: '#0a0510', fontSize: 16 }}>{u.initial}</div>
              <button
                type="button"
                onClick={() => navigate(`/profile/${u.id}`)}
                style={{ ...RESET_BTN, fontFamily: 'Outfit', fontSize: 15, fontWeight: 500, color: HP.text }}
              >
                {u.name}
              </button>
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

function Foot() {
  return (
    <footer style={{ padding: '40px 88px 64px', borderTop: `1px solid ${HP.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'Outfit', flexWrap: 'wrap', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: HP_GRAD, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff' }}>FF</div>
        <span style={{ fontSize: 13, color: HP.textMuted }}>FeelFlick · People</span>
      </div>
    </footer>
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
        <Foot />
      </div>
    </div>
  )
}

export default function PeopleV2() {
  return (
    <PeopleDataProvider>
      <PeopleV2Body />
    </PeopleDataProvider>
  )
}
