// src/features/auth/pages/LogInPassword.jsx
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { track as _track } from '@/shared/lib/analytics'
const track = _track || (() => {})

export default function LogInPassword() {
  const nav = useNavigate()
  const loc = useLocation()
  const email = useMemo(() => loc.state?.email || new URLSearchParams(loc.search).get('email') || '', [loc])
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    track('auth_view', { page: 'log-in/password' })
    if (!email) nav('/auth/log-in-or-create-account', { replace: true })
  }, [email, nav])

  async function onGoogle() {
    track('auth_click_oauth', { provider: 'google' })
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/home' },
    })
  }

  async function onReset(e) {
    e.preventDefault()
    if (!email) return
    try {
      await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })
      track('auth_reset_requested')
      setErr('If an account exists for this email, a reset link has been sent.')
    } catch {
      setErr('If an account exists for this email, a reset link has been sent.')
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!pw || busy) return
    setBusy(true)
    setErr('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
      if (error) {
        const msg = (error.message || '').toLowerCase()
        const unconfirmed = /confirm|verified|not\s*confirmed/.test(msg)
        const providerLinked = !unconfirmed && (msg.includes('oauth') || msg.includes('identity') || msg.includes('provider'))

        if (unconfirmed) {
          setErr('Please confirm your email. We can resend the link.')
          nav('/confirm-email', { state: { email } })
          track('auth_password_submit', { success: false, reason: 'reset_sent' })
          return
        }

        setErr(providerLinked
          ? 'This email is linked with Google. Try Continue with Google above.'
          : 'Incorrect password. Try again or use “Forgot password?”'
        )
        track('auth_password_submit', { success: false, reason: providerLinked ? 'provider_linked' : 'bad_password' })
        return
      }
      track('auth_password_submit', { success: true })
      nav('/home', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="w-full max-w-[400px] sm:max-w-[420px] rounded-2xl border border-white/10 bg-black/35 backdrop-blur-sm shadow-[0_30px_120px_rgba(0,0,0,.55)] max-h-[calc(100svh-var(--topnav-h,72px)-var(--footer-h,0px)-12px)] overflow-hidden"
    >
      <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2 text-white/80 mx-auto">
          <ShieldCheck className="h-4 w-4 text-brand-100" />
          <span className="text-xs font-semibold tracking-wide">FEELFLICK</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="px-4 pb-4 sm:px-5 sm:pb-5 overflow-y-auto" style={{ maxHeight: 'calc(100% - 44px)' }}>
        <h1 className="text-center text-[clamp(1rem,1.6vw,1.25rem)] font-bold text-white">Enter your password</h1>

        <button
          type="button"
          onClick={onGoogle}
          className="mt-4 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-2.5 text-[0.9rem] font-semibold text-white hover:bg-white/10 focus:outline-none"
          aria-label="Continue with Google"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M21.35 11.1H12v2.9h5.3c-.23 1.46-1.6 4.2-5.3 4.2a6.1 6.1 0 1 1 0-12.2c1.74 0 2.9.74 3.57 1.38l2.43-2.35C16.64 3.64 14.53 2.7 12 2.7a9.3 9.3 0 1 0 0 18.6c5.35 0 8.9 3.73 8.9-9.2 0-.62-.06-1.07-.15-1.6Z"/></svg>
          Continue with Google
        </button>

        <div className="relative my-3">
          <div className="h-px w-full bg-white/10" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/35 px-2 text-[11.5px] text-white/50">
            OR
          </span>
        </div>

        {/* Read-only email with Edit */}
        <label className="block text-[10.5px] font-medium text-white/70">Email address</label>
        <div className="mt-1 flex items-center justify-between gap-2">
          <input
            readOnly
            value={email}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-[13.5px] text-white placeholder-white/40 focus:outline-none"
            aria-readonly="true"
          />
          <button
            type="button"
            onClick={() => nav('/auth/log-in-or-create-account', { state: { email } })}
            className="text:[12px] font-semibold text-white/80 hover:text-white focus:outline-none"
            aria-label="Edit email"
          >
            Edit
          </button>
        </div>

        {/* Password */}
        <label className="mt-3 block text-[10.5px] font-medium text-white/70">Password</label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={pw}
            onChange={(e) => { setPw(e.target.value); setErr('') }}
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-3 pr-9 text-[13.5px] text-white placeholder-white/40 focus:outline-none"
            placeholder="Your password"
          />
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/75 hover:bg-white/10 focus:outline-none"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="mt-1">
          <button onClick={onReset} className="text-[11.5px] text-white/70 hover:text-white/90 focus:outline-none">
            Forgot password?
          </button>
        </div>

        {err && <p className="mt-3 text-[12px] text-center text-red-400">{err}</p>}

        <button
          type="submit"
          disabled={!pw || busy}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#fe9245] to-[#eb423b] py-2.5 text-[0.9rem] font-semibold text-white disabled:opacity-60 focus:outline-none"
          aria-label="Continue"
        >
          {busy && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          <span>Continue</span>
        </button>
      </form>
    </div>
  )
}