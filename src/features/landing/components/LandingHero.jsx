import { Link } from 'react-router-dom'
import { Clapperboard, Sparkles, Heart, ListChecks } from 'lucide-react'

/**
 * LandingHero
 * - Sits under TopNav (TopNav is fixed); hero adds top padding to clear it.
 * - Uses your global background: <div className="feelflick-landing-bg" />
 * - Fully responsive, fluid type, minimal CLS.
 */
export default function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background (your collage + gradient) */}
      <div className="feelflick-landing-bg" aria-hidden="true" />

      {/* Subtle radial light to add depth behind text */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 opacity-60"
        style={{
          background:
            'radial-gradient(700px 300px at 20% 15%, rgba(254,146,69,.25) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-14 sm:pt-28 sm:pb-20 md:px-6">
        <div className="cq grid items-center gap-10 md:grid-cols-2">
          {/* Left: copy + ctas */}
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
              Movies that match <span className="text-brand-100">how you feel</span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Browse smarter, build your watchlist, and keep track of what you’ve loved —
              all in a clean, fast, and beautiful experience.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/auth/sign-up"
                className="inline-flex h-11 items-center justify-center rounded-full px-5 text-[0.95rem] font-semibold text-white shadow-lift transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand/60 bg-gradient-to-r from-[#fe9245] to-[#eb423b]"
              >
                Get started
              </Link>
              <Link
                to="/auth/sign-in"
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/25 px-5 text-[0.95rem] font-semibold text-white/95 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
              >
                Sign in
              </Link>
              <span className="ml-1 text-sm text-white/55">No spam. No commitments.</span>
            </div>

            {/* Feature chips */}
            <ul className="mt-8 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
              <FeatureChip icon={<Clapperboard className="h-4 w-4" />} text="Trending & discoverable" />
              <FeatureChip icon={<ListChecks className="h-4 w-4" />} text="Watchlist & history" />
              <FeatureChip icon={<Heart className="h-4 w-4" />} text="Personalized picks" />
              <FeatureChip icon={<Sparkles className="h-4 w-4" />} text="Fast, clean UI" />
            </ul>
          </div>

          {/* Right: visual mock panel (safe if you don't have an image yet) */}
          <div className="hidden md:block">
            <div className="card-surface relative rounded-3xl p-3">
              <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-tr from-brand-600/10 to-transparent" />
              <div className="aspect-[10/7] w-full overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/60">
                {/* Placeholder grid to avoid CLS; swap with an image later if you like */}
                <div className="grid h-full grid-cols-3 gap-2 p-2">
                  {[...Array(9)].map((_, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-white/5"
                      style={{ containIntrinsicSize: '120px 160px', contentVisibility: 'auto' }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-white/50">
              Screens are illustrative. TMDb data used under license.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureChip({ icon, text }) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90">
      <span className="grid place-items-center rounded-md bg-white/10 p-1.5 text-brand-100">
        {icon}
      </span>
      <span className="truncate">{text}</span>
    </li>
  )
}