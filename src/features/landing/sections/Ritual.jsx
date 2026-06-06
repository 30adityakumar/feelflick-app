import { C } from '@/shared/lib/tokens'
import { Reveal, Poster, Eyebrow, SectionShell, SectionHeading } from '../primitives'
import { PICKS } from '../data'

// ── The Ritual (single combined section) ─────────────────────
export default function Ritual(){
  const steps=[
    {n:'01',k:'Read the room',t:'How you feel.',b:'Tap one to three moods from a constellation of eight.',visual:'mood'},
    {n:'02',k:'Fit the hour',t:'About the night.',b:"Time, company, energy. The engine bends to fit.",visual:'night'},
    {n:'03',k:'Receive the edition',t:'One film.',b:'Not three options. One pick, with the article that makes its case.',visual:'pick'},
  ];
  return(
    <SectionShell id="ritual" tone="panel">
      <Reveal>
        <SectionHeading
          eyebrow="The Ritual · Three steps"
          marginBottom={84}
          ledeMaxWidth={560}
          lede="The whole flow takes a minute. The night gets back the rest."
        >
          Three short questions. <em className="ff-italic" style={{color:C.textMid}}>One film.</em>
        </SectionHeading>
      </Reveal>
        <div className="ff-grid-3">
          {steps.map((s,i)=>(
            <Reveal key={s.n} delay={i*150}>
              <div style={{position:'relative',padding:'32px 28px',borderRadius:14,background:'rgba(255,255,255,0.022)',border:`1px solid ${C.hairline}`,height:'100%',display:'flex',flexDirection:'column'}}>
                <Eyebrow color={C.purple} style={{marginBottom:18}}>{s.k} · {s.n}</Eyebrow>
                <div style={{flex:'none',marginBottom:24}}>
                  {s.visual==='mood'&&<MoodVisual/>}
                  {s.visual==='night'&&<NightVisual/>}
                  {s.visual==='pick'&&<PickMiniVisual/>}
                </div>
                <h3 className="ff-d2" style={{fontSize:'clamp(26px,2.6vw,34px)',color:C.text,margin:0,letterSpacing:'-0.025em'}}>{s.t}</h3>
                <p className="ff-body" style={{marginTop:10,fontSize:16,color:C.textMid,lineHeight:1.6}}>{s.b}</p>
              </div>
            </Reveal>
          ))}
        </div>
    </SectionShell>
  );
}
function MoodVisual(){
  const moods=[{n:'Tender',h:'#F472B6'},{n:'Tense',h:'#EF4444'},{n:'Slow-burn',h:'#A78BFA',on:true},{n:'Cerebral',h:'#7DD3FC'},{n:'Cozy',h:'#FBBF24'},{n:'Bittersweet',h:'#FB7185',on:true},{n:'Mythic',h:'#0EA5E9'},{n:'Restless',h:'#34D399'}];
  return(
    <div style={{position:'relative',aspectRatio:'4/3',borderRadius:10,background:C.bg,border:`1px solid ${C.hairline}`,padding:'22px 18px',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',gap:14}}>
      <Eyebrow color={C.textLow}>Your constellation</Eyebrow>
      <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center',maxWidth:260}}>
        {moods.map(m=><div key={m.n} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'5px 9px',borderRadius:999,background:m.on?`${m.h}1f`:'rgba(255,255,255,0.03)',border:`1px solid ${m.on?m.h+'55':C.hairline}`,color:m.on?C.text:C.textLow,fontFamily:'Inter',fontSize:10,fontWeight:m.on?600:500}}><span style={{width:4,height:4,borderRadius:999,background:m.h}}/>{m.n}</div>)}
      </div>
      <div className="ff-italic" style={{fontSize:14,color:C.textHi,fontStyle:'italic'}}>“The Long Goodbye”</div>
    </div>
  );
}
function NightVisual(){
  const rows=[{l:'Time',v:'~2 hrs'},{l:'With',v:'Just me'},{l:'Energy',v:'Settled'},{l:'Wanting',v:'To be moved'}];
  return(
    <div style={{aspectRatio:'4/3',borderRadius:10,background:C.bg,border:`1px solid ${C.hairline}`,padding:'22px 22px',display:'flex',flexDirection:'column',justifyContent:'center',gap:11}}>
      <Eyebrow color={C.textLow} style={{marginBottom:4}}>The night</Eyebrow>
      {rows.map(r=><div key={r.l} style={{display:'flex',justifyContent:'space-between',paddingBottom:8,borderBottom:`1px solid ${C.hairline}`,fontFamily:'Inter',fontSize:12}}><span style={{color:C.textLow}}>{r.l}</span><span style={{color:C.textHi,fontWeight:500}}>{r.v}</span></div>)}
    </div>
  );
}
function PickMiniVisual(){
  const p=PICKS[0];
  return(
    <div style={{aspectRatio:'4/3',borderRadius:10,background:C.bg,border:`1px solid ${C.hairline}`,padding:18,overflow:'hidden',display:'flex',gap:16,alignItems:'center'}}>
      <div style={{width:80,aspectRatio:'2/3',borderRadius:3,flex:'none',overflow:'hidden'}}>
        <Poster src={p.poster} title={p.title} accent={p.moodHex} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
      </div>
      <div style={{minWidth:0}}>
        <Eyebrow color={C.textLow} style={{marginBottom:6}}>Edition Nº 142</Eyebrow>
        <h4 style={{fontFamily:'Outfit',fontSize:17,fontWeight:300,color:C.text,margin:0,letterSpacing:'-0.022em',lineHeight:1.1}}>{p.title}</h4>
        <div style={{fontFamily:'Inter',fontSize:10,color:C.textLow,marginTop:3}}>{p.dir} · {p.year}</div>
        <p className="ff-italic" style={{fontSize:11,color:C.textMid,marginTop:10,fontStyle:'italic',lineHeight:1.4,paddingLeft:8,borderLeft:`1.5px solid ${p.moodHex}55`}}>A slow ache that lives in glances.</p>
      </div>
    </div>
  );
}
