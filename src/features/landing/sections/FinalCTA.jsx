import { useGoogleAuth } from '@/shared/hooks/useGoogleAuth'
import { C } from '@/shared/lib/tokens'
import { Reveal, Stars, Eyebrow, AuthCTA, SectionShell } from '../primitives'

// ── Final CTA ──────────────────────────────────────────────────
export default function FinalCTA(){
  const { signInWithGoogle, isAuthenticating } = useGoogleAuth();
  return(
    <SectionShell
      id="start"
      padding="200px 32px"
      position="relative"
      overflow="hidden"
      background={C.bgPure}
      innerStyle={{position:'relative',maxWidth:880,textAlign:'center'}}
      before={<Stars tint={C.purple} count={80}/>}
    >
        <Reveal>
          <Eyebrow color={C.purple} style={{marginBottom:32}}>Stop scrolling. Start watching.</Eyebrow>
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
          <AuthCTA onClick={signInWithGoogle} loading={isAuthenticating} ariaLabel="Begin with Google" style={{display:'inline-flex',alignItems:'center',gap:10,marginTop:52,padding:'16px 32px',fontSize:14.5,boxShadow:'0 18px 40px -10px rgba(236,72,153,0.5)'}}>
            {l=><>{l?'Opening Google…':'Begin'} <span>→</span></>}
          </AuthCTA>
        </Reveal>
        <Reveal delay={550}>
          <Eyebrow color={C.textLow} style={{marginTop:24}}>Free · No credit card · No ads</Eyebrow>
        </Reveal>
    </SectionShell>
  );
}
