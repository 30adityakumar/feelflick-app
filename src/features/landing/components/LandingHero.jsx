import { useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

/**
 * LandingHero
 * - Fully responsive, mobile-first
 * - Gradient background with soft shapes (no external assets required)
 * - CTA: Get started (primary, gradient) / Sign in (secondary, outline)
 * - Prefetches auth route on hover/focus for snappy navigation
 * - Uses our theme tokens + Tailwind utilities
 */
export default function LandingHero() {
  const navigate = useNavigate()

  // Prewarm the auth route chunk on intent (hover/focus)
  const prefetchAuth = useCallback(() => {
    // Non-blocking; ignored by bundlers if already loaded
    import('@/features/auth/AuthPage').catch(() => {})
  }, [])

  function onGetStarted() {
    navigate('/auth/sign-up')
  }

  return (
    <section
      className="relative cq mx-auto flex min-h-[86vh] w-full max-w-7xl items-center px-3 pt-24 sm:px-6 sm:pt-28 md:pt-32"
      aria-label="Hero"
    >
      {/* Background: layered gradients + subtle vignette for readability */}
      <HeroBackground />

      <div className="relative z-10 mx-auto w-full max-w-3xl text-center">
        <h1 className="mx-auto max-w-2xl text-balance text-[clamp(2.2rem,6.5vw,4.2rem)] font-black leading-[1.04] tracking-[-0.02em] text-white">
          Movies by <span className="text-brand-100">mood</span>.  
          Discover what <span className="text-brand-100">feels</span> right.
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-white/80 sm:mt-5 sm:text-lg">
          Tell us how you feel and we’ll surface films you’ll actually enjoy—fast, personal, and ad-free.
        </p>

        {/* CTAs */}
        <div className="mx-auto mt-7 flex w-full max-w-md items-center justify-center gap-3 sm:mt-8">
          <button
            onClick={onGetStarted}
            onMouseEnter={prefetchAuth}
            onFocus={prefetchAuth}
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#fe9245] to-[#eb423b] px-5 text-[0.95rem] font-semibold text-white shadow-lift transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand/60 sm:h-11 sm:w-auto"
          >
            Get started
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </button>

          <Link
            to="/auth/sign-in"
            onMouseEnter={prefetchAuth}
            onFocus={prefetchAuth}
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-white/25 px-5 text-[0.95rem] font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60 sm:h-11 sm:w-auto"
          >
            Sign in
          </Link>
        </div>

        <p className="mx-auto mt-3 max-w-md text-center text-xs text-white/60">
          No spam. You can remove your data any time.
        </p>
      </div>
    </section>
  )
}

/* -------------------------- internal components -------------------------- */

function HeroBackground() {
  return (
    <>
      {/* deep backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(90%_70%_at_10%_10%,#1b1b27_0%,#0c0c12_60%,#09090f_100%)]" />
      {/* warm sweep */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[.85] mix-blend-screen"
           style={{
             background:
               'conic-gradient(from 200deg at 10% 10%, rgba(254,146,69,.55), rgba(235,66,59,.55), rgba(24,64,109,.35), transparent 70%)'
           }} />
      {/* vignette for text contrast */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_40%,transparent_0%,rgba(0,0,0,.55)_100%)]" />
      {/* decorative noise (tiny, cached) */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-20 [background:repeating-linear-gradient(0deg,transparent_0,transparent_2px,rgba(255,255,255,.02)_3px,transparent_4px)]" />
    </>
  )
}