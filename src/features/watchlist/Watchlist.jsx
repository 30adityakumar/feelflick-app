// src/features/watchlist/Watchlist.jsx
// FeelFlick — Watchlist v2 ("The Queue"). Mount at /watchlist-v2.
// PR 1: drop the internal nav (AppShell already provides the global TopNav),
//        wire every card/button to a real action (navigate, remove).
// PR 2: ITEMS + USER now derived live from user_watchlist × movies + the
//        user's taste_fingerprint — see ./useWatchlistData.jsx.

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import MoodPill from '@/shared/components/MoodPill'
import Eyebrow from '@/shared/ui/Eyebrow'
import { HP, HP_GRAD } from './data'
import { WatchlistDataProvider, useWatchlistData } from './useWatchlistData'
import './watchlist.css'

// === Reset-button style for elements wrapped as buttons ===
const RESET_BTN = {
  background:'none', border:'none', padding:0, margin:0, font:'inherit',
  color:'inherit', textAlign:'left', cursor:'pointer', display:'block', width:'100%',
};

// ── Masthead ───────────────────────────────────────────────────
function Masthead() {
  const { stats } = useWatchlistData();
  return (
    <section className="ff-wl-section ff-wl-section--masthead" style={{ padding:'72px 88px 36px', position:'relative' }}>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 60% 35% at 10% 0%, rgba(167,139,250,0.14), transparent 60%)' }} />
      <div style={{ position:'relative' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24, flexWrap:'wrap' }}>
          <Eyebrow spacing="0.32em" size={10}>Watchlist</Eyebrow>
          <div style={{ height:1, width:38, background:HP.purple, opacity:0.5 }} />
          <Eyebrow tone="meta" weight={500} size={10}>
            {stats.watchlistTotal} film{stats.watchlistTotal === 1 ? '' : 's'} saved
          </Eyebrow>
        </div>
        <h1 className="ff-wl-hero" style={{ fontFamily:'Outfit', fontSize:88, lineHeight:0.92, fontWeight:300, letterSpacing:'-0.05em', color:HP.text, margin:0, textWrap:'balance' }}>
          The <em style={{ fontStyle:'italic', fontWeight:400, color:HP.textSoft }}>queue.</em>
        </h1>
        <p style={{ marginTop:18, fontFamily:'Outfit, Inter, sans-serif', fontSize:17, color:HP.textSoft, fontStyle:'italic', maxWidth:720, lineHeight:1.55 }}>
          Filter, sort, and clean. Stale ones get flagged so you can decide what to cut.
        </p>
      </div>
    </section>
  );
}

// ── Pulse strip (3 stats) ──────────────────────────────────────
// Cold-start (no fingerprint) → swap "Perfect for tonight" for "Top match %"
// so the first stat is always meaningful. The other two are universal.
function PulseStrip() {
  const { stats, hasFingerprint } = useWatchlistData();
  const tonightStat = hasFingerprint
    ? { label:'Perfect for tonight', value: stats.perfectForTonightCount, hex: HP.purple,   hint:'matches your current mood window' }
    : { label:'Top match',           value: stats.topMatchPct ? `${stats.topMatchPct}%` : '—', hex: HP.purple, hint:'your queue’s highest match' };
  const items = [
    tonightStat,
    { label:'Getting stale',       value: stats.gettingStaleCount,       hex: HP.amber,     hint:'saved over 60 days ago' },
    { label:'Total queue',         value: stats.watchlistTotal,          hex: HP.textSoft,  hint:'films across all moods' },
  ];
  return (
    <section className="ff-wl-section ff-wl-pulse" style={{ padding:'24px 88px 40px' }}>
      <div className="ff-wl-pulse-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
        {items.map(s => (
          <div key={s.label} style={{ padding:'20px 22px', borderRadius:6, background:'rgba(255,255,255,0.025)', border:`1px solid ${HP.border}`, display:'grid', gridTemplateColumns:'auto 1fr', gap:18, alignItems:'center' }}>
            <span style={{ fontFamily:'Outfit', fontSize:44, fontWeight:200, color:s.hex, letterSpacing:'-0.045em', lineHeight:1 }}>{s.value}</span>
            <div>
              <Eyebrow tone="meta" size={10}>{s.label}</Eyebrow>
              <div style={{ marginTop:4, fontSize:12, color:HP.textSoft, fontFamily:'Outfit', fontStyle:'italic' }}>{s.hint}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Filter / sort bar ──────────────────────────────────────────
// Filter pills are dynamic: "All" + ("Perfect tonight" when fingerprint
// exists) + top-5 actual moods from the user's queue + ("Getting stale"
// when there is at least one stale item). Each pill always points to ≥1
// item so we never render dead controls.
function FilterBar({ filter, setFilter, sort, setSort, view, setView }) {
  const { availableMoods, hasFingerprint, stats } = useWatchlistData();
  const filters = [{ v:'all', l:'All' }];
  if (hasFingerprint && stats.perfectForTonightCount > 0) {
    filters.push({ v:'perfect', l:'Perfect tonight' });
  }
  for (const m of availableMoods.slice(0, 5)) {
    filters.push({ v:`mood:${m.mood}`, l:m.mood });
  }
  if (stats.gettingStaleCount > 0) {
    filters.push({ v:'stale', l:'Getting stale' });
  }
  return (
    <section className="ff-wl-section ff-wl-filterbar" style={{ padding:'12px 88px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:24, flexWrap:'wrap' }}>
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
  const { hasFingerprint } = useWatchlistData();
  if (!picks.length) return null;
  const kicker = hasFingerprint ? 'Perfect for tonight' : 'Top of your queue';
  const sub = hasFingerprint
    ? 'matched to your current mood window'
    : 'ranked by match score — your taste profile builds as you rate';
  return (
    <section className="ff-wl-section ff-wl-tonight" style={{ padding:'8px 88px 48px' }}>
      <div style={{ marginBottom:24, display:'flex', alignItems:'baseline', gap:14, flexWrap:'wrap' }}>
        <Eyebrow rule size={10}>{kicker}</Eyebrow>
        <span style={{ fontSize:12, color:HP.textMuted, fontFamily:'Outfit', fontStyle:'italic' }}>{sub}</span>
      </div>
      <div className="ff-wl-tonight-grid" style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(picks.length, 3)},1fr)`, gap:24 }}>
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
    <article className="ff-wl-featured" style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:20 }}>
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
    <section className="ff-wl-section ff-wl-grid-section" style={{ padding:'0 88px 56px' }}>
      <Eyebrow rule size={10} style={{ marginBottom:20 }}>The full queue</Eyebrow>
      <div className="ff-wl-grid" style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:22 }}>
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
    <section className="ff-wl-section ff-wl-list-section" style={{ padding:'0 88px 56px' }}>
      <Eyebrow rule size={10} style={{ marginBottom:20 }}>The full queue</Eyebrow>
      <div style={{ borderTop:`1px solid ${HP.border}` }}>
        {items.map(f => (
          <div key={f.id} className="ff-wl-list-row" style={{ display:'grid', gridTemplateColumns:'48px 1fr auto auto auto auto', gap:24, alignItems:'center', padding:'18px 0', borderBottom:`1px solid ${HP.border}` }}>
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
            <MoodPill label={f.mood} color={f.hex} dot />
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
    <section className="ff-wl-section" style={{ padding:'72px 88px 96px', textAlign:'center' }}>
      <Eyebrow size={10} style={{ marginBottom:18 }}>The queue is empty</Eyebrow>
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
// Action lives here (not in the footer): the user is being asked to act on
// stale items in the same breath that we surface the count.
function CleanupNudge({ count, onReview }) {
  const { removeStale } = useWatchlistData();
  const [busy, setBusy] = useState(false);
  if (count === 0) return null;
  async function clearStale() {
    if (busy) return;
    if (typeof window !== 'undefined' && !window.confirm(`Remove ${count} stale film${count === 1 ? '' : 's'} from your watchlist?`)) return;
    setBusy(true);
    try { await removeStale(); }
    finally { setBusy(false); }
  }
  return (
    <section className="ff-wl-section ff-wl-cleanup" style={{ padding:'48px 88px', borderTop:`1px solid ${HP.border}`, background:`linear-gradient(135deg, ${HP.amber}0a, transparent)` }}>
      <div className="ff-wl-cleanup-grid" style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:32, alignItems:'center' }}>
        <div style={{ width:48, height:48, borderRadius:999, background:`${HP.amber}1a`, border:`1px solid ${HP.amber}44`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={HP.amber} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
        </div>
        <div>
          <Eyebrow color={HP.amber} spacing="0.22em" size={10} style={{ marginBottom:6 }}>Queue hygiene</Eyebrow>
          <div style={{ fontFamily:'Outfit', fontSize:22, fontWeight:500, color:HP.text, letterSpacing:'-0.02em' }}>{count} film{count === 1 ? '' : 's'} {count === 1 ? 'has' : 'have'} been waiting over 60 days.</div>
          <div style={{ marginTop:6, fontSize:13, color:HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic' }}>Be honest. Cut what you won&rsquo;t watch &mdash; it sharpens tomorrow&rsquo;s picks.</div>
        </div>
        <div className="ff-wl-cleanup-actions" style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'flex-end' }}>
          <button
            type="button"
            onClick={onReview}
            style={{ padding:'12px 22px', borderRadius:6, background:'rgba(255,255,255,0.06)', border:`1px solid ${HP.borderStrong}`, color:HP.text, fontFamily:'Outfit', fontSize:13, fontWeight:600, cursor:'pointer' }}
          >Review stale picks →</button>
          <button
            type="button"
            onClick={clearStale}
            disabled={busy}
            title={`Remove ${count} stale film${count === 1 ? '' : 's'} from your watchlist`}
            style={{ padding:'12px 22px', borderRadius:6, background:'transparent', border:`1px solid ${HP.amber}66`, color:HP.amber, fontFamily:'Outfit', fontSize:13, fontWeight:600, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1 }}
          >{busy ? 'Clearing…' : 'Clear all'}</button>
        </div>
      </div>
    </section>
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
    if (filter === 'perfect') {
      arr = arr.filter(f => f.perfect);
    } else if (filter === 'stale') {
      arr = arr.filter(f => f.stale);
    } else if (filter.startsWith('mood:')) {
      const mood = filter.slice('mood:'.length);
      arr = arr.filter(f => f.mood === mood);
    }
    if (sort === 'match')   arr.sort((a,b) => b.match - a.match);
    if (sort === 'added')   arr.sort((a,b) => a.addedDaysAgo - b.addedDaysAgo);
    if (sort === 'stale')   arr.sort((a,b) => b.addedDaysAgo - a.addedDaysAgo);
    if (sort === 'runtime') arr.sort((a,b) => a.runtime - b.runtime);
    return arr;
  }, [items, filter, sort]);

  // TonightTier picks: with fingerprint use real "perfect" matches; cold-start
  // falls back to top 3 by match% so the tier always says something honest.
  const { hasFingerprint } = useWatchlistData();
  const tonightPicks = useMemo(() => {
    if (hasFingerprint) return items.filter(f => f.perfect);
    return [...items].sort((a, b) => b.match - a.match).slice(0, 3);
  }, [items, hasFingerprint]);

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
        <Eyebrow size={10} style={{ marginBottom:18 }}>Queue · error</Eyebrow>
        <h1 style={{ fontFamily:'Outfit, Inter, sans-serif', fontSize:36, fontWeight:500, color:HP.text, margin:'0 0 18px 0', letterSpacing:'-0.025em' }}>Couldn&rsquo;t load your queue.</h1>
        <p style={{ margin:0, color:'rgba(250,250,250,0.6)', fontSize:14, lineHeight:1.6 }}>{error}</p>
      </div>
    </div>
  );
}

export default function Watchlist() {
  usePageMeta({ title: 'Watchlist — FeelFlick' })
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
