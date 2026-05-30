// src/features/preferences/Preferences.jsx
// FeelFlick — Preferences v2 ("The dials"). Editorial dial deck backed by
// user_preferences (genres) + user_settings.settings.prefs (everything else).
// Drops the internal Nav (AppShell owns nav). All interactions push into a
// draft via the provider; the Save panel persists in one transaction.

import { useState, useEffect, useRef } from 'react'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { PreferencesDataProvider, usePreferencesData, genreLabelOf } from './usePreferencesData'
import './preferences.css'

import { HP, HP_GRAD } from '@/shared/lib/tokens'
const RESET_BTN = { background: 'none', border: 'none', padding: 0, margin: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left' }

// === Atoms ===============================================================

function H({ kicker, title, sub }) {
  return (
    <header style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        <span style={{ height: 1, width: 22, background: HP.purple, opacity: 0.6 }} />{kicker}
      </div>
      <h2 style={{ fontFamily: 'Outfit', fontSize: 36, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0, textWrap: 'balance' }}>{title}</h2>
      {sub && <p style={{ marginTop: 12, fontSize: 14, color: HP.textMuted, fontFamily: 'Outfit, Inter, sans-serif', lineHeight: 1.6, maxWidth: 560, textWrap: 'pretty' }}>{sub}</p>}
    </header>
  )
}

// === Sections ============================================================

function Masthead() {
  return (
    <section style={{ padding: '72px 88px 32px', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 50% 30% at 10% 0%, rgba(167,139,250,0.12), transparent 60%)' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.32em', textTransform: 'uppercase', color: HP.purple }}>Preferences</div>
          <div style={{ height: 1, width: 38, background: HP.purple, opacity: 0.5 }} />
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: HP.textMuted, fontFamily: 'Outfit' }}>Tune the engine · DNA recomputes nightly</div>
        </div>
        <h1 style={{ fontFamily: 'Outfit', fontSize: 88, lineHeight: 0.92, fontWeight: 300, letterSpacing: '-0.05em', color: HP.text, margin: 0, textWrap: 'balance' }}>
          The <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>dials.</em>
        </h1>
        <p style={{ marginTop: 18, fontFamily: 'Outfit, Inter, sans-serif', fontSize: 17, color: HP.textSoft, fontStyle: 'italic', maxWidth: 680, lineHeight: 1.55 }}>
          The engine learns from what you watch &mdash; but here&rsquo;s where you teach it directly.
        </p>
      </div>
    </section>
  )
}

function MoodDials() {
  const { draft, setMoodWeight, catalogs } = usePreferencesData()
  return (
    <section style={{ padding: '56px 88px', borderTop: `1px solid ${HP.border}` }}>
      <H kicker="Mood weights" title="Lean the engine." sub="Drag each mood toward how much you want it in your weekly briefing." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '28px 48px' }}>
        {catalogs.MOODS.map(m => {
          const w = draft.moodWeights[m.id] ?? 0.5
          return (
            <div key={m.id}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: m.hex, boxShadow: `0 0 8px ${m.hex}` }} />
                  <span style={{ fontFamily: 'Outfit', fontSize: 15, fontWeight: 500, color: HP.text }}>{m.label}</span>
                </span>
                <span style={{ fontFamily: 'Outfit', fontSize: 12, color: HP.textMuted, letterSpacing: '0.04em' }}>{Math.round(w * 100)}</span>
              </div>
              <input
                type="range" min="0" max="100"
                value={Math.round(w * 100)}
                onChange={e => setMoodWeight(m.id, +e.target.value / 100)}
                aria-label={`${m.label} weight`}
                style={{ width: '100%', accentColor: m.hex }}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ChipPicker({ items, hex, onRemove, onAdd, options, addLabel }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])
  const availableOptions = options.filter(o => !items.some(it => it.key === o.key))
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, position: 'relative' }} ref={wrapRef}>
      {items.map(t => (
        <span key={t.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 999, background: `${hex}15`, border: `1px solid ${hex}44`, fontFamily: 'Outfit', fontSize: 12, color: hex }}>
          {t.label}
          <button
            type="button"
            onClick={() => onRemove(t.key)}
            aria-label={`Remove ${t.label}`}
            style={{ background: 'transparent', border: 'none', color: hex, cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}
          >×</button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        disabled={availableOptions.length === 0}
        style={{ padding: '7px 12px', borderRadius: 999, background: 'transparent', border: `1px dashed ${HP.borderStrong}`, color: availableOptions.length ? HP.textMuted : HP.textFaint, fontFamily: 'Outfit', fontSize: 12, cursor: availableOptions.length ? 'pointer' : 'not-allowed' }}
      >{addLabel}</button>
      {open && availableOptions.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: '#0f0f15', border: `1px solid ${HP.borderStrong}`, borderRadius: 8, padding: 8, zIndex: 10, maxHeight: 260, overflowY: 'auto', minWidth: 240, boxShadow: '0 18px 40px -12px rgba(0,0,0,0.6)' }}>
          {availableOptions.map(o => (
            <button
              key={o.key}
              type="button"
              onClick={() => { onAdd(o.key); setOpen(false) }}
              style={{ ...RESET_BTN, display: 'block', width: '100%', padding: '8px 10px', borderRadius: 6, fontFamily: 'Outfit', fontSize: 13, color: HP.textSoft }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >{o.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}

function FreeTextChips({ items, hex, onRemove, onAdd, suggestions, placeholder }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); setText('') } }
    document.addEventListener('mousedown', onDown)
    // Focus the input once the picker opens (deliberate; the picker is opened
    // by an explicit user action so it can't trap keyboard users).
    inputRef.current?.focus()
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])
  const matchedSuggestions = (suggestions || []).filter(s =>
    !items.includes(s) && (text.trim() === '' || s.toLowerCase().includes(text.trim().toLowerCase()))
  ).slice(0, 8)
  const handleSubmit = (e) => {
    e?.preventDefault?.()
    const v = text.trim()
    if (v) { onAdd(v); setText(''); setOpen(false) }
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, position: 'relative' }} ref={wrapRef}>
      {items.map(t => (
        <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 999, background: `${hex}15`, border: `1px solid ${hex}44`, fontFamily: 'Outfit', fontSize: 12, color: hex }}>
          {t}
          <button
            type="button"
            onClick={() => onRemove(t)}
            aria-label={`Remove ${t}`}
            style={{ background: 'transparent', border: 'none', color: hex, cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}
          >×</button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ padding: '7px 12px', borderRadius: 999, background: 'transparent', border: `1px dashed ${HP.borderStrong}`, color: HP.textMuted, fontFamily: 'Outfit', fontSize: 12, cursor: 'pointer' }}
      >+ Director</button>
      {open && (
        <form onSubmit={handleSubmit} style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: '#0f0f15', border: `1px solid ${HP.borderStrong}`, borderRadius: 8, padding: 10, zIndex: 10, minWidth: 280, boxShadow: '0 18px 40px -12px rgba(0,0,0,0.6)' }}>
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={placeholder || 'Director name…'}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: `1px solid ${HP.border}`, color: HP.text, fontFamily: 'Outfit, Inter, sans-serif', fontSize: 13, outline: 'none' }}
          />
          {matchedSuggestions.length > 0 && (
            <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto' }}>
              {matchedSuggestions.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { onAdd(s); setText(''); setOpen(false) }}
                  style={{ ...RESET_BTN, display: 'block', width: '100%', padding: '6px 10px', borderRadius: 6, fontFamily: 'Outfit', fontSize: 13, color: HP.textSoft }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >{s}</button>
              ))}
            </div>
          )}
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={!text.trim()}
              style={{ padding: '6px 12px', borderRadius: 6, background: text.trim() ? HP_GRAD : 'rgba(255,255,255,0.05)', border: 'none', color: text.trim() ? '#fff' : HP.textFaint, fontFamily: 'Outfit', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', cursor: text.trim() ? 'pointer' : 'not-allowed' }}
            >Add</button>
          </div>
        </form>
      )}
    </div>
  )
}

function GenresPrefs() {
  const { draft, addDrawnGenre, removeDrawnGenre, addAvoidGenre, removeAvoidGenre, catalogs } = usePreferencesData()
  const drawnItems = draft.drawnGenreIds.map(id => ({ key: id, label: genreLabelOf(id) }))
  const avoidItems = draft.avoidGenreIds.map(id => ({ key: id, label: genreLabelOf(id) }))
  const allOptions = catalogs.GENRES.map(g => ({ key: g.id, label: g.label }))
  return (
    <section style={{ padding: '56px 88px', borderTop: `1px solid ${HP.border}`, background: 'rgba(255,255,255,0.012)' }}>
      <H kicker="Genres" title="What you live in." sub="Drawn-to genres get prioritized; avoided genres are excluded as hard rules." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: HP.textMuted, fontFamily: 'Outfit', marginBottom: 14 }}>Drawn to</div>
          <ChipPicker items={drawnItems} hex={HP.purple} onRemove={removeDrawnGenre} onAdd={addDrawnGenre} options={allOptions} addLabel="+ Genre" />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: HP.textMuted, fontFamily: 'Outfit', marginBottom: 14 }}>Avoid (hard rule)</div>
          <ChipPicker items={avoidItems} hex={HP.red} onRemove={removeAvoidGenre} onAdd={addAvoidGenre} options={allOptions} addLabel="+ Genre" />
        </div>
      </div>
    </section>
  )
}

function DirectorPrefs() {
  const { draft, addTrustedDirector, removeTrustedDirector, addMutedDirector, removeMutedDirector, directorSuggestions } = usePreferencesData()
  return (
    <section style={{ padding: '56px 88px', borderTop: `1px solid ${HP.border}` }}>
      <H kicker="Directors" title="Voices you trust." sub="Trusted directors boost match scores; muted directors get filtered out entirely." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: HP.textMuted, fontFamily: 'Outfit', marginBottom: 14 }}>Trusted</div>
          <FreeTextChips
            items={draft.trustedDirectors}
            hex={HP.green}
            onRemove={removeTrustedDirector}
            onAdd={addTrustedDirector}
            suggestions={directorSuggestions}
            placeholder="Type a director name…"
          />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: HP.textMuted, fontFamily: 'Outfit', marginBottom: 14 }}>Muted</div>
          <FreeTextChips
            items={draft.mutedDirectors}
            hex={HP.red}
            onRemove={removeMutedDirector}
            onAdd={addMutedDirector}
            suggestions={directorSuggestions}
            placeholder="Type a director name…"
          />
        </div>
      </div>
    </section>
  )
}

function Runtime() {
  const { draft, setRuntimeFloor, setRuntimeCap } = usePreferencesData()
  return (
    <section style={{ padding: '56px 88px', borderTop: `1px solid ${HP.border}`, background: 'rgba(255,255,255,0.012)' }}>
      <H kicker="Runtime" title="Your patience window." sub="Films outside this range still appear, but rank lower." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 18 }}>
            <span style={{ fontFamily: 'Outfit', fontSize: 56, fontWeight: 200, color: HP.text, letterSpacing: '-0.045em', lineHeight: 1 }}>{draft.runtimeFloor}&ndash;{draft.runtimeCap}</span>
            <span style={{ fontSize: 14, color: HP.textMuted, fontFamily: 'Outfit' }}>minutes</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360 }}>
            <label htmlFor="prefs-runtime-floor" style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Floor</label>
            <input id="prefs-runtime-floor" type="range" min="60" max="240" value={draft.runtimeFloor} onChange={e => setRuntimeFloor(+e.target.value)} style={{ accentColor: HP.purple }} />
            <label htmlFor="prefs-runtime-cap" style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>Cap</label>
            <input id="prefs-runtime-cap" type="range" min="60" max="240" value={draft.runtimeCap} onChange={e => setRuntimeCap(+e.target.value)} style={{ accentColor: HP.pink }} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: HP.textMuted, fontFamily: 'Outfit', marginBottom: 14 }}>Runtime band</div>
          <div style={{ fontFamily: 'Outfit, Inter, sans-serif', fontSize: 13, color: HP.textSoft, fontStyle: 'italic', lineHeight: 1.65 }}>
            Films shorter than <span style={{ color: HP.text, fontWeight: 600 }}>{draft.runtimeFloor} min</span> or longer than <span style={{ color: HP.text, fontWeight: 600 }}>{draft.runtimeCap} min</span> still appear in your briefings &mdash; they just rank lower.<br />
            Films inside the band get a quiet boost so you actually press play.
          </div>
        </div>
      </div>
    </section>
  )
}

function Daypart() {
  const { draft, toggleDaypart, catalogs } = usePreferencesData()
  return (
    <section style={{ padding: '56px 88px', borderTop: `1px solid ${HP.border}` }}>
      <H kicker="When you watch" title="Time-of-day fit." sub="The briefing tunes itself to when you actually settle in." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {catalogs.DAYPARTS.map(d => {
          const on = !!draft.daypart[d.id]
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => toggleDaypart(d.id)}
              aria-pressed={on}
              style={{
                padding: '20px 22px', borderRadius: 8,
                background: on ? 'rgba(167,139,250,0.10)' : 'rgba(255,255,255,0.025)',
                border: `1px solid ${on ? HP.purple + '66' : HP.border}`,
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ fontFamily: 'Outfit', fontSize: 18, fontWeight: 500, color: on ? HP.text : HP.textSoft, letterSpacing: '-0.015em' }}>{d.label}</div>
              <div style={{ marginTop: 6, fontSize: 11, color: on ? HP.purple : HP.textFaint, fontFamily: 'Outfit', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {on ? 'Active' : 'Off'}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function Subscriptions() {
  const { catalogs } = usePreferencesData()
  // Section is disabled — we don't track streamer availability per film yet.
  // Toggling can't move the engine until movies.watch_providers ships, so
  // the section is presented read-only with a "Coming soon" badge.
  return (
    <section style={{ padding: '56px 88px', borderTop: `1px solid ${HP.border}`, background: 'rgba(255,255,255,0.012)' }}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span style={{ height: 1, width: 22, background: HP.purple, opacity: 0.6 }} />Subscriptions
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: 'Outfit', fontSize: 36, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0 }}>What you have access to.</h2>
          <span style={{ padding: '4px 10px', borderRadius: 999, border: `1px solid ${HP.borderStrong}`, background: 'rgba(255,255,255,0.04)', fontFamily: 'Outfit', fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: HP.textMuted }}>Coming soon</span>
        </div>
        <p style={{ marginTop: 12, fontSize: 14, color: HP.textMuted, fontFamily: 'Outfit, Inter, sans-serif', lineHeight: 1.6, maxWidth: 560, fontStyle: 'italic' }}>
          We&rsquo;ll bias recommendations toward what you can actually watch tonight &mdash; once we wire up streamer-availability data.
        </p>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, opacity: 0.45, pointerEvents: 'none' }} aria-disabled="true">
        {catalogs.STREAMERS.map(s => (
          <div
            key={s.id}
            style={{
              padding: '18px 20px', borderRadius: 8,
              background: 'rgba(255,255,255,0.025)',
              border: `1px solid ${HP.border}`,
              display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, alignItems: 'center',
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 6, background: `linear-gradient(135deg, ${s.tint}33, ${s.tint}11)`, border: `1px solid ${s.tint}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit', fontWeight: 700, fontSize: 15, color: s.tint }}>{s.logo}</div>
            <div style={{ fontFamily: 'Outfit', fontSize: 14, fontWeight: 500, color: HP.textSoft, letterSpacing: '-0.01em' }}>{s.name}</div>
            <div style={{ width: 38, height: 22, borderRadius: 999, background: 'rgba(255,255,255,0.08)', position: 'relative' }}>
              <span style={{ position: 'absolute', top: 2, left: 2, width: 18, height: 18, borderRadius: 999, background: '#fff' }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Boundaries() {
  const { draft, toggleBoundary, catalogs } = usePreferencesData()
  return (
    <section style={{ padding: '56px 88px', borderTop: `1px solid ${HP.border}` }}>
      <H kicker="Content boundaries" title="Hard rules." sub="What we never show &mdash; or flag clearly when a film triggers them." />
      <div style={{ borderTop: `1px solid ${HP.border}` }}>
        {catalogs.BOUNDARIES.map(b => {
          const on = !!draft.boundaries[b.id]
          return (
            <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center', padding: '18px 0', borderBottom: `1px solid ${HP.border}` }}>
              <div>
                <div style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 500, color: HP.text, letterSpacing: '-0.01em' }}>{b.label}</div>
                <div style={{ marginTop: 3, fontSize: 12, color: HP.textMuted, fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic' }}>{b.desc}</div>
              </div>
              <button
                type="button"
                onClick={() => toggleBoundary(b.id)}
                aria-pressed={on}
                aria-label={`Toggle ${b.label}`}
                style={{ width: 44, height: 24, borderRadius: 999, background: on ? HP_GRAD : 'rgba(255,255,255,0.08)', border: 'none', position: 'relative', cursor: 'pointer', padding: 0 }}
              >
                <span style={{ position: 'absolute', top: 3, left: on ? 22 : 3, width: 18, height: 18, borderRadius: 999, background: '#fff', transition: 'left 0.25s ease' }} />
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Display() {
  const { draft, setSubtitles, setSpoilerTier, addLanguage, removeLanguage, catalogs } = usePreferencesData()
  const languageItems = draft.languages.map(l => ({ key: l, label: l }))
  const languageOptions = catalogs.LANGUAGES.map(l => ({ key: l, label: l }))
  return (
    <section style={{ padding: '56px 88px', borderTop: `1px solid ${HP.border}` }}>
      <H kicker="Display" title="How films arrive." sub="Doesn't change what we pick &mdash; just how each film shows up when you open it." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: HP.textMuted, fontFamily: 'Outfit', marginBottom: 6 }}>Subtitles</div>
          <div style={{ fontSize: 12, color: HP.textFaint, fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic', marginBottom: 14 }}>How you feel about reading them.</div>
          <Segmented value={draft.subtitles} onChange={setSubtitles} options={catalogs.SUBTITLE_MODES} />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: HP.textMuted, fontFamily: 'Outfit', marginBottom: 6 }}>Spoiler tier</div>
          <div style={{ fontSize: 12, color: HP.textFaint, fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic', marginBottom: 14 }}>How much synopsis we show by default.</div>
          <Segmented value={draft.spoilerTier} onChange={setSpoilerTier} options={catalogs.SPOILER_TIERS} />
        </div>
      </div>
      <div style={{ marginTop: 36 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: HP.textMuted, fontFamily: 'Outfit', marginBottom: 6 }}>Languages you watch</div>
        <div style={{ fontSize: 12, color: HP.textFaint, fontFamily: 'Outfit, Inter, sans-serif', fontStyle: 'italic', marginBottom: 14 }}>Films in these languages get a quiet boost.</div>
        <ChipPicker items={languageItems} hex={HP.purple} onRemove={removeLanguage} onAdd={addLanguage} options={languageOptions} addLabel="+ Language" />
      </div>
    </section>
  )
}

function Segmented({ value, onChange, options }) {
  return (
    <div role="radiogroup" style={{ display: 'inline-flex', padding: 3, borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: `1px solid ${HP.border}`, flexWrap: 'wrap' }}>
      {options.map(o => {
        const on = o.v === value
        return (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.v)}
            style={{ padding: '8px 16px', borderRadius: 999, background: on ? HP_GRAD : 'transparent', color: on ? '#fff' : HP.textMuted, border: 'none', cursor: 'pointer', fontFamily: 'Outfit', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em' }}
          >{o.l}</button>
        )
      })}
    </div>
  )
}

function PreviewPanel() {
  const { dirty, saving, savedAt, save, discard } = usePreferencesData()
  const justSaved = savedAt && Date.now() - savedAt < 3000
  return (
    <section style={{ padding: '56px 88px 88px', borderTop: `1px solid ${HP.border}`, background: 'rgba(167,139,250,0.04)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 48, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: HP.purple, marginBottom: 12 }}>Effect on your engine</div>
          <h2 style={{ fontFamily: 'Outfit', fontSize: 36, lineHeight: 1.05, fontWeight: 500, letterSpacing: '-0.03em', color: HP.text, margin: 0, textWrap: 'balance' }}>
            {justSaved
              ? <>Saved. <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>Next briefing will retune.</em></>
              : dirty
                ? <>Unsaved changes &mdash; <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>save to apply.</em></>
                : <>Engine is up to date <em style={{ fontStyle: 'italic', fontWeight: 400, color: HP.textSoft }}>with your dials.</em></>}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={discard}
            disabled={!dirty || saving}
            style={{ padding: '12px 22px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: `1px solid ${HP.borderStrong}`, color: dirty ? HP.textSoft : HP.textFaint, fontFamily: 'Outfit', fontSize: 13, fontWeight: 600, cursor: dirty ? 'pointer' : 'not-allowed', opacity: dirty ? 1 : 0.6 }}
          >Discard</button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            style={{ padding: '12px 22px', borderRadius: 8, background: dirty && !saving ? HP_GRAD : 'rgba(255,255,255,0.06)', border: 'none', color: dirty && !saving ? '#fff' : HP.textFaint, fontFamily: 'Outfit', fontSize: 13, fontWeight: 600, letterSpacing: '0.02em', cursor: dirty && !saving ? 'pointer' : 'not-allowed', boxShadow: dirty && !saving ? '0 12px 28px -8px rgba(236,72,153,0.5)' : 'none' }}
          >{saving ? 'Saving…' : 'Save and retune'}</button>
        </div>
      </div>
    </section>
  )
}

// === Shell ===============================================================

function PageSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: HP.bgDeep, color: HP.text, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '80px 88px' }}>
        <div className="animate-pulse" style={{ height: 64, width: '40%', borderRadius: 8, background: 'rgba(255,255,255,0.04)', marginBottom: 32 }} />
        <div className="animate-pulse" style={{ height: 18, width: '55%', borderRadius: 999, background: 'rgba(255,255,255,0.03)' }} />
      </div>
    </div>
  )
}

function PreferencesV2Body() {
  const { loading } = usePreferencesData()
  if (loading) return <PageSkeleton />
  return (
    <div className="ff-preferences-v2" style={{ minHeight: '100vh', background: HP.bgDeep, color: HP.text, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <Masthead />
        <MoodDials />
        <GenresPrefs />
        <DirectorPrefs />
        <Runtime />
        <Daypart />
        <Subscriptions />
        <Boundaries />
        <Display />
        <PreviewPanel />
      </div>
    </div>
  )
}

export default function Preferences() {
  usePageMeta({ title: 'Preferences — FeelFlick' })
  return (
    <PreferencesDataProvider>
      <PreferencesV2Body />
    </PreferencesDataProvider>
  )
}
