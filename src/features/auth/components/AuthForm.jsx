import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

const APP_ROUTE = '/app' // change if your post-auth destination is different

export default function AuthForm({ mode = 'sign-in' }) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [email, setEmail] = useState(state?.email ?? '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null) // success info
  const [error, setError] = useState(null)
  const [showPw, setShowPw] = useState(false)
  const [useMagicLink, setUseMagicLink] = useState(false)

  const origin = useMemo(
    () => (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, ''),
    []
  )

  useEffect(() => {
    setError(null)
    setMessage(null)
  }, [mode])

  async function handleEmailPassword(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      if (!email) throw new Error('Please enter a valid email.')
      if (mode === 'sign-up' && (!password || password.length < 8)) {
        throw new Error('Use at least 8 characters for your password.')
      }

      if (mode === 'sign-in') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
        // success → go to app
        navigate(APP_ROUTE, { replace: true })
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${origin}/auth/confirm` },
        })
        if (err) throw err
        setMessage('Check your email to confirm your account.')
      }
    } catch (err) {
      setError(prettify(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleMagicLink(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      if (!email) throw new Error('Please enter a valid email.')
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${origin}/auth/reset-password` }, // deep-link back
      })
      if (err) throw err
      setMessage('Magic link sent. Check your email.')
    } catch (err) {
      setError(prettify(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuth(provider) {
    setLoading(true)
    setError(null)
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${origin}${APP_ROUTE}`,
          queryParams: { prompt: 'select_account' },
        },
      })
      if (err) throw err
      // Redirect is handled by Supabase
    } catch (err) {
      setLoading(false)
      setError(prettify(err))
    }
  }

  return (
    <form className="space-y-4" onSubmit={useMagicLink ? handleMagicLink : handleEmailPassword}>
      {/* email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white/90">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-brand/60"
          placeholder="name@email.com"
        />
      </div>

      {/* password (hidden when magic link) */}
      {!useMagicLink && (
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-white/90">
              Password
            </label>
            {mode === 'sign-in' && (
              <Link
                to="/auth/reset-password"
                className="text-xs text-white/70 hover:text-white/90"
              >
                Forgot?
              </Link>
            )}
          </div>
          <div className="mt-1 relative">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 pr-10 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-brand/60"
              placeholder={mode === 'sign-up' ? 'Create a password' : 'Your password'}
              minLength={8}
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

      {/* mode toggle for sign-in only */}
      {mode === 'sign-in' && (
        <div className="flex items-center justify-between pt-1">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={useMagicLink}
              onChange={(e) => setUseMagicLink(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-black/30 text-brand-600 focus:ring-brand/60"
            />
            Use magic link
          </label>
          <Link to="/auth/sign-up" className="text-sm text-white/80 hover:text-white">
            Create account
          </Link>
        </div>
      )}

      {/* submit */}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#fe9245] to-[#eb423b] px-5 font-semibold text-white shadow-lift transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-brand/60 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {useMagicLink ? 'Send magic link' : mode === 'sign-up' ? 'Create account' : 'Sign in'}
      </button>

      {/* OAuth */}
      <div className="relative my-3 text-center text-xs text-white/40">
        <span className="bg-white/5 px-2">or</span>
        <div className="absolute left-0 right-0 top-1/2 -z-10 h-px -translate-y-1/2 bg-white/10" />
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={() => handleOAuth('google')}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-black/30 px-5 font-semibold text-white/95 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 533.5 544.3" aria-hidden>
          <path fill="#EA4335" d="M533.5 278.4c0-17.4-1.6-34-4.6-50.2H272v95h146.9c-6.3 33.7-25.2 62.2-53.8 81.3v67.4h86.9c50.8-46.8 80.5-115.9 80.5-193.5z"/>
          <path fill="#34A853" d="M272 544.3c72.8 0 134-24 178.6-65.5l-86.9-67.4c-24.1 16.2-55 25.9-91.7 25.9-70.4 0-130.1-47.5-151.4-111.2H31.9v69.9C76 497.9 168.2 544.3 272 544.3z"/>
          <path fill="#4A90E2" d="M120.6 325.1c-10.2-30.5-10.2-63.3 0-93.8v-69.9H31.9c-43.6 86.7-43.6 186.8 0 273.5l88.7-69.8z"/>
          <path fill="#FBBC05" d="M272 107.7c39.5-.6 77.1 14 105.7 41.4l79-79C407.8 25.1 342.1.2 272 .3 168.2.3 76 47 31.9 143.3l88.7 69.9C141.9 149.4 201.6 102.9 272 107.7z"/>
        </svg>
        Continue with Google
      </button>

      {/* feedback */}
      {message && (
        <p className="mt-3 text-center text-sm text-emerald-300/90">{message}</p>
      )}
      {error && (
        <p className="mt-2 text-center text-sm text-rose-300/90">{error}</p>
      )}

      {/* footer link for sign-up page */}
      {mode === 'sign-up' && (
        <p className="mt-4 text-center text-sm text-white/70">
          Already have an account?{' '}
          <Link to="/auth/sign-in" className="text-white hover:underline">
            Sign in
          </Link>
        </p>
      )}
    </form>
  )
}

function prettify(err) {
  const msg = typeof err === 'string' ? err : err?.message || 'Something went wrong.'
  if (/invalid login credentials/i.test(msg)) return 'Incorrect email or password.'
  if (/email not confirmed/i.test(msg)) return 'Please confirm your email first.'
  if (/rate limit/i.test(msg)) return 'Too many attempts. Please wait a moment.'
  return msg
}