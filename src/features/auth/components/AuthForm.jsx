// src/features/auth/components/AuthForm.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { ChevronLeft } from 'lucide-react'
import googleSvg from '@/assets/icons/google.svg'

export default function AuthForm() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  // If already authed, bounce to home
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) navigate('/home', { replace: true })
    })
  }, [navigate])

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
    <div className="relative">
      {/* soft brand glow behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 -z-10 rounded-[28px] opacity-70 blur-2xl"
        style={{
          background:
            'radial-gradient(65% 55% at 18% 12%, rgba(254,146,69,.18), transparent 60%), radial-gradient(70% 60% at 85% 20%, rgba(0,209,255,.16), transparent 65%)',
        }}
      />

      {/* Gradient hairline border wrapper */}
      <div className="w-[min(92vw,560px)] rounded-[22px] p-[1px] bg-[linear-gradient(135deg,rgba(254,146,69,.45),rgba(235,66,59,.35),rgba(45,119,255,.35),rgba(0,209,255,.35))] shadow-[0_40px_120px_rgba(0,0,0,.55)]">
        {/* Card */}
        <div className="rounded-[21px] bg-black/45 backdrop-blur-md ring-1 ring-white/10">
          {/* top bar: back only */}
          <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4">
            <button
              type="button"
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/85 hover:bg-white/10 focus:outline-none"
              aria-label="Go back"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <span className="inline-block w-9" />
          </div>

          {/* content */}
          <div className="px-5 pb-5 sm:px-7 sm:pb-7">
            <h1 className="text-center text-[clamp(1.05rem,2.1vw,1.35rem)] font-extrabold tracking-tight text-white">
              Sign in or create account
            </h1>
            <p className="mt-1 text-center text-[12.5px] leading-relaxed text-white/75">
              One tap with Google — fast, secure, no passwords.
            </p>

            {/* Google button */}
            <div className="mt-6">
              <button
                type="button"
                disabled={submitting}
                onClick={handleGoogle}
                className="
                  group inline-flex w-full items-center justify-center gap-3
                  rounded-full border border-white/12 bg-white/[.06]
                  py-3.5 px-5 text-[0.95rem] font-semibold text-white/95
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
            </div>

            {/* reassurance */}
            <p className="mt-4 text-center text-[11.5px] text-white/55">
              We never post or share without your permission.
            </p>

            {/* thin divider */}
            <div className="pointer-events-none mt-6 h-px w-full bg-white/10" />

            {/* tiny hint */}
            <p className="mt-4 flex items-center justify-center gap-2 text-[12px] text-white/65">
              <span className="inline-block h-[10px] w-[10px] rounded-[3px] bg-[conic-gradient(from_180deg,#fe9245,#eb423b,#2D77FF,#00D1FF,#fe9245)] opacity-70" />
              Use your Google account to sign in or create a new one.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}