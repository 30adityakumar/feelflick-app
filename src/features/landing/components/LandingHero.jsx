import { Link } from 'react-router-dom'

/**
 * Props:
 * - embedded: removes standalone offsets/heights for use inside a fixed-height parent
 * - centered: removes internal vertical padding so content can be perfectly centered by parent
 */
export default function LandingHero({ embedded = false, centered = false }) {
  return (
    <section
      className="relative overflow-hidden"
      // Standalone pages still need to sit below the fixed TopNav
      style={embedded ? undefined : { marginTop: 'var(--topnav-h, var(--nav-h, 72px))' }}
    >
      {/* Optional collage layer */}
      <div className="feelflick-landing-bg" aria-hidden="true" />

      {/* MULTI-COLOR ABSTRACT BACKGROUND (logo-inspired) */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]" />
        <div className="pointer-events-none absolute -top-40 -left-40 h-[65vmin] w-[65vmin] rounded-full blur-3xl opacity-60 bg-[radial-gradient(closest-side,rgba(254,146,69,0.45),rgba(254,146,69,0)_70%)]" />
        <div className="pointer-events-none absolute -bottom-44 -right-44 h-[70vmin] w-[70vmin] rounded-full blur-3xl opacity-55 bg-[radial-gradient(closest-side,rgba(235,66,59,0.38),rgba(235,66,59,0)_70%)]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(45,119,255,0.35),rgba(45,119,255,0)_70%)]" />
        <div className="pointer-events-none absolute -top-24 right-[15%] h-[45vmin] w-[45vmin] rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(255,99,196,0.35),rgba(255,99,196,0)_70%)]" />
        <div className="pointer-events-none absolute bottom-[8%] left-[12%] h-[50vmin] w-[50vmin] rounded-full blur-3xl opacity-40 bg-[radial-gradient(closest-side,rgba(124,58,237,0.30),rgba(124,58,237,0)_70%)]" />
        <div className="pointer-events-none absolute top-[18%] left-[7%] h-[40vmin] w-[40vmin] rounded-full blur-3xl opacity-40 bg-[radial-gradient(closest-side,rgba(0,209,255,0.30),rgba(0,209,255,0)_70%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-35 mix-blend-screen">
          <div className="absolute left-1/2 top-1/2 h-[140vmin] w-[140vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_220deg_at_50%_50%,rgba(255,255,255,0.08),rgba(255,255,255,0)_65%)] motion-safe:md:animate-[spin_48s_linear_infinite]" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_0%,rgba(255,255,255,0.06),rgba(255,255,255,0)_60%)]" />
      </div>

      {/* Soft radial highlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 opacity-60"
        style={{
          background:
            'radial-gradient(700px 300px at 20% 15%, rgba(254,146,69,.25) 0%, transparent 60%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6" style={{ ['--nav-h']: '72px' }}>
        <div
          className={[
            'grid',
            'items-center',
            embedded ? 'h-full' : '',
            centered ? 'py-0' : 'py-8 sm:py-10',
          ].join(' ')}
          style={
            embedded
              ? undefined
              : { height: 'calc(100svh - var(--topnav-h, var(--nav-h, 72px)))' }
          }
        >
          <div className="mx-auto w-full max-w-3xl text-center md:max-w-2xl">
            <h1 className="text-balance text-[clamp(2.5rem,9vw,4.7rem)] font-black leading-[1.05] tracking-tight text-white">
              Movies that match <span className="text-brand-100">how you feel</span>
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-[clamp(1rem,2.7vw,1.25rem)] leading-relaxed text-white/85">
              Tell us how you want to feel. We hand-pick a short, spot-on list you’ll actually
              watch—no endless scrolling. Save favorites and keep your watchlist in one place.
            </p>

            <div className="mx-auto mt-7 flex max-w-sm flex-col items-center justify-center gap-3 sm:max-w-none sm:flex-row">
              <Link
                to="/auth/sign-up"
                className="inline-flex h-11 items-center justify-center rounded-full px-8 sm:px-9 text-[0.95rem] font-semibold text-white shadow-lift transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 active:scale-[.98] bg-gradient-to-r from-[#fe9245] to-[#eb423b]"
              >
                Get started
              </Link>
            </div>

            {/* Keep the small proof line only when not embedded */}
            {!embedded && (
              <p className="mt-3 text-sm text-white/65">Free to start. Your mood, your movie.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}