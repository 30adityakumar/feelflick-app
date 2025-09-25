// src/features/auth/AuthPage.jsx
import TopNav from '@/features/landing/components/TopNav'
import Footer from '@/features/landing/components/Footer'
import AuthForm from '@/features/auth/components/AuthForm' // keep your existing form
import { Link, useLocation } from 'react-router-dom'

export default function AuthPage() {
  const { pathname } = useLocation()
  const isSignUp = /sign-?up/i.test(pathname)

  return (
    <>
      <TopNav />

      {/* Lock the viewport below the fixed nav; no page scroll */}
      <main
        id="auth"
        className="relative mx-auto w-full overflow-hidden"
        style={{ height: 'calc(100svh - var(--topnav-h, 72px))' }}
      >
        {/* 1 row for content, 1 for footer to pin it to the bottom */}
        <div className="grid h-full grid-rows-[1fr_auto]">
          {/* Background layer (same vibe as Landing) */}
          <section className="relative overflow-hidden">
            <div aria-hidden className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]" />
              <div className="pointer-events-none absolute -top-40 -left-40 h-[65vmin] w-[65vmin] rounded-full blur-3xl opacity-60 bg-[radial-gradient(closest-side,rgba(254,146,69,0.45),rgba(254,146,69,0)_70%)]" />
              <div className="pointer-events-none absolute -bottom-44 -right-44 h-[70vmin] w-[70vmin] rounded-full blur-3xl opacity-55 bg-[radial-gradient(closest-side,rgba(235,66,59,0.38),rgba(235,66,59,0)_70%)]" />
              <div className="pointer-events-none absolute top-1/2 left-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(45,119,255,0.35),rgba(45,119,255,0)_70%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_0%,rgba(255,255,255,0.06),rgba(255,255,255,0)_60%)]" />
            </div>

            {/* Center the auth card within the available height (minus footer) */}
            <div
              className="relative z-10 mx-auto flex h-full max-w-7xl items-center justify-center px-4 md:px-6"
              style={{
                height:
                  'calc(100svh - var(--topnav-h,72px) - var(--footer-h,0px))',
              }}
            >
              <div className="w-full max-w-[460px]">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-7 text-white backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,.45)]">
                  {/* Small title / switch links */}
                  <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-lg font-semibold tracking-tight">
                      {isSignUp ? 'Create your account' : 'Welcome back'}
                    </h1>
                    <div className="text-sm text-white/75">
                      {isSignUp ? (
                        <>
                          Have an account?{' '}
                          <Link
                            to="/auth/sign-in"
                            className="font-semibold text-brand-100 hover:underline"
                          >
                            Sign in
                          </Link>
                        </>
                      ) : (
                        <>
                          New here?{' '}
                          <Link
                            to="/auth/sign-up"
                            className="font-semibold text-brand-100 hover:underline"
                          >
                            Get started
                          </Link>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Your existing form component */}
                  <AuthForm />
                </div>
              </div>
            </div>
          </section>

          <Footer />
        </div>
      </main>
    </>
  )
}