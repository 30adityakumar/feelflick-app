// src/features/auth/components/ConfirmEmail.jsx
import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Loader2, ArrowLeft } from 'lucide-react'

function parseHash(hash) {
  const h = (hash || '').replace(/^#/, '')
  const p = new URLSearchParams(h)
  const out = {}
  p.forEach((v, k) => (out[k] = v))
  return out
}

export default function ConfirmEmail() {
  const navigate = useNavigate()
  const { hash } = useLocation()
  const [state, setState] = useState('checking') // checking|ok|no-session|expired|error
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const params = parseHash(hash)
    if (params.error || params.error_code) {
      if ((params.error_code || '').includes('otp_expired')) {
        setState('expired')
        setMsg('This link is expired or already used.')
      } else {
        setState('error')
        setMsg(decodeURIComponent(params.error_description || 'Invalid confirmation link.'))
      }
      return
    }

    (async () => {
      try {
        // If tokens exist in the hash (some flows), try to exchange them; harmless if not present.
        if (hash?.includes('access_token') || hash?.includes('code')) {
          try {
            const { error } = await supabase.auth.exchangeCodeForSession(hash)
            if (error) console.warn('exchangeCodeForSession:', error.message)
          } catch {
            /* ignore */
          }
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setState('ok')
          setTimeout(() => navigate('/onboarding', { replace: true }), 200)
          return
        }
        // Some projects confirm email without auto-sign-in.
        setState('no-session')
        setMsg('Email confirmed. Please sign in to continue.')
      } catch {
        setState('error')
        setMsg('Something went wrong while confirming your email.')
      }
    })()
  }, [hash, navigate])

  return (
    <section
      className="relative overflow-hidden"
      style={{ marginTop: 'var(--topnav-h, 72px)' }}
    >
      <div className="feelflick-landing-bg" aria-hidden />

      {/* same multi-color background as the hero */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]" />
        <div className="pointer-events-none absolute -top-40 -left-40 h-[65vmin] w-[65vmin] rounded-full blur-3xl opacity-60 bg-[radial-gradient(closest-side,rgba(254,146,69,0.45),rgba(254,146,69,0)_70%)]" />
        <div className="pointer-events-none absolute -bottom-44 -right-44 h-[70vmin] w-[70vmin] rounded-full blur-3xl opacity-55 bg-[radial-gradient(closest-side,rgba(235,66,59,0.38),rgba(235,66,59,0)_70%)]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(45,119,255,0.35),rgba(45,119,255,0)_70%)]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-var(--topnav-h,72px))] place-items-center px-4 md:px-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <Link
              to="/"
              aria-label="Back"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/85 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-sm font-extrabold tracking-tight text-brand-100">FEELFLICK</span>
          </div>

          {state === 'checking' && (
            <div className="flex flex-col items-center py-10 text-center">
              <Loader2 className="h-5 w-5 animate-spin text-white/80" />
              <p className="mt-3 text-sm text-white/80">Confirming your email…</p>
            </div>
          )}

          {state === 'ok' && (
            <div className="py-8 text-center">
              <p className="text-lg font-semibold text-white">You’re all set!</p>
              <p className="mt-1 text-sm text-white/70">Redirecting to onboarding…</p>
            </div>
          )}

          {state === 'no-session' && (
            <div className="py-6 text-center">
              <p className="text-base font-semibold text-white">{msg}</p>
              <Link
                to="/auth/sign-in"
                className="mt-4 inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-5 font-semibold text-white/95 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
              >
                Go to sign in
              </Link>
            </div>
          )}

          {(state === 'expired' || state === 'error') && (
            <div className="py-6 text-center">
              <p className="text-base font-semibold text-white">
                {msg || 'This confirmation link is invalid or expired.'}
              </p>
              <Link
                to="/auth/sign-in"
                className="mt-4 inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-5 font-semibold text-white/95 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
              >
                Request a new link
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}