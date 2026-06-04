import { Link } from 'react-router-dom'
import { C } from '@/shared/lib/tokens'
import { Eyebrow, Wordmark } from '../primitives'

// ── Footer ─────────────────────────────────────────────────────
// Each link maps to a real route. Pages that don't exist yet are intentionally
// omitted — we don't advertise vapor (e.g. Manifesto, Press, Careers, Contact
// are removed until they ship). React Router <Link> is used for in-app routes
// and plain <a> for external/email targets.
function FooterLink({to, href, children}){
  // 44px tap target via inline-flex + min-height; padding-right gives spacing
  // between adjacent tappable links without affecting visual rhythm.
  const style = {fontFamily:'Inter',fontSize:14,color:C.textMid,textDecoration:'none',transition:'color 0.2s ease',display:'inline-flex',alignItems:'center',minHeight:44,paddingRight:12};
  if(href){
    return <a href={href} style={style} onMouseEnter={e=>e.currentTarget.style.color=C.textHi} onMouseLeave={e=>e.currentTarget.style.color=C.textMid}>{children}</a>;
  }
  return <Link to={to} style={style} onMouseEnter={e=>e.currentTarget.style.color=C.textHi} onMouseLeave={e=>e.currentTarget.style.color=C.textMid}>{children}</Link>;
}
export default function Footer(){
  const columns = [
    {t:'Product', items:[
      {label:'Discover', to:'/discover'},
      {label:'Browse',   to:'/browse'},
      {label:'About',    to:'/about'},
    ]},
    {t:'Legal', items:[
      {label:'Privacy',  to:'/privacy'},
      {label:'Terms',    to:'/terms'},
      {label:'Contact',  href:'mailto:hello@feelflick.com'},
    ]},
  ];
  return(
    <footer style={{padding:'72px 32px 84px',borderTop:`1px solid ${C.hairline}`}}>
      <div className="ff-grid-footer" style={{maxWidth:1280,margin:'0 auto',gridTemplateColumns:'2fr 1fr 1fr'}}>
        <div>
          <Wordmark size={20}/>
          <p className="ff-italic" style={{marginTop:14,fontFamily:'Inter',fontSize:13,color:C.textLow,lineHeight:1.6,maxWidth:340,fontStyle:'italic'}}>The right film. Right now.</p>
        </div>
        {columns.map(c=>
          <div key={c.t}>
            <Eyebrow color={C.textLow} style={{marginBottom:18}}>{c.t}</Eyebrow>
            <ul style={{margin:0,padding:0,listStyle:'none',display:'flex',flexDirection:'column',gap:11}}>
              {c.items.map(item =>
                <li key={item.label}><FooterLink to={item.to} href={item.href}>{item.label}</FooterLink></li>
              )}
            </ul>
          </div>
        )}
      </div>
      <div style={{maxWidth:1280,margin:'56px auto 0',paddingTop:28,borderTop:`1px solid ${C.hairline}`,display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12,fontFamily:'Inter',fontSize:11.5,color:C.textLow}}>
        <span>© FeelFlick · {new Date().getFullYear()}</span>
        <span className="ff-italic" style={{fontStyle:'italic'}}>Made for the patient.</span>
      </div>
    </footer>
  );
}
