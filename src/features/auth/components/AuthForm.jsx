// src/features/auth/components/AuthForm.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import googleSvg from '@/assets/icons/google.svg'

export default function AuthForm({ onBack }) {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) navigate('/home', { replace: true })
    })
  }, [navigate])

  const handleBack = () => {
    if (typeof onBack === 'function') return onBack()
    if (window.history.length > 1) return navigate(-1)
    return navigate('/')
  }

  async function handleGoogle() {
    try {
      setSubmitting(true)
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/home',
          queryParams: { prompt: 'select_account' },
        },
      })
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="
        w-[min(92vw,420px)]
        rounded-[20px] p-[1px]
        bg-[linear-gradient(135deg,rgba(254,146,69,.45),rgba(235,66,59,.35),rgba(45,119,255,.35),rgba(0,209,255,.35))]
        shadow-[0_28px_90px_rgba(0,0,0,.55)]
        text-white
      "
    >
      <div className="rounded-[19px] bg-black/50 backdrop-blur-md ring-1 ring-white/10">
        <div className="flex items-center justify-between px-4 pt-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-[13px] text-white/80 hover:text-white/95 hover:bg-white/10 focus:outline-none"
            aria-label="Go back"
          >
            <span aria-hidden>←</span>
            <span>Back</span>
          </button>
          <span className="inline-block w-10" />
        </div>

        <div className="px-5 pb-5 pt-2 sm:px-6">
          <h1 className="text-center text-[clamp(1rem,2vw,1.25rem)] font-extrabold tracking-tight">
            Sign in or create account
          </h1>

          <div className="mt-4">
            <button
              type="button"
              disabled={submitting}
              onClick={handleGoogle}
              className="
                group inline-flex w-full items-center justify-center gap-3
                rounded-full border border-white/12 bg-white/[.06]
                py-3 px-5 text-[0.95rem] font-semibold text-white/95
                hover:bg-white/10 active:scale-[.99] focus:outline-none disabled:opacity-60
              "
              aria-label="Continue with Google"
            >
              <img
                src={googleSvg}
                width="18"
                height="18"
                alt=""
                aria-hidden="true"
                className="opacity-95"
              />
              <span>Continue with Google</span>
            </button>

            <p className="mt-3 text-center text-[11.5px] text-white/60">
              By continuing, you agree to our{' '}
              <a href="/terms" className="underline decoration-white/30 hover:text-white/90">Terms</a>{' '}
              and{' '}
              <a href="/privacy" className="underline decoration-white/30 hover:text-white/90">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}