import MatchBadge from '@/shared/components/MatchBadge'
import { C, ROSE } from '@/shared/lib/tokens'
import { Reveal, Poster, Eyebrow, SectionShell } from '../primitives'
import { PICKS } from '../data'

// ── The Briefing ──────────────────────────────────────────────
export default function Briefing(){
  return(
    <SectionShell id="briefing" tone="void">
        <Reveal>
          <div className="ff-grid-2" style={{marginBottom:72}}>
            <div>
              <Eyebrow color={ROSE} style={{marginBottom:24}}>The Briefing</Eyebrow>
              <h2 className="ff-d2" style={{fontSize:'clamp(44px,5.6vw,80px)',color:C.text,margin:0,textWrap:'balance'}}>
                Or get it <em className="ff-italic" style={{color:C.textMid}}>served.</em>
              </h2>
            </div>
            <p className="ff-body" style={{fontSize:18,color:C.textMid,lineHeight:1.7,maxWidth:480}}>
              Some nights you want to ask. Others you want it ready. Turn on the Briefing and one considered pick arrives each evening — with the case for why it fits tonight. Not a feed to sort. One film, chosen. Not the night for it? Skip, and the next is ready.
            </p>
          </div>
        </Reveal>
        <Reveal delay={150}>
          <div className="ff-briefing-card" style={{borderRadius:14,background:'rgba(255,255,255,0.022)',border:`1px solid ${C.hairline}`,padding:'40px 48px',position:'relative',overflow:'hidden'}}>
            <div aria-hidden style={{position:'absolute',inset:0,background:`radial-gradient(ellipse 50% 30% at 20% 0%,${ROSE}14,transparent 60%)`,pointerEvents:'none'}}/>
            <div style={{position:'relative',display:'flex',alignItems:'center',gap:14,paddingBottom:24,borderBottom:`1px solid ${C.hairline}`}}>
              <Eyebrow color={ROSE}>FeelFlick · The Briefing</Eyebrow>
              <div style={{height:1,width:28,background:ROSE,opacity:0.5}}/>
              <Eyebrow color={C.textLow}>An example issue</Eyebrow>
              <div style={{flex:1}}/>
              <div className="ff-italic" style={{fontSize:13,color:C.textLow,fontStyle:'italic'}}>What yours might look like</div>
            </div>
            <div className="ff-briefing-body" style={{position:'relative',marginTop:40}}>
              {/* Tonight's ONE pick — the confident hero. */}
              <div className="ff-briefing-hero">
                <div style={{position:'relative'}}>
                  <div style={{width:'100%',aspectRatio:'2/3',borderRadius:6,boxShadow:'0 24px 48px -18px rgba(0,0,0,0.75)',overflow:'hidden'}}>
                    <Poster src={PICKS[1].poster} title={PICKS[1].title} accent={PICKS[1].moodHex} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                  </div>
                  <MatchBadge variant="pill" pct={94} accent={PICKS[1].moodHex} />
                </div>
                <div>
                  <Eyebrow color={ROSE} style={{marginBottom:10}}>Tonight’s pick</Eyebrow>
                  <h3 className="ff-d2" style={{fontSize:'clamp(28px,3vw,40px)',color:C.text,margin:0}}>{PICKS[1].title}</h3>
                  <div style={{marginTop:8,fontFamily:'Inter',fontSize:12.5,color:C.textLow}}>{PICKS[1].year} · {PICKS[1].dir}</div>
                  <p className="ff-body" style={{marginTop:16,fontSize:14.5,fontWeight:400,color:C.textMid,lineHeight:1.65,maxWidth:440}}>{PICKS[1].why}</p>
                </div>
              </div>
              {/* If you skip — the honest next-in-queue, clearly secondary (NOT three equal picks). */}
              <div>
                <Eyebrow color={C.textLow} style={{marginBottom:18}}>Not the night for it? Skip →</Eyebrow>
                <div style={{display:'flex',flexDirection:'column',gap:18}}>
                  {[PICKS[3], PICKS[5]].map((p,i)=>(
                    <div key={i} style={{display:'flex',gap:14,alignItems:'center',opacity:0.74}}>
                      <div style={{width:46,aspectRatio:'2/3',borderRadius:4,overflow:'hidden',flex:'none',boxShadow:'0 8px 18px -8px rgba(0,0,0,0.7)'}}>
                        <Poster src={p.poster} title={p.title} accent={p.moodHex} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                      </div>
                      <div style={{minWidth:0}}>
                        <div style={{fontFamily:'Inter, sans-serif',fontSize:15,fontWeight:400,color:C.text,letterSpacing:'-0.01em'}}>{p.title}</div>
                        <div style={{fontFamily:'Inter',fontSize:11.5,color:C.textLow,marginTop:2,lineHeight:1.4}}>{p.why.split('. ')[0]}.</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="ff-italic" style={{marginTop:20,fontSize:12,color:C.textFaint,fontStyle:'italic',lineHeight:1.5}}>The queue, not a shortlist. One pick leads each night.</div>
              </div>
            </div>
          </div>
        </Reveal>
    </SectionShell>
  );
}
