// src/features/auth/pages/LogInOrCreateAccount.jsx
import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { ShieldCheck } from 'lucide-react'
import googleIcon from '@/assets/icons/google.svg'
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
          // After Google, land in app; PostAuthGate handles onboarding vs home.
          redirectTo: window.location.origin + '/home',
        },
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-black/35 backdrop-blur-sm shadow-[0_30px_120px_rgba(0,0,0,.55)] overflow-hidden">
      {/* Small branded header (unchanged) */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-white/80 mx-auto">
          <ShieldCheck className="h-4 w-4 text-brand-100" />
          <span className="text-xs font-semibold tracking-wide">FEELFLICK</span>
        </div>
      </div>

      <div className="px-5 pb-5 text-center">
        {/* 1) New copy */}
        <h1 className="text-[clamp(1rem,1.6vw,1.25rem)] font-bold text-white">Welcome to FeelFlick</h1>
        <p className="mt-1 text-[12px] text-white/70">
          New here? We’ll create an account. Already have one? This signs you in.
        </p>

        {/* 2) Google logo before label */}
        <button
          type="button"
          onClick={onGoogle}
          disabled={busy}
          className="mt-4 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-2.5 text-[0.9rem] font-semibold text-white hover:bg-white/10 disabled:opacity-60 focus:outline-none"
          aria-label="Continue with Google"
        >
          <img src={googleIcon} alt="" className="h-[18px] w-[18px]" />
          {busy ? 'Redirecting…' : 'Continue with Google'}
        </button>

        {/* 3) Tiny consent line, never larger than button text size */}
        <p className="mx-auto mt-2 max-w-full text-[11px] leading-tight text-white/60">
          By continuing you agree to our{' '}
          <a href="/terms" className="text-white/70 no-underline hover:text-white/90">Terms</a>
          {' '} &amp; {' '}
          <a href="/privacy" className="text-white/70 no-underline hover:text-white/90">Privacy</a>.
        </p>
      </div>
    </div>
  )
}