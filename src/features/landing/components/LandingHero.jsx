import { Link } from 'react-router-dom'
import { useState } from 'react'

/**
 * LandingHero
 * Props (all optional):
 *  - backgroundUrl: string (hero image); if missing, we render a gradient-only hero.
 *  - title: string
 *  - subtitle: string
 */
export default function LandingHero({
  backgroundUrl,
  title = 'Find what to watch by how you feel.',
  subtitle = 'Smart mood-based discovery across movies and shows—curated for you.'
}) {
  const [imgOk, setImgOk] = useState(true)

  return (
    <section
      className="relative isolate cq overflow-hidden bg-black text-white"
      aria-label="FeelFlick landing hero"
    >
      {/* Backdrop image (optional) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {backgroundUrl && imgOk ? (
          <img
            src={backgroundUrl}
            alt=""
            fetchpriority="high"
            decoding="async"
            loading="eager"
            className="h-full w-full object-cover"
            onError={() => setImgOk(false)}
          />
        ) : null}

        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_10%,rgba(255,255,255,.08),transparent_60%),linear-gradient(to_bottom,rgba(0,0,0,.55),rgba(0,0,0,.72))]" />
      </div>

      {/* Extra blur when the page is scrolled (TopNav applies backdrop-blur; we ensure readability here too) */}
      <div className="absolute inset-0 -z-10 backdrop-blur-0 motion-safe:transition-[backdrop-filter] data-[scrolled=true]:backdrop-blur-sm" />

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-3 pt-28 pb-16 sm:px-6 sm:pt-32 sm:pb-24">
        <div className="max-w-3xl">
          <h1
            className="text-[clamp(1.9rem,5.2vw,3.4rem)] font-black leading-tight tracking-tight"
          >
            {title}
          </h1>
          <p className="mt-3 text-[clamp(1rem,2.5vw,1.25rem)] text-white/80">
            {subtitle}
          </p>

          {/* CTAs */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/auth/sign-up"
              className="inline-flex h-12 items-center justify-center rounded-full px-6 text-[clamp(1rem,2.6vw,0.95rem)] font-semibold text-white shadow-lift focus:outline-none focus:ring-2 focus:ring-brand/60 bg-gradient-to-r from-[#fe9245] to-[#eb423b] hover:scale-[1.02] motion-safe:transition-transform"
            >
              Get started
            </Link>

            <Link
              to="/auth/sign-in"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 px-6 text-[clamp(1rem,2.6vw,0.9rem)] font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              Sign in
            </Link>
          </div>

          {/* Social proof / mini features (optional, easy to hide) */}
          <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/60">
            <li>⚡ Fast, ad-free browsing</li>
            <li>•</li>
            <li>🎯 Mood-based filters</li>
            <li>•</li>
            <li>🔒 Secure with Supabase</li>
          </ul>
        </div>
      </div>

      {/* Decorative bottom fade to help next section contrast */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-black/80" />
    </section>
  )
}