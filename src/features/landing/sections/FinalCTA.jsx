import { useGoogleAuth } from '@/shared/hooks/useGoogleAuth'
import { C, HP_GRAD as GRAD } from '@/shared/lib/tokens'
import { Reveal, Stars } from '../primitives'

// ── Final CTA ──────────────────────────────────────────────────
export default function FinalCTA(){
  const { signInWithGoogle, isAuthenticating } = useGoogleAuth();
  return(
    <section id="start" style={{position:'relative',padding:'200px 32px',borderTop:`1px solid ${C.hairline}`,background:C.bgPure,overflow:'hidden'}}>
      <Stars tint={C.purple} count={80}/>
      <div style={{position:'relative',maxWidth:880,margin:'0 auto',textAlign:'center'}}>
        <Reveal>
          <div className="ff-eyebrow" style={{color:C.purple,marginBottom:32}}>Stop scrolling. Start watching.</div>
        </Reveal>
        <Reveal delay={150}>
          <h2 className="ff-d1" style={{fontSize:'clamp(72px,11vw,160px)',color:C.text,margin:0}}>
            Tonight is <em className="ff-italic" style={{color:C.textMid}}>yours.</em>
          </h2>
        </Reveal>
        <Reveal delay={300}>
          {/* FinalCTA sub — upright weight 400 at ceremonial size carries the page-close gravitas without italic. */}
          <p className="ff-body" style={{fontSize:'clamp(17px,1.9vw,22px)',fontWeight:400,color:C.textMid,lineHeight:1.5,maxWidth:540,margin:'36px auto 0'}}>
            One film, for the way you feel. Open it anytime.
          </p>
        </Reveal>
        <Reveal delay={450}>
          <button type="button" onClick={signInWithGoogle} disabled={isAuthenticating} className="ff-link" style={{display:'inline-flex',alignItems:'center',gap:10,marginTop:52,padding:'16px 32px',borderRadius:999,background:GRAD,color:'#fff',fontFamily:'Inter',fontSize:14.5,fontWeight:600,boxShadow:'0 18px 40px -10px rgba(236,72,153,0.5)',border:'none',cursor:isAuthenticating?'progress':'pointer',opacity:isAuthenticating?0.7:1}} aria-label="Begin with Google">
            {isAuthenticating?'Opening Google…':'Begin'} <span>→</span>
          </button>
        </Reveal>
        <Reveal delay={550}>
          <div className="ff-eyebrow" style={{marginTop:24,color:C.textLow}}>Free · No credit card · No ads</div>
        </Reveal>
      </div>
    </section>
  );
}
