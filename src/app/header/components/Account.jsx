// src/app/header/components/Account.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { 
  Camera, Loader2, CheckCircle2, LogOut, Shield, Key, 
  RefreshCcw, Trash2, User as UserIcon 
} from 'lucide-react'

export default function Account() {
  const nav = useNavigate()
  const [authUser, setAuthUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
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
      setAvatarUrl(data?.avatar_url || '')
    })()
    return () => { mounted = false }
  }, [])

  const initials = useMemo(() => {
    const base = profile?.name || authUser?.user_metadata?.name || authUser?.email?.split('@')[0] || 'User'
    return base
      .trim()
      .split(' ')
      .map(s => s[0]?.toUpperCase())
      .slice(0, 2)
      .join('')
  }, [profile, authUser])

  async function handleSave(e) {
    e.preventDefault()
    if (!authUser) return
    setSaving(true)
    setMsg('')
    try {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .maybeSingle()

      if (existing) {
        await supabase.from('users').update({ name }).eq('id', authUser.id)
      } else {
        await supabase.from('users').insert({ 
          id: authUser.id, 
          name, 
          email: authUser.email, 
          avatar_url: avatarUrl || null
        })
      }
      
      // Update auth metadata too so header reflects it immediately
      await supabase.auth.updateUser({ data: { name } })
      
      setMsg('Profile updated successfully!')
    } catch (e) {
      console.warn('Account save error:', e)
      setMsg('Could not save. Please try again.')
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(''), 2500)
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
    } catch (e) {
      console.warn('Global signout error:', e)
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
      await supabase
        .from('users')
        .update({ onboarding_complete: false, onboarding_completed_at: null })
        .eq('id', authUser.id)
      
      await supabase.auth.updateUser({
        data: { onboarding_complete: false, has_onboarded: false }
      })
      
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
      
      const { error: upError } = await supabase.storage.from('avatars').upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      })
      
      if (upError) throw upError

      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = pub?.publicUrl

      await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', authUser.id)
      
      // Sync to auth metadata
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } })

      setAvatarUrl(publicUrl)
      setMsg('Avatar updated!')
    } catch (e) {
      console.warn('Avatar error:', e)
      setMsg('Could not update avatar.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
      setTimeout(() => setMsg(''), 2000)
    }
  }

  function requestDelete() {
    const subject = encodeURIComponent("FeelFlick Account Deletion Request")
    const body = encodeURIComponent(`Please delete my account.\nID: ${authUser?.id}\nEmail: ${authUser?.email}\n\nI understand this action is permanent.`)
    window.location.href = `mailto:hello@feelflick.com?subject=${subject}&body=${body}`
  }

  if (!authUser) {
    return (
      <div className="flex items-center justify-center bg-black text-white" style={{ minHeight: 'calc(100vh - var(--hdr-h, 64px))', paddingTop: 'var(--hdr-h, 64px)' }}>
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center max-w-sm mx-4 shadow-2xl">
          <UserIcon className="h-12 w-12 mx-auto text-white/20 mb-4" />
          <p className="text-white/60 text-sm">You need to be signed in to view this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black text-white w-full pb-20 md:pb-10" style={{ paddingTop: 'var(--hdr-h, 80px)', minHeight: '100vh' }}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Account Settings
          </h1>
          <p className="text-sm text-white/60">Manage your profile and preferences</p>
        </div>

        {/* Profile Card */}
        <div className="rounded-2xl border border-white/10 bg-[#111]/50 backdrop-blur-md p-6 mb-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            
            {/* Avatar */}
            <div className="relative flex-shrink-0 group">
              <div 
                className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl font-bold text-white ring-4 ring-black shadow-lg"
                style={{ 
                  background: avatarUrl ? `center/cover url(${avatarUrl})` : undefined 
                }}
              >
                {!avatarUrl && initials}
              </div>
              <button 
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 h-8 w-8 flex items-center justify-center rounded-full bg-white text-black shadow-lg hover:scale-110 transition-all active:scale-95"
                title="Change avatar"
                disabled={uploading}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin text-purple-600" /> : <Camera className="h-4 w-4 text-purple-600" />}
              </button>
              <input 
                ref={fileRef} 
                type="file" 
                accept="image/png,image/jpeg,image/jpg" 
                className="hidden" 
                onChange={onPickFile} 
              />
            </div>

            {/* Profile Form */}
            <div className="flex-1 w-full min-w-0">
              <div className="mb-4">
                <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Email Address</p>
                <p className="text-sm font-medium text-white truncate">{authUser.email}</p>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-1.5">Display Name</label>
                  <div className="flex gap-3">
                    <input 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      placeholder="Your name"
                      className="flex-1 rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    />
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="inline-flex items-center justify-center rounded-xl px-6 py-2.5 text-sm font-bold text-white focus:outline-none transition-all hover:brightness-110 active:scale-95 disabled:opacity-70 disabled:hover:scale-100 bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-900/20"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Success Message */}
              {msg && (
                <div className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 animate-in fade-in slide-in-from-left-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {msg}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="rounded-2xl border border-white/10 bg-[#111]/50 backdrop-blur-md p-6 mb-6 shadow-xl">
          <h2 className="text-lg font-bold mb-4 text-white">Details</h2>
          <div className="grid gap-3 sm:grid-cols-2 mb-4">
            <MetaRow label="Joined">
              {profile?.joined_at ? new Date(profile.joined_at).toLocaleDateString() : '—'}
            </MetaRow>
            <MetaRow label="Provider">
              <span className="capitalize">{authUser?.app_metadata?.provider || 'Email'}</span>
            </MetaRow>
            <MetaRow label="Onboarding">
              {profile?.onboarding_complete ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3" /> Completed
                </span>
              ) : (
                <span className="text-orange-400">Pending</span>
              )}
            </MetaRow>
          </div>

          {/* Re-run Onboarding */}
          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">Reset Preferences</span>
              <span className="text-xs text-white/50">Restart the onboarding process</span>
            </div>
            <button 
              type="button"
              onClick={rerunOnboarding}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-purple-400 border border-white/5 px-3 py-2 text-xs font-semibold transition-all active:scale-95"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Restart
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="rounded-2xl border border-white/10 bg-[#111]/50 backdrop-blur-md p-6 mb-6 shadow-xl">
          <h2 className="text-lg font-bold mb-4 text-white">Security</h2>
          <div className="flex flex-col gap-2">
            <ActionButton icon={Key} label="Change Password" onClick={openResetPassword} />
            <ActionButton 
              icon={Shield} 
              label="Sign Out All Devices" 
              onClick={signOutEverywhere} 
              disabled={busy} 
            />
            <ActionButton 
              icon={LogOut} 
              label="Sign Out" 
              onClick={signOut} 
              className="text-red-400 hover:text-red-300 hover:bg-red-500/5 hover:border-red-500/20"
            />
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-red-400 mb-1">Delete Account</h3>
              <p className="text-xs text-red-200/60">Permanently remove your account and all data.</p>
            </div>
            <button 
              type="button"
              onClick={requestDelete}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 text-xs font-bold text-red-400 transition-all active:scale-95 whitespace-nowrap"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete My Account
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// Helper Components
// ------------------------------------------------------------------

function MetaRow({ label, children }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <span className="text-xs font-bold text-white/40 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium text-white">{children}</span>
    </div>
  )
}

function ActionButton({ icon: Icon, label, onClick, disabled, className = '' }) {
  return (
    <button 
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-between w-full rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] px-4 py-3.5 text-left transition-all group active:scale-[0.99] ${className}`}
    >
      <span className="flex items-center gap-3 text-sm font-medium text-white/90 group-hover:text-white">
        <Icon className={`h-4 w-4 text-white/40 group-hover:text-white/80 transition-colors ${className ? 'text-inherit group-hover:text-inherit' : ''}`} />
        {label}
      </span>
      <svg className="h-4 w-4 text-white/20 group-hover:text-white/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}
