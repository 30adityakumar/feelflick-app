import { useMemo, useRef } from 'react'
import { HP_GRAD } from '@/shared/lib/tokens'
import { HP, TIME_OPTIONS, WHO_OPTIONS, ENERGY_OPTIONS, INTENTIONS } from '../constants'

// Stage 2 — sequential wizard. Replaces the old 4-row form (which felt
// like a wall of inputs) with one focused question at a time. Confirmed
// answers stack as compact chips above the current question, building
// the briefing as the user works through it. Picks auto-advance — taps
// confirm + advance, no separate Next button. Pre-selected defaults
// (from predictDiscoverDefaults) are pre-highlighted so users who agree
// with the prediction just tap once per step.
//
// stepIndex is lifted to DiscoverBody so that "Tweak inputs" from
// Stage 3 returns straight to the summary view (all 4 chips visible)
// rather than re-asking from step 0.
export default function StageNightStacked({ stepIndex, setStepIndex, time, setTime, who, setWho, energy, setEnergy, intention, setIntention, onNext, onBack, blendHex, playOptionCue, playContinueCue }) {
  const STEPS = useMemo(() => [
    { id: 'intention', kicker: 'Tonight’s intention',  question: 'What pulls you in?',  options: INTENTIONS,     gridClass: '',                       value: intention, setValue: setIntention },
    { id: 'time',      kicker: 'How much time',         question: 'How long tonight?',   options: TIME_OPTIONS,   gridClass: 'ff-night-grid--time',    value: time,      setValue: setTime },
    { id: 'who',       kicker: 'Who’s here',            question: 'Who’s watching?',     options: WHO_OPTIONS,    gridClass: 'ff-night-grid--who',     value: who,       setValue: setWho },
    { id: 'energy',    kicker: 'Your energy',           question: 'How do you feel?',    options: ENERGY_OPTIONS, gridClass: 'ff-night-grid--energy',  value: energy,    setValue: setEnergy },
  ], [intention, time, who, energy, setIntention, setTime, setWho, setEnergy]);

  // editingFromSummaryRef — true while the user is re-picking a step
  // from the summary view (clicked a chip). After they pick, jump back
  // to summary instead of cascading through the next steps.
  const editingFromSummaryRef = useRef(false);
  const allAnswered = stepIndex >= STEPS.length;
  const completed = STEPS.slice(0, Math.min(stepIndex, STEPS.length));
  const current = STEPS[stepIndex];

  const handlePick = (val) => {
    if (!current) return;
    current.setValue(val);
    playOptionCue();
    if (editingFromSummaryRef.current) {
      editingFromSummaryRef.current = false;
      setStepIndex(STEPS.length);
    } else {
      setStepIndex(stepIndex + 1);
    }
  };

  const handleEditChip = (idx) => {
    editingFromSummaryRef.current = true;
    setStepIndex(idx);
  };

  const handleBack = () => {
    if (allAnswered) {
      // From summary: drop back into the last step rather than leaving
      // Stage 2 entirely (less jarring; user can re-pick or re-Back).
      setStepIndex(STEPS.length - 1);
    } else if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    } else {
      onBack();
    }
  };

  return (
    <section className="ff-discover-section" style={{ position:'relative', minHeight:'82vh', animation:'ff-fade 0.5s ease' }}>
      <div style={{ textAlign:'center', marginBottom:28 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.32em', textTransform:'uppercase', color:HP.purple, marginBottom:14 }}>Step 2 of 2</div>
        <h2 style={{ fontFamily:'Outfit', fontSize:'clamp(28px, 5vw, 56px)', lineHeight:1.05, fontWeight:300, letterSpacing:'-0.04em', color:HP.text, margin:0 }}>
          What do you <em style={{ fontStyle:'italic', fontWeight:400, color:blendHex }}>need</em> tonight?
        </h2>
      </div>

      <div style={{ maxWidth:760, margin:'0 auto', display:'flex', flexDirection:'column', gap:14 }}>
        {/* Stacked confirmed chips — one per answered step. Click to re-pick. */}
        {completed.map((step, i) => {
          const opt = step.options.find(o => o.id === step.value);
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => handleEditChip(i)}
              className="ff-night-chip"
              style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'14px 18px', borderRadius:10, background:HP.surface, border:`1px solid ${HP.border}`, color:HP.text, fontFamily:'Outfit', cursor:'pointer', transition:'background 0.2s ease, border-color 0.2s ease' }}
            >
              <span style={{ display:'inline-flex', alignItems:'baseline', gap:12, minWidth:0 }}>
                <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:HP.textMuted, flex:'none' }}>{step.kicker}</span>
                <span style={{ fontSize:14, fontWeight:500, color:HP.text, letterSpacing:'-0.01em' }}>{opt?.label || '—'}</span>
              </span>
              <span style={{ fontSize:11, color:HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.04em' }}>Edit</span>
            </button>
          );
        })}

        {/* Current question — focused step. Tiles use the same grid CSS as
           the legacy 4-row layout so the option ergonomics carry over. */}
        {!allAnswered && current && (
          <div style={{ marginTop:18, animation:'ff-fade 0.35s ease' }}>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:HP.purple, fontFamily:'Outfit' }}>
                {stepIndex + 1} of {STEPS.length} &middot; {current.kicker}
              </div>
            </div>
            <h3 style={{ fontFamily:'Outfit', fontSize:'clamp(22px, 3.4vw, 32px)', lineHeight:1.1, fontWeight:300, letterSpacing:'-0.03em', color:HP.text, margin:'0 0 16px 0' }}>
              {current.question}
            </h3>
            <div className={`ff-night-grid ${current.gridClass || ''}`.trim()}>
              {current.options.map(o => {
                const on = current.value === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => handlePick(o.id)}
                    style={{ flex:1, padding:'14px 14px', borderRadius:10, textAlign:'left', background: on ? `${blendHex}1f` : 'rgba(255,255,255,0.025)', border:`1px solid ${on ? blendHex + '88' : HP.border}`, color: on ? HP.text : HP.textSoft, cursor:'pointer', transition:'all 0.25s ease', boxShadow: on ? `0 0 24px ${blendHex}33` : 'none' }}
                  >
                    {o.icon && <div style={{ fontSize:20, marginBottom:8, color: on?blendHex:HP.textMuted, letterSpacing:'0.1em' }}>{o.icon}</div>}
                    <div style={{ fontFamily:'Outfit', fontSize:14, fontWeight:500, letterSpacing:'-0.015em' }}>{o.label}</div>
                    <div style={{ marginTop:3, fontSize:11, color: on?blendHex:HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic' }}>{o.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="ff-stage-action-bar">
        <button onClick={handleBack} style={{ padding:'10px 20px', borderRadius:999, background:'transparent', border:`1px solid ${HP.border}`, color:HP.textMuted, fontFamily:'Outfit', fontSize:12, fontWeight:500, cursor:'pointer' }}>← Back</button>
        <div className="ff-stage-action-bar__meta" style={{ fontSize:11, color:HP.textFaint, fontFamily:'Outfit' }}>
          {allAnswered ? 'All set.' : 'Tap any option to confirm.'}
        </div>
        {allAnswered ? (
          <button onClick={()=>{ playContinueCue(); onNext(); }} style={{ padding:'14px 28px', borderRadius:999, background:HP_GRAD, border:'none', color:'#fff', fontFamily:'Outfit', fontSize:13, fontWeight:600, letterSpacing:'0.04em', cursor:'pointer', boxShadow:'0 12px 30px -10px rgba(236,72,153,0.5)' }}>Show me my edition →</button>
        ) : (
          // Reserve the slot so the action bar layout doesn't jump as
          // the CTA appears at the end. Invisible placeholder.
          <span style={{ visibility:'hidden', padding:'14px 28px' }}>placeholder</span>
        )}
      </div>
    </section>
  );
}
