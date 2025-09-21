import { Link } from 'react-router-dom'
import { LogIn } from 'lucide-react'

export default function LandingHero() {
  return (
    <section
      className="relative overflow-hidden"
      // Start below the fixed TopNav; reads the measured var with fallbacks
      style={{ marginTop: 'var(--topnav-h, var(--nav-h, 72px))' }}
    >
      {/* Abstract background — layered color fields (no images) */}
      <div aria-hidden className="absolute inset-0 -z-10">
        {/* Base deep navy gradient */}
        <div className="absolute inset-0 bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]" />

        {/* Brand glow blobs */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-[65vmin] w-[65vmin] rounded-full blur-3xl opacity-60
                        bg-[radial-gradient(closest-side,rgba(254,146,69,0.40),rgba(254,146,69,0)_70%)]" />
        <div className="pointer-events-none absolute -bottom-44 -right-44 h-[70vmin] w-[70vmin] rounded-full blur-3xl opacity-50
                        bg-[radial-gradient(closest-side,rgba(235,66,59,0.35),rgba(235,66,59,0)_70%)]" />

        {/* Subtle conic shimmer (motion-safe rotation) */}
        <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen">
          <div className="absolute left-1/2 top-1/2 h-[140vmin] w-[140vmin] -translate-x-1/2 -translate-y-1/2 rounded-full
                          bg-[conic-gradient(from_220deg_at_50%_50%,rgba(255,255,255,0.08),rgba(255,255,255,0)_65%)]
                          motion-safe:animate-[spin_40s_linear_infinite]" />
        </div>

        {/* Gentle vignette for readability */}
        <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_0%,rgba(255,255,255,0.06),rgba(255,255,255,0)_60%)]" />
      </div>

      {/* (Optional) the small radial highlight you liked */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 opacity-60"
        style={{
          background:
            'radial-gradient(700px 300px at 20% 15%, rgba(254,146,69,.22) 0%, transparent 60%)',
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
            {/* Bigger, fluid headline on mobile */}
            <h1 className="text-[clamp(2.75rem,10vw,4.5rem)] font-black leading-[1.05] tracking-tight text-white">
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

              {/* Sign in button — dual-outline pill (as in your screenshot) */}
              <Link
                to="/auth/sign-in"
                className="group relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-full px-5
                           text-[0.95rem] font-semibold text-white/95
                           bg-black/30 hover:bg-black/40
                           focus:outline-none focus:ring-2 focus:ring-brand/60"
              >
                {/* outer soft ring */}
                <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/20" />
                {/* inner crisp ring */}
                <span className="pointer-events-none absolute inset-0 rounded-full [mask:linear-gradient(#000_0,transparent_2px)] ring-1 ring-white/15" />
                <LogIn className="h-4 w-4 text-white/90" aria-hidden />
                <span>Sign in</span>
              </Link>
            </div>

            <p className="mt-3 text-sm text-white/65">Free to start. Your mood, your movie.</p>
          </div>
        </div>
      </div>
    </section>
  )
}