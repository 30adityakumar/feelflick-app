import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { formatMonthYear } from '@/shared/lib/format/date'
import { setAnalyticsOptOut } from '@/shared/services/analytics'
import Eyebrow from '@/shared/ui/Eyebrow'
import { HP, ROSE, CONNECTIONS, FOUNDING_CUTOFF } from './data'
import { SectionHead, Toggle } from './sections-top'
import { useAccountData } from './useAccountData'

// FeelFlick — /account-v2 bottom: Privacy, Connections, Plan, Sessions, Danger zone, Footer.

// ── Privacy (server-backed via user_settings.privacy) ──
function Privacy() {
  const { serverSettings, updatePrivacy } = useAccountData();
  const p = serverSettings?.privacy || {};
  const toggle = (k) => {
    const next = !p[k];
    updatePrivacy({ [k]: next });
    // analytics toggle takes effect immediately for the current session;
    // the other toggles take effect on next page load (they gate fetches).
    if (k === 'analytics') setAnalyticsOptOut(!next);
  };
  // F7.2 privacy containment: the "Public profile" / "Public diary" toggles were never
  // enforced by any read path or RLS policy — your DNA and diary are owner-private regardless.
  // Rather than render a control that falsely implies publication, they're removed until a real
  // consent-based public-profile model exists. (showOnLeaderboards IS enforced — it gates
  // taste-match discovery in People — and analytics is enforced immediately; both stay.)
  // F8.2: discovery is now EXPLICIT OPT-IN (default off) and the copy enumerates exactly what
  // becomes visible to other signed-in members.
  const rows = [
    { k:'showOnLeaderboards', label:'Appear in taste-match discovery',  desc:'When on, other signed-in members may see your name, avatar, your top film-taste tags and film count when FeelFlick suggests compatible people. Your watched films, Diary, ratings, reviews and Cinematic DNA reflection stay private.' },
    { k:'analytics',          label:'Product analytics',    desc:'Privacy-safe usage analytics to help us improve. We never send your email, name, search text, reviews, Diary, or Cinematic DNA reflection. May include privacy-masked session replay (all text and inputs masked) to diagnose bugs. Turn off any time.' },
  ];
  return (
    <section className="ff-acct-section ff-acct-section--body" style={{ padding:'56px 88px', borderTop:`1px solid ${HP.border}` }}>
      <SectionHead kicker="Privacy" title="Who else gets to look." sub="Your Cinematic DNA, watch history and ratings are private — visible only to you. Public taste profiles aren&rsquo;t available yet." />
      <div style={{ borderTop:`1px solid ${HP.border}` }}>
        {rows.map(r => (
          <div key={r.k} style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:24, alignItems:'center', padding:'18px 0', borderBottom:`1px solid ${HP.border}` }}>
            <div>
              <div style={{ fontFamily:'Inter, sans-serif', fontSize:16, fontWeight:500, color:HP.text, letterSpacing:'-0.01em' }}>{r.label}</div>
              <div style={{ marginTop:3, fontSize:12, color:HP.textMuted, fontFamily:'Inter, sans-serif', fontStyle:'italic' }}>
                {r.desc}
              </div>
            </div>
            <Toggle on={!!p[r.k]} onChange={() => toggle(r.k)} ariaLabel={`${p[r.k] ? 'Disable' : 'Enable'} ${r.label}`} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Connections (live Google detection + static others) ─────────
function Connections() {
  const { provider, authUser } = useAccountData();
  // Build live list: detect Google from app_metadata.provider; mark others Available.
  const live = CONNECTIONS.map(c => {
    if (c.id === 'google' && provider === 'google') {
      return { ...c, status: 'Connected', detail: authUser?.email || c.detail, primary: true };
    }
    if (c.id === 'google' && provider !== 'google') {
      return { ...c, status: 'Available', detail: 'Connect via Google sign-in', primary: false };
    }
    // letterboxd / netflix / plex — no integration shipped yet
    return { ...c, status: 'Available', primary: false };
  });

  return (
    <section className="ff-acct-section ff-acct-section--body" style={{ padding:'56px 88px', borderTop:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.012)' }}>
      <SectionHead kicker="Connections" title="Other lives." sub="Pull in watch history and ratings from where you already keep them." />
      <div className="ff-acct-grid-2" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
        {live.map(c => {
          const on = c.status === 'Connected';
          const disabled = !on; // no third-party integrations shipped; only Google is live
          const title = on
            ? 'Managed via your provider'
            : c.id === 'google' ? 'Sign in with Google to connect' : `${c.name} integration coming soon`;
          return (
            <div key={c.id} style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:18, alignItems:'center', padding:'20px 22px', borderRadius:6, background:'rgba(255,255,255,0.03)', border:`1px solid ${on ? c.tint+'44' : HP.border}` }}>
              <div style={{ width:40, height:40, borderRadius:8, background:`linear-gradient(135deg, ${c.tint}33, ${c.tint}11)`, border:`1px solid ${c.tint}55`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif', fontWeight:700, fontSize:16, color:c.tint }}>
                {c.name.charAt(0)}
              </div>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontFamily:'Inter, sans-serif', fontSize:15, fontWeight:500, color:HP.text }}>{c.name}</span>
                  {c.primary && <span style={{ padding:'2px 6px', borderRadius:3, background:'rgba(52,211,153,0.12)', border:`1px solid ${HP.green}44`, fontSize:8, color:HP.green, fontFamily:'Inter, sans-serif', letterSpacing:'0.1em', fontWeight:700, textTransform:'uppercase' }}>Primary</span>}
                </div>
                <div style={{ fontSize:11, color:HP.textMuted, fontFamily:'Inter, sans-serif', marginTop:2 }}>{c.detail}{c.since && ` · since ${c.since}`}</div>
              </div>
              <button
                type="button"
                disabled={disabled}
                aria-disabled={disabled}
                title={title}
                style={{ padding:'8px 14px', borderRadius:6, background: on ? 'transparent' : ROSE, border: on ? `1px solid ${HP.border}` : 'none', color: on ? HP.textMuted : '#fff', fontFamily:'Inter, sans-serif', fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.65 : 1 }}
              >
                {on ? 'Manage' : 'Connect'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Plan ────────────────────────────────────────────────────────
// Tier is derived from users.joined_at — anyone who signed up before
// FOUNDING_CUTOFF is grandfathered as "Founding Member" forever; later
// signups read as "Free". No new schema needed until billing ships.
function PlanCard() {
  const { profile, authUser } = useAccountData();
  const joinedAtRaw = profile?.joined_at || authUser?.created_at || null;
  const joinedAt = joinedAtRaw ? new Date(joinedAtRaw) : null;
  const isFounding = joinedAt && joinedAt < FOUNDING_CUTOFF;
  const tier = isFounding ? 'Founding Member' : 'Free';
  const memberSince = formatMonthYear(joinedAtRaw) || '—';
  return (
    <section className="ff-acct-section ff-acct-section--body" style={{ padding:'56px 88px', borderTop:`1px solid ${HP.border}` }}>
      <SectionHead kicker="Plan" title="What you&rsquo;re on." />
      <div className="ff-acct-plan-card" style={{ padding:'32px 36px', borderRadius:8, background:`linear-gradient(135deg, ${ROSE}11, ${HP.pink}08)`, border:`1px solid ${ROSE}33`, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-30%', right:'-10%', width:'40%', aspectRatio:1, borderRadius:999, background:`radial-gradient(circle, ${ROSE}33, transparent 70%)`, filter:'blur(40px)' }} />
        <div style={{ position:'relative' }}>
          <Eyebrow spacing="0.22em" size={10} style={{ marginBottom:10 }}>Current plan</Eyebrow>
          <div className="ff-acct-plan-headline" style={{ fontFamily:'Inter, sans-serif', fontSize:32, fontWeight:300, color:HP.text, letterSpacing:'-0.03em', marginBottom:14 }}>
            {tier}
            {isFounding && (
              <em style={{ fontStyle:'italic', fontWeight:400, color:HP.textSoft, marginLeft:10 }}>· Free, locked in</em>
            )}
          </div>
          <div style={{ fontSize:13, color:HP.textMuted, fontFamily:'Inter, sans-serif' }}>
            Member since {memberSince}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Sessions (current device only + sign out all other devices) ──
function SessionsCard() {
  const { authUser } = useAccountData();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  // We can only see the current session from the client. Render it from auth
  // metadata + the browser UA — anything else needs an admin-side query.
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const browser =
    /Edg\//.test(ua) ? 'Edge' :
    /Chrome\//.test(ua) && !/Edg\//.test(ua) ? 'Chrome' :
    /Safari\//.test(ua) && !/Chrome\//.test(ua) ? 'Safari' :
    /Firefox\//.test(ua) ? 'Firefox' : 'Browser';
  const os =
    /Mac OS X/.test(ua) ? 'macOS' :
    /Windows/.test(ua) ? 'Windows' :
    /Android/.test(ua) ? 'Android' :
    /iPhone|iPad/.test(ua) ? 'iOS' : '';
  const device =
    /iPhone/.test(ua) ? 'iPhone' :
    /iPad/.test(ua) ? 'iPad' :
    /Mac OS X/.test(ua) ? 'Mac' :
    /Windows/.test(ua) ? 'PC' :
    /Android/.test(ua) ? 'Android device' : 'This device';
  const lastSeen = authUser?.last_sign_in_at
    ? new Date(authUser.last_sign_in_at).toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' })
    : 'Now';
  const provider = authUser?.app_metadata?.provider ? `signed in via ${authUser.app_metadata.provider}` : 'signed in';

  async function signOutEverywhere() {
    try {
      setBusy(true);
      await supabase.auth.signOut({ scope: 'global' });
      navigate('/', { replace: true });
    } catch {
      await supabase.auth.signOut();
      navigate('/', { replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ff-acct-section ff-acct-section--body" style={{ padding:'56px 88px', borderTop:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.012)' }}>
      <SectionHead kicker="Sessions" title="Where you&rsquo;re signed in." sub="Supabase only exposes the current session to the client. Use sign-out-everywhere to invalidate the others." />
      <div style={{ borderTop:`1px solid ${HP.border}` }}>
        <div className="ff-acct-session" style={{ display:'grid', gridTemplateColumns:'auto 1fr auto auto', gap:20, alignItems:'center', padding:'18px 0', borderBottom:`1px solid ${HP.border}` }}>
          <div style={{ width:36, height:36, borderRadius:8, background:'rgba(255,255,255,0.05)', border:`1px solid ${HP.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={HP.textSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontFamily:'Inter, sans-serif', fontSize:15, fontWeight:500, color:HP.text }}>{device}</span>
              <span style={{ padding:'2px 6px', borderRadius:3, background:'rgba(52,211,153,0.12)', border:`1px solid ${HP.green}44`, fontSize:8, color:HP.green, fontFamily:'Inter, sans-serif', letterSpacing:'0.1em', fontWeight:700, textTransform:'uppercase' }}>This device</span>
            </div>
            <div style={{ fontSize:11, color:HP.textMuted, fontFamily:'Inter, sans-serif', marginTop:2 }}>{browser}{os ? ` · ${os}` : ''} · {provider}</div>
          </div>
          <div className="ff-acct-session__time" style={{ fontSize:11, color:HP.textFaint, fontFamily:'Inter, sans-serif', letterSpacing:'0.06em', textTransform:'uppercase' }}>{lastSeen}</div>
          <div className="ff-acct-session__spacer" style={{ width:80 }} />
        </div>
      </div>
      <button
        type="button"
        onClick={signOutEverywhere}
        disabled={busy}
        style={{ marginTop:20, padding:'10px 16px', borderRadius:6, background:'transparent', border:`1px solid ${HP.red}66`, color:HP.red, fontFamily:'Inter, sans-serif', fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1 }}
      >{busy ? 'Signing out…' : 'Sign out all other devices'}</button>
    </section>
  );
}

// ── Danger zone (reset DNA + 7-day scheduled delete) ────────────
function DangerZone() {
  const { authUser, pendingDeletion, requestDeletion, cancelDeletion } = useAccountData();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  async function rerunOnboarding() {
    if (!authUser) return;
    try {
      setBusy(true);
      // WHY: clear prior onboarding's footprint so a re-run doesn't stack
      // duplicate rows. Scoped to source='onboarding' so in-app watches/ratings
      // the user logged AFTER onboarding stay intact (matches the button copy).
      await supabase.from('user_ratings').delete().eq('user_id', authUser.id).eq('source', 'onboarding');
      await supabase.from('user_history').delete().eq('user_id', authUser.id).eq('source', 'onboarding');
      await supabase.from('user_preferences').delete().eq('user_id', authUser.id);
      await supabase.from('users').update({
        onboarding_complete: false,
        onboarding_completed_at: null,
        taste_baseline_moods: null,
      }).eq('id', authUser.id);
      await supabase.auth.updateUser({ data: { onboarding_complete: false, has_onboarded: false } });
      navigate('/onboarding', { replace: true });
    } finally {
      setBusy(false);
    }
  }

  async function onCancelDeletion() {
    try {
      setBusy(true);
      await cancelDeletion();
    } finally {
      setBusy(false);
    }
  }

  const isPending = !!pendingDeletion?.scheduled_for;
  const scheduledLabel = isPending
    ? new Date(pendingDeletion.scheduled_for).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
      })
    : null;

  return (
    <section className="ff-acct-section ff-acct-section--danger" style={{ padding:'56px 88px 80px', borderTop:`1px solid ${HP.border}` }}>
      <SectionHead kicker="Danger zone" title="The bridge you can burn." />
      <div className="ff-acct-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        <Danger
          title="Reset taste profile"
          desc="Clears the genres and films you chose during onboarding and starts onboarding over. Films you've logged since then stay in your history."
          cta="Reset DNA"
          color={HP.amber}
          onClick={rerunOnboarding}
          disabled={busy}
          confirmFirst
        />
        {isPending ? (
          <DangerPending
            scheduledLabel={scheduledLabel}
            onCancel={onCancelDeletion}
            disabled={busy}
          />
        ) : (
          <Danger
            title="Delete account"
            desc="Schedule permanent deletion of your profile, logs, and DNA. You'll have 7 days to cancel."
            cta="Delete account"
            color={HP.red}
            onClick={() => setShowDeleteModal(true)}
            disabled={busy}
          />
        )}
      </div>
      {showDeleteModal && (
        <DeleteConfirmModal
          email={authUser?.email}
          busy={busy}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={async (reason) => {
            try {
              setBusy(true);
              await requestDeletion(reason || null);
              setShowDeleteModal(false);
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
    </section>
  );
}

function DangerPending({ scheduledLabel, onCancel, disabled }) {
  return (
    <div style={{ padding:'24px 26px', borderRadius:6, background:`${HP.red}08`, border:`1px solid ${HP.red}33` }}>
      <div style={{ fontFamily:'Inter, sans-serif', fontSize:18, fontWeight:500, color:HP.text, letterSpacing:'-0.015em', marginBottom:6 }}>Deletion scheduled</div>
      <p style={{ margin:'0 0 18px 0', fontSize:13, color:HP.textMuted, fontFamily:'Inter, sans-serif', lineHeight:1.55, fontStyle:'italic' }}>
        Your account will be permanently deleted on <span style={{ color:HP.text, fontStyle:'normal', fontWeight:500 }}>{scheduledLabel}</span>. Cancel anytime before then.
      </p>
      <button
        type="button"
        onClick={onCancel}
        disabled={disabled}
        style={{ padding:'10px 16px', borderRadius:6, background:'transparent', border:`1px solid ${HP.green}77`, color:HP.green, fontFamily:'Inter, sans-serif', fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', cursor: disabled ? 'wait' : 'pointer', opacity: disabled ? 0.6 : 1 }}
      >Cancel deletion</button>
    </div>
  );
}

function DeleteConfirmModal({ email, onCancel, onConfirm, busy = false }) {
  const [typed, setTyped] = useState('');
  const [reason, setReason] = useState('');
  const emailRef = useRef(null);
  const enabled = typed.trim().toLowerCase() === (email || '').trim().toLowerCase();
  // F9.3: focus the first field on open + close on Escape (parity with the shared Modal primitive).
  useEffect(() => { emailRef.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, busy]);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="del-modal-title" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
      <div style={{ maxWidth:520, width:'100%', padding:32, borderRadius:10, background:HP.bgDeep, border:`1px solid ${HP.red}55` }}>
        <h2 id="del-modal-title" style={{ fontFamily:'Inter, sans-serif', fontSize:24, fontWeight:500, color:HP.text, letterSpacing:'-0.02em', margin:'0 0 12px' }}>
          Delete your account?
        </h2>
        <p style={{ margin:'0 0 18px 0', fontSize:14, color:HP.textSoft, fontFamily:'Inter, sans-serif', lineHeight:1.55 }}>
          We&rsquo;ll permanently delete your profile, watches, ratings, lists, and DNA <strong style={{ color:HP.text, fontWeight:600 }}>after 7 days</strong>. You can cancel anytime before then by signing back in.
        </p>
        <label htmlFor="del-confirm-email" style={{ display:'block', fontFamily:'Inter, sans-serif', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:HP.textMuted, marginBottom:8 }}>
          Type your email to confirm
        </label>
        <input
          ref={emailRef}
          id="del-confirm-email"
          type="email"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={email || 'your@email.com'}
          autoComplete="off"
          style={{ width:'100%', padding:'10px 12px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:`1px solid ${HP.border}`, color:HP.text, fontFamily:'Inter, sans-serif', fontSize:14, marginBottom:16 }}
        />
        <label htmlFor="del-reason" style={{ display:'block', fontFamily:'Inter, sans-serif', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:HP.textMuted, marginBottom:8 }}>
          Reason (optional)
        </label>
        <textarea
          id="del-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="What pushed you away?"
          style={{ width:'100%', padding:'10px 12px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:`1px solid ${HP.border}`, color:HP.text, fontFamily:'Inter, sans-serif', fontSize:13, resize:'vertical', marginBottom:24 }}
        />
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{ padding:'12px 22px', borderRadius:6, background:'transparent', border:`1px solid ${HP.borderStrong}`, color:HP.textSoft, fontFamily:'Inter, sans-serif', fontSize:13, fontWeight:600, cursor:'pointer' }}
          >Keep my account</button>
          <button
            type="button"
            onClick={() => onConfirm(reason)}
            disabled={!enabled || busy}
            style={{ padding:'12px 22px', borderRadius:6, background: (enabled && !busy) ? HP.red : 'rgba(255,255,255,0.06)', border:'none', color: (enabled && !busy) ? '#fff' : HP.textFaint, fontFamily:'Inter, sans-serif', fontSize:13, fontWeight:600, cursor: busy ? 'wait' : enabled ? 'pointer' : 'not-allowed' }}
          >{busy ? 'Scheduling…' : 'Schedule deletion'}</button>
        </div>
      </div>
    </div>
  );
}

function Danger({ title, desc, cta, color, onClick, disabled, confirmFirst = false }) {
  // F9.3: confirmFirst adds a two-step confirm for destructive actions that don't open their own modal
  // (e.g. Reset taste profile). The first click arms; a second click within ~3.5s runs the action.
  const [confirming, setConfirming] = useState(false);
  const handleClick = () => {
    if (confirmFirst && !confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3500);
      return;
    }
    setConfirming(false);
    onClick();
  };
  return (
    <div style={{ padding:'24px 26px', borderRadius:6, background:`${color}08`, border:`1px solid ${color}33` }}>
      <div style={{ fontFamily:'Inter, sans-serif', fontSize:18, fontWeight:500, color:HP.text, letterSpacing:'-0.015em', marginBottom:6 }}>{title}</div>
      <p style={{ margin:'0 0 18px 0', fontSize:13, color:HP.textMuted, fontFamily:'Inter, sans-serif', lineHeight:1.55, fontStyle:'italic', textWrap:'pretty' }}>{desc}</p>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        style={{ padding:'10px 16px', borderRadius:6, background: confirming ? `${color}18` : 'transparent', border:`1px solid ${color}77`, color, fontFamily:'Inter, sans-serif', fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', cursor: disabled ? 'wait' : 'pointer', opacity: disabled ? 0.6 : 1 }}
      >{confirming ? `Confirm — ${cta}?` : cta}</button>
    </div>
  );
}

// ── Footer ──────────────────────────────────────────────────────
function AccountFooter() {
  const navigate = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  }
  const linkStyle = { fontSize:12, color:HP.textMuted, letterSpacing:'0.04em', textDecoration:'none', cursor:'pointer' };
  const btnStyle = { ...linkStyle, background:'none', border:'none', padding:0, font:'inherit' };
  return (
    <footer className="ff-acct-section ff-acct-foot" style={{ padding:'40px 88px 64px', borderTop:`1px solid ${HP.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:'Inter, sans-serif', flexWrap:'wrap', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:28, height:28, borderRadius:6, background:ROSE, display:'inline-flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:'#fff', fontFamily:'Inter, sans-serif' }}>FF</div>
        <span style={{ fontSize:13, color:HP.textMuted }}>FeelFlick · Account</span>
      </div>
      <div className="ff-acct-foot__links" style={{ display:'flex', gap:24, alignItems:'center' }}>
        <a href="mailto:hello@feelflick.com?subject=Help" style={linkStyle}>Help</a>
        <a href="/privacy" style={linkStyle}>Privacy policy</a>
        <a href="/terms" style={linkStyle}>Terms</a>
        <button type="button" onClick={signOut} style={btnStyle}>Sign out</button>
      </div>
    </footer>
  );
}

export { Privacy, Connections, PlanCard, SessionsCard, DangerZone, AccountFooter }
