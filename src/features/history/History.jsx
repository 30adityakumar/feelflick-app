// src/features/history/History.jsx
// FeelFlick — Diary v2. All sections derived live from
// user_history × movies × user_ratings — see ./useHistoryData.jsx.
// F6.3: removal is settled + announced + focus-recovered; load errors are sanitized.
// (No stat/semantics/removal-meaning redesign — those are F6.5. Confirm copy + the
// rating/review retention are unchanged.)

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import MoodPill from '@/shared/components/MoodPill'
import Eyebrow from '@/shared/ui/Eyebrow'
import PageContainer from '@/shared/ui/PageContainer'
import { HP, HP_GRAD } from './data'
import { HistoryDataProvider, useHistoryData } from './useHistoryData'
import { matchesQuery } from './derive/historyDerive'
import RemoveDiaryEntryDialog from './components/RemoveDiaryEntryDialog'
import LibrarySectionNav from '@/features/library/LibrarySectionNav'
import { useLibraryAnnouncement } from '@/features/library/useLibraryAnnouncement'
import { scheduleFocus, findRemoveControl, findFallback, nextFocusId } from '@/features/library/focusAfterRemoval'
import './history.css'

// ── Masthead — shared "Your library" identity + the Diary headline ──
function Masthead() {
  const { stats } = useHistoryData();
  return (
    <section className="ff-hist-section ff-hist-section--masthead" style={{ padding:'40px 88px 12px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18, flexWrap:'wrap' }}>
        <Eyebrow spacing="0.32em" size={10}>Your library</Eyebrow>
        <div style={{ height:1, width:38, background:HP.purple, opacity:0.5 }} />
        <Eyebrow tone="meta" weight={500} size={10}>
          {stats.totalLogged} film{stats.totalLogged === 1 ? '' : 's'} · {stats.totalHours} hours
        </Eyebrow>
      </div>
      <h1 className="ff-hist-hero" style={{ fontFamily:'Outfit', fontSize:72, lineHeight:0.96, fontWeight:300, letterSpacing:'-0.045em', color:HP.text, margin:0, textWrap:'balance' }}>
        Your <em style={{ fontStyle:'italic', fontWeight:400, color:HP.textSoft }}>diary.</em>
      </h1>
      <p style={{ marginTop:16, fontFamily:'Outfit, Inter, sans-serif', fontSize:16, color:HP.textSoft, maxWidth:620, lineHeight:1.55 }}>
        A chronological record of what you watched and what you thought.
      </p>
    </section>
  );
}

function PulseStrip() {
  const { stats } = useHistoryData();
  // F6.5: restrained, Diary-scoped facts only — no streak / gamification. The average
  // is now computed over rated films that are actually in the Diary.
  const items = [
    { label:'Logged',        value: stats.totalLogged,         hint:'films across your diary' },
    { label:'Hours watched', value: `${stats.totalHours}h`,     hint:'total runtime logged' },
    { label:'Avg rating',    value: stats.avgRating ? stats.avgRating.toFixed(1) : '—', hint:'your rated diary films, on a 5-star scale' },
    { label:'This month',    value: stats.thisMonthCount,       hint:'films logged this month' },
  ];
  return (
    <section className="ff-hist-section ff-hist-pulse" style={{ padding:'24px 88px 40px' }}>
      <div className="ff-hist-pulse-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
        {items.map(s => (
          <div key={s.label} style={{ padding:'20px 22px', borderRadius:6, background:'rgba(255,255,255,0.025)', border:`1px solid ${HP.border}` }}>
            <Eyebrow tone="meta" size={10} style={{ marginBottom:8 }}>{s.label}</Eyebrow>
            <div style={{ fontFamily:'Outfit', fontSize:44, fontWeight:200, color:HP.text, letterSpacing:'-0.045em', lineHeight:1 }}>{s.value}</div>
            <div style={{ marginTop:6, fontSize:11, color:HP.textSoft, fontFamily:'Outfit', fontStyle:'italic' }}>{s.hint}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FilterBar({ filter, setFilter, sort, setSort, query, setQuery }) {
  // "Loved" is derived from the rating (raw 9–10), not an independent favourite flag —
  // the label says so honestly.
  const filters = [
    { v:'all',   l:'All' },
    { v:'loved', l:'Loved · 9–10' },
  ];
  return (
    <section className="ff-hist-section ff-hist-filterbar" style={{ padding:'40px 88px 20px', borderTop:`1px solid ${HP.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', gap:24, flexWrap:'wrap' }}>
      {/* F6.7: a toggle-button group (aria-pressed), NOT a partial radiogroup — these are
          independent on/off filters without arrow-key navigation. */}
      <div role="group" aria-label="Filter diary" style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {filters.map(f => {
          const on = filter === f.v;
          return (
            <button
              key={f.v}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(f.v)}
              className="ff-tap ff-hist-filter-pill"
              style={{
                minHeight:44, padding:'8px 16px', borderRadius:999,
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
          className="ff-hist-search ff-tap"
          style={{ padding:'9px 14px', borderRadius:999, background:'rgba(255,255,255,0.04)', border:`1px solid ${HP.border}`, color:HP.text, fontFamily:'Outfit, Inter, sans-serif', fontSize:12, outline:'none', minWidth:240 }}
        />
        <label className="ff-tap" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'7px 12px', borderRadius:999, background:'rgba(255,255,255,0.04)', border:`1px solid ${HP.border}` }}>
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
        <svg key={i} aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill={i<=n?HP.amber:'transparent'} stroke={i<=n?HP.amber:HP.textFaint} strokeWidth="1.6"><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>
      ))}
    </span>
  );
}

function DiaryGroup({ month, entries, onRemove }) {
  const { isRemoving } = useHistoryData();

  const byDay = useMemo(() => {
    const map = new Map();
    entries.forEach(e => {
      if (!map.has(e.day)) map.set(e.day, []);
      map.get(e.day).push(e);
    });
    return [...map.entries()];
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
              <div role="list" aria-label={`${dayDate} films`}>
              {dayEntries.map(e => {
                const busy = isRemoving(e.id);
                // F6.7: exactly ONE Film File link (the poster) + ONE Remove action per row;
                // the title is a plain heading (no duplicate open affordance).
                const poster = e.poster
                  ? <img src={e.poster} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:4 }} />
                  : <span style={{ display:'block', width:'100%', height:'100%', borderRadius:4, background:`linear-gradient(155deg, ${e.moodHex}55, ${e.moodHex}11)` }} />;
                return (
                  <div key={e.id} role="listitem" className="ff-hist-row" style={{ display:'grid', gridTemplateColumns:'64px 1fr auto auto', gap:24, alignItems:'flex-start', padding:'20px 0', borderBottom:`1px solid ${HP.border}` }}>
                    {e.tmdbId ? (
                      <Link to={`/movie/${e.tmdbId}`} aria-label={`Open ${e.title}`} className="ff-hist-row__poster" style={{ display:'block', width:64, height:96, borderRadius:4, overflow:'hidden' }}>{poster}</Link>
                    ) : (
                      <span className="ff-hist-row__poster" style={{ display:'block', width:64, height:96, borderRadius:4, overflow:'hidden' }}>{poster}</span>
                    )}
                    <div style={{ minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                        <h3 className="ff-hist-row__title" style={{ fontFamily:'Outfit', fontSize:20, fontWeight:500, color:HP.text, letterSpacing:'-0.02em', margin:0, overflowWrap:'anywhere' }}>{e.title}</h3>
                        {e.year && <span style={{ fontSize:11, color:HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.04em' }}>{e.year}{e.dir && e.dir !== '—' ? ` · ${e.dir}` : ''}</span>}
                      </div>
                      <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                        <Stars n={e.rating} />
                        {/* F6.5: the pill shows the FILM's mood/tone — its accessible name says
                            so explicitly, so it is never mistaken for the user's viewing mood. */}
                        {e.filmMood && e.filmMood !== 'Mixed' && (
                          <MoodPill label={e.filmMood} color={e.moodHex} dot role="img" aria-label={`Film mood: ${e.filmMood}`} />
                        )}
                      </div>
                      {e.review && (
                        <div style={{ marginTop:14 }}>
                          {/* review_text is a film-level review, not a note written on this watch date. */}
                          <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:HP.textFaint, fontFamily:'Outfit', marginBottom:6 }}>Your review</div>
                          <p style={{ margin:0, fontSize:14, lineHeight:1.55, color:HP.textSoft, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic', borderLeft:`2px solid ${e.moodHex}55`, paddingLeft:14, textWrap:'pretty' }}>
                            &ldquo;{e.review}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                    <span className="ff-hist-row__runtime" style={{ fontSize:11, color:HP.textFaint, fontFamily:'Outfit', letterSpacing:'0.06em', textTransform:'uppercase', paddingTop:8 }}>{e.runtime ? `${e.runtime}m` : ''}</span>
                    <button
                      type="button"
                      data-library-action="remove"
                      data-library-item-id={e.id}
                      data-library-view="diary"
                      onClick={(ev) => onRemove(e, ev.currentTarget)}
                      disabled={busy}
                      aria-busy={busy || undefined}
                      aria-label={busy ? `Removing ${e.title}` : `Remove ${e.title} from diary`}
                      title="Remove from diary"
                      className="ff-hist-row__remove"
                      style={{ minWidth:44, minHeight:44, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:6, background:'transparent', border:'none', color:HP.textFaint, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.5 : 1 }}
                    >
                      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                    </button>
                  </div>
                );
              })}
              </div>
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
      <Eyebrow size={10} style={{ marginBottom:18 }}>The diary is blank</Eyebrow>
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

// F6.7: honest loading semantics — busy status region + visually-hidden message;
// decorative placeholders hidden from screen readers.
function PageSkeleton() {
  const pulse = { background:'rgba(255,255,255,0.04)' };
  return (
    <div role="status" aria-busy="true" style={{ padding:'80px 88px' }}>
      <span className="sr-only">Loading your diary…</span>
      <div aria-hidden="true" className="animate-pulse" style={{ ...pulse, height:14, width:280, borderRadius:999, marginBottom:30 }} />
      <div aria-hidden="true" className="animate-pulse" style={{ background:'rgba(167,139,250,0.10)', height:80, width:'40%', borderRadius:8, marginBottom:48 }} />
      <div aria-hidden="true" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
        {[0,1,2,3].map(i => <div key={i} className="animate-pulse" style={{ ...pulse, height:120, borderRadius:6 }} />)}
      </div>
    </div>
  );
}

// F6.3: sanitized error — fixed, safe copy only (never a raw backend message), with
// Try-again (refresh) + Go-to-Home recovery. role="alert", one h1, ≥44px buttons.
function PageError({ onRetry, onHome }) {
  return (
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div role="alert" style={{ textAlign:'center', maxWidth:520 }}>
        <Eyebrow size={10} style={{ marginBottom:18 }}>Diary</Eyebrow>
        <h1 style={{ fontFamily:'Outfit, Inter, sans-serif', fontSize:36, fontWeight:500, color:HP.text, margin:'0 0 14px 0', letterSpacing:'-0.025em' }}>We couldn&rsquo;t load your Diary.</h1>
        <p style={{ margin:'0 0 28px 0', color:'rgba(250,250,250,0.6)', fontSize:14, lineHeight:1.6 }}>Your watched films and notes are still safe. Try again in a moment.</p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button type="button" onClick={onRetry} className="ff-hist-error-btn" style={{ minHeight:44, padding:'12px 22px', borderRadius:999, background:HP_GRAD, color:'#fff', border:'none', cursor:'pointer', fontFamily:'Outfit', fontSize:14, fontWeight:600 }}>Try again</button>
          <button type="button" onClick={onHome} className="ff-hist-error-btn" style={{ minHeight:44, padding:'12px 22px', borderRadius:999, background:'transparent', color:'rgba(250,250,250,0.85)', border:`1px solid ${HP.border}`, cursor:'pointer', fontFamily:'Outfit', fontSize:14, fontWeight:600 }}>Go to Home</button>
        </div>
      </div>
    </div>
  );
}

function HistoryShell() {
  const { entries, stats, loading, error, removeEntry, isRemoving, refresh } = useHistoryData();
  const navigate = useNavigate();
  const { announcement, announce } = useLibraryAnnouncement();
  const containerRef = useRef(null);
  const focusCancelRef = useRef(null);
  useEffect(() => () => focusCancelRef.current?.(), []);

  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [query, setQuery] = useState('');
  // Pending removal awaiting confirmation: { entry, triggerEl }.
  const [pendingRemoval, setPendingRemoval] = useState(null);

  const filtered = useMemo(() => {
    let arr = entries.slice();
    // "Loved" = raw rating 9–10 (e.fav), derived from the rating — not a separate flag.
    if (filter === 'loved') arr = arr.filter(e => e.fav);
    // Search matches the user's own content (title / director / review) — NOT film mood.
    arr = arr.filter(e => matchesQuery(e, query));
    if (sort === 'rating')  arr.sort((a,b) => b.rating - a.rating);
    if (sort === 'runtime') arr.sort((a,b) => a.runtime - b.runtime);
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

  // F6.5: removal goes through an honest, accessible confirmation dialog. The Remove
  // control opens it; "Remove from Diary" performs the settled delete; "Keep entry" /
  // Escape cancels and returns focus to the trigger. The settled-removal reliability,
  // live announcements, and focus-next behavior (F6.3) are preserved.
  const requestRemove = useCallback((e, triggerEl) => {
    if (isRemoving(e.id)) return;
    setPendingRemoval({ entry: e, triggerEl });
  }, [isRemoving]);

  const cancelRemove = useCallback(() => {
    const trigger = pendingRemoval?.triggerEl;
    setPendingRemoval(null);
    focusCancelRef.current?.();
    focusCancelRef.current = scheduleFocus(() => (trigger && trigger.isConnected ? trigger : null));
  }, [pendingRemoval]);

  const confirmRemove = useCallback(async () => {
    const p = pendingRemoval;
    if (!p) return;
    setPendingRemoval(null); // close immediately → a second confirm can't fire
    const e = p.entry;
    const orderedIds = filtered.map(x => x.id);
    const targetId = nextFocusId(orderedIds, e.id);
    const res = await removeEntry(e.id); // deletes only user_history (settled); ratings/feedback untouched
    focusCancelRef.current?.();
    if (res.ok) {
      announce(`Removed ${e.title} from your Diary.`);
      focusCancelRef.current = scheduleFocus(() =>
        findRemoveControl(containerRef.current, targetId, 'diary') || findFallback(containerRef.current));
    } else if (!res.duplicate) {
      announce(`Could not remove ${e.title} from your Diary. Try again.`);
      focusCancelRef.current = scheduleFocus(() =>
        (p.triggerEl && p.triggerEl.isConnected ? p.triggerEl : findRemoveControl(containerRef.current, e.id, 'diary')) || findFallback(containerRef.current));
    }
  }, [pendingRemoval, filtered, removeEntry, announce]);

  if (loading) return <PageSkeleton />;
  // Error state keeps the section nav (no data dependency) so the user can still reach the
  // Watchlist; PageError keeps the only h1 + role="alert".
  if (error) return (
    <>
      <section className="ff-hist-section" style={{ padding:'40px 88px 0' }}>
        <LibrarySectionNav current="diary" />
      </section>
      <PageError onRetry={refresh} onHome={() => navigate('/home')} />
    </>
  );

  if (stats.totalLogged === 0) {
    return (
      <>
        <Masthead />
        <section className="ff-hist-section" style={{ padding:'0 88px 8px' }}>
          <LibrarySectionNav current="diary" />
        </section>
        <PulseStrip />
        <EmptyState />
      </>
    );
  }

  return (
    <div ref={containerRef}>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announcement}</div>
      <Masthead />
      <section className="ff-hist-section" style={{ padding:'0 88px 8px' }}>
        <LibrarySectionNav current="diary" />
      </section>
      <PulseStrip />
      <FilterBar filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} query={query} setQuery={setQuery} />
      <div data-library-fallback tabIndex={-1} aria-label="Your diary entries" className="ff-hist-collection" style={{ outline:'none' }}>
        {grouped.length === 0 && (
          // F6.7: announce the filtered/searched-empty result so a keyboard/SR user learns
          // the list is empty without losing their place on the search/filter control.
          <section className="ff-hist-section" style={{ padding:'72px 88px', textAlign:'center', borderTop:`1px solid ${HP.border}` }} role="status">
            <div style={{ fontFamily:'Outfit', fontSize:24, color:HP.textMuted, fontStyle:'italic' }}>
              {query.trim()
                ? <>0 of {entries.length} match &ldquo;{query.trim()}&rdquo;</>
                : <>0 of {entries.length} match this filter</>}
            </div>
          </section>
        )}
        {grouped.map(([month, ents]) => <DiaryGroup key={month} month={month} entries={ents} onRemove={requestRemove} />)}
      </div>
      {pendingRemoval && (
        <RemoveDiaryEntryDialog
          title={pendingRemoval.entry.title}
          onConfirm={confirmRemove}
          onCancel={cancelRemove}
        />
      )}
    </div>
  );
}

export default function History() {
  usePageMeta({ title: 'Diary — FeelFlick' })
  return (
    <HistoryDataProvider>
      <div className="ff-history-v2" style={{ minHeight:'100vh', background:HP.bgDeep, color:HP.text, fontFamily:'Inter, sans-serif' }}>
        {/* F12B: shared PageContainer (size="wide" = 1440, byte-identical to the old inline cap) + a11y landmark. */}
        <PageContainer size="wide" padding="none">
          <HistoryShell />
        </PageContainer>
      </div>
    </HistoryDataProvider>
  )
}
