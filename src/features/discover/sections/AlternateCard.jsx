import { buildBecauseLine } from '../derive'
import { HP } from '../constants'

// ── Alternate card — compact preview of an alternate pick. Click promotes
// it to the top slot (the page crossfades and this card swaps places with
// whatever was currently top). Title + meta + because-line; no match %,
// no action buttons — those belong only on the focused top pick. Keeping
// the alternates lightweight matches the "pick between three" intent
// without multiplying decision load.
export default function AlternateCard({ film, profile, selected, onPick }) {
  const because = buildBecauseLine({ film, profile, selected, isAlt: true });
  return (
    <button
      type="button"
      onClick={onPick}
      className="ff-alt-card"
      style={{
        display:'grid', gridTemplateColumns:'auto 1fr', gap:14,
        padding:14, borderRadius:12,
        background:HP.surface, border:`1px solid ${HP.border}`,
        textAlign:'left', cursor:'pointer',
        transition:'background 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
      }}
    >
      <img
        src={film.poster}
        alt={film.title}
        loading="lazy"
        style={{ width:84, height:126, objectFit:'cover', borderRadius:6, display:'block' }}
      />
      <div style={{ minWidth:0, display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'2px 0' }}>
        <div>
          <h3 style={{ fontFamily:'Outfit', fontSize:16, fontWeight:500, color:HP.text, margin:0, letterSpacing:'-0.015em', lineHeight:1.2 }}>
            {film.title}
          </h3>
          <div style={{ marginTop:6, fontFamily:'Outfit', fontSize:11, color:HP.textMuted, letterSpacing:'0.03em' }}>
            {film.dir} &middot; {film.year} &middot; {film.runtime} min
          </div>
        </div>
        {because && (
          <p style={{ marginTop:8, marginBottom:0, fontFamily:'Outfit, Inter, sans-serif', fontSize:12, fontStyle:'italic', color:HP.textSoft, lineHeight:1.5, textWrap:'pretty' }}>
            {because}
          </p>
        )}
      </div>
    </button>
  );
}
