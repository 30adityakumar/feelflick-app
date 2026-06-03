import { C, HP_GRAD as GRAD } from '@/shared/lib/tokens'
import { Reveal, Eyebrow } from '../primitives'

// ── M.'s letter ────────────────────────────────────────────────
export default function MLetter(){
  return(
    <section style={{padding:'160px 32px',borderTop:`1px solid ${C.hairline}`,background:C.bgPaper}}>
      <div style={{maxWidth:880,margin:'0 auto'}}>
        <Reveal>
          <div style={{textAlign:'center',marginBottom:48}}>
            <Eyebrow color={C.purple} style={{marginBottom:14}}>Meet M., your curator</Eyebrow>
            <p className="ff-body" style={{fontSize:18,color:C.textMid,maxWidth:520,marginLeft:'auto',marginRight:'auto',lineHeight:1.6}}>
              The engine has a voice. <em style={{color:C.textHi}}>M.</em> reads your taste, the time of day, and what you logged last week — then writes a short note with the pick.
            </p>
          </div>
        </Reveal>
        <Reveal delay={150}>
          {/* Inner card capped at 720 so the letter body reads at ~67ch (dyslexia comfort range), inside the 880-wide section column. */}
          <div style={{position:'relative',maxWidth:720,margin:'0 auto',padding:'56px 56px',borderRadius:16,background:'rgba(15,12,24,0.78)',border:`1px solid ${C.hairline}`,boxShadow:'0 32px 60px -20px rgba(0,0,0,0.7)'}}>
            <div aria-hidden style={{position:'absolute',top:-26,right:32,width:52,height:52,borderRadius:999,background:GRAD,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Outfit',fontWeight:700,fontSize:22,color:'#fff',boxShadow:'0 12px 24px -8px rgba(0,0,0,0.6)'}}>M</div>
            <div className="ff-italic" style={{fontSize:13,color:C.textLow,fontStyle:'italic',marginBottom:24}}>An example letter · what yours might read like</div>
            <p className="ff-body" style={{fontSize:18,color:C.textMid,lineHeight:1.75,margin:0,fontFamily:'Inter'}}>
              When you’ve leaned <em style={{color:C.textHi}}>slow-burn</em> nine nights running, Tuesday has earned some tenderness, and we go softer.
            </p>
            <p className="ff-body" style={{fontSize:18,color:C.textMid,lineHeight:1.75,marginTop:14,fontFamily:'Inter'}}>
              <em style={{color:C.textHi}}>Past Lives</em> is patient. It won’t ask for your forgiveness; it’ll ask for your attention. Give it both. There’s a moment in the airport — you’ll know.
            </p>
            <p className="ff-body" style={{fontSize:18,color:C.textMid,lineHeight:1.75,marginTop:14,fontFamily:'Inter'}}>
              Have it with a glass of something warm and the phone in another room.
            </p>
            <div className="ff-italic" style={{fontSize:18,color:C.textHi,fontStyle:'italic',marginTop:24,letterSpacing:'-0.005em'}}>— M.</div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
