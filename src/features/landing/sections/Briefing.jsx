import MatchBadge from '@/shared/components/MatchBadge'
import { C } from '@/shared/lib/tokens'
import { Reveal, Poster, Eyebrow, SectionShell } from '../primitives'
import { PICKS } from '../data'

// ── The Briefing ──────────────────────────────────────────────
export default function Briefing(){
  return(
    <SectionShell id="briefing" tone="void">
        <Reveal>
          <div className="ff-grid-2" style={{marginBottom:72}}>
            <div>
              <Eyebrow color={C.purple} style={{marginBottom:24}}>The Briefing</Eyebrow>
              <h2 className="ff-d2" style={{fontSize:'clamp(44px,5.6vw,80px)',color:C.text,margin:0,textWrap:'balance'}}>
                Or get it <em className="ff-italic" style={{color:C.textMid}}>served.</em>
              </h2>
            </div>
            <p className="ff-body" style={{fontSize:18,color:C.textMid,lineHeight:1.7,maxWidth:480}}>
              Some nights you want to ask. Others you want it ready. Turn on the Briefing and three picks arrive every evening — tonight’s selection, a mood-match, and one from deep in your DNA. For the evenings you don’t want to think.
            </p>
          </div>
        </Reveal>
        <Reveal delay={150}>
          <div style={{borderRadius:14,background:'rgba(255,255,255,0.022)',border:`1px solid ${C.hairline}`,padding:'40px 48px',position:'relative',overflow:'hidden'}}>
            <div aria-hidden style={{position:'absolute',inset:0,background:`radial-gradient(ellipse 50% 30% at 20% 0%,${C.purple}14,transparent 60%)`,pointerEvents:'none'}}/>
            <div style={{position:'relative',display:'flex',alignItems:'center',gap:14,paddingBottom:24,borderBottom:`1px solid ${C.hairline}`}}>
              <Eyebrow color={C.purple}>FeelFlick · The Briefing</Eyebrow>
              <div style={{height:1,width:28,background:C.purple,opacity:0.5}}/>
              <Eyebrow color={C.textLow}>An example issue</Eyebrow>
              <div style={{flex:1}}/>
              <div className="ff-italic" style={{fontSize:13,color:C.textLow,fontStyle:'italic'}}>What yours might look like</div>
            </div>
            <div style={{position:'relative',marginTop:40}} className="ff-grid-3">
              {[PICKS[1], PICKS[3], PICKS[5]].map((p,i)=>(
                <article key={i}>
                  <div style={{position:'relative',marginBottom:18}}>
                    <div style={{width:'100%',aspectRatio:'2/3',borderRadius:5,boxShadow:'0 20px 40px -16px rgba(0,0,0,0.7)',overflow:'hidden'}}>
                      <Poster src={p.poster} title={p.title} accent={p.moodHex} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                    </div>
                    <MatchBadge variant="pill" pct={[94,88,82][i]} accent={p.moodHex} />
                  </div>
                  <Eyebrow color={p.moodHex} style={{marginBottom:9}}>0{i+1} · {['Tonight\'s pick','Mood match','From your DNA'][i]}</Eyebrow>
                  <h3 style={{fontFamily:'Outfit',fontSize:22,fontWeight:400,color:C.text,margin:'0 0 6px 0',letterSpacing:'-0.02em'}}>{p.title}</h3>
                  <div style={{fontFamily:'Inter',fontSize:11.5,color:C.textLow,marginBottom:14}}>{p.year} · {p.dir}</div>
                  <p className="ff-body" style={{margin:0,fontSize:13,fontWeight:400,color:C.textMid,lineHeight:1.6}}>{p.why.split('. ')[0]}.</p>
                </article>
              ))}
            </div>
          </div>
        </Reveal>
    </SectionShell>
  );
}
