// src/features/auth/pages/LogInOrCreateAccount.jsx
import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { ShieldCheck } from 'lucide-react'
import { track as _track } from '@/shared/lib/analytics'
const track = _track || (() => {})

export default function LogInOrCreateAccount() {
  const [busy, setBusy] = useState(false)
  useEffect(() => { track('auth_view', { page: 'oauth_only' }) }, [])

  async function onGoogle() {
    if (busy) return
    setBusy(true)
    try {
      track('auth_click_oauth', { provider: 'google' })
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // after Google, land in app (PostAuthGate will send first-timers to onboarding)
          redirectTo: window.location.origin + '/home',
        },
      })
      // Redirect happens; no further code runs here.
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-black/35 backdrop-blur-sm shadow-[0_30px_120px_rgba(0,0,0,.55)] overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-white/80 mx-auto">
          <ShieldCheck className="h-4 w-4 text-brand-100" />
          <span className="text-xs font-semibold tracking-wide">FEELFLICK</span>
        </div>
      </div>

      <div className="px-5 pb-5 text-center">
        <h1 className="text-[clamp(1rem,1.6vw,1.25rem)] font-bold text-white">Welcome</h1>
        <p className="mt-1 text-[12px] text-white/70">Sign in to continue</p>

        <button
          type="button"
          onClick={onGoogle}
          disabled={busy}
          className="mt-4 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-2.5 text-[0.9rem] font-semibold text-white hover:bg-white/10 disabled:opacity-60 focus:outline-none"
          aria-label="Continue with Google"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <path fill="currentColor" d="M21.35 11.1H12v2.9h5.3c-.23 1.46-1.6 4.2-5.3 4.2a6.1 6.1 0 1 1 0-12.2c1.74 0 2.9.74 3.57 1.38l2.43-2.35C16.64 3.64 14.53 2.7 12 2.7a9.3 9.3 0 1 0 0 18.6c5.35 0 8.9 3.73 8.9-9.2 0-.62-.06-1.07-.15-1.6Z"/>
          </svg>
          {busy ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <p className="mt-4 text-[12px] text-white/55">
          Test build: email/password is disabled.
        </p>
      </div>
    </div>
  )
}