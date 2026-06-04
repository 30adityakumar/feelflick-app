import { C } from '@/shared/lib/tokens'
import { Reveal, Poster, Eyebrow } from '../primitives'
import { PICKS } from '../data'

// ── The Film File (what every pick comes with) ────────────────
export default function FilmFile(){
  const motifs=['Class tension','Quiet endings','Slow burn','Two-handers'];
  return(
    <section id="file" style={{padding:'200px 32px',borderTop:`1px solid ${C.hairline}`,background:C.bgPure,position:'relative'}}>
      <div aria-hidden style={{position:'absolute',inset:0,background:`radial-gradient(ellipse 80% 50% at 70% 30%,${C.purple}12,transparent 60%)`,pointerEvents:'none'}}/>
      <div style={{position:'relative',maxWidth:1280,margin:'0 auto'}}>
        <Reveal>
          <div style={{textAlign:'center',marginBottom:84}}>
            <Eyebrow color={C.purple} style={{marginBottom:26}}>The Film File</Eyebrow>
            <h2 className="ff-d2" style={{fontSize:'clamp(44px,5.6vw,80px)',color:C.text,margin:'0 auto',textWrap:'balance',maxWidth:780}}>
              Every pick comes with <em className="ff-italic" style={{color:C.textMid}}>its case.</em>
            </h2>
            <p className="ff-body" style={{fontSize:18,color:C.textMid,maxWidth:560,margin:'24px auto 0',lineHeight:1.65}}>
              Not just a poster. A short essay, a critic’s line, the mood arc, what to drink, and one film we’d skip tonight — and why.
            </p>
          </div>
        </Reveal>
        <Reveal delay={150}>
          <div className="ff-grid-feature" style={{padding:'48px 48px',borderRadius:18,background:'rgba(255,255,255,0.02)',border:`1px solid ${C.hairline}`}}>
            <div>
              <div style={{width:'100%',aspectRatio:'2/3',borderRadius:6,boxShadow:'0 28px 56px -18px rgba(0,0,0,0.85)',overflow:'hidden'}}>
                <Poster src={PICKS[2].poster} title={PICKS[2].title} accent={PICKS[2].moodHex} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
              </div>
            </div>
            <div>
              <Eyebrow color={C.textLow} style={{marginBottom:18}}>The Feature · p. 01</Eyebrow>
              <h3 className="ff-d2" style={{fontSize:'clamp(36px,4.4vw,58px)',color:C.text,margin:0}}>{PICKS[2].title}</h3>
              <div style={{marginTop:10,display:'flex',alignItems:'center',gap:11,fontFamily:'Inter',fontSize:13,color:C.textLow}}>
                <span style={{fontStyle:'italic'}}>directed by {PICKS[2].dir}</span>
                <span style={{color:C.textFaint}}>·</span><span>{PICKS[2].year}</span>
                <span style={{color:C.textFaint}}>·</span><span>{PICKS[2].runtime}</span>
              </div>
              <p className="ff-body" style={{marginTop:24,fontSize:16,color:C.textHi,lineHeight:1.65,maxWidth:520}}>
                <span className="ff-italic" style={{float:'left',fontSize:64,lineHeight:0.85,color:C.purple,marginRight:10,marginTop:6,marginBottom:-4,letterSpacing:'-0.06em',fontWeight:300}}>{PICKS[2].why.charAt(0)}</span>
                {PICKS[2].why.slice(1)}
              </p>
              <blockquote style={{margin:'28px 0 0 0',padding:'14px 0 14px 20px',borderLeft:`2px solid ${C.purple}77`}}>
                <p style={{margin:0,fontFamily:'Outfit',fontSize:18,fontWeight:300,fontStyle:'italic',color:C.text,lineHeight:1.4,letterSpacing:'-0.012em'}}>“Tender enough to break your composure.”</p>
                <Eyebrow color={C.textLow} style={{marginTop:8}}>— FeelFlick Editors</Eyebrow>
              </blockquote>
              <div style={{marginTop:28,display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                <div style={{padding:'14px 16px',borderRadius:8,background:'rgba(255,255,255,0.022)',border:`1px solid ${C.hairline}`}}>
                  <Eyebrow color={C.purple} style={{marginBottom:8}}>Pairs with</Eyebrow>
                  <div style={{fontFamily:'Inter',fontSize:12.5,color:C.textMid,fontStyle:'italic',lineHeight:1.55}}>A glass of red. Ninety minutes of nothing else.</div>
                </div>
                <div style={{padding:'14px 16px',borderRadius:8,background:'rgba(255,255,255,0.022)',border:`1px solid ${C.hairline}`}}>
                  <Eyebrow color={C.purple} style={{marginBottom:8}}>Why for you</Eyebrow>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{motifs.map(t=><span key={t} style={{padding:'3px 9px',borderRadius:999,background:`${C.purple}10`,border:`1px solid ${C.purple}33`,fontFamily:'Inter',fontSize:11,color:C.textMid}}>{t}</span>)}</div>
                </div>
              </div>
              {/* Emotional arc + skip tonight — now below right content */}
              <div style={{marginTop:28,display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:20,alignItems:'stretch'}}>
                <div style={{padding:'18px 20px',borderRadius:10,background:'rgba(255,255,255,0.022)',border:`1px solid ${C.hairline}`}}>
                  <Eyebrow color={C.textLow} style={{marginBottom:14}}>Emotional arc · 126 min</Eyebrow>
                  <svg viewBox="0 0 280 56" width="100%" height="56">
                    <defs>
                      <linearGradient id="arc-g" x1="0" x2="1"><stop offset="0%" stopColor={C.purple} stopOpacity="0.6"/><stop offset="100%" stopColor={C.pink} stopOpacity="0.95"/></linearGradient>
                      <linearGradient id="arc-f" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={C.purple} stopOpacity="0.22"/><stop offset="100%" stopColor={C.purple} stopOpacity="0"/></linearGradient>
                    </defs>
                    <path d="M4,42 L34,38 L62,32 L92,26 L120,22 L150,18 L178,14 L210,12 L240,18 L276,22 L276,52 L4,52 Z" fill="url(#arc-f)"/>
                    <path d="M4,42 L34,38 L62,32 L92,26 L120,22 L150,18 L178,14 L210,12 L240,18 L276,22" fill="none" stroke="url(#arc-g)" strokeWidth="1.8" strokeLinecap="round"/>
                    <circle cx="210" cy="12" r="2.6" fill={C.pink}/>
                  </svg>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:9.5,color:C.textFaint,fontFamily:'Outfit',letterSpacing:'0.08em',textTransform:'uppercase'}}><span>Quiet</span><span style={{color:C.pink}}>Peak</span><span>Bittersweet</span></div>
                </div>
                <div style={{padding:'14px 18px',borderRadius:10,background:`${C.amber}0a`,border:`1px solid ${C.amber}33`,display:'flex',flexDirection:'column',justifyContent:'center'}}>
                  <Eyebrow color={C.amber} style={{marginBottom:6}}>Skip tonight</Eyebrow>
                  <div style={{fontFamily:'Inter',fontSize:13,color:C.textMid,fontStyle:'italic'}}>Hereditary. Your settled energy will resent it.</div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
