import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { ArrowLeft, Eye, EyeOff, Loader2, Mail } from 'lucide-react'

const APP_ROUTE = '/app' // where to land after successful sign-in

export default function AuthForm({ mode = 'sign-in' }) {
  const navigate = useNavigate()
  const { state } = useLocation()

  // form state
  const [email, setEmail] = useState(state?.email ?? '')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [useMagic, setUseMagic] = useState(false)

  // site origin for redirects (works locally + prod)
  const origin = useMemo(
    () => (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, ''),
    []
  )

  // clear feedback on mode change/toggle
  useEffect(() => {
    setError(null)
    setMessage(null)
  }, [mode, useMagic])

  async function handleSignIn(e) {
    e.preventDefault()
    setLoading(true); setError(null); setMessage(null)
    try {
      if (!email) throw new Error('Please enter a valid email address.')
      if (useMagic) {
        const { error: err } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${origin}${APP_ROUTE}` },
        })
        if (err) throw err
        setMessage('Magic link sent. Check your email.')
      } else {
        if (!password) throw new Error('Enter your password.')
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
        navigate(APP_ROUTE, { replace: true })
      }
    } catch (err) {
      setError(prettify(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuthGoogle() {
    setLoading(true); setError(null); setMessage(null)
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}${APP_ROUTE}`,
          queryParams: { prompt: 'select_account' },
        },
      })
      if (err) throw err
      // Redirect handled by Supabase
    } catch (err) {
      setLoading(false)
      setError(prettify(err))
    }
  }

  return (
    <div
      className="
        animate-[fadeIn_.35s_ease-out] 
        rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur md:p-6
      "
      style={{
        // tiny keyframe (no Tailwind plugin needed)
        '--tw-animate': 'fadeIn',
      }}
    >
      {/* Top row: back to landing */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-sm text-white/85 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          <span>Back to home</span>
        </Link>
        {mode === 'sign-in' ? (
          <Link to="/auth/sign-up" className="text-sm text-white/75 hover:text-white">
            New here? <span className="font-semibold">Create account</span>
          </Link>
        ) : (
          <Link to="/auth/sign-in" className="text-sm text-white/75 hover:text-white">
            Already have an account? <span className="font-semibold">Sign in</span>
          </Link>
        )}
      </div>

      {/* Heading */}
      <h1 className="text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
        {mode === 'sign-up' ? 'Create your account' : 'Welcome back'}
      </h1>
      <p className="mt-1 text-center text-white/70">
        {mode === 'sign-up'
          ? 'Join in seconds. No spam, ever.'
          : 'Sign in to pick up where you left off.'}
      </p>

      {/* Form */}
      <form className="mt-6 space-y-4" onSubmit={handleSignIn} noValidate>
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white/90">
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
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-brand/60"
            placeholder="name@email.com"
          />
        </div>

        {/* Password (hidden if magic link) */}
        {!useMagic && (
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-white/90">
                Password
              </label>
              {mode === 'sign-in' && (
                <Link to="/auth/reset-password" className="text-xs text-white/70 hover:text-white">
                  Forgot?
                </Link>
              )}
            </div>
            <div className="mt-1 relative">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                minLength={8}
                required={!useMagic}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 pr-10 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-brand/60"
                placeholder={mode === 'sign-up' ? 'Create a password (8+)' : 'Your password'}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute inset-y-0 right-2 grid w-8 place-items-center rounded-md text-white/70 hover:text-white/90 focus:outline-none focus:ring-2 focus:ring-brand/60"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        )}

        {/* Magic link toggle (sign-in only) */}
        {mode === 'sign-in' && (
          <button
            type="button"
            onClick={() => setUseMagic((v) => !v)}
            className="inline-flex items-center gap-2 text-sm text-white/75 hover:text-white"
          >
            <Mail className="h-4 w-4" />
            {useMagic ? 'Use password instead' : 'Use magic link instead'}
          </button>
        )}

        {/* Primary action */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#fe9245] to-[#eb423b] px-6 font-semibold text-white shadow-lift transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-brand/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'sign-up' ? 'Create account' : useMagic ? 'Send magic link' : 'Sign in'}
        </button>

        {/* OAuth */}
        <div className="relative my-3 text-center text-xs text-white/40">
          <span className="bg-white/5 px-2">or</span>
          <div className="absolute left-0 right-0 top-1/2 -z-10 h-px -translate-y-1/2 bg-white/10" />
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={handleOAuthGoogle}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-black/30 px-5 font-semibold text-white/95 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Continue with Google"
        >
          {/* Google glyph (inline to avoid extra asset) */}
          <svg width="18" height="18" viewBox="0 0 533.5 544.3" aria-hidden>
            <path fill="#EA4335" d="M533.5 278.4c0-17.4-1.6-34-4.6-50.2H272v95h146.9c-6.3 33.7-25.2 62.2-53.8 81.3v67.4h86.9c50.8-46.8 80.5-115.9 80.5-193.5z"/>
            <path fill="#34A853" d="M272 544.3c72.8 0 134-24 178.6-65.5l-86.9-67.4c-24.1 16.2-55 25.9-91.7 25.9-70.4 0-130.1-47.5-151.4-111.2H31.9v69.9C76 497.9 168.2 544.3 272 544.3z"/>
            <path fill="#4A90E2" d="M120.6 325.1c-10.2-30.5-10.2-63.3 0-93.8v-69.9H31.9c-43.6 86.7-43.6 186.8 0 273.5l88.7-69.8z"/>
            <path fill="#FBBC05" d="M272 107.7c39.5-.6 77.1 14 105.7 41.4l79-79C407.8 25.1 342.1.2 272 .3 168.2.3 76 47 31.9 143.3l88.7 69.9C141.9 149.4 201.6 102.9 272 107.7z"/>
          </svg>
          Continue with Google
        </button>

        {/* Feedback */}
        {message && (
          <p className="text-center text-sm text-emerald-300/90" role="status" aria-live="polite">
            {message}
          </p>
        )}
        {error && (
          <p className="text-center text-sm text-rose-300/90" role="alert" aria-live="assertive">
            {error}
          </p>
        )}
      </form>
    </div>
  )
}

function prettify(err) {
  const msg = typeof err === 'string' ? err : err?.message || 'Something went wrong.'
  if (/invalid login credentials/i.test(msg)) return 'Incorrect email or password.'
  if (/email not confirmed/i.test(msg)) return 'Please confirm your email first.'
  if (/rate limit/i.test(msg)) return 'Too many attempts. Please wait a moment.'
  return msg
}