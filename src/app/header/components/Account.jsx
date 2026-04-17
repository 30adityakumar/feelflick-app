// src/app/header/components/Account.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import {
  Camera, Loader2, Check, LogOut, Shield,
  RefreshCcw, Trash2, User as UserIcon, AlertCircle
} from 'lucide-react'

export default function Account() {
  const nav = useNavigate()
  const [authUser, setAuthUser]   = useState(null)
  const [profile, setProfile]     = useState(null)
  const [name, setName]           = useState('')
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState(null) // { text, ok }
  const [busy, setBusy]           = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return
      setAuthUser(user ?? null)
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select('name,email,avatar_url,signup_source,joined_at,onboarding_complete,onboarding_completed_at')
        .eq('id', user.id)
        .maybeSingle()
      setProfile(data ?? null)
      setName(data?.name || user.user_metadata?.name || '')
      setAvatarUrl(data?.avatar_url || user.user_metadata?.avatar_url || '')
    })()
    return () => { mounted = false }
  }, [])

  const initials = useMemo(() => {
    const base = profile?.name || authUser?.user_metadata?.name || authUser?.email?.split('@')[0] || 'U'
    return base.trim().split(' ').map(s => s[0]?.toUpperCase()).slice(0, 2).join('')
  }, [profile, authUser])

  function flash(text, ok = true) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 2800)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!authUser || saving) return
    setSaving(true)
    try {
      const { data: existing } = await supabase.from('users').select('id').eq('id', authUser.id).maybeSingle()
      if (existing) {
        await supabase.from('users').update({ name }).eq('id', authUser.id)
      } else {
        await supabase.from('users').insert({ id: authUser.id, name, email: authUser.email, avatar_url: avatarUrl || null })
      }
      await supabase.auth.updateUser({ data: { name } })
      flash('Name updated')
    } catch {
      flash('Could not save. Please try again.', false)
    } finally {
      setSaving(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    nav('/', { replace: true })
  }

  async function signOutEverywhere() {
    try {
      setBusy(true)
      await supabase.auth.signOut({ scope: 'global' })
      nav('/', { replace: true })
    } catch {
      await supabase.auth.signOut()
      nav('/', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  async function rerunOnboarding() {
    if (!authUser) return
    try {
      setBusy(true)
      await supabase.from('users').update({ onboarding_complete: false, onboarding_completed_at: null }).eq('id', authUser.id)
      await supabase.auth.updateUser({ data: { onboarding_complete: false, has_onboarded: false } })
      nav('/onboarding', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  async function onPickFile(e) {
    const file = e.target.files?.[0]
    if (!file || !authUser) return
    try {
      setUploading(true)
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const path = `${authUser.id}.${ext}`
      const { error: upError } = await supabase.storage.from('avatars').upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type })
      if (upError) throw upError
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = pub?.publicUrl
      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', authUser.id)
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } })
      setAvatarUrl(publicUrl)
      flash('Photo updated')
    } catch {
      flash('Could not update photo.', false)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function requestDelete() {
    const subject = encodeURIComponent('FeelFlick Account Deletion Request')
    const body = encodeURIComponent(`Please delete my account.\nID: ${authUser?.id}\nEmail: ${authUser?.email}\n\nI understand this is permanent.`)
    window.location.href = `mailto:hello@feelflick.com?subject=${subject}&body=${body}`
  }

  if (!authUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="rounded-2xl border border-white/8 bg-white/4 p-8 text-center max-w-sm mx-4">
          <UserIcon className="h-10 w-10 mx-auto text-white/15 mb-4" />
          <p className="text-white/50 text-sm">Sign in to view your account.</p>
        </div>
      </div>
    )
  }

  const joinedDate = profile?.joined_at ? new Date(profile.joined_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null
  const provider = authUser?.app_metadata?.provider || 'email'

  return (
    <div className="min-h-screen bg-black text-white pb-24 md:pb-10 relative" style={{ paddingTop: 'var(--hdr-h, 64px)' }}>

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 35% at 50% 0%, rgba(88,28,135,0.1) 0%, transparent 65%)' }} />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-4">

        {/* Page title */}
        <div className="mb-2">
          <h1 className="text-2xl font-black text-white tracking-tight">Account</h1>
          <p className="text-sm text-white/35 mt-0.5">Manage your profile and settings</p>
        </div>

        {/* ── Profile card ──────────────────────────────────── */}
        <Card>
          <div className="flex items-center gap-5 mb-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 bg-white/10">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-full h-full object-cover block" />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-xl font-black text-white"
                    style={{ background: 'linear-gradient(135deg, rgb(168,85,247), rgb(236,72,153))' }}
                  >
                    {initials}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-0.5 -right-0.5 h-7 w-7 flex items-center justify-center rounded-full bg-white shadow-md hover:scale-105 active:scale-95 transition-all"
                title="Change photo"
                aria-label="Change profile photo"
              >
                {uploading
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
                  : <Camera className="h-3.5 w-3.5 text-purple-600" />}
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onPickFile} />
            </div>

            {/* Name + email */}
            <div className="min-w-0">
              <div className="text-lg font-bold text-white truncate">{name || authUser.email}</div>
              <div className="text-sm text-white/40 truncate">{authUser.email}</div>
              {joinedDate && <div className="text-xs text-white/25 mt-0.5">Member since {joinedDate}</div>}
            </div>
          </div>

          {/* View profile shortcut */}
          <button
            type="button"
            onClick={() => nav('/profile')}
            className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 border border-white/8 hover:border-white/20 px-3 py-1.5 rounded-full transition-all duration-150 mt-1 mb-5"
          >
            View my profile →
          </button>

          {/* Name form */}
          <form onSubmit={handleSave}>
            <label
              htmlFor="account-display-name"
              className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2"
            >
              Display name
            </label>
            <div className="flex gap-2.5">
              <input
                id="account-display-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/15 transition-all"
              />
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-md shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </button>
            </div>
          </form>

          {/* Toast */}
          {msg && (
            <div className={`mt-3 flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg ${
              msg.ok
                ? 'bg-purple-500/10 border border-purple-500/20 text-purple-300'
                : 'bg-red-500/10 border border-red-500/20 text-red-300'
            }`}>
              {msg.ok ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
              {msg.text}
            </div>
          )}
        </Card>

        {/* ── Account details ───────────────────────────────── */}
        <Card title="Details">
          <div className="space-y-2">
            <DetailRow label="Signed in with">
              <span className="capitalize">{provider}</span>
            </DetailRow>
            <DetailRow label="Taste profile">
              {profile?.onboarding_complete
                ? <Link to="/profile" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">View profile →</Link>
                : <Link to="/onboarding" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Set up</Link>}
            </DetailRow>
          </div>

          {/* Reset preferences */}
          <div className="mt-4 flex items-center justify-between rounded-xl border border-white/6 bg-white/[0.025] px-4 py-3.5">
            <div>
              <div className="text-sm font-medium text-white">Reset taste profile</div>
              <div className="text-xs text-white/40 mt-0.5">Re-run genre and film setup</div>
            </div>
            <button
              type="button"
              onClick={rerunOnboarding}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/5 hover:bg-white/10 hover:border-purple-500/30 hover:text-purple-400 px-3 py-1.5 text-xs font-semibold text-white/60 transition-all active:scale-95 disabled:opacity-40"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </Card>

        {/* ── Security ─────────────────────────────────────── */}
        <Card title="Security">
          <div className="space-y-2">
            <ActionRow icon={Shield} label="Sign out all devices" sublabel="Ends all active sessions" onClick={signOutEverywhere} disabled={busy} />
            <ActionRow icon={LogOut} label="Sign out" sublabel="Sign out of this device" onClick={signOut} danger />
          </div>
        </Card>

        {/* ── Danger zone ───────────────────────────────────── */}
        <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.04] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-red-400">Delete account</h3>
              <p className="text-xs text-white/35 mt-0.5">Permanently removes your account and all data. This cannot be undone.</p>
            </div>
            <button
              type="button"
              onClick={requestDelete}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/8 hover:bg-red-500/15 px-4 py-2 text-xs font-semibold text-red-400 transition-all active:scale-95 whitespace-nowrap"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete my account
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 sm:p-6">
      {title && <h2 className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-4">{title}</h2>}
      {children}
    </div>
  )
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/40">{label}</span>
      <span className="text-sm font-medium text-white">{children}</span>
    </div>
  )
}

function ActionRow({ icon: Icon, label, sublabel, onClick, disabled, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-all group active:scale-[0.99] disabled:opacity-40 ${
        danger
          ? 'border-white/6 bg-white/[0.02] hover:bg-red-500/6 hover:border-red-500/15'
          : 'border-white/6 bg-white/[0.02] hover:bg-white/[0.05]'
      }`}
    >
      <Icon className={`h-4 w-4 flex-shrink-0 transition-colors ${danger ? 'text-white/30 group-hover:text-red-400' : 'text-white/30 group-hover:text-white/60'}`} />
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium transition-colors ${danger ? 'text-white/70 group-hover:text-red-400' : 'text-white/80 group-hover:text-white'}`}>{label}</div>
        {sublabel && <div className="text-xs text-white/30 mt-0.5">{sublabel}</div>}
      </div>
      <svg className="h-4 w-4 text-white/15 group-hover:text-white/35 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}
