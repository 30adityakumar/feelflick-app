// src/features/watchlist-v2/WatchlistV2.jsx
// FeelFlick — Watchlist v2 ("The Queue"). Mount at /watchlist-v2.
// PR 1: drop the internal nav (AppShell already provides the global TopNav),
//        wire every card/button to a real action (navigate, remove).
// PR 2: ITEMS + USER now derived live from user_watchlist × movies + the
//        user's taste_fingerprint — see ./useWatchlistData.jsx.

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HP, HP_GRAD } from './data'
import { WatchlistDataProvider, useWatchlistData } from './useWatchlistData'
import './watchlist-v2.css'

// === Reset-button style for elements wrapped as buttons ===
const RESET_BTN = {
  background:'none', border:'none', padding:0, margin:0, font:'inherit',
  color:'inherit', textAlign:'left', cursor:'pointer', display:'block', width:'100%',
};

// ── Masthead ───────────────────────────────────────────────────
function Masthead() {
  const { stats } = useWatchlistData();
  return (
    <section style={{ padding:'72px 88px 36px', position:'relative' }}>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 60% 35% at 10% 0%, rgba(167,139,250,0.14), transparent 60%)' }} />
      <div style={{ position:'relative' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.32em', textTransform:'uppercase', color:HP.purple }}>Watchlist</div>
          <div style={{ height:1, width:38, background:HP.purple, opacity:0.5 }} />
          <div style={{ fontSize:10, fontWeight:500, letterSpacing:'0.18em', textTransform:'uppercase', color:HP.textMuted, fontFamily:'Outfit' }}>
            {stats.watchlistTotal} film{stats.watchlistTotal === 1 ? '' : 's'} saved · curated for tonight
          </div>
        </div>
        <h1 style={{ fontFamily:'Outfit', fontSize:88, lineHeight:0.92, fontWeight:300, letterSpacing:'-0.05em', color:HP.text, margin:0, textWrap:'balance' }}>
          The <em style={{ fontStyle:'italic', fontWeight:400, color:HP.textSoft }}>queue.</em>
        </h1>
        <p style={{ marginTop:18, fontFamily:'Outfit, Inter, sans-serif', fontSize:17, color:HP.textSoft, fontStyle:'italic', maxWidth:720, lineHeight:1.55 }}>
          Re-sorted every evening by mood, match, and how long they&rsquo;ve been waiting.
        </p>
      </div>
    </section>
  );
}

// ── Pulse strip (3 stats) ──────────────────────────────────────
function PulseStrip() {
  const { stats } = useWatchlistData();
  const items = [
    { label:'Perfect for tonight', value: stats.perfectForTonightCount, hex: HP.purple,    hint:'matches your current mood window' },
    { label:'Getting stale',       value: stats.gettingStaleCount,       hex: HP.amber,     hint:'saved over 60 days ago' },
    { label:'Total queue',         value: stats.watchlistTotal,          hex: HP.textSoft,  hint:'films across all moods' },
  ];
  return (
    <section style={{ padding:'24px 88px 40px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
        {items.map(s => (
          <div key={s.label} style={{ padding:'20px 22px', borderRadius:6, background:'rgba(255,255,255,0.025)', border:`1px solid ${HP.border}`, display:'grid', gridTemplateColumns:'auto 1fr', gap:18, alignItems:'center' }}>
            <span style={{ fontFamily:'Outfit', fontSize:44, fontWeight:200, color:s.hex, letterSpacing:'-0.045em', lineHeight:1 }}>{s.value}</span>
            <div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:HP.textMuted, fontFamily:'Outfit' }}>{s.label}</div>
              <div style={{ marginTop:4, fontSize:12, color:HP.textSoft, fontFamily:'Outfit', fontStyle:'italic' }}>{s.hint}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Filter / sort bar ──────────────────────────────────────────
function FilterBar({ filter, setFilter, sort, setSort, view, setView }) {
  const filters = [
    { v:'all',     l:'All' },
    { v:'perfect', l:'Perfect tonight' },
    { v:'tender',  l:'Tender' },
    { v:'tense',   l:'Tense' },
    { v:'slow',    l:'Slow-burn' },
    { v:'stale',   l:'Getting stale' },
  ];
  return (
    <section style={{ padding:'12px 88px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:24, flexWrap:'wrap' }}>
      <div role="radiogroup" aria-label="Filter" style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {filters.map(f => {
          const on = filter === f.v;
          return (
            <button
              key={f.v}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setFilter(f.v)}
              style={{
                padding:'8px 14px', borderRadius:999,
                background: on ? `${HP.purple}22` : 'rgba(255,255,255,0.04)',
                border:`1px solid ${on ? HP.purple+'66' : HP.border}`,
                color: on ? HP.text : HP.textSoft,
                fontFamily:'Outfit', fontSize:12, fontWeight:500, letterSpacing:'-0.005em', cursor:'pointer', transition:'all 0.2s ease',
              }}
            >{f.l}</button>
          );
        })}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        <label style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'7px 12px', borderRadius:999, background:'rgba(255,255,255,0.04)', border:`1px solid ${HP.border}` }}>
          <span style={{ fontSize:10, color:HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.12em', textTransform:'uppercase' }}>Sort</span>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            aria-label="Sort queue"
            style={{ background:'transparent', border:'none', color:HP.text, fontFamily:'Outfit', fontSize:12, fontWeight:600, cursor:'pointer', outline:'none' }}
          >
            <option value="match">Match %</option>
            <option value="added">Recently added</option>
            <option value="stale">Longest waiting</option>
            <option value="runtime">Runtime</option>
          </select>
        </label>
        <div role="radiogroup" aria-label="View" style={{ display:'inline-flex', padding:3, borderRadius:999, background:'rgba(255,255,255,0.04)', border:`1px solid ${HP.border}` }}>
          {['grid','list'].map(v => {
            const on = view === v;
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setView(v)}
                style={{ padding:'6px 12px', borderRadius:999, background: on ? HP_GRAD : 'transparent', color: on ? '#fff' : HP.textMuted, border:'none', cursor:'pointer', fontFamily:'Outfit', fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}
              >{v}</button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Tonight tier — featured cards ──────────────────────────────
function TonightTier({ picks }) {
  if (!picks.length) return null;
  return (
    <section style={{ padding:'8px 88px 48px' }}>
      <div style={{ marginBottom:24, display:'flex', alignItems:'baseline', gap:14 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:HP.purple, display:'inline-flex', alignItems:'center', gap:10 }}>
          <span style={{ height:1, width:22, background:HP.purple, opacity:0.6 }} />Perfect for tonight
        </div>
        <span style={{ fontSize:12, color:HP.textMuted, fontFamily:'Outfit', fontStyle:'italic' }}>matched to your current mood window</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(picks.length, 3)},1fr)`, gap:24 }}>
        {picks.slice(0, 3).map((f, i) => <FeaturedCard key={f.id} f={f} idx={i} />)}
      </div>
    </section>
  );
}
function FeaturedCard({ f, idx }) {
  const navigate = useNavigate();
  const { removeFromWatchlist } = useWatchlistData();
  const goToFilm = () => f.tmdbId && navigate(`/movie/${f.tmdbId}`);
  return (
    <article style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:20 }}>
      <button
        type="button"
        onClick={goToFilm}
        aria-label={`Open ${f.title}`}
        style={{ ...RESET_BTN, position:'relative', width:140, flex:'none' }}
      >
        {f.poster ? (
          <img src={f.poster} alt={f.title} style={{ width:'100%', aspectRatio:'2/3', objectFit:'cover', borderRadius:6, boxShadow:`0 16px 36px -12px rgba(0,0,0,0.6), 0 0 32px ${f.hex}22` }} />
        ) : (
          <div style={{ width:'100%', aspectRatio:'2/3', borderRadius:6, background:`linear-gradient(155deg, ${f.hex}55, ${f.hex}11)`, display:'flex', alignItems:'center', justifyContent:'center', color:HP.text, fontFamily:'Outfit', fontSize:18, padding:14, textAlign:'center' }}>{f.title}</div>
        )}
        <div style={{ position:'absolute', top:10, left:10, padding:'4px 8px', borderRadius:3, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)', border:`1px solid ${HP.purple}55`, fontSize:9, fontWeight:700, color:HP.purple, fontFamily:'Outfit', letterSpacing:'0.08em' }}>{f.match}%</div>
      </button>
      <div style={{ display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:HP.purple, marginBottom:8 }}>0{idx+1} · {f.mood}</div>
          <button
            type="button"
            onClick={goToFilm}
            aria-label={`Open ${f.title}`}
            style={{ ...RESET_BTN, width:'auto' }}
          >
            <h3 style={{ fontFamily:'Outfit', fontSize:24, fontWeight:500, color:HP.text, letterSpacing:'-0.02em', margin:'0 0 6px 0' }}>{f.title}</h3>
          </button>
          <div style={{ fontSize:11, color:HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.04em', marginBottom:14 }}>
            {f.year}{f.runtime ? ` · ${f.runtime}m` : ''}{f.dir && f.dir !== '—' ? ` · ${f.dir}` : ''}
          </div>
          {f.why && (
            <p style={{ margin:0, fontSize:12.5, lineHeight:1.55, color:HP.textSoft, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic', textWrap:'pretty' }}>&ldquo;{f.why}&rdquo;</p>
          )}
        </div>
        <div style={{ display:'flex', gap:8, marginTop:14 }}>
          <button
            type="button"
            onClick={goToFilm}
            style={{ padding:'8px 14px', borderRadius:6, background:HP_GRAD, border:'none', color:'#fff', fontFamily:'Outfit', fontSize:11, fontWeight:600, letterSpacing:'0.04em', cursor:'pointer' }}
          >Open →</button>
          <button
            type="button"
            onClick={() => removeFromWatchlist(f.id)}
            style={{ padding:'8px 14px', borderRadius:6, background:'rgba(255,255,255,0.05)', border:`1px solid ${HP.border}`, color:HP.textMuted, fontFamily:'Outfit', fontSize:11, fontWeight:600, letterSpacing:'0.04em', cursor:'pointer' }}
          >Remove</button>
        </div>
      </div>
    </article>
  );
}

// ── Grid view ──────────────────────────────────────────────────
function Grid({ items }) {
  const navigate = useNavigate();
  if (items.length === 0) return <EmptyState />;
  return (
    <section style={{ padding:'0 88px 56px' }}>
      <div style={{ marginBottom:20, fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:HP.purple, display:'inline-flex', alignItems:'center', gap:10 }}>
        <span style={{ height:1, width:22, background:HP.purple, opacity:0.6 }} />The full queue
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:22 }}>
        {items.map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => f.tmdbId && navigate(`/movie/${f.tmdbId}`)}
            aria-label={`Open ${f.title}`}
            style={{ ...RESET_BTN, cursor:'pointer' }}
          >
            <div style={{ position:'relative', borderRadius:6, overflow:'hidden', marginBottom:12, boxShadow:'0 10px 24px -10px rgba(0,0,0,0.6)' }}>
              {f.poster ? (
                <img src={f.poster} alt={f.title} style={{ width:'100%', aspectRatio:'2/3', objectFit:'cover', display:'block' }} />
              ) : (
                <div style={{ width:'100%', aspectRatio:'2/3', background:`linear-gradient(155deg, ${f.hex}55, ${f.hex}11)`, display:'flex', alignItems:'center', justifyContent:'center', color:HP.text, fontFamily:'Outfit', fontSize:14, padding:12, textAlign:'center' }}>{f.title}</div>
              )}
              <div style={{ position:'absolute', top:8, left:8, padding:'3px 7px', borderRadius:3, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)', border:`1px solid ${f.hex}55`, fontSize:9, fontWeight:700, color:f.hex, fontFamily:'Outfit', letterSpacing:'0.06em' }}>{f.match}%</div>
              {f.stale && <div style={{ position:'absolute', top:8, right:8, padding:'3px 7px', borderRadius:3, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)', border:`1px solid ${HP.amber}55`, fontSize:9, fontWeight:700, color:HP.amber, fontFamily:'Outfit', letterSpacing:'0.06em' }}>{f.addedDaysAgo}d</div>}
              {f.perfect && <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'8px 10px', background:`linear-gradient(180deg, transparent, rgba(0,0,0,0.85))`, fontSize:9, fontWeight:700, color:HP.purple, fontFamily:'Outfit', letterSpacing:'0.1em', textTransform:'uppercase' }}>● Tonight</div>}
            </div>
            <div style={{ fontFamily:'Outfit', fontSize:14, fontWeight:500, color:HP.text, letterSpacing:'-0.01em', marginBottom:3 }}>{f.title}</div>
            <div style={{ fontSize:11, color:HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.04em' }}>{f.year || '—'} · {f.mood}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

// ── List view ──────────────────────────────────────────────────
function List({ items }) {
  const navigate = useNavigate();
  const { removeFromWatchlist } = useWatchlistData();
  if (items.length === 0) return <EmptyState />;
  return (
    <section style={{ padding:'0 88px 56px' }}>
      <div style={{ marginBottom:20, fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:HP.purple, display:'inline-flex', alignItems:'center', gap:10 }}>
        <span style={{ height:1, width:22, background:HP.purple, opacity:0.6 }} />The full queue
      </div>
      <div style={{ borderTop:`1px solid ${HP.border}` }}>
        {items.map(f => (
          <div key={f.id} style={{ display:'grid', gridTemplateColumns:'48px 1fr auto auto auto auto', gap:24, alignItems:'center', padding:'18px 0', borderBottom:`1px solid ${HP.border}` }}>
            <button
              type="button"
              onClick={() => f.tmdbId && navigate(`/movie/${f.tmdbId}`)}
              aria-label={`Open ${f.title}`}
              style={{ ...RESET_BTN, width:48, height:72 }}
            >
              {f.poster
                ? <img src={f.poster} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:4 }} />
                : <div style={{ width:'100%', height:'100%', borderRadius:4, background:`linear-gradient(155deg, ${f.hex}55, ${f.hex}11)` }} />
              }
            </button>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <button
                  type="button"
                  onClick={() => f.tmdbId && navigate(`/movie/${f.tmdbId}`)}
                  style={{ ...RESET_BTN, width:'auto', fontFamily:'Outfit', fontSize:17, fontWeight:500, color:HP.text, letterSpacing:'-0.015em', cursor:'pointer' }}
                >{f.title}</button>
                {f.perfect && <span style={{ padding:'2px 7px', borderRadius:3, background:'rgba(167,139,250,0.16)', border:`1px solid ${HP.purple}44`, fontSize:8, fontWeight:700, color:HP.purple, fontFamily:'Outfit', letterSpacing:'0.12em', textTransform:'uppercase' }}>Tonight</span>}
                {f.stale && <span style={{ padding:'2px 7px', borderRadius:3, background:'rgba(245,158,11,0.12)', border:`1px solid ${HP.amber}44`, fontSize:8, fontWeight:700, color:HP.amber, fontFamily:'Outfit', letterSpacing:'0.12em', textTransform:'uppercase' }}>Stale</span>}
              </div>
              <div style={{ fontSize:11, color:HP.textMuted, fontFamily:'Outfit', marginTop:3, letterSpacing:'0.04em' }}>
                {f.year || '—'}{f.runtime ? ` · ${f.runtime}m` : ''}{f.dir && f.dir !== '—' ? ` · ${f.dir}` : ''} · added {f.addedDaysAgo}d ago
              </div>
            </div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:999, background:`${f.hex}1a`, border:`1px solid ${f.hex}44`, fontFamily:'Outfit', fontSize:11, fontWeight:500, color:f.hex }}>
              <span style={{ width:6, height:6, borderRadius:999, background:f.hex }} />{f.mood}
            </div>
            <div style={{ fontFamily:'Outfit', fontSize:18, fontWeight:300, color:HP.text, letterSpacing:'-0.03em' }}>{f.match}<span style={{ fontSize:10, color:HP.textMuted, marginLeft:1 }}>%</span></div>
            <button
              type="button"
              onClick={() => f.tmdbId && navigate(`/movie/${f.tmdbId}`)}
              style={{ padding:'7px 12px', borderRadius:6, background:'rgba(255,255,255,0.06)', border:`1px solid ${HP.border}`, color:HP.textSoft, fontFamily:'Outfit', fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer' }}
            >Open</button>
            <button
              type="button"
              onClick={() => removeFromWatchlist(f.id)}
              aria-label={`Remove ${f.title} from watchlist`}
              title="Remove"
              style={{ padding:'7px 10px', borderRadius:6, background:'transparent', border:'none', color:HP.textFaint, cursor:'pointer' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Empty state ────────────────────────────────────────────────
function EmptyState() {
  const navigate = useNavigate();
  return (
    <section style={{ padding:'72px 88px 96px', textAlign:'center' }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:HP.purple, marginBottom:18 }}>The queue is empty</div>
      <h2 style={{ fontFamily:'Outfit', fontSize:36, lineHeight:1, fontWeight:500, letterSpacing:'-0.03em', color:HP.text, margin:'0 0 14px 0' }}>Save a film to start.</h2>
      <p style={{ margin:'0 auto 28px', maxWidth:480, fontSize:14, color:HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', lineHeight:1.6 }}>
        Tap Save on any film detail page and it lands here, re-sorted by mood + match every evening.
      </p>
      <button
        type="button"
        onClick={() => navigate('/home')}
        style={{ padding:'12px 22px', borderRadius:999, background:HP_GRAD, border:'none', color:'#fff', fontFamily:'Outfit', fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 12px 28px -8px rgba(236,72,153,0.5)' }}
      >Browse tonight&rsquo;s picks →</button>
    </section>
  );
}

// ── Cleanup nudge ──────────────────────────────────────────────
function CleanupNudge({ count, onReview }) {
  if (count === 0) return null;
  return (
    <section style={{ padding:'48px 88px', borderTop:`1px solid ${HP.border}`, background:`linear-gradient(135deg, ${HP.amber}0a, transparent)` }}>
      <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:32, alignItems:'center' }}>
        <div style={{ width:48, height:48, borderRadius:999, background:`${HP.amber}1a`, border:`1px solid ${HP.amber}44`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={HP.amber} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
        </div>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:HP.amber, marginBottom:6 }}>Queue hygiene</div>
          <div style={{ fontFamily:'Outfit', fontSize:22, fontWeight:500, color:HP.text, letterSpacing:'-0.02em' }}>{count} film{count === 1 ? '' : 's'} {count === 1 ? 'has' : 'have'} been waiting over 60 days.</div>
          <div style={{ marginTop:6, fontSize:13, color:HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic' }}>Be honest. Cut what you won&rsquo;t watch &mdash; it sharpens tomorrow&rsquo;s picks.</div>
        </div>
        <button
          type="button"
          onClick={onReview}
          style={{ padding:'12px 22px', borderRadius:6, background:'rgba(255,255,255,0.06)', border:`1px solid ${HP.borderStrong}`, color:HP.text, fontFamily:'Outfit', fontSize:13, fontWeight:600, cursor:'pointer' }}
        >Review stale picks →</button>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────
function Foot() {
  const navigate = useNavigate();
  const linkStyle = { fontSize:12, color:HP.textMuted, letterSpacing:'0.04em', textDecoration:'none', cursor:'pointer' };
  const disabledStyle = { ...linkStyle, color:HP.textFaint, cursor:'not-allowed', background:'none', border:'none', padding:0, font:'inherit' };
  return (
    <footer style={{ padding:'40px 88px 64px', borderTop:`1px solid ${HP.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:'Outfit', flexWrap:'wrap', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:28, height:28, borderRadius:6, background:HP_GRAD, display:'inline-flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:'#fff' }}>FF</div>
        <span style={{ fontSize:13, color:HP.textMuted }}>FeelFlick · The Queue</span>
      </div>
      <div style={{ display:'flex', gap:24, alignItems:'center' }}>
        <button type="button" disabled aria-disabled="true" title="Export coming soon" style={disabledStyle}>Export queue</button>
        <button type="button" disabled aria-disabled="true" title="Bulk-clear coming soon" style={disabledStyle}>Clear all stale</button>
        <button type="button" onClick={() => navigate('/home')} style={{ ...linkStyle, background:'none', border:'none', padding:0, font:'inherit' }}>Back to Briefing</button>
      </div>
    </footer>
  );
}

// ── Page (loading/error/empty shell) ───────────────────────────
function WatchlistShell() {
  const { items, stats, loading, error } = useWatchlistData();
  const [filter, setFilter] = useState('all');
  const [sort, setSort]     = useState('match');
  const [view, setView]     = useState('grid');

  const filtered = useMemo(() => {
    let arr = items.slice();
    if (filter === 'perfect') arr = arr.filter(f => f.perfect);
    else if (filter === 'tender') arr = arr.filter(f => f.mood === 'Tender');
    else if (filter === 'tense')  arr = arr.filter(f => f.mood === 'Tense');
    else if (filter === 'slow')   arr = arr.filter(f => f.mood === 'Slow-burn');
    else if (filter === 'stale')  arr = arr.filter(f => f.stale);
    if (sort === 'match')   arr.sort((a,b) => b.match - a.match);
    if (sort === 'added')   arr.sort((a,b) => a.addedDaysAgo - b.addedDaysAgo);
    if (sort === 'stale')   arr.sort((a,b) => b.addedDaysAgo - a.addedDaysAgo);
    if (sort === 'runtime') arr.sort((a,b) => a.runtime - b.runtime);
    return arr;
  }, [items, filter, sort]);

  const tonightPicks = useMemo(() => items.filter(f => f.perfect), [items]);

  if (loading) return <PageSkeleton />;
  if (error) return <PageError error={error} />;

  return (
    <>
      <Masthead />
      <PulseStrip />
      <FilterBar filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} view={view} setView={setView} />
      {filter === 'all' && <TonightTier picks={tonightPicks} />}
      {view === 'grid' ? <Grid items={filtered} /> : <List items={filtered} />}
      <CleanupNudge count={stats.gettingStaleCount} onReview={() => setFilter('stale')} />
      <Foot />
    </>
  );
}

function PageSkeleton() {
  const pulse = { background:'rgba(255,255,255,0.04)' };
  return (
    <div style={{ padding:'80px 88px' }}>
      <div className="animate-pulse" style={{ ...pulse, height:14, width:280, borderRadius:999, marginBottom:30 }} />
      <div className="animate-pulse" style={{ background:'rgba(167,139,250,0.10)', height:80, width:'40%', borderRadius:8, marginBottom:48 }} />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
        {[0,1,2].map(i => <div key={i} className="animate-pulse" style={{ ...pulse, height:80, borderRadius:6 }} />)}
      </div>
    </div>
  );
}

function PageError({ error }) {
  return (
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ textAlign:'center', maxWidth:520 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: HP.purple, marginBottom:18 }}>Queue · error</div>
        <h1 style={{ fontFamily:'Outfit, Inter, sans-serif', fontSize:36, fontWeight:500, color:HP.text, margin:'0 0 18px 0', letterSpacing:'-0.025em' }}>Couldn&rsquo;t load your queue.</h1>
        <p style={{ margin:0, color:'rgba(250,250,250,0.6)', fontSize:14, lineHeight:1.6 }}>{error}</p>
      </div>
    </div>
  );
}

export default function WatchlistV2() {
  return (
    <WatchlistDataProvider>
      <div className="ff-watchlist-v2" style={{ minHeight:'100vh', background:HP.bgDeep, color:HP.text, fontFamily:'Inter, sans-serif' }}>
        <div style={{ maxWidth:1440, margin:'0 auto' }}>
          <WatchlistShell />
        </div>
      </div>
    </WatchlistDataProvider>
  );
}
