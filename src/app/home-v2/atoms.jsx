// FeelFlick — Home v2 atoms / primitives.
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FILMS, POSTER, HP, HP_GRAD, gradFor } from './data';

export function FFMark({ size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: HP_GRAD, color: '#fff',
      fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 700, fontSize: size * 0.5,
      letterSpacing: '-0.02em',
      boxShadow: '0 4px 18px -2px rgba(167,139,250,0.5)',
    }}>FF</div>
  );
}

const NAV_LINKS = [
  { label: 'Home',      to: '/home-v2' },
  { label: 'Discover',  to: '/discover' },
  { label: 'Watchlist', to: '/watchlist' },
  { label: 'Diary',     to: '/watched' },
];

export function HPNav({ user, onAvatarClick }) {
  const navigate = useNavigate();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 28px',
      borderBottom: `1px solid ${HP.border}`,
      position: 'relative', zIndex: 5,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <NavLink to="/home-v2" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <FFMark size={28} />
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em', color: HP.text }}>FeelFlick</span>
        </NavLink>
        <nav style={{ display: 'flex', gap: 22 }}>
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.label}
              to={l.to}
              end
              style={({ isActive }) => ({
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                color: isActive ? HP.text : HP.textSoft,
                borderBottom: isActive ? `2px solid ${HP.purple}` : '2px solid transparent',
                paddingBottom: 4,
                textDecoration: 'none',
                transition: 'color 0.2s ease',
              })}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          type="button"
          onClick={() => navigate('/discover')}
          aria-label="Search films and moods"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', borderRadius: 999,
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${HP.border}`,
            fontSize: 12, color: HP.textSoft, fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          <span>Search films, moods…</span>
          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: HP.textMuted, marginLeft: 8 }}>⌘K</span>
        </button>
        <button
          type="button"
          onClick={onAvatarClick}
          aria-label="Open account"
          style={{
            width: 32, height: 32, borderRadius: 999, background: HP_GRAD,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'Outfit',
            border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          {user.name.charAt(0)}
        </button>
      </div>
    </div>
  );
}

export function SmartImg({ filmKey, alt, style, big = false }) {
  const [failed, setFailed] = useState(false);
  const f = FILMS[filmKey];
  if (failed) {
    const [a, b] = gradFor(filmKey);
    return (
      <div style={{ ...style, display:'flex', alignItems:'flex-end', padding: big?28:14, background:`linear-gradient(135deg, ${a} 0%, ${b} 100%)`, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.16), transparent 50%), radial-gradient(circle at 80% 90%, rgba(0,0,0,0.4), transparent 60%)' }} />
        <div style={{ position:'relative', zIndex:2 }}>
          <div style={{ fontFamily:'Outfit', fontWeight:700, fontSize: big?42:18, lineHeight:1, letterSpacing:'-0.02em', color:'#fff', textShadow:'0 2px 12px rgba(0,0,0,0.3)' }}>{f.title}</div>
          <div style={{ fontSize: big?13:10, color:'rgba(255,255,255,0.75)', marginTop: big?8:4, fontFamily:'Outfit', letterSpacing:'0.04em' }}>{f.year}</div>
        </div>
      </div>
    );
  }
  return <img src={POSTER(filmKey)} alt={alt || f.title} style={style} onError={() => setFailed(true)} loading="lazy" />;
}

export function Stars({ value, size = 12 }) {
  return (
    <div style={{ display:'inline-flex', gap: 2 }}>
      {[0,1,2,3,4].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i<value?HP.amber:'transparent'} stroke={i<value?HP.amber:HP.textFaint} strokeWidth="2">
          <path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>
        </svg>
      ))}
    </div>
  );
}

export function MoodBG({ tint = 'purple', intensity = 0.5 }) {
  const tints = {
    purple:['#3b1d6e','#1a0d3a'], pink:['#6e1d4d','#3a0d1f'],
    amber:['#6e4d1d','#3a2d0d'],  indigo:['#1d2c6e','#0d1a3a'],
  };
  const [c1, c2] = tints[tint] || tints.purple;
  const a1 = Math.round(intensity * 95).toString(16).padStart(2,'0');
  const a2 = Math.round(intensity * 75).toString(16).padStart(2,'0');
  return (
    <>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:`radial-gradient(ellipse 90% 50% at 20% 0%, ${c1}${a1} 0%, transparent 60%)`, transition:'background 0.6s ease' }} />
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:`radial-gradient(ellipse 70% 40% at 90% 100%, ${c2}${a2} 0%, transparent 55%)`, transition:'background 0.6s ease' }} />
    </>
  );
}
