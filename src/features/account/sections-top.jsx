import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { formatMonthYear } from '@/shared/lib/format/date'
import Eyebrow from '@/shared/ui/Eyebrow'
import { HP, HP_GRAD } from './data'
import { useAccountData } from './useAccountData'

// FeelFlick — /account-v2 top: Masthead, IdentityCard, Notifications.
// Engine + display knobs live in /preferences ("The dials"). Account is for
// identity / plan / privacy / sessions only.

// ── Masthead — single kicker bar; the URL/nav already say "Account" ──
function Masthead() {
  return (
    <section className="ff-acct-section ff-acct-section--masthead" style={{ padding:'40px 88px 12px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
        <Eyebrow spacing="0.32em" size={10}>Account</Eyebrow>
        <div style={{ height:1, width:38, background:HP.purple, opacity:0.5 }} />
        <Eyebrow tone="meta" weight={500} size={10}>Identity, privacy, plan</Eyebrow>
      </div>
    </section>
  );
}

// ── Identity card (live name save + avatar upload, ported from Account.jsx) ──
function IdentityCard() {
  const { authUser, profile, stats, refresh } = useAccountData();
  const [name, setName] = useState(profile?.name || authUser?.user_metadata?.name || '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || authUser?.user_metadata?.avatar_url || '');
  const [toast, setToast] = useState(null);  // { text, ok }
  const fileRef = useRef(null);

  // Keep local state in sync if context refreshes
  useEffect(() => {
    setName(profile?.name || authUser?.user_metadata?.name || '');
    setAvatarUrl(profile?.avatar_url || authUser?.user_metadata?.avatar_url || '');
  }, [profile, authUser]);

  const initials = useMemo(() => {
    const base = profile?.name || authUser?.user_metadata?.name || authUser?.email?.split('@')[0] || 'U';
    return base.trim().split(' ').map(s => s[0]?.toUpperCase()).slice(0, 2).join('');
  }, [profile, authUser]);

  function flash(text, ok = true) {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 2400);
  }

  async function saveName() {
    if (!authUser || saving) return;
    setEditing(false);
    if (name === (profile?.name || '')) return;  // no change
    setSaving(true);
    try {
      const { data: existing } = await supabase.from('users').select('id').eq('id', authUser.id).maybeSingle();
      if (existing) {
        await supabase.from('users').update({ name }).eq('id', authUser.id);
      } else {
        await supabase.from('users').insert({ id: authUser.id, name, email: authUser.email, avatar_url: avatarUrl || null });
      }
      await supabase.auth.updateUser({ data: { name } });
      flash('Name updated');
      refresh();
    } catch {
      flash('Could not save. Please try again.', false);
    } finally {
      setSaving(false);
    }
  }

  async function onPickFile(e) {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;
    try {
      setUploading(true);
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${authUser.id}.${ext}`;
      const { error: upError } = await supabase.storage.from('avatars').upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type });
      if (upError) throw upError;
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = pub?.publicUrl;
      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', authUser.id);
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      setAvatarUrl(publicUrl);
      flash('Photo updated');
      refresh();
    } catch {
      flash('Could not update photo.', false);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const joinedDate = formatMonthYear(profile?.joined_at) || formatMonthYear(authUser?.created_at) || '—';

  return (
    <section className="ff-acct-section ff-acct-section--body" style={{ padding:'40px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div className="ff-acct-identity" style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:36, alignItems:'center' }}>
        <div style={{ position:'relative', width:96, height:96 }}>
          <div style={{ position:'absolute', inset:-4, borderRadius:999, background:HP_GRAD, opacity:0.5, filter:'blur(14px)' }} />
          <div style={{ position:'relative', width:'100%', height:'100%', borderRadius:999, background:HP_GRAD, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit', fontWeight:300, fontSize:52, color:'#0a0510', letterSpacing:'-0.04em', overflow:'hidden' }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : initials
            }
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Change profile photo"
            title="Change photo"
            style={{ position:'absolute', bottom:-2, right:-2, width:32, height:32, borderRadius:999, background:'#fff', border:`2px solid ${HP.bgDeep}`, cursor: uploading ? 'wait' : 'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(0,0,0,0.5)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={HP.purpleDeep} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {uploading
                ? <circle cx="12" cy="12" r="9" />
                : <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>}
            </svg>
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display:'none' }} onChange={onPickFile} />
        </div>
        <div>
          {editing ? (
            <input
              value={name}
              onChange={e=>setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditing(false); }}
              aria-label="Display name"
              style={{ fontFamily:'Outfit', fontSize:32, fontWeight:500, color:HP.text, background:'transparent', border:'none', borderBottom:`2px solid ${HP.purple}`, outline:'none', letterSpacing:'-0.02em', padding:'4px 2px', minWidth:280 }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Edit display name"
              style={{ background:'none', border:'none', padding:0, font:'inherit', color:'inherit', cursor:'text', fontFamily:'Outfit', fontSize:32, fontWeight:500, letterSpacing:'-0.02em', display:'inline-block' }}
            >
              {name || authUser?.email}
            </button>
          )}
          {saving && <span style={{ marginLeft:14, fontSize:11, color:HP.textFaint, fontFamily:'Outfit', letterSpacing:'0.08em', textTransform:'uppercase' }}>Saving…</span>}
          <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:14, fontSize:12, color:HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.04em', flexWrap:'wrap' }}>
            <span className="ff-acct-email">{authUser?.email}</span>
            <span style={{ width:3, height:3, borderRadius:999, background:HP.textFaint }} />
            <span>Member since {joinedDate}</span>
          </div>
          <div style={{ marginTop:14, display:'flex', gap:14, alignItems:'center' }}>
            <Link to="/profile" className="ff-tap-hit" style={{ fontSize:11, color:HP.purple, fontFamily:'Outfit', letterSpacing:'0.06em', textTransform:'uppercase', fontWeight:600, textDecoration:'none' }}>View my profile →</Link>
            {toast && (
              <span style={{ fontSize:11, color: toast.ok ? HP.green : HP.red, fontFamily:'Outfit', letterSpacing:'0.06em', textTransform:'uppercase', fontWeight:600 }}>
                {toast.ok ? '✓ ' : '⚠ '}{toast.text}
              </span>
            )}
          </div>
        </div>
        <div className="ff-acct-identity__stats" style={{ display:'grid', gridTemplateColumns:'auto auto auto', gap:32, padding:'18px 24px', borderRadius:6, background:'rgba(255,255,255,0.025)', border:`1px solid ${HP.border}` }}>
          <Stat n={stats?.filmsLogged ?? 0}        label="Films" />
          <Stat n={stats?.hoursWatched ?? 0}       label="Hours" />
          <Stat n={(stats?.dnaConfidence ?? 0) + '%'} label="DNA" />
        </div>
      </div>
    </section>
  );
}
function Stat({ n, label }) {
  return (
    <div>
      <div style={{ fontFamily:'Outfit', fontSize:28, fontWeight:200, color:HP.text, letterSpacing:'-0.035em', lineHeight:1 }}>{n}</div>
      <Eyebrow tone="meta" size={9} style={{ marginTop:4 }}>{label}</Eyebrow>
    </div>
  );
}

// ── Section header ──────────────────────────────────────────────
function SectionHead({ kicker, title, sub }) {
  return (
    <div style={{ marginBottom:24 }}>
      <Eyebrow rule size={10} style={{ marginBottom:12 }}>{kicker}</Eyebrow>
      <h2 style={{ fontFamily:'Outfit', fontSize:36, lineHeight:1, fontWeight:500, letterSpacing:'-0.03em', color:HP.text, margin:0, textWrap:'balance' }}>{title}</h2>
      {sub && <p style={{ marginTop:12, fontSize:13.5, color:HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', lineHeight:1.55, maxWidth:540 }}>{sub}</p>}
    </div>
  );
}

// ── Notifications (server-backed via user_settings.notifications) ──
function Notifications() {
  const { serverSettings, updateNotifications } = useAccountData();
  const items = serverSettings?.notifications || [];
  const toggle = (id) => {
    const next = items.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x);
    updateNotifications(next);
  };
  return (
    <section className="ff-acct-section ff-acct-section--body" style={{ padding:'56px 88px', borderTop:`1px solid ${HP.border}` }}>
      <SectionHead kicker="Notifications" title="What we ping you about." sub="The default is quiet on purpose. Turn things on as you grow into the app." />
      <div style={{ borderTop:`1px solid ${HP.border}` }}>
        {items.map(n => (
          <div key={n.id} className="ff-acct-notif-row" style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:24, alignItems:'center', padding:'18px 0', borderBottom:`1px solid ${HP.border}` }}>
            <div>
              <div style={{ fontFamily:'Outfit', fontSize:16, fontWeight:500, color:HP.text, letterSpacing:'-0.01em', display:'inline-flex', alignItems:'center', gap:10 }}>
                {n.label}
                {n.badge && <span style={{ padding:'2px 7px', borderRadius:3, background:'rgba(167,139,250,0.18)', border:`1px solid ${HP.purple}33`, fontSize:9, color:HP.purple, fontFamily:'Outfit', letterSpacing:'0.1em', fontWeight:700, textTransform:'uppercase' }}>{n.badge}</span>}
              </div>
              <div style={{ marginTop:3, fontSize:12, color:HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic' }}>{n.desc}</div>
            </div>
            <div className="ff-acct-notif-row__state" style={{ fontSize:11, color:HP.textFaint, fontFamily:'Outfit', letterSpacing:'0.08em', textTransform:'uppercase' }}>{n.enabled?'On':'Off'}</div>
            <Toggle on={n.enabled} onChange={() => toggle(n.id)} ariaLabel={`${n.enabled ? 'Disable' : 'Enable'} ${n.label}`} />
          </div>
        ))}
      </div>
    </section>
  );
}

function Toggle({ on, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={Boolean(on)}
      aria-label={ariaLabel}
      className="ff-tap-hit"
      style={{ width:44, height:24, borderRadius:999, background: on ? HP_GRAD : 'rgba(255,255,255,0.08)', border:'none', position:'relative', cursor:'pointer', transition:'background 0.25s ease', padding:0 }}
    >
      <span style={{ position:'absolute', top:3, left: on ? 22 : 3, width:18, height:18, borderRadius:999, background:'#fff', transition:'left 0.25s ease', boxShadow:'0 2px 8px rgba(0,0,0,0.4)' }} />
    </button>
  );
}

export { Masthead, IdentityCard, Notifications, SectionHead, Toggle }
