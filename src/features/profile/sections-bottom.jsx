import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toPng } from 'html-to-image'
import { HP, HP_GRAD, RADIUS, USER as USER_DEFAULT } from './data'
import { ActionButton, SecondaryActionButton } from '@/shared/components/ActionButton'
import { useProfileData } from './useProfileData'

// FeelFlick — /profile · Directors, Motifs, Trajectory, Decades+Runtime, Mixtape, Skew, Friends, Share card, Footer.
// All sections read the live context and self-hide when their data source is
// empty. F7: the Skew + YIR sections no longer fall back to fabricated sample
// values — they self-hide when there's no real comparison / watch signal.

// Reset-button style for elements that need to be focusable buttons without
// inheriting browser default button chrome.
const RESET_BTN = {
  background:'none', border:'none', padding:0, margin:0, font:'inherit',
  color:'inherit', textAlign:'left', cursor:'pointer', display:'block', width:'100%',
};

// Signature directors — top by watch count, optional avg rating (1-5 from 1-10)
function SignatureDirectors() {
  const { directors } = useProfileData();
  if (!directors || directors.length === 0) return null;
  return (
    <section className="ff-profile-section" style={{ padding:'80px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:40 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:HP.purple, marginBottom:14, display:'inline-flex', alignItems:'center', gap:10 }}>
            <span style={{ height:1, width:22, background:HP.purple, opacity:0.6 }} />Signature directors
          </div>
          <h2 className="ff-profile-section-h2" style={{ fontFamily:'Outfit', fontSize:44, lineHeight:1, fontWeight:500, letterSpacing:'-0.035em', color:HP.text, margin:0 }}>
            The voices you <em style={{ fontStyle:'italic', fontWeight:400, color:HP.textSoft }}>trust.</em>
          </h2>
        </div>
      </div>
      <div className="ff-profile-directors-grid" style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(directors.length, 5)},1fr)`, gap:20 }}>
        {directors.map(d => (
          <div key={d.name} style={{ padding:'24px 22px', borderRadius:RADIUS.sm, background:'rgba(255,255,255,0.025)', border:`1px solid ${HP.border}`, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-30, right:-30, width:100, height:100, borderRadius:RADIUS.pill, background:`radial-gradient(circle, ${d.accent}33, transparent 70%)` }} />
            <div style={{ position:'relative' }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:14 }}>
                {d.avg != null ? (
                  <>
                    <span style={{ fontFamily:'Outfit', fontSize:30, fontWeight:200, color:d.accent, letterSpacing:'-0.04em', lineHeight:1 }}>{d.avg}</span>
                    <span style={{ fontSize:11, color:HP.textMuted, fontFamily:'Outfit' }}>★ avg</span>
                  </>
                ) : d.firstWatchedYear ? (
                  <>
                    <span style={{ fontFamily:'Outfit', fontSize:30, fontWeight:200, color:d.accent, letterSpacing:'-0.04em', lineHeight:1 }}>{d.firstWatchedYear}</span>
                    <span style={{ fontSize:11, color:HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.04em' }}>since</span>
                  </>
                ) : (
                  <span style={{ fontSize:11, color:HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.06em', textTransform:'uppercase' }}>unrated</span>
                )}
              </div>
              <div style={{ fontFamily:'Outfit', fontSize:17, fontWeight:500, color:HP.text, letterSpacing:'-0.015em', marginBottom:4 }}>{d.name}</div>
              <div style={{ fontSize:11, color:HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.06em', textTransform:'uppercase' }}>
                {d.films} film{d.films === 1 ? '' : 's'} watched
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Motif cloud — size by frequency in your watch history's mood_tags
function MotifCloud() {
  const { motifs } = useProfileData();
  if (!motifs || motifs.length === 0) return null;
  return (
    <section className="ff-profile-section" style={{ padding:'80px 88px', borderTop:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.012)' }}>
      <div className="ff-profile-motifs-grid" style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:80, alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:HP.purple, marginBottom:18 }}>Recurring motifs</div>
          <h2 className="ff-profile-section-h2" style={{ fontFamily:'Outfit', fontSize:44, lineHeight:1, fontWeight:500, letterSpacing:'-0.035em', color:HP.text, margin:0 }}>What you <em style={{ fontStyle:'italic', fontWeight:400, color:HP.textSoft }}>keep finding.</em></h2>
          <p style={{ marginTop:18, fontSize:14, color:HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', lineHeight:1.65, maxWidth:340 }}>Tonal qualities that show up across what you&rsquo;ve watched &mdash; not how films feel, but how they&rsquo;re made. Bigger means stronger pull.</p>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'14px 18px', alignItems:'baseline' }}>
          {motifs.map(m => {
            const size = 14 + m.w * 22;
            return (
              <span key={m.tag} style={{ fontFamily:'Outfit', fontSize:size, fontWeight: m.w > 0.7 ? 500 : 400, color: m.w > 0.7 ? HP.text : HP.textSoft, letterSpacing:'-0.015em', opacity: 0.5 + m.w*0.5 }}>
                {m.tag}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Trajectory — bar chart toggling between "Year" (last 12 months) and "All
// time" (one bar per distinct calendar year). Both series come from the
// hook as pure-derived arrays of { label, count, mood, hex }.
function Trajectory() {
  const { trajectory, trajectoryAllTime } = useProfileData();
  const [range, setRange] = useState('Year');
  const yearSeries    = trajectory || [];
  const allTimeSeries = trajectoryAllTime || [];
  // "All time" is only meaningful with 2+ distinct years — otherwise it
  // collapses to a single bar and the toggle adds nothing.
  const allTimeAvailable = allTimeSeries.length >= 2;
  const series = (range === 'All time' && allTimeAvailable) ? allTimeSeries : yearSeries;
  if (!series.length || series.every(t => t.count === 0)) return null;
  const max = Math.max(1, ...series.map(t => t.count));
  const heading = range === 'All time'
    ? <>Every <em style={{ fontStyle:'italic', fontWeight:400, color:HP.textSoft }}>year so far.</em></>
    : <>The <em style={{ fontStyle:'italic', fontWeight:400, color:HP.textSoft }}>last twelve.</em></>;
  return (
    <section className="ff-profile-section" style={{ padding:'80px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:44 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:HP.purple, marginBottom:14, display:'inline-flex', alignItems:'center', gap:10 }}>
            <span style={{ height:1, width:22, background:HP.purple, opacity:0.6 }} />Taste trajectory
          </div>
          <h2 className="ff-profile-section-h2" style={{ fontFamily:'Outfit', fontSize:44, lineHeight:1, fontWeight:500, letterSpacing:'-0.035em', color:HP.text, margin:0 }}>{heading}</h2>
        </div>
        {/* Only render the toggle when "All time" is actually informative
            (≥2 distinct years). Otherwise hide it so users don't tap into
            an identical chart. */}
        {allTimeAvailable && (
          <div role="radiogroup" aria-label="Time range" style={{ display:'inline-flex', borderRadius:RADIUS.pill, background:'rgba(255,255,255,0.04)', border:`1px solid ${HP.border}`, padding:3 }}>
            {['Year','All time'].map(p => {
              const active = range === p;
              return (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setRange(p)}
                  style={{ padding:'7px 14px', borderRadius:RADIUS.pill, background:active?HP_GRAD:'transparent', color:active?'#fff':HP.textMuted, border:'none', cursor:'pointer', fontFamily:'Outfit', fontSize:11, fontWeight:600, letterSpacing:'0.04em' }}
                >{p}</button>
              );
            })}
          </div>
        )}
      </div>
      <div className="ff-profile-trajectory-bars" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:14, height:240 }}>
        {series.map((t, i) => {
          const h = (t.count / max) * 100;
          return (
            <div key={`${t.label}-${i}`} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
              <div style={{ width:'100%', display:'flex', alignItems:'flex-end', justifyContent:'center', height:200 }}>
                <div style={{ width:'100%', maxWidth:48, height:`${h}%`, background:`linear-gradient(180deg, ${t.hex}, ${t.hex}77)`, borderRadius:'4px 4px 0 0', boxShadow:`0 0 16px ${t.hex}33`, transition:'height 1s cubic-bezier(0.2,0.8,0.2,1)' }} />
              </div>
              <div className="ff-profile-trajectory-label" style={{ fontFamily:'Outfit', fontSize:11, color:HP.textMuted, letterSpacing:'0.08em', textTransform:'uppercase' }}>{t.label}</div>
              <div className="ff-profile-trajectory-count" style={{ fontFamily:'Outfit', fontSize:11, color:HP.text, fontWeight:600 }}>{t.count}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Decades + Runtime + Daypart — derived from live history
function PatternPanel() {
  const { decades, runtime, daypart } = useProfileData();
  if ((!decades || decades.length === 0) && !runtime && (!daypart || daypart.length === 0)) return null;
  const dayTone = (() => {
    if (!daypart?.length) return null;
    const top = [...daypart].sort((a, b) => b.pct - a.pct)[0];
    if (!top) return null;
    if (top.label === 'Late')      return 'You’re a late-night creature.';
    if (top.label === 'Evening')   return 'Prime-time is your prime time.';
    if (top.label === 'Afternoon') return 'You watch in daylight — unusual.';
    return 'Morning person, cinematically.';
  })();
  return (
    <section className="ff-profile-section" style={{ padding:'80px 88px', borderTop:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.012)' }}>
      <div className="ff-profile-pattern-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:48 }}>
        {/* Decades */}
        {decades && decades.length > 0 && (
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:HP.purple, marginBottom:14 }}>Decade lean</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {decades.map(d => (
                <div key={d.d}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
                    <span style={{ fontFamily:'Outfit', fontSize:14, color:HP.text, fontWeight:500 }}>{d.d}</span>
                    <span style={{ fontFamily:'Outfit', fontSize:12, color:HP.textMuted }}>{d.pct}%</span>
                  </div>
                  <div style={{ height:2, background:'rgba(255,255,255,0.06)', borderRadius:RADIUS.pill, overflow:'hidden' }}>
                    <div style={{ width:`${d.pct}%`, height:'100%', background:HP.purple, opacity:0.7 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Runtime */}
        {runtime && (
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:HP.purple, marginBottom:14 }}>Runtime sweet spot</div>
            <div style={{ fontFamily:'Outfit', fontSize:72, fontWeight:200, color:HP.text, letterSpacing:'-0.045em', lineHeight:1 }}>{runtime.median}<span style={{ fontSize:18, color:HP.textMuted, marginLeft:4 }}>min</span></div>
            <div style={{ marginTop:8, fontSize:12, color:HP.textSoft, fontFamily:'Outfit', fontStyle:'italic' }}>median · {runtime.band} band · {Math.round(runtime.share*100)}% of films</div>
            <div style={{ marginTop:20, paddingTop:18, borderTop:`1px solid ${HP.border}`, fontSize:12, color:HP.textMuted, fontFamily:'Outfit', display:'flex', flexDirection:'column', gap:6 }}>
              <div>Shortest: <span style={{ color:HP.textSoft }}>{runtime.shortest.title} · {runtime.shortest.value}m</span></div>
              <div>Longest: <span style={{ color:HP.textSoft }}>{runtime.longest.title} · {runtime.longest.value}m</span></div>
            </div>
          </div>
        )}

        {/* Daypart */}
        {daypart && daypart.length > 0 && (
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:HP.purple, marginBottom:14 }}>When you watch</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {daypart.map(d => (
                <div key={d.label}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
                    <span style={{ fontFamily:'Outfit', fontSize:14, color:HP.text }}>{d.label}</span>
                    <span style={{ fontFamily:'Outfit', fontSize:12, color:HP.textMuted }}>{d.pct}%</span>
                  </div>
                  <div style={{ height:2, background:'rgba(255,255,255,0.06)', borderRadius:RADIUS.pill, overflow:'hidden' }}>
                    <div style={{ width:`${d.pct}%`, height:'100%', background:HP.pink, opacity:0.7 }} />
                  </div>
                </div>
              ))}
            </div>
            {dayTone && (
              <div style={{ marginTop:16, fontSize:11, color:HP.textFaint, fontFamily:'Outfit', fontStyle:'italic' }}>
                {dayTone}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// Mixtape — top-5 films you rated 4.5★+ (rating ≥ 9 on the 1-10 scale)
function Mixtape() {
  const navigate = useNavigate();
  const { mixtape } = useProfileData();
  if (!mixtape || mixtape.length === 0) return null;
  return (
    <section className="ff-profile-section" style={{ padding:'88px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div style={{ marginBottom:36 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:HP.purple, marginBottom:14, display:'inline-flex', alignItems:'center', gap:10 }}>
          <span style={{ height:1, width:22, background:HP.purple, opacity:0.6 }} />Your mixtape
        </div>
        <h2 className="ff-profile-section-h2" style={{ fontFamily:'Outfit', fontSize:52, lineHeight:1, fontWeight:500, letterSpacing:'-0.04em', color:HP.text, margin:0, textWrap:'balance' }}>
          {mixtape.length === 1 ? (
            <>One film <em style={{ fontStyle:'italic', fontWeight:400, color:HP.textSoft }}>so far.</em></>
          ) : (
            <>{mixtape.length === 5 ? 'Five' : mixtape.length} films <em style={{ fontStyle:'italic', fontWeight:400, color:HP.textSoft }}>that define you.</em></>
          )}
        </h2>
        {mixtape.length < 5 && (
          <p style={{ marginTop:14, fontSize:13, color:HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic' }}>
            Rate {5 - mixtape.length} more film{(5 - mixtape.length) === 1 ? '' : 's'} 4.5★+ to fill your mixtape.
          </p>
        )}
      </div>
      {/* Always 5 columns — the grid stays consistent, empty slots are placeholders so cards never blow up. */}
      <div className="ff-profile-mixtape-grid" style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:18 }}>
        {mixtape.map((f, i) => (
          <button
            key={f.tmdbId || f.title}
            type="button"
            onClick={() => f.tmdbId && navigate(`/movie/${f.tmdbId}`)}
            aria-label={`Open ${f.title}${f.year ? ` (${f.year})` : ''}`}
            style={{ ...RESET_BTN }}
          >
            <div style={{ position:'relative', borderRadius:RADIUS.sm, overflow:'hidden', marginBottom:14, boxShadow:'0 16px 36px -12px rgba(0,0,0,0.6)' }}>
              {f.poster ? (
                <img src={f.poster} alt={f.title} style={{ width:'100%', aspectRatio:'2/3', objectFit:'cover', display:'block' }} />
              ) : (
                <div style={{ width:'100%', aspectRatio:'2/3', background:'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', color:HP.textFaint, fontFamily:'Outfit', fontSize:18, padding:14, textAlign:'center' }}>{f.title}</div>
              )}
              <div style={{ position:'absolute', top:10, left:10, padding:'4px 8px', borderRadius:3, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)', border:`1px solid ${HP.amber}55`, fontSize:9, fontWeight:700, color:HP.amber, fontFamily:'Outfit', letterSpacing:'0.06em' }}>{f.rating}★</div>
              <div style={{ position:'absolute', top:10, right:10, fontFamily:'Outfit', fontSize:24, fontWeight:300, color:'#fff', letterSpacing:'-0.04em', textShadow:'0 2px 12px rgba(0,0,0,0.5)' }}>0{i+1}</div>
            </div>
            <div style={{ fontFamily:'Outfit', fontSize:16, fontWeight:500, color:HP.text, letterSpacing:'-0.015em' }}>{f.title}</div>
            <div style={{ fontSize:11, color:HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.04em', marginTop:3, marginBottom:10 }}>
              {f.year}{f.dir && f.dir !== '—' ? ` · ${f.dir}` : ''}
            </div>
            {f.why && (
              <span style={{ display:'block', margin:0, fontSize:12, lineHeight:1.55, color:HP.textSoft, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic' }}>&ldquo;{f.why}&rdquo;</span>
            )}
          </button>
        ))}
        {/* Empty placeholder slots so a partial mixtape doesn't stretch cards full-width. */}
        {Array.from({ length: Math.max(0, 5 - mixtape.length) }).map((_, idx) => (
          <div
            key={`empty-${idx}`}
            aria-hidden
            style={{ borderRadius:RADIUS.sm, border:`1px dashed ${HP.border}`, aspectRatio:'2/3', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit', fontSize:11, color:HP.textFaint, letterSpacing:'0.12em', textTransform:'uppercase', textAlign:'center', padding:14 }}
          >
            Rate 4.5★+<br/>to fill
          </div>
        ))}
      </div>
    </section>
  );
}

// How you skew vs the FF median — live from feelflick_stats. F7: the old static
// SKEWS sample fallback ("Darker — you 73 vs them 50") is gone; we self-hide when
// there's neither a real per-user comparison nor a real community-mood signal,
// rather than fabricate "you vs everyone" bars for a user with no data.
function Skew() {
  const { skews, communityMood } = useProfileData();
  const rows = Array.isArray(skews) ? skews : [];
  const hasSkew = rows.length > 0;
  const hasCommunity = Boolean(communityMood?.tag);
  if (!hasSkew && !hasCommunity) return null;
  return (
    <section className="ff-profile-section" style={{ padding:'80px 88px', borderTop:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.012)' }}>
      <div className="ff-profile-skew-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:80, alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:HP.purple, marginBottom:14 }}>Vs everyone else</div>
          <h2 className="ff-profile-section-h2" style={{ fontFamily:'Outfit', fontSize:44, lineHeight:1, fontWeight:500, letterSpacing:'-0.035em', color:HP.text, margin:0, textWrap:'balance' }}>How you <em style={{ fontStyle:'italic', fontWeight:400, color:HP.textSoft }}>skew.</em></h2>
          <p style={{ marginTop:18, fontSize:14, color:HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', lineHeight:1.65, maxWidth:340 }}>Versus the median FeelFlick user. Refreshed nightly.</p>
          {communityMood?.tag && (
            <div style={{ marginTop:24, paddingTop:18, borderTop:`1px solid ${HP.border}`, maxWidth:340 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:HP.textMuted, fontFamily:'Outfit', marginBottom:6 }}>This week the room is into</div>
              <div style={{ fontFamily:'Outfit', fontSize:24, fontWeight:500, color:HP.text, letterSpacing:'-0.02em' }}>{communityMood.tag}<span style={{ fontSize:14, color:HP.textMuted, fontStyle:'italic', marginLeft:8 }}>films.</span></div>
            </div>
          )}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {hasSkew ? (
            <>
              {rows.map(s => (
                <div key={s.label} style={{ display:'grid', gridTemplateColumns:'150px 1fr auto', gap:20, alignItems:'center' }}>
                  <div style={{ fontFamily:'Outfit', fontSize:16, fontWeight:500, color:HP.text, letterSpacing:'-0.015em' }}>{s.label}</div>
                  <div style={{ position:'relative', height:6, background:'rgba(255,255,255,0.06)', borderRadius:RADIUS.pill }}>
                    <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${s.you}%`, background:HP_GRAD, borderRadius:RADIUS.pill }} />
                    <div style={{ position:'absolute', left:`${s.them}%`, top:-4, bottom:-4, width:2, background:HP.textFaint }} title="FF median" />
                  </div>
                  <div style={{ fontFamily:'Outfit', fontSize:14, fontWeight:600, color: s.delta >= 0 ? HP.pink : HP.textMuted, letterSpacing:'0.04em' }}>{s.delta >= 0 ? `+${s.delta}` : s.delta}</div>
                </div>
              ))}
              <div style={{ marginTop:14, paddingTop:18, borderTop:`1px solid ${HP.border}`, display:'inline-flex', alignItems:'center', gap:10, fontSize:11, color:HP.textFaint, fontFamily:'Outfit', letterSpacing:'0.08em' }}>
                <span style={{ width:14, height:2, background:HP.textFaint }} />
                <span style={{ textTransform:'uppercase' }}>FF median</span>
                <span style={{ marginLeft:14, width:14, height:2, background:HP_GRAD, borderRadius:RADIUS.pill }} />
                <span style={{ textTransform:'uppercase' }}>You</span>
              </div>
            </>
          ) : (
            <p style={{ fontFamily:'Outfit, Inter, sans-serif', fontSize:14, fontStyle:'italic', color:HP.textMuted, lineHeight:1.6, maxWidth:420 }}>
              Watch and rate a few more films, and your comparison to the room lands here.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// Taste twins — real overlap from user_similarity (bidirectional via
// useProfileData). When the user has no similarity rows yet (new account
// or thin history), we render an explicit empty state with a /people CTA
// instead of falling back to fabricated names — fake social proof is
// explicitly off-limits.
function FriendsRanked() {
  const navigate = useNavigate();
  const { friends } = useProfileData();
  const hasFriends = friends && friends.length > 0;
  return (
    <section className="ff-profile-section" style={{ padding:'72px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div style={{ marginBottom:32 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:HP.purple, marginBottom:14, display:'inline-flex', alignItems:'center', gap:10 }}>
          <span style={{ height:1, width:22, background:HP.purple, opacity:0.6 }} />Taste twins
        </div>
        <h2 className="ff-profile-section-h2" style={{ fontFamily:'Outfit', fontSize:36, lineHeight:1.05, fontWeight:500, letterSpacing:'-0.03em', color:HP.text, margin:0 }}>People who <em style={{ fontStyle:'italic', fontWeight:400, color:HP.textSoft }}>get it.</em></h2>
      </div>
      {hasFriends ? (
        <div className="ff-profile-friends-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:18 }}>
          {friends.map(f => (
            <button
              key={f.userId || f.name}
              type="button"
              onClick={() => navigate('/people')}
              style={{ ...RESET_BTN, padding:'24px 22px', borderRadius:RADIUS.sm, background:'rgba(255,255,255,0.025)', border:`1px solid ${HP.border}`, transition:'border-color 0.18s ease, background 0.18s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = HP.borderStrong; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = HP.border; e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
            >
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                <div style={{ width:44, height:44, borderRadius:RADIUS.pill, background:f.avatarBg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit', fontWeight:700, color:'#0a0510', fontSize:18 }}>{f.initial}</div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'Outfit', fontSize:30, fontWeight:200, color:HP.text, letterSpacing:'-0.04em', lineHeight:1 }}>{f.match}<span style={{ fontSize:13, color:HP.textMuted, marginLeft:1 }}>%</span></div>
                  <div style={{ fontSize:9, color:HP.textFaint, fontFamily:'Outfit', letterSpacing:'0.14em', textTransform:'uppercase' }}>match</div>
                </div>
              </div>
              <div style={{ fontFamily:'Outfit', fontSize:16, fontWeight:500, color:HP.text, letterSpacing:'-0.01em' }}>{f.name}</div>
              <div style={{ fontSize:11, color:HP.textMuted, fontFamily:'Outfit', marginTop:3 }}>{f.films} film{f.films === 1 ? '' : 's'} logged</div>
            </button>
          ))}
        </div>
      ) : (
        <div style={{ padding:'40px 36px', borderRadius:RADIUS.md, background:'rgba(255,255,255,0.025)', border:`1px dashed ${HP.borderStrong}`, display:'flex', flexDirection:'column', alignItems:'flex-start', gap:18 }}>
          <p style={{ margin:0, fontFamily:'Outfit, Inter, sans-serif', fontSize:16, fontStyle:'italic', color:HP.textSoft, maxWidth:520, lineHeight:1.55 }}>
            Twins surface here once your taste overlaps with someone else&rsquo;s &mdash; keep logging films and they&rsquo;ll come.
          </p>
          <button
            type="button"
            onClick={() => navigate('/people')}
            style={{ padding:'10px 18px', borderRadius:RADIUS.sm, background:HP_GRAD, border:'none', color:'#fff', fontFamily:'Outfit', fontSize:12, fontWeight:600, letterSpacing:'0.04em', cursor:'pointer', boxShadow:'0 8px 22px -8px rgba(167,139,250,0.45)' }}
          >Find people on FeelFlick →</button>
        </div>
      )}
    </section>
  );
}

// Shareable card preview — Instagram-story shape
function ShareCard() {
  const { user, editorial } = useProfileData();
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const previewRef = useRef(null);
  const firstName = (user?.name || USER_DEFAULT.name).split(' ')[0];
  const lastName = (user?.name || USER_DEFAULT.name).split(' ').slice(1).join(' ');
  const filmsLogged = user?.filmsLogged ?? USER_DEFAULT.filmsLogged;
  const hoursWatched = user?.hoursWatched ?? USER_DEFAULT.hoursWatched;
  const signature = editorial?.signature || USER_DEFAULT.signature;
  const archetype = Array.isArray(editorial?.archetype) && editorial.archetype.length === 3
    ? editorial.archetype
    : USER_DEFAULT.archetype;
  const handleCopy = async () => {
    if (!navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* silent */ }
  };
  const handleDownload = async () => {
    if (!previewRef.current || exporting) return;
    setExporting(true);
    try {
      // Render the 240px-wide preview at 4.5× pixel density so the export
      // lands at ~1080px wide — fine for IG story / X uploads. cacheBust
      // avoids stale font/image fetches between sessions.
      const dataUrl = await toPng(previewRef.current, {
        pixelRatio: 4.5,
        cacheBust: true,
        backgroundColor: '#06060a',
      });
      const slug = (firstName || 'cinematic').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cinematic';
      const link = document.createElement('a');
      link.download = `${slug}-dna.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('[ShareCard.export]', e);
    } finally {
      setExporting(false);
    }
  };
  return (
    <section className="ff-profile-section" style={{ padding:'80px 88px', borderTop:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.012)' }}>
      <div className="ff-profile-share-grid" style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:64, alignItems:'center' }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:HP.purple, marginBottom:14 }}>Share your DNA</div>
          <h2 className="ff-profile-section-h2" style={{ fontFamily:'Outfit', fontSize:44, lineHeight:1, fontWeight:500, letterSpacing:'-0.035em', color:HP.text, margin:0, textWrap:'balance' }}>
            Card for <em style={{ fontStyle:'italic', fontWeight:400, color:HP.textSoft }}>the feed.</em>
          </h2>
          <p style={{ marginTop:18, fontSize:14, color:HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', lineHeight:1.65, maxWidth:380 }}>
            A 1080×1920 image you can drop straight into Instagram, X, or wherever. Updates every time your DNA shifts.
          </p>
          <div style={{ marginTop:24, display:'flex', gap:10 }}>
            <ActionButton
              onClick={handleDownload}
              disabled={exporting}
              aria-live="polite"
              style={exporting ? { cursor:'wait', opacity:0.7 } : undefined}
            >{exporting ? 'Exporting…' : 'Download PNG'}</ActionButton>
            <SecondaryActionButton
              onClick={handleCopy}
              aria-live="polite"
              label={copied ? 'Copied ✓' : 'Copy link'}
            />
          </div>
        </div>
        {/* Story-shape preview — this is the exact node toPng captures
            (refs the wrapping div). Rendering at 4.5× pixelRatio gives
            a ~1080×1920 export suitable for IG story / X / etc. */}
        <div ref={previewRef} className="ff-profile-share-preview" style={{ width:240, aspectRatio:'9/16', borderRadius:14, padding:'32px 26px', background:'linear-gradient(160deg, #1a0d3a 0%, #06060a 50%, #3a0d1f 100%)', position:'relative', overflow:'hidden', boxShadow:'0 32px 80px -16px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
          <div style={{ position:'absolute', top:'-20%', right:'-30%', width:'80%', aspectRatio:1, borderRadius:RADIUS.pill, background:`radial-gradient(circle, ${HP.purple}66, transparent 65%)`, filter:'blur(20px)' }} />
          <div style={{ position:'absolute', bottom:'-20%', left:'-30%', width:'80%', aspectRatio:1, borderRadius:RADIUS.pill, background:`radial-gradient(circle, ${HP.pink}55, transparent 65%)`, filter:'blur(20px)' }} />
          <div style={{ position:'relative' }}>
            <div style={{ fontSize:7, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:HP.purple, marginBottom:8 }}>FeelFlick · Cinematic DNA</div>
            <div style={{ fontFamily:'Outfit', fontWeight:300, fontSize:28, color:HP.text, letterSpacing:'-0.04em', lineHeight:1 }}>{firstName}{lastName && <><br/><em style={{ fontStyle:'italic', fontWeight:400, color:HP.textSoft }}>{lastName}.</em></>}</div>
          </div>
          <div style={{ position:'relative' }}>
            <div style={{ fontFamily:'Outfit', fontSize:14, fontWeight:400, color:HP.text, fontStyle:'italic', letterSpacing:'-0.01em', lineHeight:1.35, marginBottom:14 }}>
              &ldquo;{signature}&rdquo;
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {archetype.map(a => (
                <span key={a} style={{ padding:'3px 7px', borderRadius:3, background:'rgba(167,139,250,0.18)', border:`1px solid ${HP.purple}55`, fontSize:8, color:HP.text, fontFamily:'Outfit', letterSpacing:'0.06em', textTransform:'uppercase' }}>{a}</span>
              ))}
            </div>
            <div style={{ marginTop:14, display:'flex', alignItems:'baseline', gap:6 }}>
              <span style={{ fontFamily:'Outfit', fontSize:28, fontWeight:200, color:HP.text, letterSpacing:'-0.04em' }}>{filmsLogged}</span>
              <span style={{ fontSize:8, color:HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.14em', textTransform:'uppercase' }}>films logged · {hoursWatched}h</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function YIRBanner() {
  const { stats, yir } = useProfileData();
  // Prefer the live year-in-review derivation, then the real this-month summary.
  // F7: the old fabricated "You binged 18 films in December" sample fallback is
  // gone — self-hide when there's no real watch signal rather than invent one.
  let banner;
  if (yir && yir.bingedMonth?.count > 0) {
    banner = {
      headline: `You binged ${yir.bingedMonth.count} films in ${yir.bingedMonth.month}.`,
      sub: yir.topMoodGrowth?.mood && yir.topMoodGrowth.mood !== '—'
        ? `${yir.topMoodGrowth.mood} climbed ${yir.topMoodGrowth.delta} — ${yir.topMoodGrowth.note}`
        : `${yir.newDirectors} new directors · ${yir.rewatched} rewatched.`,
    };
  } else if (stats && stats.filmsThisMonth > 0) {
    banner = { headline: `You watched ${stats.filmsThisMonth} film${stats.filmsThisMonth === 1 ? '' : 's'} this month.`, sub: `${stats.filmsLogged} total · ${stats.hoursWatched}h logged.` };
  } else {
    return null;
  }
  return (
    <section className="ff-profile-section" style={{ padding:'56px 88px', borderTop:`1px solid ${HP.border}`, background:`linear-gradient(135deg, ${HP.purple}11, ${HP.pink}08)` }}>
      <div className="ff-profile-yir-grid" style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:32, alignItems:'center' }}>
        <div style={{ fontFamily:'Outfit', fontSize:64, fontWeight:200, color:HP.text, letterSpacing:'-0.05em', lineHeight:1, background:HP_GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{new Date().getFullYear()}</div>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:HP.purple, marginBottom:6 }}>Year so far</div>
          <div style={{ fontFamily:'Outfit', fontSize:22, fontWeight:500, color:HP.text, letterSpacing:'-0.02em', marginBottom:6 }}>{banner.headline}</div>
          <div style={{ fontSize:13, color:HP.textSoft, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic' }}>{banner.sub}</div>
        </div>
      </div>
    </section>
  );
}

function ProfileFooter() {
  const linkStyle = { fontSize:12, color:HP.textMuted, letterSpacing:'0.04em', textDecoration:'none', cursor:'pointer' };
  return (
    <footer className="ff-profile-section" style={{ padding:'40px 88px 64px', borderTop:`1px solid ${HP.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:'Outfit', flexWrap:'wrap', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:28, height:28, borderRadius:RADIUS.sm, background:HP_GRAD, display:'inline-flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:'#fff' }}>FF</div>
        <span style={{ fontSize:13, color:HP.textMuted, letterSpacing:'0.04em' }}>FeelFlick · Cinematic DNA</span>
      </div>
      <div style={{ display:'flex', gap:24 }}>
        <a href="/privacy" style={linkStyle}>Privacy</a>
        <a href="/account" style={linkStyle}>Manage data</a>
      </div>
    </footer>
  );
}
export { SignatureDirectors, MotifCloud, Trajectory, PatternPanel, Mixtape, Skew, FriendsRanked, ShareCard, YIRBanner, ProfileFooter }
