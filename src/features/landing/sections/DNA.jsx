import { useState, useEffect, useRef } from 'react'
import { C } from '@/shared/lib/tokens'
import { Reveal } from '../primitives'

// ── DNA — your portrait ────────────────────────────────────────
export default function DNA(){
  const ref=useRef(null);
  const [iv,setIv]=useState(false);
  useEffect(()=>{const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){setIv(true);o.disconnect();}},{threshold:0.3});if(ref.current)o.observe(ref.current);return()=>o.disconnect();},[]);
  const weights=[{n:'Tense',v:0.84,h:'#EF4444'},{n:'Slow-burn',v:0.78,h:'#A78BFA'},{n:'Bittersweet',v:0.71,h:'#FB7185'},{n:'Cerebral',v:0.68,h:'#7DD3FC'},{n:'Tender',v:0.62,h:'#F472B6'}];
  return(
    <section id="dna" ref={ref} style={{padding:'160px 32px',borderTop:`1px solid ${C.hairline}`}}>
      <div style={{maxWidth:1280,margin:'0 auto'}}>
        <Reveal>
          <div style={{textAlign:'center',marginBottom:80}}>
            <div className="ff-eyebrow" style={{marginBottom:26,color:C.purple}}>Your Cinematic DNA</div>
            <h2 className="ff-d2" style={{fontSize:'clamp(44px,5.6vw,80px)',color:C.text,margin:'0 auto',textWrap:'balance',maxWidth:880}}>
              A portrait you can only get <em className="ff-italic" style={{color:C.textMid}}>by watching.</em>
            </h2>
            <p className="ff-body" style={{fontSize:18,color:C.textMid,maxWidth:580,margin:'24px auto 0',lineHeight:1.65}}>
              Letterboxd has your ratings. Netflix has your watch time. FeelFlick has the shape of you — moods, directors, recurring motifs, the runtime you actually have patience for. Visible only to you.
            </p>
          </div>
        </Reveal>
        <Reveal delay={150}>
          <div className="ff-grid-2" style={{padding:'48px 48px',borderRadius:16,background:'rgba(255,255,255,0.018)',border:`1px solid ${C.hairline}`}}>
            <div>
              <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:28}}>
                <div className="ff-eyebrow" style={{color:C.purple}}>An example DNA</div>
                <div className="ff-italic" style={{fontSize:11,color:C.textFaint,fontStyle:'italic'}}>Sharper with every watch</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                {weights.map((w,i)=>
                  <div key={w.n}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                      <span style={{fontFamily:'Outfit',fontSize:14,fontWeight:400,color:C.text}}>{w.n}</span>
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
                <div className="ff-eyebrow" style={{color:C.textLow,marginBottom:14}}>Signature directors</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
                  {['Bong Joon-ho','Wong Kar-wai','Denis Villeneuve','Park Chan-wook'].map(d=>
                    <span key={d} style={{padding:'7px 13px',borderRadius:999,background:`${C.purple}10`,border:`1px solid ${C.purple}33`,fontFamily:'Inter',fontSize:12.5,color:C.textMid}}>{d}</span>
                  )}
                </div>
              </div>
              <div>
                <div className="ff-eyebrow" style={{color:C.textLow,marginBottom:14}}>Recurring motifs</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
                  {['Class tension','Quiet endings','Two-handers','Long takes','Rain','Patient ache'].map(t=>
                    <span key={t} style={{padding:'7px 13px',borderRadius:999,background:'rgba(255,255,255,0.04)',border:`1px solid ${C.hairline}`,fontFamily:'Inter',fontSize:12.5,color:C.textMid}}>{t}</span>
                  )}
                </div>
              </div>
              <div style={{paddingTop:24,borderTop:`1px solid ${C.hairline}`}}>
                <div className="ff-eyebrow" style={{color:C.textLow,marginBottom:10}}>Your signature line</div>
                <div className="ff-italic" style={{fontSize:21,fontStyle:'italic',color:C.text,letterSpacing:'-0.018em',lineHeight:1.3}}>“Films that earn their silences.”</div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
