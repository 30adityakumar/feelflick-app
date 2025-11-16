// src/app/header/components/Account.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import {
  Camera,
  Loader2,
  CheckCircle2,
  LogOut,
  Shield,
  Key,
  RefreshCcw,
  Trash2,
  User as UserIcon,
} from 'lucide-react'

const BTN_GRAD = 'linear-gradient(90deg,#fe9245 10%,#eb423b 90%)'

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
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!mounted) return
      setAuthUser(user || null)
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select(
          'name,email,avatar_url,signup_source,joined_at,onboarding_complete,onboarding_completed_at'
        )
        .eq('id', user.id)
        .maybeSingle()
      setProfile(data || null)
      setName(data?.name || user.user_metadata?.name || '')
      setAvatarUrl(data?.avatar_url || '')
    })()
    return () => {
      mounted = false
    }
  }, [])

  const initials = useMemo(() => {
    const base =
      profile?.name || authUser?.user_metadata?.name || authUser?.email?.split('@')[0] || 'User'
    return (
      base
        .trim()
        .split(/\s+/)
        .map((s) => s[0]?.toUpperCase())
        .slice(0, 2)
        .join('') || 'U'
    )
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
          avatar_url: avatarUrl || null,
        })
      }
      setMsg('Profile updated successfully!')
    } catch (e) {
      console.warn('Account save error', e)
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
      console.warn('Global signout error', e)
      await supabase.auth.signOut()
      nav('/', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  function openResetPassword() {
    nav('/auth/reset-password')
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
        data: { onboarding_complete: false, has_onboarded: false },
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
      const up = await supabase.storage.from('avatars').upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      })
      if (up.error) {
        console.warn('Avatar upload error:', up.error.message)
        setMsg('Could not upload avatar.')
        return
      }
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = pub?.publicUrl || ''
      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', authUser.id)
      setAvatarUrl(publicUrl)
      setMsg('Avatar updated!')
    } catch (e) {
      console.warn('Avatar error', e)
      setMsg('Could not update avatar.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
      setTimeout(() => setMsg(''), 2000)
    }
  }

  function requestDelete() {
    const subject = encodeURIComponent('FeelFlick – Account deletion request')
    const body = encodeURIComponent(
      `Please delete my account.\n\nUser ID: ${authUser?.id}\nEmail: ${authUser?.email}\n\nI understand this action is permanent.`
    )
    window.location.href = `mailto:hello@feelflick.com?subject=${subject}&body=${body}`
  }

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="text-center">
          <UserIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-white/20 mb-4" />
          <p className="text-white/60 text-sm sm:text-base">You're signed out.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24 md:pb-8">
      {/* Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
            Account Settings
          </h1>
          <p className="text-sm sm:text-base text-white/60">
            Manage your profile and account preferences
          </p>
        </div>

        {/* Success/Error Message */}
        {msg && (
          <div
            className={`mb-6 flex items-center gap-2 sm:gap-3 rounded-xl px-4 py-3 sm:px-5 sm:py-4 ${
              msg.includes('success')
                ? 'bg-green-500/10 border border-green-500/20'
                : 'bg-red-500/10 border border-red-500/20'
            } animate-in fade-in slide-in-from-top-2 duration-300`}
          >
            {msg.includes('success') && (
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 flex-shrink-0" />
            )}
            <p
              className={`text-xs sm:text-sm font-medium ${
                msg.includes('success') ? 'text-green-200' : 'text-red-200'
              }`}
            >
              {msg}
            </p>
          </div>
        )}

        {/* Profile Section */}
        <section className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Profile
          </h2>

          {/* Avatar Upload */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full object-cover ring-2 ring-white/20 group-hover:ring-white/40 transition-all"
                />
              ) : (
                <div className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full bg-gradient-to-br from-[#FF9245] to-[#EB423B] flex items-center justify-center text-white text-2xl sm:text-3xl md:text-4xl font-bold ring-2 ring-white/20 group-hover:ring-white/40 transition-all">
                  {initials}
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-full">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-white" />
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading || busy}
                className="absolute bottom-0 right-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-[#FF9245] to-[#EB423B] text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Change avatar"
              >
                <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onPickFile}
                className="hidden"
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
                {profile?.name || authUser?.user_metadata?.name || 'User'}
              </h3>
              <p className="text-xs sm:text-sm text-white/60 mb-3 break-all">{authUser.email}</p>
              <p className="text-xs text-white/40">
                Click the camera icon to change your profile picture
              </p>
            </div>
          </div>

          {/* Name Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-xs sm:text-sm font-medium text-white/70 mb-2"
              >
                Display Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-white/40 focus:outline-none focus:border-[#FF9245] focus:ring-1 focus:ring-[#FF9245] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={saving || busy}
              style={{ background: BTN_GRAD }}
              className="w-full sm:w-auto px-6 py-2.5 sm:px-8 sm:py-3 rounded-lg sm:rounded-xl text-white text-sm sm:text-base font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </form>
        </section>

        {/* Security Section */}
        <section className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </h2>

          <div className="space-y-3 sm:space-y-4">
            <ActionButton
              icon={Key}
              label="Reset Password"
              description="Change your password via email"
              onClick={openResetPassword}
              disabled={busy}
            />

            <ActionButton
              icon={LogOut}
              label="Sign Out Everywhere"
              description="Sign out from all devices"
              onClick={signOutEverywhere}
              disabled={busy}
              variant="warning"
            />
          </div>
        </section>

        {/* Preferences Section */}
        <section className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
            <RefreshCcw className="h-5 w-5" />
            Preferences
          </h2>

          <ActionButton
            icon={RefreshCcw}
            label="Redo Onboarding"
            description="Restart the setup process"
            onClick={rerunOnboarding}
            disabled={busy}
          />
        </section>

        {/* Danger Zone */}
        <section className="bg-red-500/10 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-red-500/20 p-4 sm:p-6 md:p-8">
          <h2 className="text-lg sm:text-xl font-bold text-red-400 mb-2 flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mb-4 sm:mb-6">
            Permanently delete your account. This action cannot be undone.
          </p>

          <button
            onClick={requestDelete}
            disabled={busy}
            className="w-full sm:w-auto px-6 py-2.5 sm:px-8 sm:py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg sm:rounded-xl text-red-300 text-sm sm:text-base font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Request Account Deletion
          </button>
        </section>
      </div>
    </div>
  )
}

/* ===== Action Button Component ===== */
function ActionButton({ icon: Icon, label, description, onClick, disabled, variant = 'default' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
        variant === 'warning'
          ? 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20'
          : 'bg-white/5 border-white/10 hover:bg-white/10'
      }`}
    >
      <div
        className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
          variant === 'warning' ? 'bg-orange-500/20' : 'bg-white/10'
        }`}
      >
        <Icon className={`h-5 w-5 ${variant === 'warning' ? 'text-orange-400' : 'text-white/80'}`} />
      </div>
      <div className="flex-1 text-left">
        <div className="text-sm sm:text-base font-semibold text-white">{label}</div>
        <div className="text-xs sm:text-sm text-white/60 mt-0.5">{description}</div>
      </div>
    </button>
  )
}
