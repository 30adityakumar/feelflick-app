import { C, ROSE } from '@/shared/lib/tokens'
import { Reveal, Poster, Eyebrow, SectionShell, SectionHeading } from '../primitives'
import { PICKS } from '../data'

// ── The Problem (Apple "vs" split) ─────────────────────────
export default function TheProblem(){
  // Build a fake Netflix-style chaotic wall
  return(
    <SectionShell tone="void" position="relative" overflow="hidden" padding="160px 32px">
      <Reveal>
        <SectionHeading
          eyebrow="The problem"
          eyebrowMarginBottom={28}
          ledeMarginTop={30}
          ledeLineHeight={1.6}
          lede="Streaming taught us to scroll. Three rivals, twelve rows, four trailers, no decision. Most evenings end without a film — and the few that do, end with a film no-one quite wanted."
        >
          You spent <em className="ff-italic" style={{color:'#EF4444'}}>23 minutes</em> picking.{' '}<br/>You watched <em className="ff-italic" style={{color:ROSE}}>thirty.</em>
        </SectionHeading>
      </Reveal>
        <Reveal delay={150}>
          <div style={{maxWidth:1280,margin:'0 auto'}} className="ff-grid-2">
            {/* Left: chaos */}
            <div style={{position:'relative',borderRadius:14,overflow:'hidden',background:'#0c0a14',border:`1px solid ${C.hairline}`,padding:'24px 24px 0'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
                <Eyebrow color="#EF4444">Streaming · Tonight</Eyebrow>
                <div style={{fontFamily:'Inter',fontSize:11,color:C.textFaint}}>scrolling · 23 min</div>
              </div>
              {/* Mocked grid of small posters with shimmer */}
              {[
                {label:'Trending today',blur:0,op:1},
                {label:'Because you watched anything',blur:0.5,op:0.78},
                {label:'Top 10 in your country',blur:1.2,op:0.55},
              ].map((row,idx)=>(
                <div key={idx} style={{marginBottom:10}}>
                  <div style={{fontFamily:'Inter',fontSize:9.5,color:C.textFaint,marginBottom:5,fontWeight:500,letterSpacing:'0.04em'}}>{row.label}</div>
                  <div style={{display:'flex',gap:6,filter:`blur(${row.blur}px)`,opacity:row.op}}>
                    {Array.from({length:8}).map((_,i)=><div key={i} style={{flex:'none',width:72,height:100,borderRadius:3,background:`linear-gradient(135deg,rgba(255,255,255,${0.04+(i%3)*0.02}),rgba(255,255,255,0.02))`,border:`1px solid ${C.hairline}`}}/>)}
                  </div>
                </div>
              ))}
              <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,transparent 50%,#0c0a14 95%)',pointerEvents:'none'}}/>
              <div style={{position:'absolute',bottom:20,left:24,right:24,fontFamily:'Inter',fontSize:13,color:C.textLow,fontStyle:'italic',lineHeight:1.5}}>
                “Maybe this one… no. What about… no. Let’s see what’s trending…”
              </div>
            </div>
            {/* Right: clarity */}
            <div style={{position:'relative',borderRadius:14,overflow:'hidden',background:`linear-gradient(160deg,${ROSE}10,transparent 80%)`,border:`1px solid ${ROSE}44`,padding:'32px 32px 36px',display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <Eyebrow color={ROSE}>FeelFlick · Tonight</Eyebrow>
                <div style={{fontFamily:'Inter',fontSize:11,color:C.textFaint}}>deciding · 47 sec</div>
              </div>
              <div style={{margin:'auto',display:'flex',gap:24,alignItems:'flex-end',maxWidth:380}}>
                <div style={{position:'relative',width:140,aspectRatio:'2/3',borderRadius:4,boxShadow:`0 20px 40px -14px rgba(0,0,0,0.7),0 0 0 1px ${ROSE}33`,overflow:'hidden'}}>
                <Poster src={PICKS[3].poster} title={PICKS[3].title} accent={PICKS[3].moodHex} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
              </div>
                <div style={{paddingBottom:6}}>
                  <h3 style={{fontFamily:'Inter, sans-serif',fontSize:22,fontWeight:400,color:C.text,margin:0,letterSpacing:'-0.02em'}}>{PICKS[3].title}</h3>
                  <div style={{fontFamily:'Inter',fontSize:11,color:C.textLow,marginTop:4}}>{PICKS[3].dir} · {PICKS[3].year}</div>
                  <Eyebrow color={ROSE} style={{marginTop:14}}>94% match</Eyebrow>
                </div>
              </div>
              <div className="ff-italic" style={{fontFamily:'Inter, sans-serif',fontSize:13,color:C.textMid,fontStyle:'italic',lineHeight:1.5}}>
                “Forty-seven seconds. The right film. The rest of the night, yours.”
              </div>
            </div>
          </div>
        </Reveal>
    </SectionShell>
  );
}
