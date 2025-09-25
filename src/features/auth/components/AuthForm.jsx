// src/features/auth/components/AuthForm.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { ArrowLeft, Mail, Eye, EyeOff, Shield, UserPlus, LogIn } from 'lucide-react'

export default function AuthForm({ mode = 'sign-up', onSwap }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [useMagic, setUseMagic] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // if authed already, bounce to /home (router will gate to onboarding if needed)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/home', { replace: true })
    })
  }, [navigate])

  const handleBack = () => {
    // go back if possible, else landing
    if (window.history.length > 1) navigate(-1)
    else navigate('/', { replace: true })
  }

  const handleForgot = () => navigate('/reset-password')

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      if (useMagic) {
        const { error } = await supabase.auth.signInWithOtp({ email })
        if (error) throw error
        setErr('Check your email for the magic link.')
        return
      }

      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      }
      // success -> router will send to /home after session; be explicit too
      navigate('/home', { replace: true })
    } catch (e) {
      setErr(e.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const Title = mode === 'sign-in' ? 'Welcome back' : 'Create your account'
  const CtaText = mode === 'sign-in' ? 'Sign in' : 'Create account'
  const CtaIcon = mode === 'sign-in' ? LogIn : UserPlus
  const SwitchLine =
    mode === 'sign-in' ? (
      <>New here? <button type="button" onClick={onSwap} className="text-white hover:text-brand-100 underline-offset-4 hover:underline focus:outline-none">Create account</button></>
    ) : (
      <>Have an account? <button type="button" onClick={onSwap} className="text-white hover:text-brand-100 underline-offset-4 hover:underline focus:outline-none">Sign in</button></>
    )

  return (
    <div className="w-[min(92vw,520px)]">
      <form
        onSubmit={submit}
        className="relative rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6 md:p-7 text-white shadow-[0_20px_80px_rgba(0,0,0,.45)] backdrop-blur-md"
      >
        {/* Header row */}
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back"
            className="inline-grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 hover:bg-white/10 focus:outline-none"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-white/80">
            <Shield className="h-4 w-4" />
            <span className="text-sm tracking-wide">FEELFLICK</span>
          </div>
        </div>

        <h1 className="mt-1 text-center text-[clamp(1.2rem,3.4vw,1.7rem)] font-extrabold tracking-tight">
          {Title}
        </h1>
        <p className="mt-1 text-center text-[0.92rem] text-white/75">
          {mode === 'sign-in'
            ? 'Sign in to pick up where you left off.'
            : 'Join free and start finding what fits your mood.'}
        </p>

        {/* Fields */}
        <div className="mt-5 space-y-4">
          <label className="block text-xs font-semibold text-white/70">EMAIL</label>
          <div className="flex items-center gap-2 rounded-2xl border border-white/12 bg-black/30 px-3.5 py-2.5 focus-within:border-white/25">
            <Mail className="h-4 w-4 text-white/60" />
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
              className="w-full bg-transparent text-[0.98rem] outline-none placeholder:text-white/40"
            />
          </div>

          {!useMagic && (
            <>
              <label className="block text-xs font-semibold text-white/70">PASSWORD</label>
              <div className="flex items-center gap-2 rounded-2xl border border-white/12 bg-black/30 px-3.5 py-2.5 focus-within:border-white/25">
                <input
                  type={show ? 'text' : 'password'}
                  autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full bg-transparent text-[0.98rem] outline-none placeholder:text-white/40"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="ml-1 rounded-lg p-2 text-white/70 hover:bg-white/10 focus:outline-none"
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-1 flex justify-end">
                <button
                  type="button"
                  onClick={handleForgot}
                  className="text-[0.85rem] text-white/70 underline-offset-4 hover:text-white focus:outline-none hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </>
          )}

          {/* Magic link toggle */}
          <label className="flex select-none items-center gap-2 pt-1 text-[0.92rem]">
            <input
              type="checkbox"
              checked={useMagic}
              onChange={(e) => setUseMagic(e.target.checked)}
              className="h-4 w-4 rounded border-white/30 bg-transparent text-brand-100 focus:ring-0"
            />
            <span className="text-white/80">Use magic link instead</span>
          </label>
        </div>

        {/* Error / Info */}
        {!!err && (
          <div className="mt-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[0.9rem] text-white/85">
            {err}
          </div>
        )}

        {/* CTA */}
        <button
          type="submit"
          disabled={busy}
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#fe9245] to-[#eb423b] text-[0.98rem] font-semibold text-white shadow-lg shadow-black/30 transition-transform active:scale-[.99] focus:outline-none disabled:opacity-60"
        >
          <CtaIcon className="h-5 w-5" />
          {CtaText}
        </button>

        {/* Divider */}
        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/50">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={async () => {
            setErr('')
            setBusy(true)
            try {
              const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
              if (error) throw error
            } catch (e) {
              setErr(e.message || 'Google sign-in failed.')
            } finally {
              setBusy(false)
            }
          }}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-black/30 text-[0.98rem] font-semibold text-white/95 hover:bg-white/10 focus:outline-none"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt=""
            className="h-5 w-5"
          />
          Continue with Google
        </button>

        {/* Switch */}
        <p className="mt-5 text-center text-[0.92rem] text-white/80">{SwitchLine}</p>
      </form>
    </div>
  )
}