// src/features/auth/components/ResetPassword.jsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import logoPng from '@/assets/images/logo.png'

function parseHash() {
  const qs = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return {
    type: qs.get('type'),
    access_token: qs.get('access_token'),
  }
}

export default function ResetPassword() {
  // stage: 'request' = ask for email, 'update' = set new password (after email link)
  const [stage, setStage] = useState('request')
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
      // The user arrived from the email link and is already authenticated; show "set new password"
      setStage('update')
      // Clean the hash to avoid re-triggering
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
      setMsg('Password updated. You can now sign in with your new password.')
    } catch (e) {
      setErr(e.message || 'Could not update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="relative overflow-hidden"
      style={{
        marginTop: 'var(--topnav-h,72px)',
        height: 'calc(100svh - var(--topnav-h,72px))',
      }}
    >
      {/* Keep collage if you use it */}
      <div className="feelflick-landing-bg" aria-hidden="true" />

      {/* LandingHero background (mesh + blobs + ribbon) */}
      <div aria-hidden className="absolute inset-0 -z-10">
        {/* Deep base */}
        <div className="absolute inset-0 bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]" />
        {/* Brand blobs */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-[60vmin] w-[60vmin] rounded-full blur-3xl opacity-60 bg-[radial-gradient(closest-side,rgba(254,146,69,0.45),transparent_65%)]" />
        <div className="pointer-events-none absolute -bottom-44 -right-44 h-[66vmin] w-[66vmin] rounded-full blur-3xl opacity-55 bg-[radial-gradient(closest-side,rgba(235,66,59,0.38),transparent_65%)]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[78vmin] w-[78vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(45,119,255,0.35),transparent_65%)]" />
        <div className="pointer-events-none absolute -top-24 right-[15%] h-[42vmin] w-[42vmin] rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(255,99,196,0.35),transparent_65%)]" />
        <div className="pointer-events-none absolute bottom-[8%] left-[12%] h-[46vmin] w-[46vmin] rounded-full blur-3xl opacity-40 bg-[radial-gradient(closest-side,rgba(124,58,237,0.30),transparent_65%)]" />
        {/* Ribbon */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     w-[160vmin] h-[80vmin] md:w-[180vmin] md:h-[90vmin] opacity-35 md:opacity-40"
        >
          <svg viewBox="0 0 1600 900" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="ff-ribbon" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"  stopColor="#2D77FF" stopOpacity=".36" />
                <stop offset="55%" stopColor="#4EA1FF" stopOpacity=".34" />
                <stop offset="100%" stopColor="#0E3EE6" stopOpacity=".28" />
              </linearGradient>
              <filter id="ff-ribbon-blur"><feGaussianBlur stdDeviation="28" /></filter>
            </defs>
            <path
              d="M -120 620 C 260 300, 700 780, 1000 420 C 1250 130, 1500 520, 1720 340"
              fill="none" stroke="url(#ff-ribbon)" strokeWidth="180" strokeLinecap="round" filter="url(#ff-ribbon-blur)"
            />
          </svg>
        </div>
        {/* Gentle top highlight */}
        <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_0%,rgba(255,255,255,0.06),transparent_60%)]" />
      </div>

      {/* Centered, one-viewport layout (no scroll) */}
      <section className="relative z-10 mx-auto flex h-full max-w-7xl items-center justify-center px-4 md:px-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur md:p-5">
          {/* Top row: arrow-only back + brand */}
          <div className="mb-3 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/85 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
              aria-label="Back to home"
              title="Back"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
            <div className="inline-flex items-center gap-2 px-2 py-1">
              <img
                src={logoPng}
                alt="FeelFlick"
                width="18" height="18"
                className="h-4.5 w-4.5 rounded object-contain"
              />
              <span className="text-sm font-extrabold tracking-tight text-brand-100">FEELFLICK</span>
            </div>
          </div>

          {/* Compact headings to fit on one screen */}
          <h1 className="text-center text-[1.125rem] font-extrabold tracking-tight text-white sm:text-[1.35rem]">
            {stage === 'update' ? 'Set a new password' : 'Reset your password'}
          </h1>
          <p className="mt-1 text-center text-xs text-white/70">
            {stage === 'update'
              ? 'Enter a new password for your account.'
              : 'We’ll email you a link to reset your password.'}
          </p>

          {/* Forms */}
          {stage === 'update' ? (
            <form className="mt-4 space-y-3.5" onSubmit={updatePassword} noValidate>
              <div>
                <label htmlFor="newpw" className="block text-[0.8rem] font-medium text-white/90">
                  New password
                </label>
                <input
                  id="newpw"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[0.95rem] text-white outline-none focus:ring-2 focus:ring-brand/60"
                />
              </div>
              <div>
                <label htmlFor="confirm" className="block text-[0.8rem] font-medium text-white/90">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[0.95rem] text-white outline-none focus:ring-2 focus:ring-brand/60"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-1.5 inline-flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#fe9245] to-[#eb423b] px-6 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-brand/60 disabled:opacity-60"
              >
                Update password
              </button>
            </form>
          ) : (
            <form className="mt-4 space-y-3.5" onSubmit={requestLink} noValidate>
              <div>
                <label htmlFor="email" className="block text-[0.8rem] font-medium text-white/90">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[0.95rem] text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-brand/60"
                  placeholder="name@email.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-1.5 inline-flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#fe9245] to-[#eb423b] px-6 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-brand/60 disabled:opacity-60"
              >
                Send reset link
              </button>
            </form>
          )}

          {/* Feedback */}
          {msg && <p className="mt-3 text-center text-[12px] text-emerald-300/90">{msg}</p>}
          {err && <p className="mt-2 text-center text-[12px] text-rose-300/90">{err}</p>}

          {/* Small link back to Sign in */}
          {stage === 'request' && (
            <p className="mt-3 text-center text-sm text-white/80">
              Remembered it?{' '}
              <Link to="/auth/sign-in" className="font-semibold text-white hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </section>
    </main>
  )
}