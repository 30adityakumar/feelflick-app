// src/features/auth/AuthPage.jsx
import { useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import TopNav from '@/features/landing/components/TopNav'
import Footer from '@/features/landing/components/Footer'
import AuthForm from '@/features/auth/components/AuthForm'

export default function AuthPage() {
  const { mode: modeParam } = useParams() // "sign-in" | "sign-up" | undefined
  const loc = useLocation()
  const navigate = useNavigate()

  // Normalize mode (default: sign-up when coming from "Get started")
  const mode = useMemo(() => {
    if (modeParam === 'sign-in' || modeParam === 'sign-up') return modeParam
    // also support legacy /auth?mode=sign-in|sign-up
    const q = new URLSearchParams(loc.search).get('mode')
    return q === 'sign-in' ? 'sign-in' : 'sign-up'
  }, [modeParam, loc.search])

  const swapMode = () => {
    navigate(`/auth/${mode === 'sign-in' ? 'sign-up' : 'sign-in'}`, { replace: true })
  }

  return (
    <>
      <TopNav />

      {/* Same background as Landing */}
      <section
        id="main"
        className="relative mx-auto w-full overflow-hidden"
        style={{ height: 'calc(100svh - var(--topnav-h,72px))' }}
      >
        <div className="grid h-full grid-rows-[1fr_auto]">
          {/* Gradient stack (matches LandingHero) */}
          <div className="relative">
            <div aria-hidden className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]" />
              <div className="pointer-events-none absolute -top-40 -left-40 h-[65vmin] w-[65vmin] rounded-full blur-3xl opacity-60 bg-[radial-gradient(closest-side,rgba(254,146,69,0.45),rgba(254,146,69,0)_70%)]" />
              <div className="pointer-events-none absolute -bottom-44 -right-44 h-[70vmin] w-[70vmin] rounded-full blur-3xl opacity-55 bg-[radial-gradient(closest-side,rgba(235,66,59,0.38),rgba(235,66,59,0)_70%)]" />
              <div className="pointer-events-none absolute top-1/2 left-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(45,119,255,0.35),rgba(45,119,255,0)_70%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_0%,rgba(255,255,255,0.06),rgba(255,255,255,0)_60%)]" />
            </div>

            {/* Centered card; no page scroll */}
            <div
              className="mx-auto grid place-content-center"
              style={{ height: 'calc(100svh - var(--topnav-h,72px) - var(--footer-h,0px))' }}
            >
              <AuthForm mode={mode} onSwap={swapMode} />
            </div>
          </div>

          <Footer />
        </div>
      </section>
    </>
  )
}