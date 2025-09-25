// src/features/auth/components/AuthForm.jsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Mail, Eye, EyeOff, UserPlus, ShieldCheck, LogIn, ChevronLeft, MailCheck } from 'lucide-react'

export default function AuthForm({ mode = 'signin' }) {
  const navigate = useNavigate()
  const isSignup = mode === 'signup'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [useMagic, setUseMagic] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // if already authenticated, bounce (keeps the auth screen snappy)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) navigate('/home', { replace: true })
    })
  }, [navigate])

  const title = isSignup ? 'Create your account' : 'Welcome back'
  const cta   = isSignup ? 'Create account' : 'Sign in'
  const swapQ = isSignup ? 'Have an account?' : 'New here?'
  const swapL = isSignup ? 'Sign in' : 'Create account'
  const swapTo = isSignup ? '/auth/sign-in' : '/auth/sign-up'

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      if (useMagic) {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/home' } })
        if (error) throw error
        navigate('/confirm-email', { replace: true })
        return
      }

      if (isSignup) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        navigate('/confirm-email', { replace: true })
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/home', { replace: true })
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="
        w-full max-w-[520px]
        rounded-3xl border border-white/10 bg-black/35 backdrop-blur-sm
        shadow-[0_30px_120px_rgba(0,0,0,.55)]
      "
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/80 hover:bg-white/10 focus:outline-none"
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-white/80">
          <ShieldCheck className="h-5 w-5 text-brand-100" />
          <span className="text-sm font-semibold tracking-wide">FEELFLICK</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="px-4 pb-4 sm:px-6 sm:pb-6">
        <h1 className="text-center text-[clamp(1.25rem,2.4vw,1.75rem)] font-bold text-white">{title}</h1>
        <p className="mt-1 text-center text-[13px] text-white/70">
          {isSignup ? 'Join free and start finding what fits your mood.' : 'Sign in to pick up where you left off.'}
        </p>

        {/* Fields */}
        <div className="mt-5 space-y-4">
          <label className="block text-xs font-medium text-white/70">EMAIL</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 text-[15px] text-white placeholder-white/40 focus:outline-none"
            />
          </div>

          {!useMagic && (
            <>
              <label className="mt-3 block text-xs font-medium text-white/70">PASSWORD</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required={true}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-3 pr-12 text-[15px] text-white placeholder-white/40 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-white/75 hover:bg-white/10 focus:outline-none"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="mt-2 text-right">
                <Link to="/reset-password" className="text-[12px] text-white/70 hover:text-white/90 focus:outline-none">
                  Forgot password?
                </Link>
              </div>
            </>
          )}

          {/* Magic link toggle */}
          <label className="mt-2 inline-flex items-center gap-2 text-[13px] text-white/80">
            <input
              type="checkbox"
              checked={useMagic}
              onChange={(e) => setUseMagic(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-transparent text-brand-100 focus:outline-none"
            />
            Use magic link instead
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#fe9245] to-[#eb423b] py-3.5 text-[0.98rem] font-semibold text-white disabled:opacity-60 focus:outline-none"
        >
          {isSignup ? <UserPlus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
          {submitting ? 'Please wait…' : cta}
        </button>

        {/* Divider */}
        <div className="relative my-5">
          <div className="h-px w-full bg-white/10" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/35 px-2 text-[12px] text-white/50">
            or
          </span>
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/home' } })}
          className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-3 text-[0.98rem] font-semibold text-white hover:bg-white/10 focus:outline-none"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M21.35 11.1H12v2.9h5.3c-.23 1.46-1.6 4.2-5.3 4.2a6.1 6.1 0 1 1 0-12.2c1.74 0 2.9.74 3.57 1.38l2.43-2.35C16.64 3.64 14.53 2.7 12 2.7a9.3 9.3 0 1 0 0 18.6c5.35 0 8.9 3.73 8.9-9.2 0-.62-.06-1.07-.15-1.6Z"/></svg>
          Continue with Google
        </button>

        {/* Error */}
        {error && <p className="mt-3 text-center text-[13px] text-red-400">{error}</p>}

        {/* Switch link */}
        <p className="mt-6 text-center text-[13px] text-white/70">
          {swapQ}{' '}
          <Link to={swapTo} className="font-semibold text-white hover:text-white/90 focus:outline-none">
            {swapL}
          </Link>
        </p>
      </form>
    </div>
  )
}