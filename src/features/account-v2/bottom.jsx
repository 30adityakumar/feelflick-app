import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { HP, HP_GRAD, CONNECTIONS, PLAN } from './data'
import { SectionHead, Toggle } from './top'
import { useAccountData } from './useAccountData'

// FeelFlick — /account-v2 bottom: Privacy, Connections, Plan, Sessions, Danger zone, Footer.

// ── Privacy (server-backed via user_settings.privacy) ──
function Privacy() {
  const { serverSettings, updatePrivacy } = useAccountData();
  const p = serverSettings?.privacy || {};
  const toggle = (k) => updatePrivacy({ [k]: !p[k] });
  const rows = [
    { k:'profilePublic',      label:'Public profile',       desc:'Anyone with the link can view your DNA' },
    { k:'diaryPublic',        label:'Public diary',         desc:'Your ratings and notes show on your profile' },
    { k:'showOnLeaderboards', label:'Show on taste-match',  desc:'Surface in other users’ taste-twin lists' },
    { k:'shareableCards',     label:'Shareable DNA cards',  desc:'Allow PNG export of your profile' },
    { k:'analytics',          label:'Product analytics',    desc:'Help us improve. Aggregated, no PII.' },
  ];
  return (
    <section style={{ padding:'56px 88px', borderTop:`1px solid ${HP.border}` }}>
      <SectionHead kicker="Privacy" title="Who else gets to look." sub="Everything&rsquo;s off-by-default for new accounts. You opt-in for each surface." />
      <div style={{ borderTop:`1px solid ${HP.border}` }}>
        {rows.map(r => (
          <div key={r.k} style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:24, alignItems:'center', padding:'18px 0', borderBottom:`1px solid ${HP.border}` }}>
            <div>
              <div style={{ fontFamily:'Outfit', fontSize:16, fontWeight:500, color:HP.text, letterSpacing:'-0.01em' }}>{r.label}</div>
              <div style={{ marginTop:3, fontSize:12, color:HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic' }}>
                {r.desc}
              </div>
            </div>
            <Toggle on={!!p[r.k]} onChange={() => toggle(r.k)} ariaLabel={`${p[r.k] ? 'Disable' : 'Enable'} ${r.label}`} />
          </div>
        ))}
      </div>
      <div style={{ marginTop:24, display:'flex', gap:10, flexWrap:'wrap' }}>
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Data export coming soon"
          style={{ padding:'10px 16px', borderRadius:6, background:'rgba(255,255,255,0.06)', border:`1px solid ${HP.borderStrong}`, color:HP.textMuted, fontFamily:'Outfit', fontSize:12, fontWeight:600, letterSpacing:'0.04em', cursor:'not-allowed', opacity:0.65 }}
        >Export my data</button>
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Engine-transparency page coming soon"
          style={{ padding:'10px 16px', borderRadius:6, background:'transparent', border:`1px solid ${HP.border}`, color:HP.textFaint, fontFamily:'Outfit', fontSize:12, fontWeight:600, letterSpacing:'0.04em', cursor:'not-allowed', opacity:0.65 }}
        >What the engine sees</button>
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
    <section style={{ padding:'56px 88px', borderTop:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.012)' }}>
      <SectionHead kicker="Connections" title="Other lives." sub="Pull in watch history and ratings from where you already keep them." />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
        {live.map(c => {
          const on = c.status === 'Connected';
          const disabled = !on; // no third-party integrations shipped; only Google is live
          const title = on
            ? 'Managed via your provider'
            : c.id === 'google' ? 'Sign in with Google to connect' : `${c.name} integration coming soon`;
          return (
            <div key={c.id} style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:18, alignItems:'center', padding:'20px 22px', borderRadius:6, background:'rgba(255,255,255,0.03)', border:`1px solid ${on ? c.tint+'44' : HP.border}` }}>
              <div style={{ width:40, height:40, borderRadius:8, background:`linear-gradient(135deg, ${c.tint}33, ${c.tint}11)`, border:`1px solid ${c.tint}55`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit', fontWeight:700, fontSize:16, color:c.tint }}>
                {c.name.charAt(0)}
              </div>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontFamily:'Outfit', fontSize:15, fontWeight:500, color:HP.text }}>{c.name}</span>
                  {c.primary && <span style={{ padding:'2px 6px', borderRadius:3, background:'rgba(52,211,153,0.12)', border:`1px solid ${HP.green}44`, fontSize:8, color:HP.green, fontFamily:'Outfit', letterSpacing:'0.1em', fontWeight:700, textTransform:'uppercase' }}>Primary</span>}
                </div>
                <div style={{ fontSize:11, color:HP.textMuted, fontFamily:'Outfit', marginTop:2 }}>{c.detail}{c.since && ` · since ${c.since}`}</div>
              </div>
              <button
                type="button"
                disabled={disabled}
                aria-disabled={disabled}
                title={title}
                style={{ padding:'8px 14px', borderRadius:6, background: on ? 'transparent' : HP_GRAD, border: on ? `1px solid ${HP.border}` : 'none', color: on ? HP.textMuted : '#fff', fontFamily:'Outfit', fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.65 : 1 }}
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
function PlanCard() {
  return (
    <section style={{ padding:'56px 88px', borderTop:`1px solid ${HP.border}` }}>
      <SectionHead kicker="Plan" title="What you&rsquo;re on." />
      <div style={{ padding:'32px 36px', borderRadius:8, background:`linear-gradient(135deg, ${HP.purple}11, ${HP.pink}08)`, border:`1px solid ${HP.purple}33`, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-30%', right:'-10%', width:'40%', aspectRatio:1, borderRadius:999, background:`radial-gradient(circle, ${HP.purple}33, transparent 70%)`, filter:'blur(40px)' }} />
        <div style={{ position:'relative', display:'grid', gridTemplateColumns:'1fr auto', gap:36, alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:HP.purple, marginBottom:10 }}>Current plan</div>
            <div style={{ fontFamily:'Outfit', fontSize:32, fontWeight:300, color:HP.text, letterSpacing:'-0.03em', marginBottom:18 }}>
              {PLAN.tier.split('·')[0]}<em style={{ fontStyle:'italic', fontWeight:400, color:HP.textSoft }}>· {PLAN.tier.split('·')[1].trim()}</em>
            </div>
            <ul style={{ margin:0, padding:0, listStyle:'none', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {PLAN.perks.map(p => (
                <li key={p} style={{ display:'inline-flex', alignItems:'center', gap:8, fontFamily:'Outfit, Inter, sans-serif', fontSize:13, color:HP.textSoft }}>
                  <span style={{ width:6, height:6, borderRadius:999, background:HP.green, boxShadow:`0 0 8px ${HP.green}` }} />{p}
                </li>
              ))}
            </ul>
            <p style={{ marginTop:20, fontSize:13, color:HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic', maxWidth:480 }}>{PLAN.upgradeHint}</p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Billing not yet wired"
              style={{ padding:'12px 22px', borderRadius:6, background:'rgba(255,255,255,0.06)', border:`1px solid ${HP.borderStrong}`, color:HP.textMuted, fontFamily:'Outfit', fontSize:12, fontWeight:600, cursor:'not-allowed', opacity:0.65 }}
            >Billing history</button>
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Pro waitlist opens later"
              style={{ padding:'12px 22px', borderRadius:6, background:HP_GRAD, border:'none', color:'#fff', fontFamily:'Outfit', fontSize:12, fontWeight:600, cursor:'not-allowed', opacity:0.55 }}
            >Join Pro waitlist</button>
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
    <section style={{ padding:'56px 88px', borderTop:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.012)' }}>
      <SectionHead kicker="Sessions" title="Where you&rsquo;re signed in." sub="Supabase only exposes the current session to the client. Use sign-out-everywhere to invalidate the others." />
      <div style={{ borderTop:`1px solid ${HP.border}` }}>
        <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto auto', gap:20, alignItems:'center', padding:'18px 0', borderBottom:`1px solid ${HP.border}` }}>
          <div style={{ width:36, height:36, borderRadius:8, background:'rgba(255,255,255,0.05)', border:`1px solid ${HP.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={HP.textSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontFamily:'Outfit', fontSize:15, fontWeight:500, color:HP.text }}>{device}</span>
              <span style={{ padding:'2px 6px', borderRadius:3, background:'rgba(52,211,153,0.12)', border:`1px solid ${HP.green}44`, fontSize:8, color:HP.green, fontFamily:'Outfit', letterSpacing:'0.1em', fontWeight:700, textTransform:'uppercase' }}>This device</span>
            </div>
            <div style={{ fontSize:11, color:HP.textMuted, fontFamily:'Outfit', marginTop:2 }}>{browser}{os ? ` · ${os}` : ''} · {provider}</div>
          </div>
          <div style={{ fontSize:11, color:HP.textFaint, fontFamily:'Outfit', letterSpacing:'0.06em', textTransform:'uppercase' }}>{lastSeen}</div>
          <div style={{ width:80 }} />
        </div>
      </div>
      <button
        type="button"
        onClick={signOutEverywhere}
        disabled={busy}
        style={{ marginTop:20, padding:'10px 16px', borderRadius:6, background:'transparent', border:`1px solid ${HP.red}66`, color:HP.red, fontFamily:'Outfit', fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1 }}
      >{busy ? 'Signing out…' : 'Sign out all other devices'}</button>
    </section>
  );
}

// ── Danger zone (reset DNA + delete via mailto) ─────────────────
function DangerZone() {
  const { authUser } = useAccountData();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function rerunOnboarding() {
    if (!authUser) return;
    try {
      setBusy(true);
      await supabase.from('users').update({ onboarding_complete: false, onboarding_completed_at: null }).eq('id', authUser.id);
      await supabase.auth.updateUser({ data: { onboarding_complete: false, has_onboarded: false } });
      navigate('/onboarding', { replace: true });
    } finally {
      setBusy(false);
    }
  }

  function requestDelete() {
    if (!authUser) return;
    const subject = encodeURIComponent('FeelFlick Account Deletion Request');
    const body = encodeURIComponent(`Please delete my account.\nID: ${authUser.id}\nEmail: ${authUser.email}\n\nI understand this is permanent.`);
    window.location.href = `mailto:hello@feelflick.com?subject=${subject}&body=${body}`;
  }

  return (
    <section style={{ padding:'56px 88px 80px', borderTop:`1px solid ${HP.border}` }}>
      <SectionHead kicker="Danger zone" title="The bridge you can burn." />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        <Danger
          title="Reset taste profile"
          desc="Re-run onboarding. Your existing watches stay logged, but mood weights start from zero."
          cta="Reset DNA"
          color={HP.amber}
          onClick={rerunOnboarding}
          disabled={busy}
        />
        <Danger
          title="Delete account"
          desc="Permanently removes your profile, logs, and DNA. We email you a final export first."
          cta="Delete forever"
          color={HP.red}
          onClick={requestDelete}
          disabled={busy}
        />
      </div>
    </section>
  );
}

function Danger({ title, desc, cta, color, onClick, disabled }) {
  return (
    <div style={{ padding:'24px 26px', borderRadius:6, background:`${color}08`, border:`1px solid ${color}33` }}>
      <div style={{ fontFamily:'Outfit', fontSize:18, fontWeight:500, color:HP.text, letterSpacing:'-0.015em', marginBottom:6 }}>{title}</div>
      <p style={{ margin:'0 0 18px 0', fontSize:13, color:HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', lineHeight:1.55, fontStyle:'italic', textWrap:'pretty' }}>{desc}</p>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{ padding:'10px 16px', borderRadius:6, background:'transparent', border:`1px solid ${color}77`, color, fontFamily:'Outfit', fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', cursor: disabled ? 'wait' : 'pointer', opacity: disabled ? 0.6 : 1 }}
      >{cta}</button>
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
    <footer style={{ padding:'40px 88px 64px', borderTop:`1px solid ${HP.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:'Outfit', flexWrap:'wrap', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:28, height:28, borderRadius:6, background:HP_GRAD, display:'inline-flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:'#fff' }}>FF</div>
        <span style={{ fontSize:13, color:HP.textMuted }}>FeelFlick · Account</span>
      </div>
      <div style={{ display:'flex', gap:24, alignItems:'center' }}>
        <a href="mailto:hello@feelflick.com?subject=Help" style={linkStyle}>Help</a>
        <a href="/privacy" style={linkStyle}>Privacy policy</a>
        <a href="/terms" style={linkStyle}>Terms</a>
        <button type="button" onClick={signOut} style={btnStyle}>Sign out</button>
      </div>
    </footer>
  );
}

export { Privacy, Connections, PlanCard, SessionsCard, DangerZone, AccountFooter }
