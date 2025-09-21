import { Link } from 'react-router-dom'

export default function LandingHero() {
  return (
    <section
      className="relative overflow-hidden"
      // Start below the fixed TopNav; uses measured CSS var with fallbacks
      style={{ marginTop: 'var(--topnav-h, var(--nav-h, 72px))' }}
    >
      {/* Your existing collage/gradient background */}
      <div className="feelflick-landing-bg" aria-hidden="true" />

      {/* Subtle radial highlight (kept exactly as before) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 opacity-60"
        style={{
          background:
            'radial-gradient(700px 300px at 20% 15%, rgba(254,146,69,.25) 0%, transparent 60%)',
        }}
      />

      {/* Content: perfectly centered within remaining viewport */}
      <div
        className="relative z-10 mx-auto max-w-7xl px-4 md:px-6"
        style={{ ['--nav-h']: '72px' }}
      >
        <div
          className="grid items-center py-14 sm:py-16"
          style={{ minHeight: 'calc(100svh - var(--topnav-h, var(--nav-h, 72px)))' }}
        >
          <div className="mx-auto w-full max-w-3xl text-center md:max-w-2xl">
            <h1 className="text-[clamp(2.25rem,8vw,4.25rem)] font-black leading-[1.05] tracking-tight text-white">
              Movies that match <span className="text-brand-100">how you feel</span>
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-[clamp(1rem,2.7vw,1.25rem)] leading-relaxed text-white/85">
              Tell us how you want to feel. We hand-pick a short, spot-on list you’ll actually
              watch—no endless scrolling. Save favorites and keep your watchlist in one place.
            </p>

            {/* CTAs */}
            <div className="mx-auto mt-7 flex max-w-sm flex-col items-center justify-center gap-3 sm:max-w-none sm:flex-row">
              <Link
                to="/auth/sign-up"
                className="inline-flex h-11 items-center justify-center rounded-full px-6 text-[0.95rem] font-semibold text-white shadow-lift transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand/60 bg-gradient-to-r from-[#fe9245] to-[#eb423b]"
              >
                Get started
              </Link>
              <Link
                to="/auth/sign-in"
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/25 px-5 text-[0.95rem] font-semibold text-white/95 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
              >
                Sign in
              </Link>
            </div>

            <p className="mt-3 text-sm text-white/65">
              Free to start. Your mood, your movie.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}