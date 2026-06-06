import { useGoogleAuth } from '@/shared/hooks/useGoogleAuth'
import { C } from '@/shared/lib/tokens'
import { Reveal, Eyebrow, AuthCTA, SectionShell } from '../primitives'

// ── Pricing ────────────────────────────────────────────────────
export default function Pricing(){
  const { signInWithGoogle, isAuthenticating } = useGoogleAuth();
  return(
    <SectionShell id="pricing" tone="panel" padding="160px 32px" innerStyle={{maxWidth:880,textAlign:'center'}}>
        <Reveal>
          <Eyebrow color={C.purple} style={{marginBottom:24}}>Pricing</Eyebrow>
          <h2 className="ff-d2" style={{fontSize:'clamp(44px,5.6vw,80px)',color:C.text,margin:0}}>
            <em className="ff-italic" style={{color:C.textMid}}>Free.</em> Forever.
          </h2>
          <p className="ff-body" style={{marginTop:22,fontSize:16,color:C.textMid,lineHeight:1.65}}>One price. No tiers. The whole engine — picks, DNA, the Briefing — for everyone.</p>
        </Reveal>
        <Reveal delay={150}>
          {/* Inner price card capped at 480 so it stays focused inside the 880 outer column. */}
          <div style={{maxWidth:480,margin:'56px auto 0',padding:'48px 44px',borderRadius:16,background:`linear-gradient(160deg,${C.purple}15,transparent 80%)`,border:`1px solid ${C.purple}55`,position:'relative',overflow:'hidden'}}>
            <div aria-hidden style={{position:'absolute',top:-40,right:-40,width:200,height:200,borderRadius:999,background:`radial-gradient(circle,${C.purple}30,transparent 70%)`,filter:'blur(30px)'}}/>
            <div style={{position:'relative'}}>
              <Eyebrow color={C.textLow} style={{marginBottom:18}}>The whole thing</Eyebrow>
              <div style={{display:'flex',alignItems:'baseline',justifyContent:'center',gap:8,marginBottom:32}}>
                <span style={{fontFamily:'Outfit',fontSize:84,fontWeight:200,color:C.text,letterSpacing:'-0.055em',lineHeight:0.9}}>$0</span>
                <span className="ff-italic" style={{fontSize:14,color:C.textLow,fontStyle:'italic'}}>/ forever</span>
              </div>
              <ul style={{margin:0,padding:0,listStyle:'none',display:'flex',flexDirection:'column',gap:14,textAlign:'left',maxWidth:380,marginLeft:'auto',marginRight:'auto'}}>
                {['Unlimited picks, any hour','Cinematic DNA, forever','The Briefing if you want it','No ads. No upsells. No algorithm tax.'].map(t=>
                  <li key={t} style={{display:'flex',alignItems:'center',gap:12,fontFamily:'Inter',fontSize:16,color:C.textMid}}>
                    <span style={{width:18,height:18,borderRadius:999,background:`${C.purple}20`,color:C.purple,display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>{t}
                  </li>
                )}
              </ul>
              <AuthCTA onClick={signInWithGoogle} loading={isAuthenticating} ariaLabel="Start free with Google" style={{display:'block',width:'100%',textAlign:'center',marginTop:36,padding:'15px 22px',fontSize:14}}>{l=>l?'Opening Google…':'Start free →'}</AuthCTA>
            </div>
          </div>
        </Reveal>
    </SectionShell>
  );
}
