import { Link, useNavigate } from 'react-router-dom'
import { useCallback } from 'react'
import logoPng from '@/assets/images/logo.png'

/**
 * LandingHero
 * - Big, readable hero that adapts fluidly
 * - Optimized hero image: high fetch priority, async decode
 * - Brand gradient CTA
 * - Buttons: Sign in → /auth/sign-in, Get started → /auth/sign-up
 * - Clicking the brand button also scrolls to top (Landing keeps TopNav doing that too)
 */
export default function LandingHero({
  title = 'Find movies by mood, vibe, and feels',
  subtitle = 'Stop doom-scrolling. Tell us how you feel and we’ll surface the right film—fast.',
  // Fallback uses your existing collage. Replace with your preferred hero assets anytime.
  imageSrc = '/collage.jpg',
}) {
  const navigate = useNavigate()

  const hideIfError = useCallback((e) => {
    // If a custom image path 404s, keep the gradient background clean.
    e.currentTarget.style.display = 'none'
  }, [])

  return (
    <section
      className="relative isolate overflow-hidden"
      aria-labelledby="landing-hero-title"
    >
      {/* Background image + gradient overlays */}
      <div className="absolute inset-0 -z-10">
        <img
          src={imageSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover brightness-[.5]"
          fetchpriority="high"
          decoding="async"
          loading="eager"
          sizes="100vw"
          onError={hideIfError}
        />
        {/* soft vignette + brand tint for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/35 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-600/20 via-transparent to-transparent" />
      </div>

      {/* Content container (mobile-first, comfy spacing) */}
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 pb-14 pt-24 text-center sm:pb-20 sm:pt-28 md:pb-24 md:pt-32 lg:pt-40">
        {/* Brand mini-button (optional) — scroll-to-top affordance + visual anchor */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-xs text-white/80 backdrop-blur hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60 sm:text-[0.8rem]"
        >
          <img
            src={logoPng}
            alt=""
            width="20"
            height="20"
            className="h-5 w-5 rounded"
          />
          FEELFLICK
        </button>

        {/* Headline */}
        <h1
          id="landing-hero-title"
          className="max-w-[16ch] text-balance text-4xl font-black leading-tight tracking-[-0.02em] text-white sm:text-5xl md:text-6xl"
        >
          {title}
        </h1>

        {/* Subhead */}
        <p className="mt-4 max-w-[52ch] text-pretty text-base leading-relaxed text-white/80 sm:text-lg">
          {subtitle}
        </p>

        {/* CTAs */}
        <div className="mt-7 flex w-full flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row sm:gap-4">
          {/* Sign in — outlined pill (a bit smaller on desktop, bigger on mobile) */}
          <Link
            to="/auth/sign-in"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 px-5 text-[1.05rem] font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 sm:h-10 sm:px-4 sm:text-[0.92rem]"
          >
            Sign in
          </Link>

          {/* Get started — brand gradient */}
          <Link
            to="/auth/sign-up"
            className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#fe9245] to-[#eb423b] px-6 text-[1.05rem] font-extrabold text-white shadow-lift transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-white/40 sm:h-10 sm:px-5 sm:text-[0.96rem]"
          >
            Get started
          </Link>
        </div>

        {/* Social proof / secondary row (optional) */}
        <div className="mt-8 text-xs text-white/50 sm:text-sm">
          No ads. Free to try. Works on any device.
        </div>
      </div>
    </section>
  )
}