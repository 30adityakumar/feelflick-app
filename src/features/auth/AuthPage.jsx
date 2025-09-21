import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import AuthForm from '@/features/auth/components/AuthForm'

export default function AuthPage({ mode: modeProp }) {
  const { pathname } = useLocation()

  // Auto-detect from route if no prop provided
  const mode = useMemo(() => {
    if (modeProp) return modeProp
    return pathname.toLowerCase().includes('sign-up') ? 'sign-up' : 'sign-in'
  }, [modeProp, pathname])

  return (
    <main
      id="main"
      className="relative min-h-screen"
      style={{ marginTop: 'var(--topnav-h, 72px)' }}
    >
      {/* Background (reuse hero vibe) */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]" />
        <div className="pointer-events-none absolute -top-40 -left-40 h-[60vmin] w-[60vmin] rounded-full blur-3xl opacity-55 bg-[radial-gradient(closest-side,rgba(254,146,69,0.40),transparent_65%)]" />
        <div className="pointer-events-none absolute bottom-[-12%] right-[-12%] h-[66vmin] w-[66vmin] rounded-full blur-3xl opacity-50 bg-[radial-gradient(closest-side,rgba(235,66,59,0.32),transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_0%,rgba(255,255,255,0.06),transparent_60%)]" />
      </div>

      <section className="mx-auto grid max-w-7xl grid-cols-1 px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-center text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {mode === 'sign-up' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-center text-white/70">
            {mode === 'sign-up'
              ? 'Join in seconds. No spam, ever.'
              : 'Sign in to pick up where you left off.'}
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur md:p-6">
            <AuthForm mode={mode} />
          </div>

          <p className="mt-4 text-center text-xs text-white/50">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>
      </section>
    </main>
  )
}