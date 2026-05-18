// Home v2 — bottom sections, wired to useHomeData.
// All hardcoded RECENT / CONTINUE / DNA / FRIENDS / LISTS imports gone.

import { useState } from 'react'
import { HP } from './data'
import { SmartImg, Stars } from './atoms'
import { useHomeData } from './useHomeData'

const Heading = ({ kicker, title, sub }) => (
  <header style={{ marginBottom: 36 }}>
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: HP.purple, marginBottom: 14, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <span style={{ height: 1, width: 22, background: HP.purple, opacity: 0.6 }} />{kicker}
    </div>
    <h2 style={{ fontFamily: 'Outfit, Inter, sans-serif', fontSize: 44, lineHeight: 1.0, fontWeight: 500, letterSpacing: '-0.035em', color: HP.text, margin: 0, textWrap: 'balance' }}>{title}</h2>
    {sub && <p style={{ marginTop: 14, fontSize: 14, color: HP.textMuted, maxWidth: 540, fontFamily: 'Outfit, Inter, sans-serif', textWrap: 'pretty' }}>{sub}</p>}
  </header>
)

export function ContinueWatching({ onResume }) {
  const { continueItem } = useHomeData()
  // Hidden when no resume source — better than fabricating a card. The
  // recommendation pipeline doesn't yet write resume progress anywhere, so
  // there's nothing meaningful to display.
  if (!continueItem) return null
  const f = continueItem.film
  return (
    <section style={{ padding: '56px 88px', borderTop: `1px solid ${HP.border}` }}>
      <Heading kicker="In Progress" title="Pick up where you paused." />
      <button
        type="button"
        onClick={() => onResume?.(f)}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = HP.purple + '66'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = HP.border}
        style={{
          display: 'flex', gap: 24, padding: 20, border: `1px solid ${HP.border}`, borderRadius: 6,
          background: 'rgba(255,255,255,0.012)', maxWidth: 720, cursor: 'pointer',
          transition: 'border-color 0.3s ease', textAlign: 'left', width: '100%', fontFamily: 'inherit', color: 'inherit',
        }}
      >
        <SmartImg film={f} style={{ width: 84, height: 126, objectFit: 'cover', borderRadius: 4, flex: 'none' }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, minWidth: 0 }}>
          <div>
            <div style={{ fontFamily: 'Outfit', fontSize: 19, fontWeight: 500, color: HP.text, letterSpacing: '-0.015em' }}>{f.title}</div>
            <div style={{ fontSize: 12, color: HP.textMuted, marginTop: 4, fontFamily: 'Outfit', letterSpacing: '0.04em' }}>{continueItem.timeLeft} · last watched {continueItem.lastWatched}</div>
          </div>
          <div>
            <div style={{ height: 2, background: HP.border, borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${continueItem.progress * 100}%`, background: HP.purple, borderRadius: 999 }} />
            </div>
            <div style={{ fontSize: 10, color: HP.textFaint, fontFamily: 'Outfit', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{Math.round(continueItem.progress * 100)}% watched</div>
          </div>
        </div>
        <span style={{ alignSelf: 'center', padding: '10px 18px', borderRadius: 4, background: HP.purple, color: '#0A0510', fontFamily: 'Outfit', fontWeight: 600, fontSize: 12, letterSpacing: '0.04em' }}>Resume &rarr;</span>
      </button>
    </section>
  )
}

export function CinematicDNA() {
  const { dna } = useHomeData()
  if (!dna) return null
  return (
    <section style={{ padding: '72px 88px', borderTop: `1px solid ${HP.border}`, background: 'rgba(255,255,255,0.008)' }}>
      <Heading
        kicker="Cinematic DNA"
        title="Your taste, taking shape."
        sub={dna.filmsToNext > 0 ? `A portrait of what you’re drawn to. ${dna.filmsToNext} more films and your DNA tunes further.` : 'A portrait of what you’re drawn to.'}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Confidence</div>
            <div style={{ fontFamily: 'Outfit', fontSize: 56, fontWeight: 200, color: HP.text, letterSpacing: '-0.04em' }}>{Math.round(dna.progress * 100)}<span style={{ fontSize: 24, color: HP.textMuted }}>%</span></div>
          </div>
          <div style={{ height: 2, background: HP.border, borderRadius: 999, overflow: 'hidden', marginBottom: 28 }}>
            <div style={{ height: '100%', width: `${dna.progress * 100}%`, background: `linear-gradient(90deg, ${HP.purple}, ${HP.pink})` }} />
          </div>
          <div style={{ fontSize: 12, color: HP.textSoft, fontFamily: 'Outfit', fontStyle: 'italic', marginBottom: 28 }}>{dna.filmsLogged} film{dna.filmsLogged === 1 ? '' : 's'} logged &middot; taking shape.</div>
          <div style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Motifs forming</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {dna.motifs.map(m => (
              <span key={m} style={{ padding: '6px 12px', borderRadius: 4, background: 'rgba(167,139,250,0.06)', border: `1px solid ${HP.purple}33`, fontSize: 12, color: HP.textSoft, fontFamily: 'Outfit' }}>{m}</span>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 24 }}>Mood weights</div>
          {dna.topMoods ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {dna.topMoods.map(m => (
                <div key={m.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <div style={{ fontFamily: 'Outfit', fontSize: 14, fontWeight: 500, color: HP.text }}>{m.label}</div>
                    <div style={{ fontFamily: 'Outfit', fontSize: 12, color: HP.textMuted, letterSpacing: '0.04em' }}>{Math.round(m.weight * 100)}%</div>
                  </div>
                  <div style={{ height: 2, background: HP.border, borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${m.weight * 100}%`, background: HP.purple, opacity: 0.6 + m.weight * 0.4 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: HP.textMuted, fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic' }}>
              Rate a few more films to see your mood weights.
            </div>
          )}
          <div style={{ marginTop: 32, fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Runtime preference</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'Outfit', fontSize: 36, fontWeight: 200, color: HP.text, letterSpacing: '-0.03em' }}>{dna.runtime.value}</span>
            <span style={{ fontSize: 12, color: HP.textMuted, fontFamily: 'Outfit' }}>{dna.runtime.unit}{dna.runtime.note && ` · ${dna.runtime.note}`}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export function RecentlyLogged({ onCardClick }) {
  const { recent } = useHomeData()
  if (recent.length === 0) return null
  return (
    <section style={{ padding: '72px 88px', borderTop: `1px solid ${HP.border}` }}>
      <Heading kicker="Diary" title="Recently logged." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32 }}>
        {recent.map(l => (
          <button
            key={l.key}
            type="button"
            onClick={() => onCardClick?.(l.film)}
            style={{
              background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
              textAlign: 'left', fontFamily: 'inherit', color: 'inherit',
            }}
          >
            <SmartImg film={l.film} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 4, marginBottom: 14 }} />
            <div style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 500, color: HP.text, letterSpacing: '-0.015em' }}>{l.film.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <Stars value={l.rating} size={11} />
              <div style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit' }}>{l.when}</div>
            </div>
            {l.note && <p style={{ fontSize: 13, color: HP.textSoft, marginTop: 10, fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic', lineHeight: 1.55, textWrap: 'pretty' }}>&ldquo;{l.note}&rdquo;</p>}
          </button>
        ))}
      </div>
    </section>
  )
}

export function TasteMatch({ onOpenFriend }) {
  const { friends } = useHomeData()
  if (friends.length === 0) return null
  return (
    <section style={{ padding: '72px 88px', borderTop: `1px solid ${HP.border}`, background: 'rgba(255,255,255,0.008)' }}>
      <Heading kicker="Taste match" title="People who see what you see." sub="Friends with overlapping taste fingerprints — not just shared genres." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
        {friends.map(fr => (
          <button
            key={fr.userId}
            type="button"
            onClick={() => onOpenFriend?.(fr.userId)}
            style={{
              padding: 28, border: `1px solid ${HP.border}`, borderRadius: 6, background: 'rgba(255,255,255,0.02)',
              cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: 'inherit', width: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
              <div style={{ width: 44, height: 44, borderRadius: 999, background: fr.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A0510', fontFamily: 'Outfit', fontWeight: 700, fontSize: 16 }}>{fr.name.charAt(0).toUpperCase()}</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Outfit', fontSize: 38, fontWeight: 200, color: HP.text, lineHeight: 1, letterSpacing: '-0.04em' }}>{fr.match}<span style={{ fontSize: 14, color: HP.textMuted, marginLeft: 2 }}>%</span></div>
                <div style={{ fontSize: 9, color: HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>match</div>
              </div>
            </div>
            <div style={{ fontFamily: 'Outfit', fontSize: 17, fontWeight: 500, color: HP.text, marginBottom: 4 }}>{fr.name}</div>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: HP.textSoft, fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic', margin: 0, textWrap: 'pretty' }}>&ldquo;{fr.overlap}.&rdquo;</p>
            {fr.last && fr.last !== '—' && (
              <div style={{ marginTop: 14, fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: HP.textMuted, fontFamily: 'Outfit' }}>
                Last · <span style={{ color: HP.textSoft, textTransform: 'none', letterSpacing: '0.02em', fontStyle: 'italic', fontWeight: 400 }}>{fr.last}</span>
                {fr.lastWhen && <span style={{ color: HP.textFaint }}> · {fr.lastWhen}</span>}
              </div>
            )}
          </button>
        ))}
      </div>
    </section>
  )
}

export function CuratedLists({ onOpenList }) {
  const { lists } = useHomeData()
  if (lists.length === 0) return null
  return (
    <section style={{ padding: '72px 88px', borderTop: `1px solid ${HP.border}` }}>
      <Heading kicker="Lists" title="Curated edits." sub="Hand-built collections, not algorithmic dumps." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
        {lists.map(L => {
          const [c1, c2] = L.palette
          return (
            <button
              key={L.id}
              type="button"
              onClick={() => onOpenList?.(L.slug)}
              style={{
                cursor: 'pointer', background: 'transparent', border: 'none', padding: 0,
                textAlign: 'left', fontFamily: 'inherit', color: 'inherit',
              }}
            >
              <div style={{ aspectRatio: '4/5', borderRadius: 6, background: `linear-gradient(135deg, ${c1}33, ${c2}11)`, border: `1px solid ${HP.border}`, position: 'relative', overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 70% 30%, ${c1}55, transparent 60%)` }} />
                <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
                  <div style={{ fontSize: 9, color: HP.text, fontFamily: 'Outfit', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 6 }}>{L.count} films</div>
                  <div style={{ fontFamily: 'Outfit, Inter, sans-serif', fontSize: 19, fontWeight: 500, color: HP.text, lineHeight: 1.1, letterSpacing: '-0.02em', textWrap: 'balance' }}>{L.title}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: HP.textMuted, fontFamily: 'Outfit, Inter, sans-serif', textWrap: 'pretty', lineHeight: 1.5 }}>{L.blurb}</div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function QuickLog({ onLog }) {
  const examples = ['Past Lives', 'Whiplash', 'The Handmaiden', 'Drive']
  const [query, setQuery] = useState('')
  return (
    <section style={{ padding: '72px 88px 96px', borderTop: `1px solid ${HP.border}`, background: 'rgba(255,255,255,0.008)' }}>
      <div style={{ maxWidth: 720 }}>
        <Heading kicker="Feed the engine" title="Log a film you’ve seen." sub="Every film you log makes tomorrow’s briefing sharper." />
        <form
          onSubmit={(e) => { e.preventDefault(); onLog?.(query) }}
          style={{ display: 'flex', gap: 0, border: `1px solid ${HP.border}`, borderRadius: 8, background: 'rgba(255,255,255,0.02)', padding: 4 }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a film you watched recently…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '14px 16px', color: HP.text, fontFamily: 'Outfit, Inter, sans-serif', fontSize: 15 }}
          />
          <button type="submit" style={{ padding: '10px 20px', borderRadius: 6, background: HP.purple, border: 'none', color: '#0A0510', fontFamily: 'Outfit', fontWeight: 600, fontSize: 13, letterSpacing: '0.02em', cursor: 'pointer' }}>Log it &rarr;</button>
        </form>
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit' }}>
          <span style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>Try</span>
          {examples.map(e => (
            <button
              key={e}
              type="button"
              onClick={() => onLog?.(e)}
              style={{ padding: '5px 11px', borderRadius: 999, background: 'transparent', border: `1px solid ${HP.border}`, color: HP.textSoft, fontFamily: 'Outfit', fontSize: 12, cursor: 'pointer' }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
