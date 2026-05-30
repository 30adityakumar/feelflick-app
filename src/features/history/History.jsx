// src/features/history/History.jsx
// FeelFlick — Diary v2. Mount at /history-v2.
// All sections (heatmap, timeline, mood share, stats, entries) are derived
// live from user_history × movies × user_ratings — see ./useHistoryData.jsx.

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import MoodPill from '@/shared/components/MoodPill'
import { HP, HP_GRAD } from './data'
import { HistoryDataProvider, useHistoryData } from './useHistoryData'
import './history.css'

// === Reset-button style for elements wrapped as buttons ===
const RESET_BTN = {
  background:'none', border:'none', padding:0, margin:0, font:'inherit',
  color:'inherit', textAlign:'left', cursor:'pointer', display:'block',
};

// ── Masthead — kicker bar only; the URL/nav already say "Diary" ──
function Masthead() {
  const { stats } = useHistoryData();
  return (
    <section className="ff-hist-section ff-hist-section--masthead" style={{ padding:'40px 88px 12px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.32em', textTransform:'uppercase', color:HP.purple }}>Diary</div>
        <div style={{ height:1, width:38, background:HP.purple, opacity:0.5 }} />
        <div style={{ fontSize:10, fontWeight:500, letterSpacing:'0.18em', textTransform:'uppercase', color:HP.textMuted, fontFamily:'Outfit' }}>
          {stats.totalLogged} film{stats.totalLogged === 1 ? '' : 's'} · {stats.totalHours} hours · {stats.streakDays}-day streak
        </div>
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
    <section className="ff-hist-section ff-hist-pulse" style={{ padding:'24px 88px 40px' }}>
      <div className="ff-hist-pulse-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
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

// Streak heatmap, "Films per month", and "Mood share" used to live here.
// They were trend/signature visuals, not diary content — moved out so this
// page stays a chronological record. The DNA page (/profile) is the home
// for taste patterns; deriveTrajectory + the mood radar there already cover
// monthly volume + mood share. The streak heatmap is a follow-up port to
// /profile (TODO).

function FilterBar({ filter, setFilter, sort, setSort, query, setQuery }) {
  // "Favorites" was redundant with "Loved (5★)" — both filtered on the same
  // ≥9 rating bucket. Dropped until there's a real per-row favorite toggle
  // separate from the rating scale. The ♥ heart in DiaryGroup is dropped
  // for the same reason.
  const filters = [
    { v:'all', l:'All' },
    { v:'5',   l:'Loved (5★)' },
  ];
  return (
    <section className="ff-hist-section ff-hist-filterbar" style={{ padding:'40px 88px 20px', borderTop:`1px solid ${HP.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', gap:24, flexWrap:'wrap' }}>
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
      <div className="ff-hist-filterbar-controls" style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search the diary…"
          aria-label="Search the diary"
          className="ff-hist-search"
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
  const { removeEntry } = useHistoryData();
  const open = (e) => e.tmdbId && navigate(`/movie/${e.tmdbId}`);
  async function handleRemove(e) {
    if (typeof window !== 'undefined' && !window.confirm(`Remove "${e.title}" from your diary?`)) return;
    await removeEntry(e.id);
  }

  // Bucket entries within this month by day. Surfaces bingeing patterns
  // (a Sat with 10 logs reads as one chunk rather than 10 repeated "24"
  // numerals) and gives mobile rows a date they previously lacked (the
  // per-row day numeral was hidden at narrow widths).
  const byDay = useMemo(() => {
    const map = new Map();
    entries.forEach(e => {
      if (!map.has(e.day)) map.set(e.day, []);
      map.get(e.day).push(e);
    });
    return [...map.entries()];  // already in newest-first order from entries
  }, [entries]);

  return (
    <section className="ff-hist-section ff-hist-group" style={{ padding:'56px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:24, gap:16, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:18 }}>
          <h2 style={{ fontFamily:'Outfit', fontSize:48, fontWeight:300, color:HP.text, letterSpacing:'-0.045em', margin:0 }}>{month.split(' ')[0]}</h2>
          <span style={{ fontFamily:'Outfit', fontSize:20, color:HP.textMuted, letterSpacing:'-0.02em' }}>{month.split(' ')[1]}</span>
        </div>
        <div style={{ fontSize:11, color:HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.08em', textTransform:'uppercase' }}>{entries.length} {entries.length===1?'film':'films'}</div>
      </div>
      <div style={{ borderTop:`1px solid ${HP.border}` }}>
        {byDay.map(([day, dayEntries]) => {
          // Weekday lives in e.context as "<dayPart> · <Weekday>"
          const weekday = dayEntries[0]?.context?.split(' · ')[1] || '';
          const dayDate = dayEntries[0]?.date || '';
          const dayHours = Math.round(dayEntries.reduce((s, e) => s + (e.runtime || 0), 0) / 60);
          return (
            <div key={day}>
              <div className="ff-hist-day-header" style={{
                display:'flex', alignItems:'baseline', gap:12, flexWrap:'wrap',
                padding:'24px 0 12px', borderBottom:`1px solid ${HP.border}`,
              }}>
                <span style={{ fontFamily:'Outfit', fontSize:18, fontWeight:500, color:HP.text, letterSpacing:'-0.015em' }}>
                  {dayDate}
                </span>
                {weekday && <span style={{ fontFamily:'Outfit', fontSize:13, color:HP.textMuted, letterSpacing:'0.02em' }}>· {weekday}</span>}
                <span style={{ fontSize:10, color:HP.textFaint, fontFamily:'Outfit', letterSpacing:'0.12em', textTransform:'uppercase' }}>
                  · {dayEntries.length} film{dayEntries.length === 1 ? '' : 's'}{dayHours > 0 ? ` · ${dayHours}h` : ''}
                </span>
              </div>
              {dayEntries.map(e => (
                <div key={e.id} className="ff-hist-row" style={{ display:'grid', gridTemplateColumns:'64px 1fr auto auto', gap:24, alignItems:'flex-start', padding:'20px 0', borderBottom:`1px solid ${HP.border}` }}>
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
                  <div style={{ minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                      <button
                        type="button"
                        onClick={() => open(e)}
                        style={{ ...RESET_BTN, fontFamily:'Outfit', fontSize:20, fontWeight:500, color:HP.text, letterSpacing:'-0.02em', cursor:'pointer' }}
                      >{e.title}</button>
                      {e.year && <span style={{ fontSize:11, color:HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.04em' }}>{e.year}{e.dir && e.dir !== '—' ? ` · ${e.dir}` : ''}</span>}
                    </div>
                    <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                      <Stars n={e.rating} />
                      {e.mood && e.mood !== 'Mixed' && <MoodPill label={e.mood} color={e.moodHex} dot />}
                    </div>
                    {e.note && (
                      <p style={{ margin:'14px 0 0 0', fontSize:14, lineHeight:1.55, color:HP.textSoft, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic', borderLeft:`2px solid ${e.moodHex}55`, paddingLeft:14, textWrap:'pretty' }}>
                        &ldquo;{e.note}&rdquo;
                      </p>
                    )}
                  </div>
                  <span className="ff-hist-row__runtime" style={{ fontSize:11, color:HP.textFaint, fontFamily:'Outfit', letterSpacing:'0.06em', textTransform:'uppercase', paddingTop:8 }}>{e.runtime ? `${e.runtime}m` : ''}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(e)}
                    aria-label={`Remove ${e.title} from diary`}
                    title="Remove from diary"
                    style={{ padding:'7px 10px', borderRadius:6, background:'transparent', border:'none', color:HP.textFaint, cursor:'pointer' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EmptyState() {
  const navigate = useNavigate();
  return (
    <section className="ff-hist-section" style={{ padding:'72px 88px 96px', textAlign:'center', borderTop:`1px solid ${HP.border}` }}>
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
      </>
    );
  }

  return (
    <>
      <Masthead />
      <PulseStrip />
      <FilterBar filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} query={query} setQuery={setQuery} />
      {grouped.length === 0 && (
        <section className="ff-hist-section" style={{ padding:'72px 88px', textAlign:'center', borderTop:`1px solid ${HP.border}` }}>
          <div style={{ fontFamily:'Outfit', fontSize:24, color:HP.textMuted, fontStyle:'italic' }}>
            {query.trim()
              ? <>0 of {entries.length} match &ldquo;{query.trim()}&rdquo;</>
              : <>0 of {entries.length} match this filter</>}
          </div>
        </section>
      )}
      {grouped.map(([month, ents]) => <DiaryGroup key={month} month={month} entries={ents} />)}
    </>
  );
}

export default function History() {
  usePageMeta({ title: 'Diary — FeelFlick' })
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
