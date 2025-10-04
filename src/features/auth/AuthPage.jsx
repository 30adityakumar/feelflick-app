// src/features/auth/AuthPage.jsx
import { useLocation } from 'react-router-dom'
import TopNav from '@/features/landing/components/TopNav'
import Footer from '@/features/landing/components/Footer'
import AuthForm from '@/features/auth/components/AuthForm'

export default function AuthPage() {
  const { pathname } = useLocation()
  const mode = pathname.includes('sign-up') ? 'signup' : 'signin'

  return (
    <>
      {/* Same header, but hide the “Sign in” CTA while on auth */}
      <TopNav hideAuthCta />

      {/* Fill the viewport below TopNav; no page scroll */}
      <main
        id="main"
        className="relative mx-auto w-full overflow-hidden"
        style={{ height: 'calc(100svh - var(--topnav-h,72px))' }}
      >
        {/* Landing-style background lives under everything (incl. fixed footer) */}
        <div aria-hidden className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]" />
          <div className="pointer-events-none absolute -top-40 -left-40 h-[65vmin] w-[65vmin] rounded-full blur-3xl opacity-60 bg-[radial-gradient(closest-side,rgba(254,146,69,0.45),rgba(254,146,69,0)_70%)]" />
          <div className="pointer-events-none absolute -bottom-44 -right-44 h-[70vmin] w-[70vmin] rounded-full blur-3xl opacity-55 bg-[radial-gradient(closest-side,rgba(235,66,59,0.38),rgba(235,66,59,0)_70%)]" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(45,119,255,0.35),rgba(45,119,255,0)_70%)]" />
          <div className="pointer-events-none absolute -top-24 right-[15%] h-[45vmin] w-[45vmin] rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(255,99,196,0.35),rgba(255,99,196,0)_70%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-35 mix-blend-screen">
            <div className="absolute left-1/2 top-1/2 h-[140vmin] w-[140vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_220deg_at_50%_50%,rgba(255,255,255,0.08),rgba(255,255,255,0)_65%)] motion-safe:md:animate-[spin_48s_linear_infinite]" />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_0%,rgba(255,255,255,0.06),rgba(255,255,255,0)_60%)]" />
        </div>

        {/* Reserve exact footer height; center the card inside the remaining space */}
        <div
          className="relative z-10 grid h-full min-h-0"
          style={{ gridTemplateRows: '1fr var(--footer-h,0px)' }}
        >
          <section
            className="grid h-full place-items-center px-4 md:px-6"
            style={{ paddingTop: 'max(4vh, 8px)' }} // small top breathing room
          >
            <AuthForm mode={mode} />
          </section>
          <div aria-hidden />
        </div>
      </main>

      {/* Fixed footer; its height is measured to align the center above */}
      <Footer />
    </>
  )
}