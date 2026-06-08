import { HP } from '../constants'

// Streaming availability — honest about what we know. `status` (F3.9) lets us
// distinguish a found provider from "no data" / "couldn't check" without
// implying the film is unavailable everywhere or that our data is complete.
export default function StreamingChip({ provider, status }) {
  if (provider) {
    const label = provider.type === 'flatrate' ? 'Streaming on'
      : provider.type === 'rent' ? 'Rent on'
      : 'Buy on';
    return (
      <div style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'8px 12px 8px 8px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:`1px solid ${HP.border}`, maxWidth:'100%' }}>
        <img
          src={`https://image.tmdb.org/t/p/w92${provider.logoPath}`}
          alt={`${provider.name} logo`}
          style={{ width:28, height:28, borderRadius:5, objectFit:'cover', flex:'none' }}
          loading="lazy"
        />
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.18em', textTransform:'uppercase', color:HP.textFaint, fontFamily:'Outfit', lineHeight:1 }}>{label}</div>
          <div style={{ fontSize:12, fontWeight:600, color:HP.text, fontFamily:'Outfit', lineHeight:1.2, marginTop:3 }}>{provider.name}</div>
        </div>
      </div>
    );
  }
  // Quiet, secondary, honest. Not an alert; not a claim of unavailability.
  if (status === 'empty') return <span className="ff-provider-note">Availability not found</span>;
  if (status === 'error') return <span className="ff-provider-note">Availability unavailable</span>;
  return null; // idle / loading → render nothing (no layout shift)
}
