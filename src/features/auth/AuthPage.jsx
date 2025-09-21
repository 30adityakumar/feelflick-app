// src/features/auth/AuthPage.jsx
import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AuthForm from '@/features/auth/components/AuthForm'

export default function AuthPage({ mode: modeProp }) {
  const { pathname } = useLocation()
  const mode = useMemo(() => {
    if (modeProp) return modeProp
    return pathname.toLowerCase().includes('sign-up') ? 'sign-up' : 'sign-in'
  }, [modeProp, pathname])

  return (
    <main
      id="main"
      className="relative overflow-hidden"
      // Replace hero: occupy exactly the viewport below TopNav, no page scroll
      style={{
        marginTop: 'var(--topnav-h,72px)',
        height: 'calc(100svh - var(--topnav-h,72px))',
      }}
    >
      {/* Keep your existing collage layer if you use it */}
      <div className="feelflick-landing-bg" aria-hidden="true" />

      {/* LandingHero background (color gradient + blobs + ribbon) */}
      <div aria-hidden className="absolute inset-0 -z-10">
        {/* Deep base */}
        <div className="absolute inset-0 bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]" />

        {/* Brand aurora blobs */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-[60vmin] w-[60vmin] rounded-full blur-3xl opacity-60 bg-[radial-gradient(closest-side,rgba(254,146,69,0.45),transparent_65%)]" />
        <div className="pointer-events-none absolute -bottom-44 -right-44 h-[66vmin] w-[66vmin] rounded-full blur-3xl opacity-55 bg-[radial-gradient(closest-side,rgba(235,66,59,0.38),transparent_65%)]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[78vmin] w-[78vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(45,119,255,0.35),transparent_65%)]" />
        <div className="pointer-events-none absolute -top-24 right-[15%] h-[42vmin] w-[42vmin] rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(255,99,196,0.35),transparent_65%)]" />
        <div className="pointer-events-none absolute bottom-[8%] left-[12%] h-[46vmin] w-[46vmin] rounded-full blur-3xl opacity-40 bg-[radial-gradient(closest-side,rgba(124,58,237,0.30),transparent_65%)]" />

        {/* S-curve ribbon (faint) */}
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
              <filter id="ff-ribbon-blur">
                <feGaussianBlur stdDeviation="28" />
              </filter>
            </defs>
            <path
              d="M -120 620
                 C 260 300, 700 780, 1000 420
                 C 1250 130, 1500 520, 1720 340"
              fill="none"
              stroke="url(#ff-ribbon)"
              strokeWidth="180"
              strokeLinecap="round"
              filter="url(#ff-ribbon-blur)"
            />
          </svg>
        </div>

        {/* Gentle top highlight */}
        <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_0%,rgba(255,255,255,0.06),transparent_60%)]" />
      </div>

      {/* Content: centered, non-scrollable */}
      <section className="relative z-10 mx-auto flex h-full max-w-7xl items-center justify-center px-4 md:px-6">
        <div className="w-full max-w-md">
          {/* Small heading to keep everything within one viewport on small devices */}
          <h1 className="text-center text-[clamp(1.25rem,4.5vw,1.75rem)] font-extrabold tracking-tight text-white">
            {mode === 'sign-up' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-1 text-center text-[0.95rem] text-white/75">
            {mode === 'sign-up' ? 'Join in seconds. No spam, ever.' : 'Sign in to continue.'}
          </p>

          <div className="mt-5">
            <AuthForm mode={mode} />
          </div>

          {/* No TMDB disclaimer, no footer */}
        </div>
      </section>
    </main>
  )
}