import { C } from '@/shared/lib/tokens'
import { Reveal, Eyebrow, SectionShell } from '../primitives'

// ── Community / Taste twins ────────────────────────────────────
export default function Community(){
  const twins=[
    {n:'Marco',match:87,h:'#A78BFA',mood:'Slow-burn obsessed',recent:'Rated Past Lives ★★★★★ · 2 days ago'},
    {n:'Priya',match:79,h:'#F472B6',mood:'Late-night cerebral',recent:'Saved 3 films · last week'},
    {n:'Theo',match:64,h:'#7DD3FC',mood:'Crime + thriller',recent:'Started a list · "Refn-coded"'},
  ];
  return(
    <SectionShell background={C.bgPure}>
        <Reveal>
          <div className="ff-grid-2" style={{marginBottom:72}}>
            <h2 className="ff-d2" style={{fontSize:'clamp(44px,5.6vw,80px)',color:C.text,margin:0,textWrap:'balance'}}>
              Find the people whose ratings <em className="ff-italic" style={{color:C.textMid}}>actually predict yours.</em>
            </h2>
            <p className="ff-body" style={{fontSize:18,color:C.textMid,lineHeight:1.7,maxWidth:440}}>
              Not popularity. Compatibility. We compute the overlap between your taste graph and theirs — and tell you how reliably their five-star agrees with what you’ll feel.
            </p>
          </div>
        </Reveal>
        <Reveal>
          {/* display:block so the self-centered label spans full width (the canonical
              Eyebrow is inline-flex; there is no centered parent here to align it). */}
          <Eyebrow color={C.textLow} style={{display:'block',textAlign:'center',marginBottom:32}}>Illustrative · Taste twins grow richer as FeelFlick does</Eyebrow>
        </Reveal>
        <div className="ff-grid-3">
          {twins.map((t,i)=>
            <Reveal key={t.n} delay={i*100}>
              <article style={{padding:'30px 28px',borderRadius:14,background:'rgba(255,255,255,0.022)',border:`1px solid ${C.hairline}`}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24}}>
                  <div style={{position:'relative',width:48,height:48}}>
                    <div style={{position:'absolute',inset:-3,borderRadius:999,background:`conic-gradient(${t.h},${C.pink},${t.h})`,opacity:0.7}}/>
                    <div style={{position:'relative',width:48,height:48,borderRadius:999,background:C.bg,padding:2}}>
                      <div style={{width:'100%',height:'100%',borderRadius:999,background:t.h,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Outfit',fontWeight:700,color:C.bg,fontSize:17}}>{t.n.charAt(0)}</div>
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontFamily:'Outfit',fontSize:32,fontWeight:200,color:C.text,letterSpacing:'-0.045em',lineHeight:1}}>{t.match}<span style={{fontSize:13,color:C.textLow}}>%</span></div>
                    <Eyebrow color={C.textFaint} style={{marginTop:3}}>Match</Eyebrow>
                  </div>
                </div>
                <div style={{fontFamily:'Outfit',fontSize:17,fontWeight:500,color:C.text}}>{t.n}</div>
                <div className="ff-italic" style={{fontFamily:'Outfit',fontSize:12,color:C.textLow,fontStyle:'italic',marginTop:3}}>{t.mood}</div>
                <div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${C.hairline}`,fontFamily:'Inter',fontSize:12,color:C.textLow,lineHeight:1.5}}>{t.recent}</div>
              </article>
            </Reveal>
          )}
        </div>
    </SectionShell>
  );
}
