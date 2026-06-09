// src/features/watchlist/Watchlist.jsx
// FeelFlick — Watchlist: a calm record of saved intent ("Saved for later"). Films the
// user chose to remember for another moment — NOT a recommendation feed. F6.4 removed
// the match %, "Perfect for tonight", featured tier, pulse dashboard, "stale"/guilt
// framing, the bulk cleanup, and the grid/list toggle. Home + Discover own nightly
// selection; this surface just preserves and retrieves saved films. F6.3 removal
// reliability (settled delete, live announcements, focus recovery, pending) is preserved.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import MoodPill from '@/shared/components/MoodPill'
import Eyebrow from '@/shared/ui/Eyebrow'
import { HP, HP_GRAD } from './data'
import { WatchlistDataProvider, useWatchlistData } from './useWatchlistData'
import { sortItems } from './derive/watchlistDerive'
import { useLibraryAnnouncement } from '@/features/library/useLibraryAnnouncement'
import { scheduleFocus, findRemoveControl, findFallback, nextFocusId } from '@/features/library/focusAfterRemoval'
import LibrarySectionNav from '@/features/library/LibrarySectionNav'
import './watchlist.css'

// ── Masthead ───────────────────────────────────────────────────
function Masthead() {
  const { total } = useWatchlistData();
  return (
    <section className="ff-wl-section ff-wl-section--masthead" style={{ padding:'72px 88px 28px', position:'relative' }}>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 60% 35% at 10% 0%, rgba(167,139,250,0.12), transparent 60%)' }} />
      <div style={{ position:'relative' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24, flexWrap:'wrap' }}>
          <Eyebrow spacing="0.32em" size={10}>Your library</Eyebrow>
          <div style={{ height:1, width:38, background:HP.purple, opacity:0.5 }} />
          <Eyebrow tone="meta" weight={500} size={10}>{total} film{total === 1 ? '' : 's'} saved</Eyebrow>
        </div>
        <h1 className="ff-wl-hero" style={{ fontFamily:'Outfit', fontSize:72, lineHeight:0.96, fontWeight:300, letterSpacing:'-0.045em', color:HP.text, margin:0, textWrap:'balance' }}>
          Saved <em style={{ fontStyle:'italic', fontWeight:400, color:HP.textSoft }}>for later.</em>
        </h1>
        <p style={{ marginTop:18, fontFamily:'Outfit, Inter, sans-serif', fontSize:17, color:HP.textSoft, maxWidth:640, lineHeight:1.55 }}>
          Films you wanted to remember &mdash; ready whenever the moment feels right.
        </p>
      </div>
    </section>
  );
}

// ── Retrieval controls: film-mood filter + saved-date sort (no ranking) ──
function Controls({ filter, setFilter, sort, setSort }) {
  const { availableMoods } = useWatchlistData();
  return (
    <section className="ff-wl-section ff-wl-controls" style={{ padding:'4px 88px 36px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:24, flexWrap:'wrap' }}>
      <div role="group" aria-label="Filter by film mood" style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {[{ v:'all', l:'All' }, ...availableMoods.map(m => ({ v:`mood:${m.mood}`, l:m.mood }))].map(f => {
          const on = filter === f.v;
          return (
            <button
              key={f.v}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(f.v)}
              className="ff-wl-filter-pill"
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
      <label style={{ display:'inline-flex', alignItems:'center', gap:8, minHeight:44, padding:'7px 12px', borderRadius:999, background:'rgba(255,255,255,0.04)', border:`1px solid ${HP.border}` }}>
        <span style={{ fontSize:10, color:HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.12em', textTransform:'uppercase' }}>Sort</span>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          aria-label="Sort saved films"
          style={{ background:'transparent', border:'none', color:HP.text, fontFamily:'Outfit', fontSize:12, fontWeight:600, cursor:'pointer', outline:'none' }}
        >
          <option value="recent">Recently saved</option>
          <option value="oldest">Oldest saved</option>
          <option value="runtime">Runtime</option>
          <option value="title">Title</option>
        </select>
      </label>
    </section>
  );
}

// ── Saved-film card ────────────────────────────────────────────
// F6.7: exactly ONE Film File link (poster + title) + ONE Remove action per item — the
// duplicate "Open" affordances are gone. Each card is a list item in a labelled list.
function SavedCard({ f, onRemove }) {
  const { isRemoving } = useWatchlistData();
  const busy = isRemoving(f.id);
  const poster = f.poster
    ? <img src={f.poster} alt="" style={{ width:'100%', aspectRatio:'2/3', objectFit:'cover', display:'block' }} />
    : <span style={{ width:'100%', aspectRatio:'2/3', background:`linear-gradient(155deg, ${f.hex}55, ${f.hex}11)`, display:'flex', alignItems:'center', justifyContent:'center', color:HP.text, fontFamily:'Outfit', fontSize:14, padding:12, textAlign:'center' }}>{f.title}</span>;
  const title = <h3 className="ff-wl-card__title" style={{ fontFamily:'Outfit', fontSize:15, fontWeight:500, color:HP.text, letterSpacing:'-0.01em', margin:'12px 0 0 0', lineHeight:1.25 }}>{f.title}</h3>;
  return (
    <article className="ff-wl-card" role="listitem">
      {f.tmdbId ? (
        <Link to={`/movie/${f.tmdbId}`} className="ff-wl-card__link" style={{ color:'inherit', textDecoration:'none', display:'block' }}>
          <span className="ff-wl-card__poster" aria-hidden="true" style={{ display:'block', position:'relative', borderRadius:6, overflow:'hidden' }}>{poster}</span>
          {title}
        </Link>
      ) : (
        <div className="ff-wl-card__link" style={{ display:'block' }}>
          <span className="ff-wl-card__poster" aria-hidden="true" style={{ display:'block', position:'relative', borderRadius:6, overflow:'hidden' }}>{poster}</span>
          {title}
        </div>
      )}
      <div style={{ marginTop:4, fontSize:11, color:HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.03em' }}>
        {f.year || '—'}{f.runtime ? ` · ${f.runtime}m` : ''}{f.dir && f.dir !== '—' ? ` · ${f.dir}` : ''}
      </div>
      <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        {f.mood && f.mood !== 'Mixed' && <MoodPill label={f.mood} color={f.hex} dot role="img" aria-label={`Film mood: ${f.mood}`} />}
        <span style={{ fontSize:11, color:HP.textFaint, fontFamily:'Outfit', letterSpacing:'0.02em' }}>{f.savedLabel}</span>
      </div>
      <div style={{ marginTop:14 }}>
        <button
          type="button"
          data-library-action="remove"
          data-library-item-id={f.id}
          data-library-view="grid"
          disabled={busy}
          aria-busy={busy || undefined}
          aria-label={busy ? `Removing ${f.title}` : `Remove ${f.title} from Watchlist`}
          title="Remove from Watchlist"
          onClick={(e) => onRemove(f, e.currentTarget)}
          className="ff-wl-card__remove"
          style={{ width:'100%', minHeight:44, padding:'8px 14px', borderRadius:6, background:'transparent', border:`1px solid ${HP.border}`, color:HP.textMuted, fontFamily:'Outfit', fontSize:11, fontWeight:600, letterSpacing:'0.04em', cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1 }}
        >{busy ? 'Removing…' : 'Remove'}</button>
      </div>
    </article>
  );
}

// ── Empty states ───────────────────────────────────────────────
function EmptyState() {
  const navigate = useNavigate();
  return (
    <section className="ff-wl-section" style={{ padding:'56px 88px 96px', textAlign:'center' }}>
      <Eyebrow size={10} style={{ marginBottom:18 }}>Watchlist</Eyebrow>
      <h2 style={{ fontFamily:'Outfit', fontSize:34, lineHeight:1.05, fontWeight:500, letterSpacing:'-0.03em', color:HP.text, margin:'0 0 14px 0' }}>Your Watchlist is open.</h2>
      <p style={{ margin:'0 auto 28px', maxWidth:460, fontSize:14, color:HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', lineHeight:1.6 }}>
        Save a film when you want to remember it for another time.
      </p>
      <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
        <button type="button" onClick={() => navigate('/discover')} className="ff-wl-cta" style={{ minHeight:44, padding:'12px 22px', borderRadius:999, background:HP_GRAD, border:'none', color:'#fff', fontFamily:'Outfit', fontSize:13, fontWeight:600, cursor:'pointer' }}>Open Discover →</button>
        <button type="button" onClick={() => navigate('/browse')} className="ff-wl-cta" style={{ minHeight:44, padding:'12px 22px', borderRadius:999, background:'transparent', border:`1px solid ${HP.border}`, color:HP.text, fontFamily:'Outfit', fontSize:13, fontWeight:600, cursor:'pointer' }}>Browse films</button>
      </div>
    </section>
  );
}

function FilteredEmpty({ onShowAll }) {
  // F6.7: announce the filtered-empty result (role="status") so a keyboard/SR user who just
  // changed the filter learns the list is empty without losing their place on the filter.
  return (
    <section className="ff-wl-section ff-wl-collection" style={{ padding:'56px 88px 96px', textAlign:'center' }} role="status">
      <h2 style={{ fontFamily:'Outfit', fontSize:26, lineHeight:1.1, fontWeight:500, letterSpacing:'-0.02em', color:HP.text, margin:'0 0 12px 0' }}>No saved films match this mood.</h2>
      <p style={{ margin:'0 auto 24px', maxWidth:440, fontSize:14, color:HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', lineHeight:1.6 }}>Choose another film mood or show everything.</p>
      <button type="button" onClick={onShowAll} className="ff-wl-cta" style={{ minHeight:44, padding:'12px 22px', borderRadius:999, background:'rgba(255,255,255,0.06)', border:`1px solid ${HP.borderStrong}`, color:HP.text, fontFamily:'Outfit', fontSize:13, fontWeight:600, cursor:'pointer' }}>Show all</button>
    </section>
  );
}

// ── Shell ──────────────────────────────────────────────────────
function WatchlistShell() {
  const { items, total, loading, error, removeFromWatchlist, isRemoving, refresh } = useWatchlistData();
  const navigate = useNavigate();
  const { announcement, announce } = useLibraryAnnouncement();
  const containerRef = useRef(null);
  const focusCancelRef = useRef(null);
  useEffect(() => () => focusCancelRef.current?.(), []);

  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recent');

  const visible = useMemo(() => {
    let arr = items;
    if (filter.startsWith('mood:')) {
      const mood = filter.slice('mood:'.length);
      arr = arr.filter(f => f.mood === mood);
    }
    return sortItems(arr, sort);
  }, [items, filter, sort]);

  const onRemove = useCallback(async (f, triggerEl) => {
    if (isRemoving(f.id)) return;
    const orderedIds = visible.map(it => it.id);
    const targetId = nextFocusId(orderedIds, f.id);
    const res = await removeFromWatchlist(f.id);
    focusCancelRef.current?.();
    if (res.ok) {
      announce(`Removed ${f.title} from your Watchlist.`);
      focusCancelRef.current = scheduleFocus(() =>
        findRemoveControl(containerRef.current, targetId, 'grid') || findFallback(containerRef.current));
    } else if (!res.duplicate) {
      announce(`Could not remove ${f.title}. Try again.`);
      focusCancelRef.current = scheduleFocus(() =>
        (triggerEl && triggerEl.isConnected ? triggerEl : findRemoveControl(containerRef.current, f.id, 'grid')) || findFallback(containerRef.current));
    }
  }, [isRemoving, visible, removeFromWatchlist, announce]);

  if (loading) return <PageSkeleton />;
  // Error state keeps the section nav (it has no data dependency) so the user can still
  // reach the Diary; PageError keeps the only h1 + role="alert".
  if (error) return (
    <>
      <section className="ff-wl-section" style={{ padding:'40px 88px 0' }}>
        <LibrarySectionNav current="watchlist" />
      </section>
      <PageError onRetry={refresh} onHome={() => navigate('/home')} />
    </>
  );

  return (
    <div ref={containerRef}>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announcement}</div>
      <Masthead />
      <section className="ff-wl-section" style={{ padding:'0 88px 28px' }}>
        <LibrarySectionNav current="watchlist" />
      </section>
      {total === 0 ? (
        <EmptyState />
      ) : (
        <>
          <Controls filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} />
          <div data-library-fallback tabIndex={-1} aria-label="Your saved films" style={{ outline:'none' }}>
            {visible.length === 0 ? (
              <FilteredEmpty onShowAll={() => setFilter('all')} />
            ) : (
              <section className="ff-wl-section ff-wl-collection" style={{ padding:'0 88px 72px' }} aria-label="Saved films">
                <div className="ff-wl-grid" role="list">
                  {visible.map(f => <SavedCard key={f.id} f={f} onRemove={onRemove} />)}
                </div>
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// F6.7: honest loading semantics — the skeleton region is a busy status with a
// visually-hidden message, and its decorative placeholders are hidden from SR.
function PageSkeleton() {
  const pulse = { background:'rgba(255,255,255,0.04)' };
  return (
    <div role="status" aria-busy="true" style={{ padding:'80px 88px' }}>
      <span className="sr-only">Loading your watchlist…</span>
      <div aria-hidden="true" className="animate-pulse" style={{ ...pulse, height:14, width:240, borderRadius:999, marginBottom:28 }} />
      <div aria-hidden="true" className="animate-pulse" style={{ background:'rgba(167,139,250,0.10)', height:72, width:'40%', borderRadius:8, marginBottom:48 }} />
      <div aria-hidden="true" className="ff-wl-grid">
        {[0,1,2,3,4].map(i => <div key={i} className="animate-pulse" style={{ ...pulse, aspectRatio:'2/3', borderRadius:6 }} />)}
      </div>
    </div>
  );
}

// Sanitized error (unchanged from F6.3): fixed safe copy + Try-again + Go-to-Home.
function PageError({ onRetry, onHome }) {
  return (
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div role="alert" style={{ textAlign:'center', maxWidth:520 }}>
        <Eyebrow size={10} style={{ marginBottom:18 }}>Watchlist</Eyebrow>
        <h1 style={{ fontFamily:'Outfit, Inter, sans-serif', fontSize:36, fontWeight:500, color:HP.text, margin:'0 0 14px 0', letterSpacing:'-0.025em' }}>We couldn&rsquo;t load your Watchlist.</h1>
        <p style={{ margin:'0 0 28px 0', color:'rgba(250,250,250,0.6)', fontSize:14, lineHeight:1.6 }}>Your saved films are still safe. Try again in a moment.</p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button type="button" onClick={onRetry} className="ff-wl-error-btn" style={{ minHeight:44, padding:'12px 22px', borderRadius:999, background:HP_GRAD, color:'#fff', border:'none', cursor:'pointer', fontFamily:'Outfit', fontSize:14, fontWeight:600 }}>Try again</button>
          <button type="button" onClick={onHome} className="ff-wl-error-btn" style={{ minHeight:44, padding:'12px 22px', borderRadius:999, background:'transparent', color:'rgba(250,250,250,0.85)', border:`1px solid ${HP.border}`, cursor:'pointer', fontFamily:'Outfit', fontSize:14, fontWeight:600 }}>Go to Home</button>
        </div>
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
