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
      profile?.name ||
      authUser?.user_metadata?.name ||
      authUser?.email?.split('@')[0] ||
      'User'
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
        .update({
          onboarding_complete: false,
          onboarding_completed_at: null,
        })
        .eq('id', authUser.id)

      await supabase.auth.updateUser({
        data: {
          onboarding_complete: false,
          has_onboarded: false,
        },
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

      await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', authUser.id)

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <UserIcon className="h-12 w-12 md:h-16 md:w-16 text-white/20 mb-3 md:mb-4" />
        <h2 className="text-lg md:text-xl font-bold text-white mb-2">You're signed out</h2>
        <button
          onClick={() => nav('/auth/login')}
          className="mt-4 px-6 py-2.5 md:px-8 md:py-3 text-sm md:text-base rounded-xl font-semibold text-white transition-all active:scale-95"
          style={{ background: BTN_GRAD }}
        >
          Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 pb-20">
      {/* Page Title - Mobile Only */}
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6 md:mb-8">
        Account
      </h1>

      {/* Success/Error Message */}
      {msg && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-white/10 border border-white/20 flex items-center gap-2 sm:gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 flex-shrink-0" />
          <p className="text-xs sm:text-sm text-white">{msg}</p>
        </div>
      )}

      {/* Profile Section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-white mb-4 sm:mb-6">
          Profile
        </h2>

        {/* Avatar */}
        <div className="flex items-start gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="relative flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name || 'User'}
                className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full object-cover ring-2 ring-white/20"
              />
            ) : (
              <div
                className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full flex items-center justify-center text-white font-bold text-xl sm:text-2xl md:text-3xl"
                style={{ background: BTN_GRAD }}
              >
                {initials}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 sm:bottom-0 sm:right-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/10 hover:bg-white/20 border-2 border-[#0a0a0a] flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onPickFile}
              className="hidden"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-white truncate">
              {name || 'No name set'}
            </h3>
            <p className="text-xs sm:text-sm text-white/60 mt-1 truncate">{authUser.email}</p>
            <p className="text-xs text-white/40 mt-1 sm:mt-2">
              Manage your profile and account preferences
            </p>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-white/80 mb-1.5 sm:mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 sm:px-8 sm:py-3 text-sm sm:text-base rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: BTN_GRAD }}
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
      </div>

      {/* Security Section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
          <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
          Security
        </h2>

        <div className="space-y-3 sm:space-y-4">
          <button
            onClick={openResetPassword}
            disabled={busy}
            className="w-full flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-[0.99] disabled:opacity-50 text-left"
          >
            <div className="flex items-center gap-3">
              <Key className="h-4 w-4 sm:h-5 sm:w-5 text-white/60" />
              <div>
                <div className="text-sm sm:text-base font-medium text-white">Change Password</div>
                <div className="text-xs text-white/50 mt-0.5">Update your password</div>
              </div>
            </div>
          </button>

          <button
            onClick={signOutEverywhere}
            disabled={busy}
            className="w-full flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-[0.99] disabled:opacity-50 text-left"
          >
            <div className="flex items-center gap-3">
              {busy ? (
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-white/60 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5 text-white/60" />
              )}
              <div>
                <div className="text-sm sm:text-base font-medium text-white">
                  Sign Out Everywhere
                </div>
                <div className="text-xs text-white/50 mt-0.5">
                  End all sessions on all devices
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-white mb-4 sm:mb-6">
          Preferences
        </h2>

        <button
          onClick={rerunOnboarding}
          disabled={busy}
          className="w-full flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-[0.99] disabled:opacity-50 text-left"
        >
          <div className="flex items-center gap-3">
            <RefreshCcw className="h-4 w-4 sm:h-5 sm:w-5 text-white/60" />
            <div>
              <div className="text-sm sm:text-base font-medium text-white">
                Re-run Onboarding
              </div>
              <div className="text-xs text-white/50 mt-0.5">
                Update your movie preferences
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 backdrop-blur-sm rounded-2xl border border-red-500/20 p-4 sm:p-6 md:p-8">
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-red-400 mb-3 sm:mb-4">
          Danger Zone
        </h2>

        <div className="mb-3 sm:mb-4">
          <p className="text-xs sm:text-sm text-white/60">
            Permanently delete your account. This action cannot be undone.
          </p>
        </div>

        <button
          onClick={requestDelete}
          className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-2.5 text-sm sm:text-base rounded-xl font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Request Account Deletion
        </button>
      </div>

      {/* Sign Out Button - Bottom */}
      <div className="mt-6 sm:mt-8">
        <button
          onClick={signOut}
          disabled={busy}
          className="w-full px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
