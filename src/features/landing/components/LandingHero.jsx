import { Link } from 'react-router-dom'

/**
 * Landing hero for the public page.
 * - Uses CSS class `.feelflick-landing-bg` you already have as the backdrop
 * - High-contrast overlay for readability
 * - Mobile-first, fluid type, accessible
 */
export default function LandingHero() {
  return (
    <section
      className="relative isolate overflow-hidden"
      aria-labelledby="landing-hero-h1"
    >
      {/* Background: your existing collage + gradient */}
      <div aria-hidden className="feelflick-landing-bg" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/75 via-black/55 to-black/20"
      />

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 pt-28 pb-16 sm:pt-32 sm:pb-24 md:px-6 lg:pt-36 lg:pb-28">
        <div className="cq mx-auto max-w-3xl text-center">
          <h1
            id="landing-hero-h1"
            className="font-black tracking-tight text-white
                       text-[clamp(2.2rem,7vw,4rem)] leading-[1.06]"
          >
            Find the <span className="text-brand-100">right movie</span> for your mood.
          </h1>

          <p
            className="mt-4 text-white/80
                       text-[clamp(1rem,2.8vw,1.25rem)] leading-relaxed"
          >
            Browse by feeling, keep spoilers off, and build your watchlist in seconds.
          </p>

          {/* CTAs */}
          <div className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:mt-7 sm:flex-row sm:items-center sm:justify-center">
            <Link
              to="/auth/sign-in"
              className="inline-flex h-11 items-center justify-center rounded-full
                         border border-white/25 px-5
                         text-[clamp(.95rem,2.8vw,0.9rem)] font-semibold text-white
                         hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
            >
              Sign in
            </Link>

            <Link
              to="/auth/sign-up"
              className="inline-flex h-11 items-center justify-center rounded-full
                         px-6 text-[clamp(1rem,3vw,0.95rem)] font-semibold text-white
                         shadow-lift transition-transform hover:scale-[1.02]
                         focus:outline-none focus:ring-2 focus:ring-brand/60
                         bg-gradient-to-r from-[#fe9245] to-[#eb423b]"
            >
              Get started
            </Link>
          </div>

          {/* Quick value bullets */}
          <ul
            className="mt-6 grid grid-cols-1 gap-2 text-left text-[0.95rem] text-white/80 sm:mt-7 sm:grid-cols-3 sm:text-sm"
            aria-label="Highlights"
          >
            <li className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-400" />
              Mood-first discovery
            </li>
            <li className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-400" />
              Zero-spoilers mode
            </li>
            <li className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-400" />
              One-tap watchlist
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}