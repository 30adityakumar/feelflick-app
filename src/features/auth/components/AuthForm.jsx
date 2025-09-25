import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { ArrowLeft, Eye, EyeOff, Mail, LogIn, UserPlus, ShieldCheck } from 'lucide-react'

export default function AuthForm() {
  const nav = useNavigate()
  const loc = useLocation()

  // read mode from pathname: /auth/sign-in or /auth/sign-up
  const initialMode = /sign-up/i.test(loc.pathname) ? 'signup' : 'signin'
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [magic, setMagic] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const title = mode === 'signin' ? 'Welcome back' : 'Create your account'

  useEffect(() => setMode(initialMode), [initialMode])

  const submitLabel = useMemo(
    () => (magic ? (mode === 'signin' ? 'Send magic link' : 'Send sign-up link') : mode === 'signin' ? 'Sign in' : 'Create account'),
    [mode, magic]
  )

  async function handleOAuth(provider = 'google') {
    try {
      setLoading(true)
      setError('')
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth` },
      })
      if (error) throw error
    } catch (e) {
      setError(e?.message || 'OAuth error')
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (!email) throw new Error('Email is required')

      if (magic) {
        // One tap, low-friction
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        })
        if (error) throw error
        nav('/confirm-email', { replace: true, state: { email } })
        return
      }

      if (!password) throw new Error('Password is required')

      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { onboarding_complete: false },
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        })
        if (error) throw error
      }

      // success → go home; PostAuthGate will route to /onboarding if needed
      nav('/home', { replace: true })
    } catch (e) {
      setError(e?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    if (window.history.length > 1) nav(-1)
    else nav('/', { replace: true })
  }

  const goReset = () => nav('/reset-password')

  return (
    <div className="rounded-[20px] border border-white/10 bg-neutral-900/60 p-4 shadow-[0_20px_80px_rgba(0,0,0,.45)] backdrop-blur-md md:p-6">
      {/* Card header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/85 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-white">
          <ShieldCheck className="h-4 w-4 text-brand-100" />
          <span className="text-sm tracking-wide text-white/80">FEELFLICK</span>
        </div>
      </div>

      <h1 className="text-center text-[1.4rem] font-extrabold tracking-tight text-white md:text-[1.55rem]">
        {title}
      </h1>
      <p className="mt-1 text-center text-sm text-white/70">
        {mode === 'signin' ? 'Sign in to pick up where you left off.' : 'Join free and start finding what fits your mood.'}
      </p>

      {/* Form */}
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        {/* email */}
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-white/70">EMAIL</span>
          <div className="relative">
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[.07] px-10 text-[0.95rem] text-white placeholder:text-white/45 focus:border-brand/60 focus:outline-none"
              placeholder="name@email.com"
            />
            <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/60" />
          </div>
        </label>

        {/* password (hidden if magic link) */}
        {!magic && (
          <label className="block">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-white/70">PASSWORD</span>
              <button
                type="button"
                onClick={goReset}
                className="text-xs font-semibold text-white/75 hover:text-white"
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/[.07] px-4 pr-10 text-[0.95rem] text-white placeholder:text-white/45 focus:border-brand/60 focus:outline-none"
                placeholder="Your password"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-white/75 hover:bg-white/10"
              >
                {showPass ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </label>
        )}

        {/* magic link toggle */}
        <label className="flex select-none items-center gap-2 pt-1 text-sm text-white/80">
          <input
            type="checkbox"
            checked={magic}
            onChange={(e) => setMagic(e.target.checked)}
            className="h-4 w-4 rounded border-white/30 bg-white/10 text-brand-100 focus:ring-brand/60"
          />
          Use magic link instead
        </label>

        {/* error */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* submit */}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#fe9245] to-[#eb423b] py-3 font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,.35)] disabled:opacity-70"
        >
          {mode === 'signin' ? <LogIn className="h-4.5 w-4.5" /> : <UserPlus className="h-4.5 w-4.5" />}
          {submitLabel}
        </button>

        {/* divider */}
        <div className="relative py-1">
          <div className="h-px w-full bg-white/10" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-900/60 px-2 text-xs text-white/60">
            or
          </span>
        </div>

        {/* Google */}
        <button
          type="button"
          disabled={loading}
          onClick={() => handleOAuth('google')}
          className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/5 py-3 text-[0.95rem] font-semibold text-white hover:bg-white/10"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt=""
            className="h-5 w-5"
          />
          Continue with Google
        </button>

        {/* mode switch */}
        <div className="pt-1 text-center text-sm text-white/75">
          {mode === 'signin' ? (
            <>
              New here?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="font-semibold text-white hover:underline"
              >
                Create account
              </button>
            </>
          ) : (
            <>
              Have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="font-semibold text-white hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}