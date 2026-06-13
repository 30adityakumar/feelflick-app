import { useState } from 'react'
import { ROSE } from '@/shared/lib/tokens'
import { HP, TIME_OPTIONS, WHO_OPTIONS, ENERGY_OPTIONS, INTENTIONS } from '../constants'

// Stage 2 (F3.6) — the night-context CHECKPOINT. Replaces the forced 4-question
// auto-advancing wizard with a SUMMARY-FIRST view: the four values Discover already
// predicted (intention / time / who / energy) are shown filled in, the primary CTA
// is available immediately (no four confirmation taps), and all editing lives behind
// one optional "Adjust details" disclosure. This component owns NO persistence — the
// parent commits the visible values only when the user explicitly continues.
export default function StageNightContext({ time, setTime, who, setWho, energy, setEnergy, intention, setIntention, onUserEdit, onNext, onBack, blendHex, playOptionCue, playContinueCue }) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Each editor group + the summary read their value LABEL from the shared option
  // tables (constants.js) — never a duplicated hardcoded string.
  const GROUPS = [
    { id: 'intention', legend: 'Intention', options: INTENTIONS,     value: intention, setValue: setIntention, gridClass: '' },
    { id: 'time',      legend: 'Time',      options: TIME_OPTIONS,   value: time,      setValue: setTime,      gridClass: 'ff-night-grid--time' },
    { id: 'who',       legend: 'Watching',  options: WHO_OPTIONS,    value: who,       setValue: setWho,       gridClass: 'ff-night-grid--who' },
    { id: 'energy',    legend: 'Energy',    options: ENERGY_OPTIONS, value: energy,    setValue: setEnergy,    gridClass: 'ff-night-grid--energy' },
  ]
  const labelOf = (options, value) => options.find(o => o.id === value)?.label || '—'

  // Editing a detail: mark context manually touched (the parent freezes predictions
  // so a late profile/mood/learned update can't overwrite this), update ONLY this
  // field, cue — and keep the editor open. No auto-advance, no preference write.
  const handlePick = (group, optId) => {
    onUserEdit()
    group.setValue(optId)
    playOptionCue()
  }

  return (
    <section className="ff-night-context ff-discover-section" style={{ position:'relative', minHeight:'82vh', animation:'ff-fade 0.5s ease' }}>
      <div style={{ textAlign:'center', marginBottom:28 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.32em', textTransform:'uppercase', color:ROSE, marginBottom:14 }}>Tonight · 2 of 2</div>
        <h1 style={{ fontFamily:'var(--font-editorial)', fontSize:'clamp(28px, 5vw, 56px)', lineHeight:1.05, fontWeight:400, letterSpacing:'-0.03em', color:HP.text, margin:0 }}>
          A few details, <em style={{ fontStyle:'italic', color:blendHex }}>already filled in.</em>
        </h1>
        <p style={{ marginTop:14, fontFamily:'Inter, sans-serif', fontSize:14, color:HP.textMuted, fontStyle:'italic' }}>Keep this starting point, or adjust anything that feels off.</p>
      </div>

      <div style={{ maxWidth:760, margin:'0 auto' }}>
        {/* Summary — quiet 2×2 grid; value labels read from the option tables. */}
        <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:HP.textMuted, fontFamily:'Inter, sans-serif', marginBottom:10 }}>Tonight’s starting point</div>
        <dl className="ff-night-summary">
          {GROUPS.map(g => (
            <div key={g.id} className="ff-night-summary__item" style={{ background:HP.surface, border:`1px solid ${HP.border}` }}>
              <dt className="ff-night-summary__label" style={{ color:HP.textMuted }}>{g.legend}</dt>
              <dd className="ff-night-summary__value" style={{ color:HP.text }}>{labelOf(g.options, g.value)}</dd>
            </div>
          ))}
        </dl>

        {/* Optional editor — one disclosure, never four separate screens. */}
        <button
          type="button"
          className="ff-night-details-toggle"
          aria-expanded={detailsOpen}
          aria-controls="ff-night-details"
          onClick={() => setDetailsOpen(o => !o)}
          style={{ marginTop:16, padding:'10px 18px', borderRadius:999, background:'transparent', border:`1px solid ${HP.border}`, color:HP.textSoft, fontFamily:'Inter, sans-serif', fontSize:12, fontWeight:600, letterSpacing:'0.02em', cursor:'pointer' }}
        >
          {detailsOpen ? 'Done adjusting' : 'Adjust details'}
        </button>

        {detailsOpen && (
          <div id="ff-night-details" className="ff-night-details" style={{ marginTop:18, display:'flex', flexDirection:'column', gap:24, animation:'ff-fade 0.3s ease' }}>
            {GROUPS.map(g => (
              <fieldset key={g.id} className="ff-night-fieldset" style={{ border:'none', padding:0, margin:0, minWidth:0 }}>
                <legend style={{ fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:ROSE, fontFamily:'Inter, sans-serif', padding:0, marginBottom:12 }}>{g.legend}</legend>
                <div className={`ff-night-grid ${g.gridClass}`.trim()}>
                  {g.options.map(o => {
                    const on = g.value === o.id
                    return (
                      <button
                        key={o.id}
                        type="button"
                        aria-pressed={on}
                        aria-label={`${o.label} — ${o.sub}`}
                        className="ff-night-option"
                        onClick={() => handlePick(g, o.id)}
                        style={{ flex:1, padding:'14px 14px', borderRadius:10, textAlign:'left', background: on ? `${blendHex}1f` : 'rgba(255,255,255,0.025)', border:`1px solid ${on ? blendHex + '88' : HP.border}`, color: on ? HP.text : HP.textSoft, cursor:'pointer', transition:'all 0.25s ease', boxShadow: on ? `0 0 24px ${blendHex}33` : 'none' }}
                      >
                        {o.icon && <div aria-hidden="true" style={{ fontSize:20, marginBottom:8, color: on?blendHex:HP.textMuted, letterSpacing:'0.1em' }}>{o.icon}</div>}
                        <div style={{ fontFamily:'Inter, sans-serif', fontSize:14, fontWeight:500, letterSpacing:'-0.015em' }}>{o.label}</div>
                        <div style={{ marginTop:3, fontSize:11, color: on?blendHex:HP.textMuted, fontFamily:'Inter, sans-serif', fontStyle:'italic' }}>{o.sub}</div>
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        )}
      </div>

      <div className="ff-stage-action-bar">
        <button onClick={onBack} style={{ padding:'10px 20px', borderRadius:999, background:'transparent', border:`1px solid ${HP.border}`, color:HP.textMuted, fontFamily:'Inter, sans-serif', fontSize:12, fontWeight:500, cursor:'pointer' }}>← Back</button>
        <div className="ff-stage-action-bar__meta" style={{ fontSize:11, color:HP.textFaint, fontFamily:'Inter, sans-serif' }}>These details shape tonight’s ranking.</div>
        <button onClick={()=>{ playContinueCue(); onNext(); }} style={{ padding:'14px 28px', borderRadius:999, background:ROSE, border:'none', color:'#fff', fontFamily:'Inter, sans-serif', fontSize:13, fontWeight:600, letterSpacing:'0.04em', cursor:'pointer', boxShadow:'0 12px 30px -10px rgba(221,78,131,0.5)' }}>Find my film →</button>
      </div>
    </section>
  )
}
