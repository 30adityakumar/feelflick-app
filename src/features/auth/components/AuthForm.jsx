// src/features/auth/components/AuthForm.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { ShieldCheck, ChevronLeft, LogIn } from 'lucide-react'

export default function AuthForm({ mode = 'signin' }) {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  // If already authed, bounce to /home
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) navigate('/home', { replace: true })
    })
  }, [navigate])

  const title = mode === 'signup' ? 'Create your account' : 'Welcome back'
  const cta   = mode === 'signup' ? 'Continue with Google' : 'Sign in with Google'

  async function signInWithGoogle() {
    setSubmitting(true)
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/home` },
      })
      // Full-page redirect happens; no further code runs here
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="
        w-full max-w-[340px] sm:max-w-[360px]
        rounded-2xl border border-white/10 bg-black/35 backdrop-blur-sm
        shadow-[0_30px_120px_rgba(0,0,0,.55)]
        overflow-hidden
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/80 hover:bg-white/10 focus:outline-none"
          aria-label="Go back"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-white/80">
          <ShieldCheck className="h-4 w-4 text-brand-100" />
          <span className="text-xs font-semibold tracking-wide">FEELFLICK</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        <h1 className="text-center text-[clamp(1rem,1.6vw,1.25rem)] font-bold text-white">
          {title}
        </h1>
        <p className="mt-1 text-center text-[12px] text-white/70">
          Fast, private, and seamless with Google.
        </p>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={submitting}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#fe9245] to-[#eb423b] py-2.5 text-[0.92rem] font-semibold text-white disabled:opacity-60 focus:outline-none"
        >
          <LogIn className="h-4 w-4" />
          {submitting ? 'Opening Google…' : cta}
        </button>

        <p className="mt-3 text-center text-[11px] text-white/55">
          By continuing you agree to our&nbsp;
          <a href="/privacy" className="underline decoration-white/30 hover:text-white/80">Privacy</a>
          &nbsp;and&nbsp;
          <a href="/terms" className="underline decoration-white/30 hover:text-white/80">Terms</a>.
        </p>
      </div>
    </div>
  )
}