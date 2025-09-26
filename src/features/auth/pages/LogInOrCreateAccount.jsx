// src/features/auth/pages/LogInOrCreateAccount.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { ShieldCheck } from 'lucide-react'
// Optional analytics helper (fallback to noop)
import { track as _track } from '@/shared/lib/analytics'
const track = _track || (() => {})

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LogInOrCreateAccount() {
  const nav = useNavigate()
  const loc = useLocation()
  const prefill = useMemo(() => loc.state?.email || new URLSearchParams(loc.search).get('email') || '', [loc])
  const [email, setEmail] = useState(prefill)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const valid = emailRegex.test(email)

  const onContinue = (e) => {
    e.preventDefault()
    if (!email) return
    navigate(`/auth/password?email=${encodeURIComponent(email)}`)
  }

  useEffect(() => {
    track('auth_view', { page: 'log-in-or-create-account' })
  }, [])

  async function onGoogle() {
    track('auth_click_oauth', { provider: 'google' })
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/home' },
    })
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!valid || busy) return
    const cleaned = email.trim().toLowerCase()
    // no server call; just go to the unified password page
    nav(`/auth/password?email=${encodeURIComponent(cleaned)}`)
  }

  return (
    <div
      className="
        w-full max-w-[400px] sm:max-w-[420px]
        rounded-2xl border border-white/10 bg-black/35 backdrop-blur-sm
        shadow-[0_30px_120px_rgba(0,0,0,.55)]
        max-h-[calc(100svh-var(--topnav-h,72px)-var(--footer-h,0px)-12px)]
        overflow-hidden
      "
    >
      {/* Card header: brand lockup */}
      <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2 text-white/80 mx-auto">
          <ShieldCheck className="h-4 w-4 text-brand-100" />
          <span className="text-xs font-semibold tracking-wide">FEELFLICK</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="px-4 pb-4 sm:px-5 sm:pb-5 overflow-y-auto" style={{ maxHeight: 'calc(100% - 44px)' }}>
        <h1 className="text-center text-[clamp(1rem,1.6vw,1.25rem)] font-bold text-white">Log in or sign up</h1>
        <p className="mt-1 text-center text-[12px] text-white/70">Start exploring movie recommendations</p>

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

        <label className="block text-[10.5px] font-medium text-white/70" htmlFor="email">Email address</label>
        <div className="mt-1">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErr('') }}
            placeholder="name@email.com"
            className={`w-full rounded-lg border ${valid || !email ? 'border-white/10' : 'border-red-500/60'} bg-white/5 py-2 px-3 text-[13.5px] text-white placeholder-white/40 focus:outline-none`}
            aria-invalid={email.length > 0 && !valid}
            aria-describedby={err ? 'email-error' : undefined}
            autoFocus
          />
        </div>

        {err && <p id="email-error" className="mt-2 text-[12px] text-red-400">{err}</p>}

        <button
          type="submit"
          disabled={!valid || busy}
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