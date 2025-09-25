// src/features/auth/components/ResetPassword.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Spinner from '../components/ui/Spinner'

export default function ResetPassword() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [email, setEmail] = useState('')
  const [mode, setMode] = useState('request') // 'request' | 'update'
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  // If user arrived via Supabase email link containing a code, exchange for a session
  useEffect(() => {
    let mounted = true
    async function init() {
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href)
        if (error) return
        if (mounted && data?.session) setMode('update')
      } catch (_) {
        // ignore
      }
    }
    init()
    return () => { mounted = false }
  }, [])

  async function sendReset(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setNotice('')
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (err) throw err
      setNotice("If that email exists, we've sent a reset link. Check your inbox (and spam).")
    } catch (err) {
      setError(err?.message || 'Failed to send reset email.')
    } finally {
      setLoading(false)
    }
  }

  async function updatePassword(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setNotice('')
    if (password.length < 8) return setError('Use at least 8 characters.'), setLoading(false)
    if (password !== confirm) return setError('Passwords do not match.'), setLoading(false)
    try {
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) throw err
      setNotice('Password updated. You can now close this tab and sign in.')
    } catch (err) {
      setError(err?.message || 'Could not update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl">
        {mode === 'request' ? (
          <form onSubmit={sendReset} className="space-y-4">
            <h1 className="text-xl font-semibold">Reset your password</h1>
            <p className="text-sm text-slate-400">Enter your email and we will send a reset link.</p>
            <div>
              <label htmlFor="email" className="block text-sm text-slate-200">Email</label>
              <input
                id="email"
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && <div role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 border border-red-500/20">{error}</div>}
            {notice && <div role="status" className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 border border-emerald-500/20">{notice}</div>}

            <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-emerald-950 hover:bg-emerald-400 disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
              {loading && <Spinner />} Send reset link
            </button>
          </form>
        ) : (
          <form onSubmit={updatePassword} className="space-y-4">
            <h1 className="text-xl font-semibold">Set a new password</h1>
            <div>
              <label htmlFor="pw" className="block text-sm text-slate-200">New password</label>
              <input id="pw" type="password" className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <label htmlFor="cpw" className="block text-sm text-slate-200">Confirm password</label>
              <input id="cpw" type="password" className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            {error && <div role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 border border-red-500/20">{error}</div>}
            {notice && <div role="status" className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 border border-emerald-500/20">{notice}</div>}
            <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-emerald-950 hover:bg-emerald-400 disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
              {loading && <Spinner />} Update password
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
