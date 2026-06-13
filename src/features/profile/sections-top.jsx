import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import FollowButton from '@/shared/components/FollowButton'
import { USER as USER_DEFAULT, HP, ROSE, RADIUS } from './data'
import { useProfileData } from './useProfileData'
import { classifyProfileMaturity, MATURITY, formatEvidenceSummary, INK_LABEL } from './derive/profilePresentation'

// F7.4 — honest "still forming" copy when there isn't enough canonical evidence for a generated
// identity. NOT styled or framed as a generated reflection.
const FORMING_SUMMARY = 'Your Cinematic DNA is still forming. Watch and rate a few more films to reveal stronger patterns.'

// FeelFlick — /profile · Top sections: masthead, archetype card, mood radar.
// Edit profile + Share my DNA actions live in the masthead corner — the page
// is rendered inside AppShell which already provides the global TopNav.

// "Updated today" / "Updated 5 days ago" / "Updated May 2026" — relative
// label for the masthead eyebrow, driven by editorial.generatedAt. Returns
// null when we have no real timestamp so the secondary text just hides
// instead of lying.
function formatUpdated(isoString) {
  if (!isoString) return null
  const t = new Date(isoString).getTime()
  if (!Number.isFinite(t)) return null
  const diffMs = Date.now() - t
  const day = 24 * 60 * 60 * 1000
  const days = Math.floor(diffMs / day)
  if (days <= 0) return 'Updated today'
  if (days === 1) return 'Updated yesterday'
  if (days < 7) return `Updated ${days} days ago`
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return `Updated ${weeks} week${weeks === 1 ? '' : 's'} ago`
  }
  return `Updated ${new Date(isoString).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
}

// F7.6: the explicit, settled editorial refresh prompt — shown only for an eligible self profile
// whose reflection is missing ('none') or stale/version-mismatched ('stale'). Generation happens
// ONLY on click, never on render. Honest copy; no raw errors; no fabricated progress.
function EditorialRefresh({ status, refreshStatus, onRefresh }) {
  const generating = refreshStatus === 'generating';
  const failed = refreshStatus === 'error';
  const label = status === 'none' ? 'Generate reflection' : 'Refresh reflection';
  const prompt = status === 'none'
    ? 'Generate a reflection from your current film activity.'
    : 'Your taste evidence has changed. Refresh the reflection when you’re ready.';
  const body = generating ? 'Refreshing reflection…' : failed ? 'We couldn’t refresh your reflection. Try again.' : prompt;
  return (
    <div style={{ marginTop:18, maxWidth:720 }}>
      <p style={{ marginBottom:8, fontSize:11.5, color:INK_LABEL, fontFamily:'Inter, sans-serif', letterSpacing:'0.01em' }}>
        <span style={{ color:ROSE, fontWeight:600 }}>FeelFlick reflection</span>
      </p>
      <p style={{ marginBottom:16, fontFamily:'Inter, sans-serif', fontSize:18, color:HP.textSoft, letterSpacing:'-0.01em', lineHeight:1.5 }}>{body}</p>
      {typeof onRefresh === 'function' && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={generating}
          aria-busy={generating}
          className="ff-tap"
          style={{ minHeight:44, padding:'11px 20px', borderRadius:RADIUS.sm, background:generating?'rgba(255,255,255,0.06)':ROSE, color:generating?INK_LABEL:'#fff', border:'none', cursor:generating?'wait':'pointer', fontFamily:'Inter, sans-serif', fontSize:13, fontWeight:600, letterSpacing:'0.02em', opacity:generating?0.85:1 }}
        >{generating ? 'Refreshing…' : label}</button>
      )}
    </div>
  );
}

function Masthead() {
  const navigate = useNavigate();
  const { user, isSelf, viewingUserId, editorial, stats, editorialStatus, refreshStatus, refreshEditorial } = useProfileData();
  const name = user?.name || USER_DEFAULT.name;
  const firstName = (name.split(' ')[0] || '').trim();
  const lastName = name.split(' ').slice(1).join(' ').trim();
  // F7.6: editorialStatus (current | stale | none | forming) — computed in the provider from
  // maturity + TTL + evidence VERSION — decides what the masthead editorial area shows. Only a
  // 'current' (version-matched, fresh, non-forming) reflection renders as the reflection; 'stale'
  // and 'none' show an explicit refresh prompt; 'forming' shows the honest still-forming copy.
  const watchedCount = stats?.filmsLogged ?? user?.filmsLogged ?? 0;
  const ratedCount   = stats?.filmsRated ?? 0;
  const status = editorialStatus || (classifyProfileMaturity({ watchedCount, ratedCount }) === MATURITY.FORMING ? 'forming' : 'none');
  const showCurrent = status === 'current';
  const summary    = showCurrent ? editorial?.summary : null;
  const signature  = showCurrent ? (editorial?.signature || null) : null;
  const evidenceLine = formatEvidenceSummary({ watchedCount, ratedCount });
  // The deterministic archetype is always real (computed locally from taste signals); show it
  // once there's any signal, distinct from the generated prose.
  const archetype  = Array.isArray(editorial?.archetype) && editorial.archetype.length === 3
    ? editorial.archetype
    : USER_DEFAULT.archetype;
  // "Updated [N days] ago" — driven by the real editorial regen timestamp, not
  // a hardcoded "Vol. I · Updated today" string.
  const updatedLabel = formatUpdated(editorial?.generatedAt);

  const handleShareDNA = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name}'s Cinematic DNA on FeelFlick`,
          text: `"${summary}"`,
          url,
        });
        return;
      } catch {
        // user cancelled — fall through to clipboard
      }
    }
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(url); } catch { /* silent */ }
    }
  };

  return (
    <section className="ff-profile-section ff-profile-masthead" style={{ padding:'80px 88px 24px', position:'relative' }}>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 70% 40% at 20% 0%, rgba(221,78,131,0.12), transparent 60%), radial-gradient(ellipse 60% 30% at 90% 0%, rgba(221,78,131,0.12), transparent 60%)' }} />

      {/* Top row: eyebrow on left, page actions on right */}
      <div className="ff-profile-masthead-actions-row" style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, marginBottom:30 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.32em', textTransform:'uppercase', color:ROSE }}>Cinematic DNA</div>
          {updatedLabel && (
            <>
              <div style={{ height:1, width:38, background:ROSE, opacity:0.5 }} />
              <div style={{ fontSize:10, fontWeight:500, letterSpacing:'0.18em', textTransform:'uppercase', color:INK_LABEL, fontFamily:'Inter, sans-serif' }}>{updatedLabel}</div>
            </>
          )}
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {isSelf ? (
            <>
              <button
                onClick={() => navigate('/account')}
                style={{ padding:'8px 14px', borderRadius:RADIUS.sm, background:'rgba(255,255,255,0.05)', border:`1px solid ${HP.border}`, color:HP.textSoft, fontFamily:'Inter, sans-serif', fontSize:12, fontWeight:600, letterSpacing:'0.04em', cursor:'pointer' }}
              >Edit profile</button>
              <button
                onClick={handleShareDNA}
                style={{ padding:'8px 14px', borderRadius:RADIUS.sm, background:ROSE, border:'none', color:'#fff', fontFamily:'Inter, sans-serif', fontSize:12, fontWeight:600, letterSpacing:'0.04em', cursor:'pointer', boxShadow:'0 8px 22px -8px rgba(221,78,131,0.35)' }}
              >Share my DNA →</button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate(-1)}
                style={{ padding:'8px 14px', borderRadius:RADIUS.sm, background:'rgba(255,255,255,0.05)', border:`1px solid ${HP.border}`, color:HP.textSoft, fontFamily:'Inter, sans-serif', fontSize:12, fontWeight:600, letterSpacing:'0.04em', cursor:'pointer' }}
              >← Back</button>
              {viewingUserId && <FollowButton userId={viewingUserId} size="sm" />}
            </>
          )}
        </div>
      </div>

      <div className="ff-profile-masthead-grid" style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:48, alignItems:'flex-end' }}>
        {/* Avatar — gradient ring with photo or initial fallback */}
        <div style={{ position:'relative', width:120, height:120 }}>
          <div style={{ position:'absolute', inset:-6, borderRadius:RADIUS.pill, background:ROSE, opacity:0.5, filter:'blur(18px)' }} />
          <div style={{ position:'relative', width:'100%', height:'100%', borderRadius:RADIUS.pill, background:ROSE, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif', fontWeight:500, fontSize:64, color:'#fff', letterSpacing:'-0.04em', boxShadow:'0 24px 60px -12px rgba(0,0,0,0.7)', overflow:'hidden' }}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            ) : (
              user?.initial || USER_DEFAULT.initial
            )}
          </div>
        </div>

        <div>
          <h1 className="ff-profile-masthead-h1" style={{ fontFamily:'var(--font-editorial)', fontSize:96, lineHeight:0.92, fontWeight:400, letterSpacing:'-0.055em', color:HP.text, margin:0, textWrap:'balance' }}>
            {firstName}{lastName && <> <em style={{ fontStyle:'italic', fontWeight:400, color:HP.textSoft }}>{lastName}</em></>}.
          </h1>
          {status === 'current' ? (
            <>
              <p id="ff-dna-summary" className="ff-profile-masthead-summary" aria-describedby="ff-dna-provenance" style={{ marginTop:18, fontFamily:'Inter, sans-serif', fontSize:21, fontStyle:'italic', color:HP.textSoft, letterSpacing:'-0.012em', maxWidth:720, textWrap:'pretty' }}>
                “{summary}”
              </p>
              <p id="ff-dna-provenance" style={{ marginTop:10, fontSize:11.5, color:INK_LABEL, fontFamily:'Inter, sans-serif', letterSpacing:'0.01em', maxWidth:720 }}>
                <span style={{ color:ROSE, fontWeight:600 }}>FeelFlick reflection</span> — a generated interpretation of your film activity, not a measured fact.
              </p>
            </>
          ) : status === 'forming' ? (
            <p className="ff-profile-masthead-summary" style={{ marginTop:18, fontFamily:'Inter, sans-serif', fontSize:20, color:INK_LABEL, letterSpacing:'-0.012em', maxWidth:720, textWrap:'pretty', lineHeight:1.5 }}>
              {FORMING_SUMMARY}
            </p>
          ) : (
            <EditorialRefresh status={status} refreshStatus={refreshStatus} onRefresh={isSelf ? refreshEditorial : undefined} />
          )}
          {/* F7.6: one persistent polite/atomic live region — announces a settled refresh once. */}
          <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
            {refreshStatus === 'success' ? 'Your FeelFlick reflection is updated.'
              : refreshStatus === 'error' ? 'We couldn’t refresh your reflection. Try again.'
              : ''}
          </div>
          {evidenceLine && (
            <p style={{ marginTop:14, fontSize:12, color:INK_LABEL, fontFamily:'Inter, sans-serif', letterSpacing:'0.03em' }}>{evidenceLine}</p>
          )}
          <div style={{ marginTop:20, display:'flex', alignItems:'center', gap:14, fontSize:11, color:INK_LABEL, fontFamily:'Inter, sans-serif', letterSpacing:'0.08em', textTransform:'uppercase', flexWrap:'wrap' }}>
            <span>{user?.handle || USER_DEFAULT.handle}</span>
            <span style={{ width:3, height:3, borderRadius:RADIUS.pill, background:HP.textFaint }} />
            <span>Joined {user?.joined || USER_DEFAULT.joined}</span>
            <span style={{ width:3, height:3, borderRadius:RADIUS.pill, background:HP.textFaint }} />
            <span><span style={{ color:HP.text, fontWeight:600 }}>{user?.filmsLogged ?? 0}</span> films logged</span>
            <span style={{ width:3, height:3, borderRadius:RADIUS.pill, background:HP.textFaint }} />
            <span><span style={{ color:HP.text, fontWeight:600 }}>{user?.hoursWatched ?? 0}h</span> watched</span>
          </div>
        </div>

        {/* Archetype card — deterministic taxonomy from taste fingerprint */}
        <div style={{ padding:'22px 26px', borderRadius:RADIUS.sm, background:'rgba(255,255,255,0.025)', border:`1px solid ${HP.border}`, minWidth:240 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:ROSE, marginBottom:14 }}>Taste pattern</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {archetype.map((a, i) => (
              <div key={a} style={{ fontFamily:'Inter, sans-serif', fontSize:i===0?20:16, fontWeight:i===0?500:400, color:i===0?HP.text:HP.textSoft, fontStyle:i===0?'normal':'italic', letterSpacing:'-0.015em' }}>{a}</div>
            ))}
          </div>
          {/* F7.4: clarify this is computed locally from real signals — derived, not generated. */}
          <div style={{ marginTop:14, fontSize:10.5, color:INK_LABEL, fontFamily:'Inter, sans-serif', fontStyle:'italic', letterSpacing:'0.01em' }}>Derived from your film signals</div>
        </div>
      </div>

      {/* Signature — LLM-generated short caption. F7.4: rendered ONLY above the maturity floor
          (signature is null when forming) and labelled as a FeelFlick reflection. */}
      {signature && (
        <div style={{ marginTop:64, paddingTop:48, borderTop:`1px solid ${HP.border}` }}>
          <p className="ff-profile-signature" style={{ fontFamily:'var(--font-editorial)', fontSize:64, lineHeight:1.05, fontWeight:400, letterSpacing:'-0.04em', color:HP.text, margin:0, textWrap:'balance', textAlign:'center' }}>
            <em style={{ fontStyle:'italic', color:ROSE }}>{signature}</em>
          </p>
          <p style={{ marginTop:18, textAlign:'center', fontSize:11, color:INK_LABEL, fontFamily:'Inter, sans-serif', letterSpacing:'0.03em' }}>
            <span style={{ color:ROSE, fontWeight:600 }}>FeelFlick reflection</span> — generated from your film signals, not a measured fact.
          </p>
        </div>
      )}
    </section>
  );
}

// Quick stats — 4 big numbers, live from derived stats
function QuickStats() {
  const { stats } = useProfileData();
  if (!stats) return null;
  // DNA confidence moved to its own framed section (DnaConfidence.jsx, F7) — a
  // bare "78% · high" stat read like an accuracy grade / a score of the user.
  // These three remain plain counts.
  const items = [
    { label:'Films logged',    value: stats.filmsLogged,        sub:'all time' },
    { label:'Hours watched',   value: `${stats.hoursWatched}h`, sub:'all time' },
    { label:'This month',      value: stats.filmsThisMonth,     sub:'films' },
  ];
  return (
    <section className="ff-profile-section" style={{ padding:'40px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div className="ff-profile-stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:48 }}>
        {items.map((s, i) => (
          <div key={s.label} className="ff-profile-stat-cell" style={{ borderLeft:i===0?'none':`1px solid ${HP.border}`, paddingLeft:i===0?0:32 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:INK_LABEL, fontFamily:'Inter, sans-serif', marginBottom:10 }}>{s.label}</div>
            <div className="ff-profile-stat-value" style={{ fontFamily:'Inter, sans-serif', fontSize:56, fontWeight:200, color:HP.text, letterSpacing:'-0.045em', lineHeight:1 }}>{s.value}</div>
            <div style={{ marginTop:6, fontSize:11, color:HP.textSoft, fontFamily:'Inter, sans-serif', fontStyle:'italic', letterSpacing:'0.02em' }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Mood Radar — derived from taste_fingerprint via useProfileData
// F7.5: rank descriptor instead of an unexplained raw weight (e.g. "74").
const moodRank = (i) => (i === 0 ? 'strongest signal' : i < 3 ? 'strong signal' : 'developing signal');

function MoodRadar() {
  const { moods, stats } = useProfileData();
  const [in_, setIn] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setIn(true); }, { threshold:0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  if (!moods || moods.length < 3) return null;

  const n = moods.length, cx=200, cy=200, R=140;
  const pts = (ws) => moods.map((_,i) => {
    const a = -Math.PI/2 + (i/n)*Math.PI*2;
    return [cx + Math.cos(a)*R*ws[i], cy + Math.sin(a)*R*ws[i]];
  });
  const path = (p) => p.map((q,i) => (i===0?'M':'L')+q[0].toFixed(1)+','+q[1].toFixed(1)).join(' ')+' Z';
  const target = moods.map(m => m.weight);
  const anim = in_ ? target : moods.map(()=>0);

  return (
    <section ref={ref} aria-labelledby="ff-mood-title" className="ff-profile-section" style={{ padding:'88px', borderTop:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.012)' }}>
      <div className="ff-profile-mood-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr', gap:80, alignItems:'center' }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:ROSE, marginBottom:18, display:'inline-flex', alignItems:'center', gap:10 }}>
            <span aria-hidden="true" style={{ height:1, width:22, background:ROSE, opacity:0.6 }} />Mood signature
          </div>
          <h2 id="ff-mood-title" className="ff-profile-section-h2" style={{ fontFamily:'var(--font-editorial)', fontSize:52, lineHeight:1, fontWeight:400, letterSpacing:'-0.04em', color:HP.text, margin:0, textWrap:'balance' }}>
            How you <em style={{ fontStyle:'italic', fontWeight:400, color:HP.textSoft }}>feel cinema.</em>
          </h2>
          {/* F7.5: the ordered mood list IS the chart's text equivalent — strongest-first, with
              each film count as the denominator and a rank word instead of a raw weight number. */}
          <p id="ff-mood-summary" style={{ marginTop:18, fontSize:15, lineHeight:1.7, color:INK_LABEL, fontFamily:'Inter, sans-serif', maxWidth:380 }}>
            Your strongest film-tone signals are {moods.slice(0,3).map(m => m.name).join(', ')}{stats?.filmsLogged ? ` — derived from ${stats.filmsLogged} watched film${stats.filmsLogged === 1 ? '' : 's'}, patterns rather than measured facts` : ''}.
          </p>
          <ol style={{ marginTop:24, display:'flex', flexDirection:'column', gap:8, listStyle:'none', padding:0 }}>
            {moods.map((m, i) => (
              <li key={m.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderRadius:RADIUS.sm }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span aria-hidden="true" style={{ width:8, height:8, borderRadius:RADIUS.pill, background:m.hex }} />
                  <span style={{ fontFamily:'Inter, sans-serif', fontSize:14, fontWeight:500, color:HP.text }}>{m.name}</span>
                  <span style={{ fontSize:11, color:INK_LABEL, fontFamily:'Inter, sans-serif' }}>· {m.count} film{m.count === 1 ? '' : 's'}</span>
                </div>
                <span style={{ fontFamily:'Inter, sans-serif', fontSize:12, color:INK_LABEL, letterSpacing:'0.02em' }}>{moodRank(i)}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Decorative geometry — the ordered list above is the accessible equivalent. */}
        <figure aria-labelledby="ff-mood-title" aria-describedby="ff-mood-summary" className="ff-profile-mood-radar" style={{ position:'relative', width:420, height:420, margin:'0 auto' }}>
          <svg aria-hidden="true" viewBox="0 0 400 400" style={{ width:'100%', height:'100%' }}>
            {[0.25,0.5,0.75,1].map((r,i) => {
              const p = moods.map((_,j) => {
                const a = -Math.PI/2 + (j/n)*Math.PI*2;
                return [cx+Math.cos(a)*R*r, cy+Math.sin(a)*R*r];
              });
              return <path key={i} d={path(p)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
            })}
            {moods.map((_,i) => {
              const a = -Math.PI/2 + (i/n)*Math.PI*2;
              return <line key={i} x1={cx} y1={cy} x2={cx+Math.cos(a)*R} y2={cy+Math.sin(a)*R} stroke="rgba(255,255,255,0.08)" />;
            })}
            <defs>
              <linearGradient id="dnaShape" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={ROSE} stopOpacity="0.42" />
                <stop offset="100%" stopColor={HP.pink} stopOpacity="0.28" />
              </linearGradient>
            </defs>
            <path d={path(pts(anim))} fill="url(#dnaShape)" stroke={ROSE} strokeWidth="1.8" />
            {pts(anim).map((q,i) => <circle key={i} cx={q[0]} cy={q[1]} r="5" fill={moods[i].hex} style={{ filter:`drop-shadow(0 0 8px ${moods[i].hex})` }} />)}
            {moods.map((m,i) => {
              const a = -Math.PI/2 + (i/n)*Math.PI*2;
              return <text key={i} x={cx+Math.cos(a)*(R+28)} y={cy+Math.sin(a)*(R+28)} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily:'Inter, sans-serif', fontSize:13, fontWeight:500, fill:HP.textSoft, letterSpacing:'0.02em' }}>{m.name}</text>;
            })}
          </svg>
        </figure>
      </div>
    </section>
  );
}
export { Masthead, QuickStats, MoodRadar }
