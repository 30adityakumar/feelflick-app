// src/features/auth/pages/LogInOrCreateAccount.jsx
import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
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
    <div
      className="
        relative w-full max-w-[560px]
        rounded-3xl border border-white/10 bg-[#0b1118]/70 backdrop-blur-md
        shadow-[0_44px_160px_rgba(0,0,0,.65)]
        overflow-hidden
      "
    >
      {/* Decorative glows inspired by the logo */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-24 -top-20 h-72 w-72 rounded-full blur-3xl opacity-70"
          style={{ background: 'radial-gradient(closest-side, rgba(254,146,69,.55), rgba(254,146,69,0) 70%)' }}
        />
        <div
          className="absolute -bottom-28 right-[-10%] h-80 w-80 rounded-full blur-3xl opacity-70"
          style={{ background: 'radial-gradient(closest-side, rgba(45,200,255,.45), rgba(45,200,255,0) 70%)' }}
        />
        <div
          className="absolute inset-0 opacity-30 mix-blend-screen"
          style={{ background: 'conic-gradient(from 230deg at 60% 40%, rgba(255,255,255,.08), rgba(255,255,255,0) 60%)' }}
        />
      </div>

      {/* Body */}
      <div className="relative px-6 sm:px-8 py-8 sm:py-10 text-center">
        <h1 className="text-[clamp(1.1rem,2.8vw,1.7rem)] font-bold text-white">
          Welcome to FeelFlick
        </h1>
        <p className="mt-1 text-[12.5px] text-white/75">
          New here? We’ll create an account. Already have one? This signs you in.
        </p>

        {/* Google CTA */}
        <button
          type="button"
          onClick={onGoogle}
          disabled={busy}
          aria-label="Continue with Google"
          className="
            mt-5 inline-flex items-center justify-center gap-2
            h-11 px-5 sm:px-6 rounded-full
            text-[0.95rem] font-semibold text-white
            bg-[linear-gradient(90deg,#fe9245_0%,#eb423b_100%)]
            shadow-[0_10px_30px_rgba(235,66,59,.35)]
            hover:brightness-110 active:scale-95
            focus:outline-none disabled:opacity-60
          "
        >
          <span className="inline-grid h-5 w-5 place-items-center rounded-full bg-white">
            <img src={googleIcon} alt="" className="h-[14px] w-[14px]" />
          </span>
          {busy ? 'Redirecting…' : 'Continue with Google'}
        </button>

        {/* Consent line (small, no underline) */}
        <p className="mx-auto mt-2 max-w-full text-[11px] leading-tight text-white/65">
          By continuing you agree to our{' '}
          <a href="/terms" className="no-underline text-white/75 hover:text-white">Terms</a>
          {' '} &amp; {' '}
          <a href="/privacy" className="no-underline text-white/75 hover:text-white">Privacy</a>.
        </p>
      </div>
    </div>
  )
}