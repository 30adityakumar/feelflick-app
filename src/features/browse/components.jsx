import React, { useState, useMemo, useEffect, useRef } from 'react'
import { HP, HP_GRAD, MOODS, SORT_OPTIONS, DECADE_OPTIONS, LANG_OPTIONS, GENRE_OPTIONS, RUNTIME_OPTIONS, PACING_OPTIONS, INTENSITY_OPTIONS, DEPTH_OPTIONS, DIALOGUE_OPTIONS, ATTENTION_OPTIONS, GAP_OPTIONS, VIBE_OPTIONS, PRESETS } from './data'

// FeelFlick — Browse v3 components.
// /browse v5 — components & helpers.


// ── Inline icons (lucide-style) ──
const Ic = ({ d, s=16, fill='none' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IcSearch = (p) => <Ic {...p} d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></>} />;
const IcX      = (p) => <Ic {...p} d={<><path d="M18 6 6 18M6 6l12 12"/></>} />;
const IcChevD  = (p) => <Ic {...p} d={<path d="m6 9 6 6 6-6"/>} />;
const IcChevU  = (p) => <Ic {...p} d={<path d="m18 15-6-6-6 6"/>} />;
const IcSlide  = (p) => <Ic {...p} d={<><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></>} />;
const IcPlus   = (p) => <Ic {...p} d={<><path d="M12 5v14M5 12h14"/></>} />;
const IcCheck  = (p) => <Ic {...p} d={<path d="M20 6 9 17l-5-5"/>} />;
const IcEye    = (p) => <Ic {...p} d={<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>} />;
const IcEyeOff = (p) => <Ic {...p} d={<><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><path d="m2 2 20 20"/></>} />;
const IcClock  = (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>} />;
const IcGrid   = (p) => <Ic {...p} d={<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>} />;
const IcList   = (p) => <Ic {...p} d={<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>} />;
const IcAward  = (p) => <Ic {...p} d={<><circle cx="12" cy="8" r="6"/><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/></>} />;
const IcSpark  = (p) => <Ic {...p} d={<path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z"/>} />;
const IcGem    = (p) => <Ic {...p} d={<><path d="M6 3h12l3 5-9 13L3 8z"/><path d="M9 8l3 13 3-13M3 8h18"/></>} />;
const IcMoon   = (p) => <Ic {...p} d={<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>} />;
const IcBrain  = (p) => <Ic {...p} d={<><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04Z"/></>} />;
const IcZap    = (p) => <Ic {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>} />;
const IcGlobe  = (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14.7 14.7 0 0 1 0 18 14.7 14.7 0 0 1 0-18z"/></>} />;
const IcFlame  = (p) => <Ic {...p} d={<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>} />;
const IcSmile  = (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></>} />;
const IcInfo   = (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="9"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>} />;
const PRESET_ICONS = { gem:IcGem, moon:IcMoon, brain:IcBrain, zap:IcZap, globe:IcGlobe, flame:IcFlame, smile:IcSmile, clock:IcClock, spark:IcSpark };

// ── Mood tag helper ──
function getMoodTag(m) {
  if (m.cult >= 60)                          return { label:'Cult classic',   color:'#A78BFA' };
  if (m.hidden >= 50)                        return { label:'Hidden gem',     color:'#34D399' };
  if (m.intensity >= 8)                      return { label:'Intense',        color:'#F87171' };
  if (m.pacing <= 3 && m.depth >= 7)         return { label:'Slow burn',      color:'#93C5FD' };
  if (m.pacing >= 8)                         return { label:'Fast-paced',     color:'#FBBF24' };
  if (m.depth >= 8)                          return { label:'Thought-provoking', color:'#C4B5FD' };
  return null;
}

// ╭───────────────────────────────────────╮
// │ Nav                                   │
// ╰───────────────────────────────────────╯
function Nav() {
  return (
    <header style={{ padding:'14px 56px', borderBottom:`1px solid ${HP.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(6,6,10,0.7)', backdropFilter:'blur(18px) saturate(140%)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:26, height:26, borderRadius:6, background:HP_GRAD, display:'inline-flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit', fontWeight:700, fontSize:12, color:'#fff' }}>FF</div>
        <span style={{ fontFamily:'Outfit', fontWeight:600, fontSize:14, color:HP.text, letterSpacing:'-0.005em' }}>FeelFlick</span>
      </div>
      <nav style={{ display:'flex', gap:24 }}>
        <span style={{ fontSize:13, color:HP.textMid, fontFamily:'Inter', fontWeight:500 }}>Home</span>
        <span style={{ fontSize:13, color:HP.text, fontFamily:'Inter', fontWeight:600, position:'relative' }}>Browse<span style={{ position:'absolute', left:0, right:0, bottom:-18, height:2, background:HP.purple, borderRadius:2 }}/></span>
        <span style={{ fontSize:13, color:HP.textMid, fontFamily:'Inter', fontWeight:500 }}>Diary</span>
        <span style={{ fontSize:13, color:HP.textMid, fontFamily:'Inter', fontWeight:500 }}>DNA</span>
      </nav>
    </header>
  );
}

// ╭───────────────────────────────────────╮
// │ Editorial header + mood reactor       │
// ╰───────────────────────────────────────╯
function EditorialHeader({ mood, setMood, total }) {
  const m = MOODS.find(x => x.id === mood) || MOODS[0];
  const tint = m.hex;
  return (
    <section style={{ padding:'40px 56px 18px', position:'relative' }}>
      <div aria-hidden style={{ position:'absolute', inset:0, pointerEvents:'none', background:`radial-gradient(ellipse 60% 50% at 22% 0%, ${tint}22, transparent 60%), radial-gradient(ellipse 50% 40% at 90% 0%, ${tint}11, transparent 60%)`, transition:'background 0.6s ease' }} />
      <div style={{ position:'relative', display:'flex', alignItems:'center', gap:14 }}>
        <span style={{ fontFamily:'Outfit', fontSize:11, fontWeight:600, letterSpacing:'0.28em', textTransform:'uppercase', color:tint }}>Browse</span>
        <span style={{ height:1, flex:1, maxWidth:56, background:tint, opacity:0.5 }} />
      </div>
    </section>
  );
}

// ╭───────────────────────────────────────╮
// │ Mood pill row — sits below toolbar          │
// ╰───────────────────────────────────────╯
function MoodRow({ mood, setMood, sortBy, setSortBy, view, setView }) {
  return (
    <section className="ff-browse-mood-row" style={{ padding:'22px 56px 6px', display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
      <span style={{ fontFamily:'Outfit', fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:HP.textLow }}>Mood</span>
      <div className="ff-browse-mood-pills" style={{ display:'flex', flexWrap:'wrap', gap:7, flex:1 }}>
        {MOODS.map(p => {
          const on = mood === p.id;
          return (
            <button key={p.id} onClick={()=>setMood(p.id)} style={{
              display:'inline-flex', alignItems:'center', gap:7, padding:'8px 13px', borderRadius:999,
              background: on ? `${p.hex}1f` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${on ? p.hex+'66' : HP.border}`,
              color: on ? HP.text : HP.textMid,
              fontFamily:'Inter', fontSize:13, fontWeight: on ? 600 : 500,
              cursor:'pointer', transition:'all 0.2s ease',
              boxShadow: on ? `0 0 14px ${p.hex}22` : 'none',
              whiteSpace:'nowrap',
            }}>
              <span style={{ width:6, height:6, borderRadius:999, background:p.hex }} />{p.label}
            </button>
          );
        })}
      </div>
      <div className="ff-browse-mood-controls" style={{ display:'flex', gap:10, alignItems:'center' }}>
        <FilterPill label="Sort" value={sortBy} defaultValue="ff_rating.desc" options={SORT_OPTIONS} onChange={setSortBy} />
        <div style={{ display:'inline-flex', height:34, padding:3, borderRadius:999, background:'rgba(255,255,255,0.04)', border:`1px solid ${HP.border}` }}>
          {[{v:'grid',I:IcGrid},{v:'list',I:IcList}].map(({v,I}) => {
            const on = view === v;
            return (
              <button key={v} onClick={()=>setView(v)} aria-label={`${v} view`} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:32, borderRadius:999, background: on ? HP_GRAD : 'transparent', color: on ? '#fff' : HP.textLow, border:'none', cursor:'pointer', transition:'all 0.2s ease' }}>
                <I s={14} />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ╭───────────────────────────────────────╮
// │ Tonight CTA                           │
// ╰───────────────────────────────────────╯
function TonightRow({ on, set }) {
  return (
    <section style={{ padding:'4px 56px 18px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:18, alignItems:'center', padding:'14px 18px', borderRadius:10, background: on ? 'rgba(167,139,250,0.10)' : 'rgba(255,255,255,0.025)', border:`1px solid ${on ? HP.purple+'55' : HP.border}`, transition:'all 0.2s ease' }}>
        <div style={{ width:34, height:34, borderRadius:999, background: on ? HP_GRAD : 'rgba(167,139,250,0.13)', color: on ? '#fff' : HP.purple, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <IcClock s={16} />
        </div>
        <div>
          <div style={{ fontFamily:'Outfit', fontSize:15, fontWeight:500, color:HP.text, letterSpacing:'-0.005em' }}>{on ? 'Tonight mode on' : 'Pick for tonight'}</div>
          <div style={{ fontFamily:'Inter', fontSize:12.5, color:HP.textMid, marginTop:2, lineHeight:1.5 }}>{on ? 'Slow-burn, under 2h 15m, available on your streamers.' : 'One tap: tune the catalogue to your evening.'}</div>
        </div>
        <button onClick={()=>set(!on)} style={{ padding:'10px 18px', borderRadius:999, background: on ? 'rgba(255,255,255,0.06)' : HP_GRAD, border: on ? `1px solid ${HP.borderStrong}` : 'none', color: on ? HP.textMid : '#fff', fontFamily:'Inter', fontSize:12.5, fontWeight:600, cursor:'pointer' }}>{on ? 'Clear' : 'Tonight →'}</button>
      </div>
    </section>
  );
}

// ╭───────────────────────────────────────╮
// │ Filter components                     │
// ╰───────────────────────────────────────╯
function FilterPill({ label, value, options, defaultValue='', onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', esc); };
  }, [open]);
  const active = value !== defaultValue;
  const activeLabel = active ? (options.find(o => o.value === value)?.label ?? label) : label;
  return (
    <div ref={ref} className="ff-browse-filter-pill" style={{ position:'relative' }}>
      <button onClick={()=>setOpen(v=>!v)} aria-haspopup="listbox" aria-expanded={open} style={{ display:'inline-flex', alignItems:'center', gap:7, height:34, padding:'0 14px', borderRadius:999, border:`1px solid ${active ? HP.purple+'66' : HP.border}`, background: active ? `${HP.purple}1a` : 'rgba(255,255,255,0.04)', color: active ? HP.text : HP.textMid, fontFamily:'Inter', fontSize:12.5, fontWeight:500, cursor:'pointer', transition:'all 0.15s ease' }}>
        <span>{activeLabel}</span>
        <IcChevD s={12} style={{ color: active ? HP.purple : HP.textLow, opacity:0.85, transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.18s ease' }} />
      </button>
      {/* Native <select> overlay for touch devices. CSS hides it on
          `pointer: fine` (desktop); on `pointer: coarse` (phones/tablets)
          it covers the chip and intercepts taps, so the OS picker (with
          its Done/Cancel actions) handles the selection.
          - Fixes the dropdown-clipped-by-overflow bug at narrow widths.
          - Gives the Apply/Reset buttons users expect on mobile (iOS Done
            / Android OK = apply; Cancel = revert). */}
      <select
        className="ff-browse-filter-pill-native"
        value={value}
        aria-label={label}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {open && (
        <div role="listbox" className="ff-browse-filter-pill-menu" style={{ position:'absolute', top:'calc(100% + 8px)', left:0, minWidth:200, maxHeight:340, overflowY:'auto', padding:6, borderRadius:14, background:'rgba(14,11,24,0.96)', border:`1px solid ${HP.borderStrong}`, boxShadow:'0 24px 48px -12px rgba(0,0,0,0.7)', backdropFilter:'blur(20px)', zIndex:60, animation:'ffSelectIn 0.16s cubic-bezier(.2,.7,.2,1)' }}>
          <style>{`@keyframes ffSelectIn { from { opacity:0; transform:translateY(-6px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
          {options.map(o => {
            const on = value === o.value;
            return (
              <button key={o.value} onClick={()=>{ onChange(o.value); setOpen(false); }} role="option" aria-selected={on} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 12px', borderRadius:8, background: on ? `${HP.purple}1a` : 'transparent', border:'none', color: on ? HP.text : HP.textMid, fontFamily:'Inter', fontSize:13, fontWeight:500, cursor:'pointer', textAlign:'left', transition:'background 0.12s ease' }}
                onMouseEnter={e => { if (!on) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ flex:1 }}>{o.label}</span>
                {on && <span style={{ color:HP.purple }}><IcCheck s={13}/></span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PresetsDropdown({ preset, applyPreset }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', esc); };
  }, [open]);
  const activePreset = PRESETS.find(p => p.id === preset);
  // Same touch-device escape hatch as FilterPill — a hidden native select
  // overlay captures taps on phones/tablets where the custom dropdown is
  // clipped by the toolbar's overflow-x: auto. Selecting an option here
  // calls applyPreset, which toggles or applies the preset.
  const handleNativeSelect = (e) => {
    const id = e.target.value;
    if (!id) return;
    const p = PRESETS.find(x => x.id === id);
    if (p) applyPreset(p);
  };
  return (
    <div ref={ref} className="ff-browse-filter-pill" style={{ position:'relative' }}>
      <button onClick={()=>setOpen(v=>!v)} aria-haspopup="listbox" aria-expanded={open} style={{ display:'inline-flex', alignItems:'center', gap:7, height:34, padding:'0 14px', borderRadius:999, border:`1px solid ${preset ? HP.purple+'66' : HP.border}`, background: preset ? `${HP.purple}1a` : 'rgba(255,255,255,0.04)', color: preset ? HP.text : HP.textMid, fontFamily:'Inter', fontSize:12.5, fontWeight:500, cursor:'pointer', transition:'all 0.15s ease' }}>
        {activePreset ? (() => { const I = PRESET_ICONS[activePreset.icon] || IcSpark; return <><span style={{ color:HP.purple, display:'inline-flex' }}><I s={13}/></span>{activePreset.label}</>; })() : <><IcSpark s={13} style={{ color:HP.textLow }}/>Presets</>}
        <IcChevD s={12} style={{ color: preset ? HP.purple : HP.textLow, opacity:0.85 }}/>
      </button>
      <select className="ff-browse-filter-pill-native" value={preset || ''} onChange={handleNativeSelect} aria-label="Presets">
        <option value="">No preset</option>
        {PRESETS.map(p => (
          <option key={p.id} value={p.id}>{p.label}</option>
        ))}
      </select>
      {open && (
        <div role="listbox" style={{ position:'absolute', top:'calc(100% + 8px)', left:0, minWidth:240, padding:6, borderRadius:14, background:'rgba(14,11,24,0.96)', border:`1px solid ${HP.borderStrong}`, boxShadow:'0 24px 48px -12px rgba(0,0,0,0.7)', backdropFilter:'blur(20px)', zIndex:60, animation:'ffPresetsIn 0.16s cubic-bezier(.2,.7,.2,1)' }}>
          <style>{`@keyframes ffPresetsIn { from { opacity:0; transform:translateY(-6px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
          {PRESETS.map(p => {
            const PIcon = PRESET_ICONS[p.icon] || IcSpark;
            const on = preset === p.id;
            return (
              <button key={p.id} onClick={()=>{ applyPreset(p); setOpen(false); }} role="option" aria-selected={on} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 12px', borderRadius:8, background: on ? `${HP.purple}1a` : 'transparent', border:'none', color: on ? HP.text : HP.textMid, fontFamily:'Inter', fontSize:13, fontWeight:500, cursor:'pointer', textAlign:'left', transition:'background 0.12s ease' }}
                onMouseEnter={e => { if (!on) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ display:'inline-flex', color: on ? HP.purple : HP.textLow }}><PIcon s={14}/></span>
                {p.label}
                {on && <span style={{ marginLeft:'auto', color:HP.purple }}><IcCheck s={13}/></span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ToggleSwitch({ on, onClick, label, disabled = false, title }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      role="switch"
      aria-checked={on}
      aria-disabled={disabled || undefined}
      title={title}
      disabled={disabled}
      style={{
        display:'inline-flex', alignItems:'center', gap:9, height:34, padding:'0 14px',
        borderRadius:999, border:`1px solid ${on ? HP.purple+'66' : HP.border}`,
        background: on ? `${HP.purple}10` : 'rgba(255,255,255,0.04)',
        color: on ? HP.text : HP.textMid,
        fontFamily:'Inter', fontSize:12.5, fontWeight:500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition:'all 0.15s ease',
      }}>
      <span style={{ position:'relative', width:26, height:14, borderRadius:999, background: on ? HP.purple : 'rgba(255,255,255,0.14)', transition:'background 0.2s ease', flex:'none' }}>
        <span aria-hidden style={{ position:'absolute', top:2, left: on ? 14 : 2, width:10, height:10, borderRadius:999, background:'#fff', transition:'left 0.2s cubic-bezier(.2,.7,.2,1)', boxShadow:'0 1px 3px rgba(0,0,0,0.4)' }} />
      </span>
      {label}
    </button>
  );
}

function ToggleDot({ on }) {
  return (
    <span aria-hidden style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:14, height:14, borderRadius:999, background: on ? HP.purple : 'transparent', border:`1.5px solid ${on ? HP.purple : 'rgba(255,255,255,0.25)'}`, transition:'all 0.18s ease', flex:'none' }}>
      {on && <span style={{ width:5, height:5, borderRadius:999, background:'#fff' }}/>}
    </span>
  );
}

function SegGroup({ label, value, options, onChange }) {
  return (
    <div>
      <div style={{ fontFamily:'Outfit', fontSize:11, fontWeight:600, letterSpacing:'0.16em', textTransform:'uppercase', color:HP.textLow, marginBottom:10 }}>{label}</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {options.map(o => {
          if (!o.value) return null;
          const active = value === o.value;
          return (
            <button key={o.value} onClick={()=>onChange(active ? '' : o.value)} style={{ height:32, padding:'0 13px', borderRadius:999, border:`1px solid ${active ? HP.purple+'66' : HP.border}`, background: active ? `${HP.purple}1a` : 'rgba(255,255,255,0.04)', color: active ? HP.text : HP.textMid, fontFamily:'Inter', fontSize:12, fontWeight:500, cursor:'pointer', transition:'all 0.15s ease' }}>{o.label}</button>
          );
        })}
      </div>
    </div>
  );
}

function RatingSlider({ label, value, onChange }) {
  const numValue = Number(value) || 0;
  return (
    <div>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ fontFamily:'Outfit', fontSize:11, fontWeight:600, letterSpacing:'0.16em', textTransform:'uppercase', color:HP.textLow }}>{label}</div>
        {numValue > 0 && <div style={{ fontFamily:'Outfit', fontSize:14, fontWeight:500, color:HP.purple, letterSpacing:'-0.01em' }}>≥ {numValue}</div>}
      </div>
      <input type="range" min={0} max={95} step={5} value={numValue} onChange={e => onChange(e.target.value === '0' ? '' : e.target.value)} style={{ width:'100%', accentColor:HP.purpleDeep }} />
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontFamily:'Inter', fontSize:10, color:HP.textFaint }}>
        <span>Off</span><span>95</span>
      </div>
    </div>
  );
}

// ╭───────────────────────────────────────╮
// │ Toolbar — search, sort, view, filters │
// ╰───────────────────────────────────────╯
function Toolbar(props) {
  const { query, setQuery, draftQuery, setDraftQuery, hideWatched, setHide, panelOpen, setPanel, advancedCount, availableTonight, setAvailableTonight, availableTonightDisabled, availableTonightTitle, twinsLoved, setTwinsLoved, twinsLovedDisabled, twinsLovedTitle, onSurprise } = props;
  const searchRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div className="ff-browse-toolbar" style={{ position:'sticky', top:0, zIndex:40, padding:'14px 56px 14px', borderTop:`1px solid ${HP.border}`, borderBottom:`1px solid ${HP.border}`, background:'rgba(6,6,10,0.92)', backdropFilter:'blur(20px) saturate(140%)' }}>
      {/* Row 1 — search + Search button + Surprise me */}
      <form className="ff-browse-toolbar-form" onSubmit={e=>{e.preventDefault(); setQuery(draftQuery);}} style={{ display:'flex', gap:10, alignItems:'center' }}>
        <div style={{ position:'relative', flex:1 }}>
          <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:HP.textLow }}><IcSearch s={15} /></div>
          <input ref={searchRef} value={draftQuery} onChange={e=>setDraftQuery(e.target.value)} placeholder="Search by title or director…" style={{ width:'100%', height:42, padding:'0 38px 0 42px', borderRadius:999, border:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.04)', color:HP.text, fontFamily:'Inter', fontSize:14, outline:'none', transition:'border-color 0.18s ease' }} onFocus={e=>e.target.style.borderColor=HP.purple+'66'} onBlur={e=>e.target.style.borderColor=HP.border} />
          {draftQuery && <button type="button" onClick={()=>{setDraftQuery(''); setQuery('');}} style={{ position:'absolute', right:42, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', color:HP.textLow, cursor:'pointer', padding:4 }}><IcX s={14}/></button>}
          <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', padding:'3px 7px', borderRadius:4, background:'rgba(255,255,255,0.05)', border:`1px solid ${HP.border}`, color:HP.textLow, fontFamily:'Inter', fontSize:11, letterSpacing:'0.04em' }}>/</span>
        </div>
        <button type="submit" aria-label="Search" className="ff-browse-search-btn" style={{ height:42, padding:'0 22px', borderRadius:999, background:HP_GRAD, border:'none', color:'#fff', fontFamily:'Inter', fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', boxShadow:'0 8px 18px -6px rgba(236,72,153,0.4)', display:'inline-flex', alignItems:'center', gap:7 }}>
          <span className="ff-browse-search-btn-icon" aria-hidden style={{ display:'none' }}><IcSearch s={16}/></span>
          <span className="ff-browse-search-btn-label">Search</span>
        </button>
        <button type="button" className="ff-browse-surprise-btn" onClick={onSurprise} style={{ display:'inline-flex', alignItems:'center', gap:7, height:42, padding:'0 18px', borderRadius:999, background:'rgba(255,255,255,0.05)', border:`1px solid ${HP.borderStrong}`, color:HP.textHi, fontFamily:'Inter', fontSize:13, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap' }}>✨ Surprise me</button>
      </form>

      {/* Row 2 — quick pills + presets + refine + toggles.
          On mobile (<640) the chip cluster and toggle cluster collapse via
          CSS into the Refine panel — a single "Filters" button replaces a
          5-row wall of controls. Class hooks below mark the regions that
          get hidden. */}
      <div className="ff-browse-toolbar-row2" style={{ marginTop:11, display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
        <div className="ff-browse-quick-chips" style={{ display:'inline-flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
          <FilterPill label="Genre" value={props.genre} options={GENRE_OPTIONS} onChange={props.setGenre} />
          <FilterPill label="Era" value={props.decade} options={DECADE_OPTIONS} onChange={props.setDecade} />
          <FilterPill label="Language" value={props.lang} options={LANG_OPTIONS} onChange={props.setLang} />
          <FilterPill label="Runtime" value={props.runtime} options={RUNTIME_OPTIONS} onChange={props.setRuntime} />
          <PresetsDropdown preset={props.preset} applyPreset={props.applyPreset} />
          <div style={{ width:1, height:20, background:HP.border, margin:'0 3px' }} />
        </div>

        <button className="ff-browse-refine-btn" onClick={()=>setPanel(true)} style={{ display:'inline-flex', alignItems:'center', gap:7, height:34, padding:'0 14px', borderRadius:999, border:`1px solid ${panelOpen||advancedCount>0 ? HP.purple+'66' : HP.border}`, background: panelOpen||advancedCount>0 ? `${HP.purple}1a` : 'rgba(255,255,255,0.04)', color: panelOpen||advancedCount>0 ? HP.text : HP.textMid, fontFamily:'Inter', fontSize:12.5, fontWeight:500, cursor:'pointer', transition:'all 0.15s ease' }}>
          {panelOpen ? <IcChevU s={13}/> : <IcSlide s={13}/>}<span>Filters</span>
          {advancedCount > 0 && <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:18, height:18, borderRadius:999, background:HP_GRAD, fontSize:10, fontWeight:700, color:'#fff' }}>{advancedCount}</span>}
        </button>

        <div className="ff-browse-quick-toggles" style={{ display:'inline-flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
          <ToggleSwitch on={hideWatched}      onClick={()=>setHide(!hideWatched)}                 label="Hide watched" />
          <ToggleSwitch on={availableTonight} onClick={()=>setAvailableTonight(!availableTonight)} label="Streaming I have" disabled={availableTonightDisabled} title={availableTonightTitle} />
          <ToggleSwitch on={twinsLoved}       onClick={()=>setTwinsLoved(!twinsLoved)}             label="Twins loved"      disabled={twinsLovedDisabled}      title={twinsLovedTitle} />
        </div>

        {props.hasAnyFilter && <button className="ff-browse-clear-all" onClick={props.clearAll} style={{ marginLeft:'auto', display:'inline-flex', alignItems:'center', gap:5, height:32, padding:'0 13px', borderRadius:999, border:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.04)', color:HP.textLow, fontFamily:'Inter', fontSize:12, fontWeight:500, cursor:'pointer' }}><IcX s={11}/>Clear all</button>}
      </div>

      {/* Active filter chips */}
      {props.activeFilters.length > 0 && (
        <div style={{ marginTop:9, display:'flex', flexWrap:'wrap', gap:6 }}>
          {props.activeFilters.map(f => (
            <button key={f.k} onClick={f.c} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:999, background:`${HP.purple}1a`, border:`1px solid ${HP.purple}44`, color:HP.purple, fontFamily:'Inter', fontSize:11.5, fontWeight:500, cursor:'pointer' }}>{f.l}<IcX s={11}/></button>
          ))}
        </div>
      )}
    </div>
  );
}

// ╭───────────────────────────────────────╮
// │ Refine panel (advanced filters)       │
// ╰───────────────────────────────────────╯
function RefinePanel(props) {
  const {
    vibe, setVibe, draftDirector, setDraftDir, setDirector, open,
    // Live result count + clear-all surfaced in the panel footer so users
    // tuning filters can see what their selections will return without
    // closing the panel first.
    totalResults, hasAnyFilter, clearAll,
    // Quick filters (also exposed in the toolbar on desktop). Required so
    // the panel is a complete filter surface on mobile, where the toolbar
    // collapses these into the panel via CSS.
    genre, setGenre, decade, setDecade, lang, setLang, runtime, setRuntime,
    hideWatched, setHide,
    availableTonight, setAvailableTonight, availableTonightDisabled, availableTonightTitle,
    twinsLoved, setTwinsLoved, twinsLovedDisabled, twinsLovedTitle,
    onSurprise,
  } = props;
  useEffect(() => {
    if (!open) return;
    const esc = (e) => { if (e.key === 'Escape') props.onClose(); };
    document.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  return (
    // Modal backdrop — dismisses on click. Escape handled by the useEffect above.
    // Backdrop owns the click-to-close behavior; the modal-content div is a
    // flex column with header + scrollable body + footer so the "Show N
    // films" CTA stays visible at all heights of content.
    // The backdrop padding leaves bottom room for the fixed mobile nav so
    // the modal footer doesn't get hidden behind it. CSS class drops the
    // extra bottom on desktop where there's no nav.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div onClick={props.onClose} className="ff-browse-refine-backdrop" style={{ position:'fixed', inset:0, zIndex:80, background:'rgba(0,0,0,0.62)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 24px 110px 24px' }}>
      {/* Modal panel — stops click propagation so interactions inside don't close the modal. */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div onClick={e=>e.stopPropagation()} className="ff-browse-refine-panel" style={{ width:'min(820px, 100%)', maxHeight:'calc(100vh - 134px)', display:'flex', flexDirection:'column', borderRadius:18, background:'rgba(14,11,24,0.98)', border:`1px solid ${HP.borderStrong}`, boxShadow:'0 40px 80px -20px rgba(0,0,0,0.8)', overflow:'hidden', animation:'refineIn 0.28s cubic-bezier(.2,.7,.2,1)' }}>
        <style>{`@keyframes refineIn { from { opacity:0; transform:translateY(16px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 26px', borderBottom:`1px solid ${HP.border}`, flex:'none' }}>
          <div>
            <div style={{ fontFamily:'Outfit', fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:HP.purple, marginBottom:4 }}>Filters</div>
            <div style={{ fontFamily:'Outfit', fontSize:22, fontWeight:400, color:HP.text, letterSpacing:'-0.015em' }}>Tune the catalogue.</div>
          </div>
          <button onClick={props.onClose} aria-label="Close" style={{ width:36, height:36, borderRadius:999, background:'rgba(255,255,255,0.04)', border:`1px solid ${HP.border}`, color:HP.textMid, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center' }}><IcX s={15}/></button>
        </div>
        <div style={{ padding:'20px 22px 26px', flex:'1 1 auto', overflowY:'auto', minHeight:0 }}>
          {/* ── Browse basics ──────────────────────────────────────────────
             Mirrors the top-row toolbar chips (Genre / Era / Lang /
             Runtime) plus the toggles row (Hide watched, Streaming I have,
             Twins loved). On mobile the toolbar collapses these into here
             via CSS; on desktop the panel still exposes them so the user
             can change everything from one place. */}
          <div className="ff-browse-refine-basics" style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0, 1fr))', gap:8, marginBottom:18 }}>
            <FilterPill label="Genre"    value={genre}   options={GENRE_OPTIONS}   onChange={setGenre} />
            <FilterPill label="Era"      value={decade}  options={DECADE_OPTIONS}  onChange={setDecade} />
            <FilterPill label="Language" value={lang}    options={LANG_OPTIONS}    onChange={setLang} />
            <FilterPill label="Runtime"  value={runtime} options={RUNTIME_OPTIONS} onChange={setRuntime} />
          </div>
          <div className="ff-browse-refine-toggles" style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:22 }}>
            <ToggleSwitch on={hideWatched}      onClick={()=>setHide(!hideWatched)}                 label="Hide watched" />
            {/* For each toggle that's gated, surface the "why it's off" reason
                as inline italic text below the switch — mobile users can't
                see the hover title=. */}
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <ToggleSwitch on={availableTonight} onClick={()=>setAvailableTonight(!availableTonight)} label="Streaming I have" disabled={availableTonightDisabled} title={availableTonightTitle} />
              {availableTonightDisabled && availableTonightTitle && (
                <span style={{ fontFamily:'Inter', fontSize:11, color:HP.textFaint, fontStyle:'italic', paddingLeft:14, maxWidth:240 }}>{availableTonightTitle}</span>
              )}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <ToggleSwitch on={twinsLoved}       onClick={()=>setTwinsLoved(!twinsLoved)}             label="Twins loved"      disabled={twinsLovedDisabled}      title={twinsLovedTitle} />
              {twinsLovedDisabled && twinsLovedTitle && (
                <span style={{ fontFamily:'Inter', fontSize:11, color:HP.textFaint, fontStyle:'italic', paddingLeft:14, maxWidth:240 }}>{twinsLovedTitle}</span>
              )}
            </div>
            {onSurprise && (
              <button type="button" onClick={() => { onSurprise(); props.onClose?.(); }} className="ff-browse-refine-surprise" style={{ marginLeft:'auto', display:'inline-flex', alignItems:'center', gap:7, height:34, padding:'0 14px', borderRadius:999, background:'rgba(255,255,255,0.04)', border:`1px solid ${HP.borderStrong}`, color:HP.textHi, fontFamily:'Inter', fontSize:12.5, fontWeight:500, cursor:'pointer' }}>
                ✨ Surprise me
              </button>
            )}
          </div>
          <div style={{ height:1, background:HP.border, marginBottom:20 }} />
          <div style={{ fontFamily:'Outfit', fontSize:11, fontWeight:600, letterSpacing:'0.16em', textTransform:'uppercase', color:HP.textLow, marginBottom:14 }}>Advanced</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'24px 28px' }}>
            {/* Quality cluster used to ship 5 visible buttons (6.0–8.5) which
                wrapped to 4+1 on phones. Dropped the 7.5+ tier (least-used
                between adjacent 7.0+ and 8.0+) so the row fits cleanly. */}
            <SegGroup label="Quality"    value={props.minRating} options={[{value:'',label:''},{value:'6',label:'6.0+'},{value:'7',label:'7.0+'},{value:'8',label:'8.0+'},{value:'8.5',label:'8.5+'}]} onChange={props.setMinRating} />
            <SegGroup label="Pacing"     value={props.pacing}    options={PACING_OPTIONS}    onChange={props.setPacing} />
            <SegGroup label="Intensity"  value={props.intensity} options={INTENSITY_OPTIONS} onChange={props.setIntensity} />
            <SegGroup label="Depth"      value={props.depth}     options={DEPTH_OPTIONS}     onChange={props.setDepth} />
            <SegGroup label="Dialogue"   value={props.dialogue}  options={DIALOGUE_OPTIONS}  onChange={props.setDialogue} />
            <SegGroup label="Attention"  value={props.attention} options={ATTENTION_OPTIONS} onChange={props.setAttention} />
            <SegGroup label="Critic ↔ Audience" value={props.gap} options={GAP_OPTIONS} onChange={props.setGap} />
            <RatingSlider label="Critics love it"   value={props.minCritic}   onChange={props.setMinCritic} />
            <RatingSlider label="Audiences love it" value={props.minAudience} onChange={props.setMinAudience} />
            <div>
              <div style={{ fontFamily:'Outfit', fontSize:11, fontWeight:600, letterSpacing:'0.16em', textTransform:'uppercase', color:HP.textLow, marginBottom:10 }}>Genre excellence</div>
              <button onClick={()=>props.setGenreTop(!props.genreTop)} style={{ display:'inline-flex', alignItems:'center', gap:7, height:32, padding:'0 13px', borderRadius:999, border:`1px solid ${props.genreTop ? HP.purple+'66' : HP.border}`, background: props.genreTop ? `${HP.purple}1a` : 'rgba(255,255,255,0.04)', color: props.genreTop ? HP.text : HP.textMid, fontFamily:'Inter', fontSize:12, fontWeight:500, cursor:'pointer' }}>
                <IcAward s={13}/>Exceptional for genre
              </button>
            </div>
            <div>
              <div style={{ fontFamily:'Outfit', fontSize:11, fontWeight:600, letterSpacing:'0.16em', textTransform:'uppercase', color:HP.textLow, marginBottom:10 }}>Director</div>
              <input value={draftDirector} onChange={e=>setDraftDir(e.target.value)} onBlur={()=>setDirector(draftDirector)} onKeyDown={e=>e.key==='Enter'&&setDirector(draftDirector)} placeholder="e.g. Bong Joon-ho" style={{ width:'100%', height:34, borderRadius:8, border:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.04)', color:HP.text, padding:'0 12px', fontFamily:'Inter', fontSize:13, outline:'none' }} />
            </div>
            <div style={{ gridColumn:'span 2' }}>
              <div style={{ fontFamily:'Outfit', fontSize:11, fontWeight:600, letterSpacing:'0.16em', textTransform:'uppercase', color:HP.textLow, marginBottom:10 }}>Vibe</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {VIBE_OPTIONS.map(v => {
                  const on = vibe.includes(v.value);
                  return <button key={v.value} onClick={()=>setVibe(on ? vibe.filter(x=>x!==v.value) : [...vibe, v.value])} style={{ display:'inline-flex', alignItems:'center', gap:6, height:32, padding:'0 12px', borderRadius:999, border:`1px solid ${on ? HP.purple+'66' : HP.border}`, background: on ? `${HP.purple}1a` : 'rgba(255,255,255,0.04)', color: on ? HP.text : HP.textMid, fontFamily:'Inter', fontSize:12, fontWeight:500, cursor:'pointer' }}><span style={{ color: on ? HP.purple : HP.textLow }}>{v.symbol}</span>{v.label}</button>;
                })}
              </div>
            </div>
          </div>
        </div>
        {/* Panel footer — live count of what the user's current filter
            combination returns, plus Reset (clears every filter) and
            "Show N films" (closes the panel; nothing to "apply" because
            every tweak already wrote to the URL live).
            Lives outside the scrollable body so it stays visible at all
            content heights. */}
        <div style={{ flex:'none', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'14px 22px', borderTop:`1px solid ${HP.border}`, background:'rgba(14,11,24,0.98)' }}>
          <button
            type="button"
            disabled={!hasAnyFilter}
            onClick={() => { clearAll && clearAll() }}
            style={{ fontFamily:'Inter', fontSize:12.5, color: hasAnyFilter ? HP.textMid : HP.textFaint, background:'transparent', border:'none', cursor: hasAnyFilter ? 'pointer' : 'not-allowed', padding:'8px 0' }}
          >
            Reset all
          </button>
          <button onClick={props.onClose} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 22px', borderRadius:999, background:HP_GRAD, color:'#fff', border:'none', fontFamily:'Inter', fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 8px 18px -6px rgba(236,72,153,0.4)' }}>
            {typeof totalResults === 'number' ? (
              <>Show <span style={{ fontVariantNumeric:'tabular-nums' }}>{totalResults.toLocaleString()}</span> {totalResults === 1 ? 'film' : 'films'}</>
            ) : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ╭───────────────────────────────────────╮
// │ Action button (overlay)               │
// ╰───────────────────────────────────────╯
function ActionBtn({ active, onClick, activeBg, activeBorder, title, children }) {
  return (
    <button onClick={onClick} title={title} aria-label={title} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:30, height:30, borderRadius:999, border:`1px solid ${active ? activeBorder : 'rgba(248,250,252,0.2)'}`, background: active ? activeBg : 'rgba(0,0,0,0.55)', color:'#fff', cursor:'pointer' }}>{children}</button>
  );
}

// ╭───────────────────────────────────────╮
// │ Grid card                             │
// ╰───────────────────────────────────────╯
function GridCard({ f, mood, watched, inWatchlist, onTW, onTWL }) {
  const [h, setH] = useState(false);
  const moodTag = mood==='all' ? getMoodTag(f) : null;
  const matchScore = mood==='all' ? f.ff : Math.round(0.6*(f.fit[mood]*100) + 0.25*f.ff + 0.15*(100 - Math.abs(115 - f.runtime)));
  const why = mood==='all' ? `${f.dir} · FF ${f.ff}%` : f.rationale[mood];
  // Two-line clamp for the title so long names ("Lord of the Rings: The
  // Return of the King") stay readable without one card growing taller than
  // its siblings. Paired with `min-height` on the text block in CSS so
  // single-line titles still leave the same vertical footprint.
  const titleClamp = {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    wordBreak: 'break-word',
  };
  return (
    <div className="ff-browse-card" style={{ position:'relative' }} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}>
      <div style={{ position:'relative', overflow:'hidden', borderRadius:10, border:`1px solid ${h ? 'rgba(216,180,254,0.22)' : HP.border}`, background:HP.surface, transform: h ? 'translateY(-2px)' : 'none', boxShadow: h ? '0 18px 36px -12px rgba(0,0,0,0.65)' : 'none', transition:'all 0.2s ease', cursor:'pointer', zIndex: h ? 20 : 1 }}>
        <div style={{ position:'relative', aspectRatio:'2/3', overflow:'hidden', background:'rgba(255,255,255,0.04)' }}>
          {f.poster ? (
            <img src={f.poster} alt={f.title} loading="lazy" style={{ width:'100%', height:'100%', objectFit:'cover', transform: h ? 'scale(1.04)' : 'none', transition:'transform 0.3s ease' }} />
          ) : (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:HP.textFaint, fontFamily:'Outfit', fontSize:14, padding:14, textAlign:'center' }}>{f.title}</div>
          )}

          {/* Match badge — top right */}
          <div style={{ position:'absolute', top:8, right:8, padding:'3px 7px', borderRadius:4, background:'rgba(0,0,0,0.78)', backdropFilter:'blur(6px)', border:`1px solid ${HP.purple}44`, fontFamily:'Outfit', fontSize:10, fontWeight:700, color:HP.purple, letterSpacing:'0.03em' }}>{matchScore}%</div>

          {/* Mood tag — top left (when not hovering) */}
          {moodTag && !h && (
            <div style={{ position:'absolute', top:8, left:8, padding:'3px 9px', borderRadius:999, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(6px)', border:`1px solid ${moodTag.color}44`, color:moodTag.color, fontFamily:'Inter', fontSize:10, fontWeight:600 }}>{moodTag.label}</div>
          )}

          {/* Hover overlay */}
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'flex-end', opacity: h ? 1 : 0, transition:'opacity 0.2s ease', background:'linear-gradient(to top, rgba(9,6,14,0.98) 0%, rgba(15,10,24,0.78) 40%, transparent 78%)' }}>
            <div style={{ padding:12 }}>
              <h3 style={{ margin:0, fontFamily:'Outfit', fontSize:14, fontWeight:600, color:'#fff', lineHeight:1.25, letterSpacing:'-0.005em', ...titleClamp }}>{f.title}</h3>
              <div style={{ marginTop:3, fontFamily:'Inter', fontSize:11, color:'rgba(248,250,252,0.55)' }}>{f.year}{f.genre && ` · ${f.genre}`}</div>
              <div style={{ marginTop:8, paddingTop:7, paddingBottom:7, borderTop:'1px solid rgba(255,255,255,0.1)', borderBottom:'1px solid rgba(255,255,255,0.1)', fontFamily:'Inter', fontSize:11, color:HP.purple, lineHeight:1.4 }}>{why}</div>
              <div style={{ marginTop:9, display:'flex', alignItems:'center', gap:5 }}>
                <ActionBtn active={inWatchlist} onClick={e=>{e.stopPropagation(); onTWL();}} activeBg="rgba(168,85,247,0.85)" activeBorder="rgba(216,180,254,0.5)" title={inWatchlist?'In watchlist':'Add to watchlist'}>{inWatchlist ? <IcCheck s={12}/> : <IcPlus s={12}/>}</ActionBtn>
                <ActionBtn active={watched}     onClick={e=>{e.stopPropagation(); onTW();}}  activeBg="rgba(16,185,129,0.85)" activeBorder="rgba(110,231,183,0.5)" title={watched?'Mark unwatched':'Mark watched'}>{watched ? <IcEye s={12}/> : <IcEyeOff s={12}/>}</ActionBtn>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="ff-browse-card-textblock" style={{ marginTop:8, padding:'0 2px', display:'flex', flexDirection:'column', gap:2 }}>
        <div className="ff-browse-card-title" title={f.title} style={{ fontFamily:'Inter', fontSize:13, fontWeight:500, color: h ? '#fff' : HP.textHi, letterSpacing:'-0.005em', lineHeight:1.3, ...titleClamp }}>{f.title}</div>
        <div className="ff-browse-card-meta" style={{ fontFamily:'Inter', fontSize:11.5, color:HP.textLow, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.dir || '—'}</div>
        <div className="ff-browse-card-meta" style={{ fontFamily:'Inter', fontSize:11, color:HP.textFaint, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.year}{f.runtime ? ` · ${f.runtime}m` : ''}</div>
      </div>
    </div>
  );
}

// ╭───────────────────────────────────────╮
// │ List row                              │
// ╰───────────────────────────────────────╯
function ListRow({ f, mood, watched, inWatchlist, onTW, onTWL }) {
  const [h, setH] = useState(false);
  const moodTag = getMoodTag(f);
  const matchScore = mood==='all' ? f.ff : Math.round(0.6*(f.fit[mood]*100) + 0.25*f.ff + 0.15*(100 - Math.abs(115 - f.runtime)));
  const why = mood==='all' ? null : f.rationale[mood];
  return (
    <article className="ff-browse-list-row" onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{ display:'grid', gridTemplateColumns:'auto minmax(0, 1fr) auto auto auto', gap:18, alignItems:'center', padding:'14px 16px', borderBottom:`1px solid ${HP.border}`, background: h ? 'rgba(167,139,250,0.04)' : 'transparent', transition:'background 0.18s ease', cursor:'pointer' }}>
      {f.poster ? (
        <img src={f.poster} alt="" loading="lazy" style={{ width:54, height:81, objectFit:'cover', borderRadius:4, flex:'none' }} />
      ) : (
        <div style={{ width:54, height:81, borderRadius:4, background:'rgba(255,255,255,0.04)', flex:'none' }} />
      )}
      <div style={{ minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontFamily:'Outfit', fontSize:18, fontWeight:500, color:HP.text, letterSpacing:'-0.01em', overflow:'hidden', textOverflow:'ellipsis' }}>{f.title}</span>
          <span style={{ fontFamily:'Inter', fontSize:12.5, color:HP.textLow }}>{f.year}</span>
          {moodTag && <span style={{ padding:'2px 8px', borderRadius:999, background:`${moodTag.color}1a`, border:`1px solid ${moodTag.color}44`, color:moodTag.color, fontFamily:'Inter', fontSize:11, fontWeight:500 }}>{moodTag.label}</span>}
        </div>
        <div style={{ marginTop:4, fontFamily:'Inter', fontSize:13, color:HP.textMid, lineHeight:1.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {[f.dir, f.genre, f.runtime ? `${f.runtime}m` : null].filter(Boolean).join(' · ')}
        </div>
        {why && <div style={{ marginTop:6, fontFamily:'Inter', fontSize:12, color:HP.purple, lineHeight:1.45 }}>{why}</div>}
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3 }}>
        <div style={{ fontFamily:'Outfit', fontSize:20, fontWeight:300, color:HP.text, letterSpacing:'-0.025em', lineHeight:1 }}>{matchScore}<span style={{ fontSize:11, color:HP.textLow, marginLeft:1 }}>%</span></div>
        <div style={{ fontFamily:'Inter', fontSize:10, color:HP.textFaint, letterSpacing:'0.05em' }}>FF · {f.ff}</div>
      </div>
      <div className="ff-browse-list-extras" style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3, fontFamily:'Inter', fontSize:11 }}>
        <div style={{ color:HP.textMid }}>C {f.critic}</div>
        <div style={{ color:HP.textLow }}>A {f.audience}</div>
      </div>
      <div className="ff-browse-list-actions" style={{ display:'flex', gap:6 }}>
        <ActionBtn active={inWatchlist} onClick={e=>{e.stopPropagation(); onTWL();}} activeBg="rgba(168,85,247,0.85)" activeBorder="rgba(216,180,254,0.5)" title={inWatchlist?'In watchlist':'Add to watchlist'}>{inWatchlist ? <IcCheck s={12}/> : <IcPlus s={12}/>}</ActionBtn>
        <ActionBtn active={watched}     onClick={e=>{e.stopPropagation(); onTW();}}  activeBg="rgba(16,185,129,0.85)" activeBorder="rgba(110,231,183,0.5)" title={watched?'Mark unwatched':'Mark watched'}>{watched ? <IcEye s={12}/> : <IcEyeOff s={12}/>}</ActionBtn>
      </div>
    </article>
  );
}

export { EditorialHeader, MoodRow, Nav, Toolbar, RefinePanel, GridCard, ListRow, getMoodTag, FilterPill, IcGrid, IcList }
