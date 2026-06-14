import { C, ROSE } from '@/shared/lib/tokens'
import { Reveal, Eyebrow, SectionShell, SectionHeading } from '../primitives'
import { useInView } from '@/shared/hooks/useInView'

// ── DNA — your portrait ────────────────────────────────────────
export default function DNA(){
  const [ref,iv]=useInView({threshold:0.3});
  const weights=[{n:'Tense',v:0.84,h:'#EF4444'},{n:'Slow-burn',v:0.78,h:'#A78BFA'},{n:'Bittersweet',v:0.71,h:'#FB7185'},{n:'Cerebral',v:0.68,h:'#7DD3FC'},{n:'Tender',v:0.62,h:'#F472B6'}];
  return(
    <SectionShell id="dna" ref={ref} tone="panel">
      <Reveal>
        <SectionHeading
          eyebrow="Your Cinematic DNA"
          lede="Letterboxd has your ratings. Netflix has your watch time. FeelFlick has the shape of you — moods, directors, recurring motifs, the runtime you actually have patience for. Visible only to you."
        >
          A portrait you can only get <em className="ff-italic" style={{color:C.textMid}}>by watching.</em>
        </SectionHeading>
      </Reveal>
        <Reveal delay={150}>
          <div className="ff-grid-2" style={{padding:'48px 48px',borderRadius:16,background:'rgba(255,255,255,0.018)',border:`1px solid ${C.hairline}`}}>
            <div>
              <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:28}}>
                <Eyebrow color={ROSE}>An example DNA</Eyebrow>
                <div className="ff-italic" style={{fontSize:11,color:C.textFaint,fontStyle:'italic'}}>Sharper with every watch</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                {weights.map((w,i)=>
                  <div key={w.n}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                      <span style={{fontFamily:'Inter, sans-serif',fontSize:14,fontWeight:400,color:C.text}}>{w.n}</span>
                      <span style={{fontFamily:'Inter',fontSize:12,color:C.textLow}}>{Math.round(w.v*100)}</span>
                    </div>
                    <div style={{height:2,background:'rgba(255,255,255,0.05)',borderRadius:999,overflow:'hidden'}}>
                      <div style={{height:'100%',width:iv?`${w.v*100}%`:'0%',background:w.h,opacity:0.85,transition:`width 1.6s cubic-bezier(.2,.7,.2,1) ${i*0.1+0.1}s`}}/>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:28}}>
              <div>
                <Eyebrow color={C.textLow} style={{marginBottom:14}}>Signature directors</Eyebrow>
                <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
                  {['Bong Joon-ho','Wong Kar-wai','Denis Villeneuve','Park Chan-wook'].map(d=>
                    <span key={d} style={{padding:'7px 13px',borderRadius:999,background:`${ROSE}10`,border:`1px solid ${ROSE}33`,fontFamily:'Inter',fontSize:12.5,color:C.textMid}}>{d}</span>
                  )}
                </div>
              </div>
              <div>
                <Eyebrow color={C.textLow} style={{marginBottom:14}}>Recurring motifs</Eyebrow>
                <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
                  {['Class tension','Quiet endings','Two-handers','Long takes','Rain','Patient ache'].map(t=>
                    <span key={t} style={{padding:'7px 13px',borderRadius:999,background:'rgba(255,255,255,0.04)',border:`1px solid ${C.hairline}`,fontFamily:'Inter',fontSize:12.5,color:C.textMid}}>{t}</span>
                  )}
                </div>
              </div>
              <div style={{paddingTop:24,borderTop:`1px solid ${C.hairline}`}}>
                <Eyebrow color={C.textLow} style={{marginBottom:10}}>Your signature line</Eyebrow>
                <div className="ff-italic" style={{fontSize:21,fontStyle:'italic',color:C.text,letterSpacing:'-0.018em',lineHeight:1.3}}>“Films that earn their silences.”</div>
              </div>
            </div>
          </div>
        </Reveal>
        {/* Bridge to the moat spine — DNA isn't a standalone profile; it's what every pick is drawn from. */}
        <Reveal delay={250}>
          <p className="ff-body" style={{textAlign:'center',maxWidth:640,margin:'44px auto 0',fontSize:16,color:C.textMid,lineHeight:1.6}}>
            This is the shape every pick is measured against — so when a film fits, the <em className="ff-italic" style={{color:C.textHi}}>why</em> is already written.
          </p>
        </Reveal>
    </SectionShell>
  );
}
