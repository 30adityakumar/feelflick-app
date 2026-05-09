// Home v2 — top sections (Masthead, Mood Reactor, The Briefing 3-up).
import { useMemo, useState } from 'react';
import { FILMS, HP, MOODS, SLOT_LABELS, META } from './data';
import { SmartImg } from './atoms';

export function BriefMasthead({ user }) {
  const today = new Date();
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return (
    <section style={{ padding:'72px 88px 40px', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'flex-end', gap: 56, borderBottom:`1px solid ${HP.border}` }}>
      <div>
        <div style={{ display:'flex', alignItems:'center', gap: 14, marginBottom: 26 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing:'0.28em', textTransform:'uppercase', color: HP.purple }}>The Briefing</div>
          <div style={{ flex:'none', height: 1, width: 36, background: HP.purple, opacity: 0.5 }} />
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing:'0.18em', textTransform:'uppercase', color: HP.textMuted, fontFamily:'Outfit' }}>Issue {META.issueNum} · Vol. {META.volume} · For {user.name}</div>
        </div>
        <h1 style={{ fontFamily:'Outfit, Inter, sans-serif', fontSize: 104, lineHeight: 0.92, fontWeight: 600, letterSpacing:'-0.05em', color: HP.text, margin: 0, textWrap:'balance' }}>
          Tonight’s <em style={{ fontStyle:'italic', fontWeight: 400, color: HP.textSoft }}>edit</em>.
        </h1>
        <div style={{ marginTop: 28, fontSize: 15, lineHeight: 1.65, color: HP.textSoft, maxWidth: 580, fontFamily:'Outfit, Inter, sans-serif' }}>
          Three films, hand-picked from your taste signal. <em>Not a feed</em> — a short list. Pick one and the others rest until tomorrow.
        </div>
        <div style={{ marginTop: 32, display:'flex', alignItems:'center', gap: 24, fontSize: 11, color: HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.04em' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background:'#10B981', boxShadow:'0 0 8px #10B981' }} />
            Refreshed 4:00am · next 4:00am
          </span>
          <span style={{ width: 1, height: 12, background: HP.border }} />
          <span>Tuned to <span style={{ color: HP.text }}>your mood</span></span>
          <span style={{ width: 1, height: 12, background: HP.border }} />
          <span>{user.watched} films logged</span>
        </div>
      </div>
      <div style={{ textAlign:'right', borderLeft:`1px solid ${HP.border}`, paddingLeft: 40 }}>
        <div style={{ fontFamily:'Outfit', fontSize: 13, fontWeight: 500, color: HP.textMuted, letterSpacing:'0.12em', textTransform:'uppercase' }}>{days[today.getDay()]}</div>
        <div style={{ fontFamily:'Outfit', fontSize: 96, fontWeight: 200, color: HP.text, lineHeight: 1, letterSpacing:'-0.05em', marginTop: 4 }}>{today.getDate()}</div>
        <div style={{ fontFamily:'Outfit', fontSize: 13, fontWeight: 500, color: HP.textMuted, letterSpacing:'0.12em', textTransform:'uppercase', marginTop: 6 }}>{months[today.getMonth()]} · {today.getFullYear()}</div>
      </div>
    </section>
  );
}

export function MoodReactor({ currentMood, setMood }) {
  return (
    <section style={{ padding:'28px 88px', display:'flex', alignItems:'center', gap: 24, borderBottom:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.012)' }}>
      <div style={{ display:'flex', alignItems:'baseline', gap: 12, flex:'none' }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing:'0.22em', textTransform:'uppercase', color: HP.textMuted }}>Tonight I feel</div>
        <div style={{ fontFamily:'Outfit', fontSize: 22, fontWeight: 500, fontStyle:'italic', color: currentMood.hex, letterSpacing:'-0.015em', transition:'color 0.4s ease' }}>{currentMood.label.toLowerCase()}.</div>
      </div>
      <div style={{ flex: 1, display:'flex', gap: 8, justifyContent:'flex-end', flexWrap:'wrap' }}>
        {MOODS.map(m => {
          const active = m.id === currentMood.id;
          return (
            <button key={m.id} onClick={() => setMood(m)} style={{
              display:'inline-flex', alignItems:'center', gap: 8,
              padding:'8px 14px', borderRadius: 999,
              background: active ? `${m.hex}22` : 'transparent',
              border: `1px solid ${active ? m.hex : HP.border}`,
              color: active ? HP.text : HP.textSoft,
              fontFamily:'Outfit', fontSize: 12, fontWeight: 500,
              letterSpacing:'-0.005em', cursor:'pointer', transition:'all 0.25s ease',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: m.hex, boxShadow: active ? `0 0 10px ${m.hex}` : 'none', transition:'box-shadow 0.25s ease' }} />
              {m.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function BriefingCard({ pick, idx, label, rationale, featured, onWatch, onSave, onSkip }) {
  const f = FILMS[pick];
  const [hover, setHover] = useState(false);
  return (
    <article onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display:'flex', flexDirection:'column', gap: 22, transition:'transform 0.4s cubic-bezier(0.2,0.8,0.2,1)', transform: hover ? 'translateY(-4px)':'translateY(0)' }}>
      <button
        type="button"
        onClick={() => onWatch?.(pick)}
        aria-label={`Watch ${f.title}`}
        style={{
          position:'relative', borderRadius: 6, overflow:'hidden',
          boxShadow: hover ? '0 24px 60px -16px rgba(0,0,0,0.8), 0 0 0 1px rgba(167,139,250,0.2)' : '0 16px 40px -12px rgba(0,0,0,0.6)',
          transition:'box-shadow 0.4s ease',
          background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
        }}
      >
        <SmartImg filmKey={pick} big style={{ width:'100%', aspectRatio:'2/3', objectFit:'cover', display:'block' }} />
        <div style={{ position:'absolute', top: 16, right: 16, padding:'5px 10px', borderRadius: 4, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(10px)', fontSize: 9, fontWeight: 600, color: HP.textSoft, letterSpacing:'0.16em', textTransform:'uppercase', fontFamily:'Outfit' }}>0{idx + 1}</div>
        <div style={{ position:'absolute', bottom: 16, left: 16, padding:'7px 12px', borderRadius: 4, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(10px)', border:'1px solid rgba(167,139,250,0.4)', display:'inline-flex', alignItems:'center', gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: HP.purple, boxShadow:`0 0 8px ${HP.purple}` }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: HP.text, fontFamily:'Outfit', letterSpacing:'0.06em' }}>{75 + idx*-5 + (featured?18:8)}% MATCH</span>
        </div>
      </button>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing:'0.24em', textTransform:'uppercase', color: HP.purple, marginBottom: 14, display:'inline-flex', alignItems:'center', gap: 8 }}>
          <span style={{ height: 1, width: 14, background: HP.purple, opacity: 0.7 }} />{label}
        </div>
        <h3 style={{ fontFamily:'Outfit, Inter, sans-serif', fontSize: featured?44:32, lineHeight: 0.98, fontWeight: 600, letterSpacing:'-0.03em', color: HP.text, margin:'0 0 14px 0', textWrap:'balance' }}>{f.title}</h3>
        <div style={{ display:'flex', alignItems:'center', gap: 10, fontSize: 11, color: HP.textMuted, marginBottom: 18, fontFamily:'Outfit', letterSpacing:'0.06em', textTransform:'uppercase' }}>
          <span>{f.year}</span><span style={{ width: 3, height: 3, borderRadius: 999, background: HP.textFaint }} />
          <span>{f.runtime} min</span><span style={{ width: 3, height: 3, borderRadius: 999, background: HP.textFaint }} />
          <span>{f.director}</span>
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: HP.textSoft, margin:'0 0 22px 0', fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic', textWrap:'pretty' }}>“{rationale}”</p>
        <div style={{ display:'flex', gap: 0, paddingTop: 18, borderTop:`1px solid ${HP.border}` }}>
          <button type="button" onClick={() => onWatch?.(pick)} style={{ fontSize: 12, fontWeight: 600, color: HP.text, background:'transparent', border:'none', cursor:'pointer', padding:'4px 16px 4px 0', fontFamily:'Outfit', letterSpacing:'0.04em', display:'inline-flex', alignItems:'center', gap: 8, borderRight:`1px solid ${HP.border}` }}>
            Watch <span style={{ fontSize: 14, lineHeight: 1, transform: hover?'translateX(2px)':'none', transition:'transform 0.3s ease' }}>→</span>
          </button>
          <button type="button" onClick={() => onSave?.(pick)} style={{ fontSize: 12, fontWeight: 500, color: HP.textMuted, background:'transparent', border:'none', cursor:'pointer', padding:'4px 16px', fontFamily:'Outfit', borderRight:`1px solid ${HP.border}` }}>Save</button>
          <button type="button" onClick={() => onSkip?.(pick)} style={{ fontSize: 12, fontWeight: 500, color: HP.textMuted, background:'transparent', border:'none', cursor:'pointer', padding:'4px 16px', fontFamily:'Outfit' }}>Skip</button>
        </div>
      </div>
    </article>
  );
}

// Tiny seeded shuffle so each Reshuffle click reorders deterministically.
function shuffleByseed(arr, seed) {
  if (!seed) return arr;
  const out = arr.slice();
  let s = seed * 9301 + 49297;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function TheBriefing({ currentMood, shuffleSeed = 0, onWatch, onSave, onSkip, onReshuffle }) {
  const picks = useMemo(
    () => shuffleByseed(currentMood.pool, shuffleSeed).slice(0, 3),
    [currentMood, shuffleSeed],
  );
  const labels = SLOT_LABELS[currentMood.id];
  return (
    <section style={{ padding:'64px 88px 80px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1.05fr 1fr 1fr', gap: 56 }}>
        {picks.map((key, i) => (
          <BriefingCard
            key={`${currentMood.id}-${key}-${shuffleSeed}`}
            pick={key} idx={i} label={labels[i]} rationale={currentMood.rationale[key]} featured={i===0}
            onWatch={onWatch} onSave={onSave} onSkip={onSkip}
          />
        ))}
      </div>
      <div style={{ marginTop: 40, paddingTop: 24, borderTop:`1px solid ${HP.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', fontSize: 11, color: HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.06em' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap: 12 }}>
          <span>Curated from <span style={{ color: HP.text }}>your taste signal</span></span>
          <span style={{ width: 3, height: 3, borderRadius: 999, background: HP.textFaint }} />
          <span>Tuned to <span style={{ color: currentMood.hex, transition:'color 0.4s ease' }}>{currentMood.label}</span></span>
        </div>
        <button
          type="button"
          onClick={onReshuffle}
          style={{ background:'transparent', border:'none', cursor:'pointer', fontSize: 11, color: HP.textSoft, fontFamily:'Outfit', letterSpacing:'0.06em', textTransform:'uppercase', fontWeight: 600, display:'inline-flex', alignItems:'center', gap: 6 }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 1 0 18 0M3 12l3-3M3 12l3 3" strokeLinecap="round"/></svg>
          Reshuffle
        </button>
      </div>
    </section>
  );
}
