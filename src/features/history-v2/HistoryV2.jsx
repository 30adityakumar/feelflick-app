// src/features/history-v2/HistoryV2.jsx
// FeelFlick — Diary v2. Mount at /history-v2.
// All sections (heatmap, timeline, mood share, stats, entries) are derived
// live from user_history × movies × user_ratings — see ./useHistoryData.jsx.

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HP, HP_GRAD } from './data'
import { HistoryDataProvider, useHistoryData } from './useHistoryData'
import './history-v2.css'

// === Reset-button style for elements wrapped as buttons ===
const RESET_BTN = {
  background:'none', border:'none', padding:0, margin:0, font:'inherit',
  color:'inherit', textAlign:'left', cursor:'pointer', display:'block',
};

// ── Masthead ───────────────────────────────────────────────────
function Masthead() {
  const { stats } = useHistoryData();
  return (
    <section style={{ padding:'72px 88px 36px', position:'relative' }}>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 60% 35% at 10% 0%, rgba(236,72,153,0.10), transparent 60%)' }} />
      <div style={{ position:'relative' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.32em', textTransform:'uppercase', color:HP.purple }}>Diary</div>
          <div style={{ height:1, width:38, background:HP.purple, opacity:0.5 }} />
          <div style={{ fontSize:10, fontWeight:500, letterSpacing:'0.18em', textTransform:'uppercase', color:HP.textMuted, fontFamily:'Outfit' }}>
            {stats.totalLogged} film{stats.totalLogged === 1 ? '' : 's'} · {stats.totalHours} hours · {stats.streakDays}-day streak
          </div>
        </div>
        <h1 style={{ fontFamily:'Outfit', fontSize:88, lineHeight:0.92, fontWeight:300, letterSpacing:'-0.05em', color:HP.text, margin:0, textWrap:'balance' }}>
          The <em style={{ fontStyle:'italic', fontWeight:400, color:HP.textSoft }}>diary.</em>
        </h1>
        <p style={{ marginTop:18, fontFamily:'Outfit, Inter, sans-serif', fontSize:17, color:HP.textSoft, fontStyle:'italic', maxWidth:680, lineHeight:1.55 }}>
          Everything you&rsquo;ve watched, what it felt like, and when. Read backward to find a pattern.
        </p>
      </div>
    </section>
  );
}

function PulseStrip() {
  const { stats } = useHistoryData();
  const items = [
    { label:'Logged',        value: stats.totalLogged,         hint:'films across your diary' },
    { label:'Hours watched', value: `${stats.totalHours}h`,     hint:'total runtime logged' },
    { label:'Avg rating',    value: stats.avgRating ? stats.avgRating.toFixed(1) : '—', hint:'on a 5-star scale' },
    { label:'Streak',        value: `${stats.streakDays}d`,     hint:'consecutive days with a log' },
  ];
  return (
    <section style={{ padding:'24px 88px 40px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
        {items.map(s => (
          <div key={s.label} style={{ padding:'20px 22px', borderRadius:6, background:'rgba(255,255,255,0.025)', border:`1px solid ${HP.border}` }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:HP.textMuted, fontFamily:'Outfit', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontFamily:'Outfit', fontSize:44, fontWeight:200, color:HP.text, letterSpacing:'-0.045em', lineHeight:1 }}>{s.value}</div>
            <div style={{ marginTop:6, fontSize:11, color:HP.textSoft, fontFamily:'Outfit', fontStyle:'italic' }}>{s.hint}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Heatmap() {
  const { heatmap, stats } = useHistoryData();
  const tint = (v) => {
    if (v === 0) return 'rgba(255,255,255,0.04)';
    if (v === 1) return 'rgba(167,139,250,0.32)';
    if (v === 2) return 'rgba(167,139,250,0.62)';
    return 'rgba(236,72,153,0.85)';
  };
  // Hide the heatmap section entirely when there's no history yet.
  if (stats.totalLogged === 0) return null;
  return (
    <section style={{ padding:'40px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:HP.purple, marginBottom:10, display:'inline-flex', alignItems:'center', gap:10 }}>
            <span style={{ height:1, width:22, background:HP.purple, opacity:0.6 }} />Streak heatmap
          </div>
          <h2 style={{ fontFamily:'Outfit', fontSize:32, lineHeight:1.05, fontWeight:500, letterSpacing:'-0.03em', color:HP.text, margin:0 }}>The <em style={{ fontStyle:'italic', fontWeight:400, color:HP.textSoft }}>last twelve weeks.</em></h2>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:10, color:HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.08em', textTransform:'uppercase' }}>
          <span>Less</span>
          {[0,1,2,3].map(v => <span key={v} style={{ width:14, height:14, borderRadius:3, background:tint(v), border:`1px solid ${HP.border}` }} />)}
          <span>More</span>
        </div>
      </div>
      <div style={{ display:'flex', gap:4, padding:18, borderRadius:6, background:'rgba(255,255,255,0.018)', border:`1px solid ${HP.border}` }}>
        {heatmap.map((col, i) => (
          <div key={i} style={{ display:'flex', flexDirection:'column', gap:4, flex:1 }}>
            {col.map((v, j) => (
              <div key={j} style={{ aspectRatio:1, borderRadius:3, background:tint(v), transition:'background 0.3s ease' }} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function TimelineAndMood() {
  const { timeline, moodShare, stats } = useHistoryData();
  if (stats.totalLogged === 0) return null;
  const max = Math.max(1, ...timeline.map(t => t.n));
  return (
    <section style={{ padding:'48px 88px', borderTop:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.012)', display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:56, alignItems:'flex-start' }}>
      <div>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:HP.purple, marginBottom:12, display:'inline-flex', alignItems:'center', gap:10 }}>
          <span style={{ height:1, width:22, background:HP.purple, opacity:0.6 }} />Twelve months
        </div>
        <h2 style={{ fontFamily:'Outfit', fontSize:30, lineHeight:1, fontWeight:500, letterSpacing:'-0.03em', color:HP.text, margin:'0 0 24px 0' }}>Films per month.</h2>
        <div style={{ display:'flex', alignItems:'flex-end', gap:10, height:140 }}>
          {timeline.map(t => {
            const h = (t.n / max) * 100;
            return (
              <div key={t.key || t.m} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                <div style={{ width:'100%', display:'flex', alignItems:'flex-end', justifyContent:'center', height:110 }}>
                  <div style={{ width:'100%', maxWidth:36, height:`${h}%`, background:`linear-gradient(180deg, ${HP.purple}, ${HP.purple}55)`, borderRadius:'3px 3px 0 0' }} />
                </div>
                <div style={{ fontSize:9, color:HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.1em', textTransform:'uppercase' }}>{t.m}</div>
                <div style={{ fontSize:9, color:HP.textFaint, fontFamily:'Outfit' }}>{t.n}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:HP.purple, marginBottom:12, display:'inline-flex', alignItems:'center', gap:10 }}>
          <span style={{ height:1, width:22, background:HP.purple, opacity:0.6 }} />This year by mood
        </div>
        <h2 style={{ fontFamily:'Outfit', fontSize:30, lineHeight:1, fontWeight:500, letterSpacing:'-0.03em', color:HP.text, margin:'0 0 24px 0' }}>Mood share.</h2>
        {moodShare.length === 0 ? (
          <div style={{ fontSize:13, color:HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic' }}>No mood-tagged watches this year yet.</div>
        ) : (
          <>
            <div style={{ display:'flex', height:32, borderRadius:4, overflow:'hidden', marginBottom:18 }}>
              {moodShare.map(m => (
                <div key={m.name} title={`${m.name} · ${m.pct}%`} style={{ width:`${m.pct}%`, background:m.hex }} />
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 16px' }}>
              {moodShare.map(m => (
                <div key={m.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12, fontFamily:'Outfit' }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                    <span style={{ width:8, height:8, borderRadius:999, background:m.hex }} />
                    <span style={{ color:HP.text }}>{m.name}</span>
                  </span>
                  <span style={{ color:HP.textMuted }}>{m.pct}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function FilterBar({ filter, setFilter, sort, setSort, query, setQuery }) {
  const filters = [
    { v:'all',     l:'All' },
    { v:'5',       l:'Loved (5★)' },
    { v:'fav',     l:'Favorites' },
  ];
  return (
    <section style={{ padding:'40px 88px 20px', borderTop:`1px solid ${HP.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', gap:24, flexWrap:'wrap' }}>
      <div role="radiogroup" aria-label="Filter" style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
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
                fontFamily:'Outfit', fontSize:12, fontWeight:500, cursor:'pointer',
              }}
            >{f.l}</button>
          );
        })}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search the diary…"
          aria-label="Search the diary"
          style={{ padding:'9px 14px', borderRadius:999, background:'rgba(255,255,255,0.04)', border:`1px solid ${HP.border}`, color:HP.text, fontFamily:'Outfit, Inter, sans-serif', fontSize:12, outline:'none', minWidth:240 }}
        />
        <label style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'7px 12px', borderRadius:999, background:'rgba(255,255,255,0.04)', border:`1px solid ${HP.border}` }}>
          <span style={{ fontSize:10, color:HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.12em', textTransform:'uppercase' }}>Sort</span>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            aria-label="Sort diary"
            style={{ background:'transparent', border:'none', color:HP.text, fontFamily:'Outfit', fontSize:12, fontWeight:600, cursor:'pointer', outline:'none' }}
          >
            <option value="recent">Most recent</option>
            <option value="rating">Highest rated</option>
            <option value="runtime">Runtime</option>
          </select>
        </label>
      </div>
    </section>
  );
}

function Stars({ n }) {
  if (!n) return null;
  return (
    <span style={{ display:'inline-flex', gap:2 }} aria-label={`${n} of 5 stars`}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i<=n?HP.amber:'transparent'} stroke={i<=n?HP.amber:HP.textFaint} strokeWidth="1.6"><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>
      ))}
    </span>
  );
}

function DiaryGroup({ month, entries }) {
  const navigate = useNavigate();
  const open = (e) => e.tmdbId && navigate(`/movie/${e.tmdbId}`);
  return (
    <section style={{ padding:'56px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:18 }}>
          <h2 style={{ fontFamily:'Outfit', fontSize:48, fontWeight:300, color:HP.text, letterSpacing:'-0.045em', margin:0 }}>{month.split(' ')[0]}</h2>
          <span style={{ fontFamily:'Outfit', fontSize:20, color:HP.textMuted, letterSpacing:'-0.02em' }}>{month.split(' ')[1]}</span>
        </div>
        <div style={{ fontSize:11, color:HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.08em', textTransform:'uppercase' }}>{entries.length} {entries.length===1?'film':'films'}</div>
      </div>
      <div style={{ borderTop:`1px solid ${HP.border}` }}>
        {entries.map(e => (
          <div key={e.id} style={{ display:'grid', gridTemplateColumns:'56px 64px 1fr auto auto auto', gap:24, alignItems:'flex-start', padding:'24px 0', borderBottom:`1px solid ${HP.border}` }}>
            {/* Day numeral */}
            <div style={{ paddingTop:4 }}>
              <div style={{ fontFamily:'Outfit', fontSize:38, fontWeight:200, color:HP.text, letterSpacing:'-0.045em', lineHeight:1 }}>{String(e.day).padStart(2,'0')}</div>
              <div style={{ fontSize:9, color:HP.textFaint, fontFamily:'Outfit', letterSpacing:'0.12em', textTransform:'uppercase', marginTop:4 }}>{e.date.split(',')[0].split(' ')[0]}</div>
            </div>
            {/* Poster (clickable → movie detail) */}
            <button
              type="button"
              onClick={() => open(e)}
              aria-label={`Open ${e.title}`}
              style={{ ...RESET_BTN, width:64, height:96 }}
            >
              {e.poster
                ? <img src={e.poster} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:4 }} />
                : <div style={{ width:'100%', height:'100%', borderRadius:4, background:`linear-gradient(155deg, ${e.moodHex}55, ${e.moodHex}11)` }} />
              }
            </button>
            {/* Title + meta + note */}
            <div style={{ minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <button
                  type="button"
                  onClick={() => open(e)}
                  style={{ ...RESET_BTN, fontFamily:'Outfit', fontSize:20, fontWeight:500, color:HP.text, letterSpacing:'-0.02em', cursor:'pointer' }}
                >{e.title}</button>
                {e.year && <span style={{ fontSize:11, color:HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.04em' }}>{e.year}{e.dir && e.dir !== '—' ? ` · ${e.dir}` : ''}</span>}
                {e.rewatch && <span style={{ padding:'2px 7px', borderRadius:3, background:'rgba(255,255,255,0.05)', border:`1px solid ${HP.border}`, fontSize:9, fontWeight:600, color:HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.1em', textTransform:'uppercase' }}>Re-watch</span>}
                {e.fav && <span style={{ color:HP.pink, fontSize:13 }} aria-label="Favorite">♥</span>}
              </div>
              <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                <Stars n={e.rating} />
                {e.mood && e.mood !== 'Mixed' && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'3px 9px', borderRadius:999, background:`${e.moodHex}1a`, border:`1px solid ${e.moodHex}44`, fontFamily:'Outfit', fontSize:11, color:e.moodHex }}>
                    <span style={{ width:6, height:6, borderRadius:999, background:e.moodHex }} />{e.mood}
                  </span>
                )}
                <span style={{ fontSize:11, color:HP.textFaint, fontFamily:'Outfit', letterSpacing:'0.06em' }}>{e.context}</span>
              </div>
              {e.note && (
                <p style={{ margin:'14px 0 0 0', fontSize:14, lineHeight:1.55, color:HP.textSoft, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic', borderLeft:`2px solid ${e.moodHex}55`, paddingLeft:14, textWrap:'pretty' }}>
                  &ldquo;{e.note}&rdquo;
                </p>
              )}
            </div>
            <span style={{ fontSize:11, color:HP.textFaint, fontFamily:'Outfit', letterSpacing:'0.06em', textTransform:'uppercase', paddingTop:8 }}>{e.runtime ? `${e.runtime}m` : ''}</span>
            <button
              type="button"
              onClick={() => open(e)}
              aria-label={`Open ${e.title} to edit rating`}
              style={{ padding:'7px 12px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:`1px solid ${HP.border}`, color:HP.textMuted, fontFamily:'Outfit', fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer' }}
            >Edit</button>
            <button
              type="button"
              onClick={() => open(e)}
              aria-label={`Open ${e.title}`}
              title="Open"
              style={{ padding:'7px 10px', borderRadius:6, background:'transparent', border:'none', color:HP.textFaint, cursor:'pointer' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyState() {
  const navigate = useNavigate();
  return (
    <section style={{ padding:'72px 88px 96px', textAlign:'center', borderTop:`1px solid ${HP.border}` }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:HP.purple, marginBottom:18 }}>The diary is blank</div>
      <h2 style={{ fontFamily:'Outfit', fontSize:36, lineHeight:1, fontWeight:500, letterSpacing:'-0.03em', color:HP.text, margin:'0 0 14px 0' }}>Mark something watched.</h2>
      <p style={{ margin:'0 auto 28px', maxWidth:480, fontSize:14, color:HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', lineHeight:1.6 }}>
        Hit Mark Watched on any film detail page and it lands here, grouped by month with your rating and a note line.
      </p>
      <button
        type="button"
        onClick={() => navigate('/home')}
        style={{ padding:'12px 22px', borderRadius:999, background:HP_GRAD, border:'none', color:'#fff', fontFamily:'Outfit', fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 12px 28px -8px rgba(236,72,153,0.5)' }}
      >Browse tonight&rsquo;s picks →</button>
    </section>
  );
}

function Foot() {
  const navigate = useNavigate();
  const linkStyle = { fontSize:12, color:HP.textMuted, letterSpacing:'0.04em', textDecoration:'none', cursor:'pointer' };
  const disabledStyle = { ...linkStyle, color:HP.textFaint, cursor:'not-allowed', background:'none', border:'none', padding:0, font:'inherit' };
  return (
    <footer style={{ padding:'40px 88px 64px', borderTop:`1px solid ${HP.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:'Outfit', flexWrap:'wrap', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:28, height:28, borderRadius:6, background:HP_GRAD, display:'inline-flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:'#fff' }}>FF</div>
        <span style={{ fontSize:13, color:HP.textMuted }}>FeelFlick · Diary</span>
      </div>
      <div style={{ display:'flex', gap:24, alignItems:'center' }}>
        <button type="button" disabled aria-disabled="true" title="Export coming soon" style={disabledStyle}>Export diary</button>
        <button type="button" disabled aria-disabled="true" title="Tagging coming soon" style={disabledStyle}>Manage tags</button>
        <button type="button" onClick={() => navigate('/home')} style={{ ...linkStyle, background:'none', border:'none', padding:0, font:'inherit' }}>Back to Briefing</button>
      </div>
    </footer>
  );
}

function PageSkeleton() {
  const pulse = { background:'rgba(255,255,255,0.04)' };
  return (
    <div style={{ padding:'80px 88px' }}>
      <div className="animate-pulse" style={{ ...pulse, height:14, width:280, borderRadius:999, marginBottom:30 }} />
      <div className="animate-pulse" style={{ background:'rgba(167,139,250,0.10)', height:80, width:'40%', borderRadius:8, marginBottom:48 }} />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
        {[0,1,2,3].map(i => <div key={i} className="animate-pulse" style={{ ...pulse, height:120, borderRadius:6 }} />)}
      </div>
    </div>
  );
}

function PageError({ error }) {
  return (
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ textAlign:'center', maxWidth:520 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: HP.purple, marginBottom:18 }}>Diary · error</div>
        <h1 style={{ fontFamily:'Outfit, Inter, sans-serif', fontSize:36, fontWeight:500, color:HP.text, margin:'0 0 18px 0', letterSpacing:'-0.025em' }}>Couldn&rsquo;t load your diary.</h1>
        <p style={{ margin:0, color:'rgba(250,250,250,0.6)', fontSize:14, lineHeight:1.6 }}>{error}</p>
      </div>
    </div>
  );
}

function HistoryShell() {
  const { entries, stats, loading, error } = useHistoryData();
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    let arr = entries.slice();
    if (filter === '5')   arr = arr.filter(e => e.rating === 5);
    if (filter === 'fav') arr = arr.filter(e => e.fav);
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter(e =>
        e.title.toLowerCase().includes(q)
        || (e.note && e.note.toLowerCase().includes(q))
        || (e.dir && e.dir.toLowerCase().includes(q))
      );
    }
    if (sort === 'rating')  arr.sort((a,b) => b.rating - a.rating);
    if (sort === 'runtime') arr.sort((a,b) => a.runtime - b.runtime);
    // 'recent' = source order (already sorted newest-first by the hook)
    return arr;
  }, [entries, filter, sort, query]);

  const grouped = useMemo(() => {
    const g = new Map();
    filtered.forEach(e => {
      if (!g.has(e.month)) g.set(e.month, []);
      g.get(e.month).push(e);
    });
    return [...g.entries()];
  }, [filtered]);

  if (loading) return <PageSkeleton />;
  if (error) return <PageError error={error} />;

  if (stats.totalLogged === 0) {
    return (
      <>
        <Masthead />
        <PulseStrip />
        <EmptyState />
        <Foot />
      </>
    );
  }

  return (
    <>
      <Masthead />
      <PulseStrip />
      <Heatmap />
      <TimelineAndMood />
      <FilterBar filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} query={query} setQuery={setQuery} />
      {grouped.length === 0 && (
        <section style={{ padding:'72px 88px', textAlign:'center', borderTop:`1px solid ${HP.border}` }}>
          <div style={{ fontFamily:'Outfit', fontSize:24, color:HP.textMuted, fontStyle:'italic' }}>No entries match.</div>
        </section>
      )}
      {grouped.map(([month, ents]) => <DiaryGroup key={month} month={month} entries={ents} />)}
      <Foot />
    </>
  );
}

export default function HistoryV2() {
  return (
    <HistoryDataProvider>
      <div className="ff-history-v2" style={{ minHeight:'100vh', background:HP.bgDeep, color:HP.text, fontFamily:'Inter, sans-serif' }}>
        <div style={{ maxWidth:1440, margin:'0 auto' }}>
          <HistoryShell />
        </div>
      </div>
    </HistoryDataProvider>
  )
}
