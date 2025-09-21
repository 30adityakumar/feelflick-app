import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

function parseHash() {
  // Supabase sends access_token etc. in the URL hash on recovery
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return {
    type: hash.get('type'),
    access_token: hash.get('access_token'),
    refresh_token: hash.get('refresh_token'),
  }
}

export default function ResetPassword() {
  const [stage, setStage] = useState('request') // 'request' | 'update'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)

  const origin = useMemo(
    () => (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, ''),
    []
  )

  useEffect(() => {
    const { type, access_token } = parseHash()
    if (type === 'recovery' && access_token) {
      // user returned from email → they are already authenticated
      setStage('update')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  async function requestLink(e) {
    e.preventDefault()
    setLoading(true); setErr(null); setMsg(null)
    try {
      if (!email) throw new Error('Enter your email.')
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/reset-password`,
      })
      if (error) throw error
      setMsg('Password reset link sent. Check your inbox.')
    } catch (e) {
      setErr(e.message || 'Could not send reset link.')
    } finally {
      setLoading(false)
    }
  }

  async function updatePassword(e) {
    e.preventDefault()
    setLoading(true); setErr(null); setMsg(null)
    try {
      if (!password || password.length < 8) throw new Error('Use at least 8 characters.')
      if (password !== confirm) throw new Error("Passwords don't match.")
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setMsg('Password updated. You can close this tab and sign in.')
    } catch (e) {
      setErr(e.message || 'Could not update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="relative mx-auto grid max-w-7xl grid-cols-1 px-4 py-16 md:px-6"
      style={{ marginTop: 'var(--topnav-h,72px)' }}
    >
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-white sm:text-4xl">
          {stage === 'update' ? 'Set a new password' : 'Reset your password'}
        </h1>
        <p className="mt-2 text-center text-white/70">
          {stage === 'update'
            ? 'Enter a new password for your account.'
            : 'We’ll email you a link to reset your password.'}
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur md:p-6">
          {stage === 'update' ? (
            <form className="space-y-4" onSubmit={updatePassword}>
              <div>
                <label className="block text-sm font-medium text-white/90" htmlFor="newpw">
                  New password
                </label>
                <input
                  id="newpw"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-brand/60"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90" htmlFor="confirm">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-brand/60"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#fe9245] to-[#eb423b] px-5 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-brand/60 disabled:opacity-60"
              >
                Update password
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={requestLink}>
              <div>
                <label className="block text-sm font-medium text-white/90" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-brand/60"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#fe9245] to-[#eb423b] px-5 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-brand/60 disabled:opacity-60"
              >
                Send reset link
              </button>
            </form>
          )}

          {msg && <p className="mt-3 text-center text-sm text-emerald-300/90">{msg}</p>}
          {err && <p className="mt-2 text-center text-sm text-rose-300/90">{err}</p>}
        </div>
      </div>
    </main>
  )
}