// src/features/landing/components/LandingHero.jsx
import { Link } from 'react-router-dom'

/**
 * Landing hero with a right-side “mini stack” of movie posters on desktop,
 * and posters on top for mobile. Content stays perfectly centered between
 * the fixed TopNav (which sets --topnav-h) and the footer (optionally set
 * --footer-h, we fall back to 56px).
 *
 * Tip: If you add --footer-h in your Footer (like we do TopNav), this section
 * will auto-fit the remaining viewport without any extra scroll.
 */
export default function LandingHero({ embedded = false, posters }) {
  // Fallback posters (host any CDN you like; TMDb-sized images shown)
  const demo = posters?.length
    ? posters
    : [
        // primary (front)
        'https://image.tmdb.org/t/p/w780/qJ2tW6WMUDux911r6m7haRef0WH.jpg', // The Dark Knight
        // middle
        'https://image.tmdb.org/t/p/w780/uC6TTUhPpQCmgldGyYveKRAu8JN.jpg', // La La Land
        // back
        'https://image.tmdb.org/t/p/w780/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', // Parasite
      ]

  return (
    <section
      className="relative overflow-hidden"
      style={
        embedded
          ? undefined
          : {
              // Live exactly between TopNav and Footer. Footer var is optional.
              height:
                'calc(100svh - var(--topnav-h, 72px) - var(--footer-h, 56px))',
              marginTop: 'var(--topnav-h, 72px)',
            }
      }
    >
      {/* Optional brand collage */}
      <div className="feelflick-landing-bg" aria-hidden="true" />

      {/* BACKGROUND: brandy gradient + aurora blobs + subtle conic shimmer */}
      <DecorBackground />

      {/* Soft radial logo-hued highlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 opacity-60"
        style={{
          background:
            'radial-gradient(700px 300px at 20% 15%, rgba(254,146,69,.25) 0%, transparent 60%)',
        }}
      />

      {/* CONTENT GRID
          - Mobile: posters on top, copy beneath
          - Desktop: copy left, posters right
      */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8">
        <div
          className={[
            'grid h-full items-center',
            'gap-8 sm:gap-10',
            'md:grid-cols-2',
            embedded ? 'py-6 sm:py-8' : 'py-4 sm:py-6',
          ].join(' ')}
        >
          {/* Poster stack (top on mobile, right on desktop) */}
          <div className="order-1 md:order-2">
            <PosterStack posters={demo} />
          </div>

          {/* Copy + CTA (bottom on mobile, left on desktop) */}
          <div className="order-2 md:order-1 md:pl-4">
            <h1 className="text-balance text-[clamp(2.1rem,6.5vw,3.8rem)] font-black leading-[1.04] tracking-tight text-white">
              Movies that match your{' '}
              <span className="text-brand-100">mood</span>
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-[clamp(.95rem,2.2vw,1.1rem)] leading-relaxed text-white/85 md:mx-0">
              Get the perfect movie recommendation based on your taste and how
              you feel — fast, private, and always free.
            </p>

            <div className="mt-6">
              <Link
                to="/auth/sign-up"
                className="inline-flex h-11 items-center justify-center rounded-full px-8 sm:px-9 text-[0.95rem] font-semibold text-white shadow-lift transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 active:scale-[.98] bg-gradient-to-r from-[#fe9245] to-[#eb423b]"
              >
                Get started
              </Link>
            </div>

            {!embedded && (
              <p className="mt-3 text-sm text-white/65">
                Free to start. Your mood, your movie.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------------------- Visual building blocks ---------------------- */

function DecorBackground() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10">
      {/* Deep base gradient */}
      <div className="absolute inset-0 bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]" />

      {/* Brand aurora blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[65vmin] w-[65vmin] rounded-full blur-3xl opacity-60 bg-[radial-gradient(closest-side,rgba(254,146,69,0.45),rgba(254,146,69,0)_70%)]" />
      <div className="pointer-events-none absolute -bottom-44 -right-44 h-[70vmin] w-[70vmin] rounded-full blur-3xl opacity-55 bg-[radial-gradient(closest-side,rgba(235,66,59,0.38),rgba(235,66,59,0)_70%)]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(45,119,255,0.35),rgba(45,119,255,0)_70%)]" />
      <div className="pointer-events-none absolute -top-24 right-[15%] h-[45vmin] w-[45vmin] rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(255,99,196,0.35),rgba(255,99,196,0)_70%)]" />
      <div className="pointer-events-none absolute bottom-[8%] left-[12%] h-[50vmin] w-[50vmin] rounded-full blur-3xl opacity-40 bg-[radial-gradient(closest-side,rgba(124,58,237,0.30),rgba(124,58,237,0)_70%)]" />
      <div className="pointer-events-none absolute top-[18%] left-[7%] h-[40vmin] w-[40vmin] rounded-full blur-3xl opacity-40 bg-[radial-gradient(closest-side,rgba(0,209,255,0.30),rgba(0,209,255,0)_70%)]" />

      {/* Subtle conic shimmer */}
      <div className="pointer-events-none absolute inset-0 opacity-35 mix-blend-screen">
        <div className="absolute left-1/2 top-1/2 h-[140vmin] w-[140vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_220deg_at_50%_50%,rgba(255,255,255,0.08),rgba(255,255,255,0)_65%)] motion-safe:md:animate-[spin_48s_linear_infinite]" />
      </div>

      {/* Gentle vignette for readability */}
      <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_0%,rgba(255,255,255,0.06),rgba(255,255,255,0)_60%)]" />
    </div>
  )
}

/** The poster cluster with tasteful offsets so all 3 are visible at a glance. */
function PosterStack({ posters }) {
  // Defensive guards (just in case)
  const [front, middle, back] = [
    posters?.[0],
    posters?.[1] ?? posters?.[0],
    posters?.[2] ?? posters?.[1] ?? posters?.[0],
  ]

  return (
    <div className="relative mx-auto aspect-[5/6] w-[min(88vw,560px)] sm:w-[min(70vw,520px)]">
      {/* BACK card – slightly left, pushed back */}
      <PosterCard
        src={back}
        alt="Popular pick"
        className="absolute left-[-8%] top-[6%] rotate-[-8deg] scale-[.84] opacity-[.92] blur-[.2px]"
        shadow="0 30px 60px rgba(0,0,0,.5)"
      >
        {/* Decorative badge */}
        <FloatPill className="left-[-10px] top-[28%]">
          <SparkIcon className="h-3.5 w-3.5" />
          <span className="ml-1 text-[11px] font-semibold">🔥 Buzzing</span>
        </FloatPill>
      </PosterCard>

      {/* MIDDLE card – slightly right, visible edge */}
      <PosterCard
        src={middle}
        alt="Trending now"
        className="absolute right-[-10%] top-[2%] rotate-[6.5deg] scale-[.90] opacity-[.96]"
        shadow="0 38px 80px rgba(0,0,0,.55)"
      >
        {/* Corner bookmark */}
        <CornerIcon>
          <BookmarkIcon className="h-3.5 w-3.5" />
        </CornerIcon>
      </PosterCard>

      {/* FRONT card – centered & crisp */}
      <PosterCard
        src={front}
        alt="Top rated"
        className="absolute left-1/2 top-0 -translate-x-1/2 rotate-[-1.5deg] scale-[1]"
        shadow="0 50px 110px rgba(0,0,0,.6)"
      >
        <FloatPill className="right-[-8px] top-[10px]">
          <StarIcon className="h-3.5 w-3.5" />
          <span className="ml-1 text-[11px] font-semibold">Top rated</span>
        </FloatPill>

        {/* Floating heart */}
        <Bubble className="left-[-16px] top-[26%]">
          <HeartIcon className="h-4 w-4" />
        </Bubble>
      </PosterCard>
    </div>
  )
}

function PosterCard({ src, alt, className = '', shadow = '0 30px 60px rgba(0,0,0,.5)', children }) {
  return (
    <figure
      className={[
        'pointer-events-none select-none',
        'relative overflow-hidden rounded-[22px]',
        'ring-1 ring-white/10',
        'bg-neutral-900/20',
        className,
      ].join(' ')}
      style={{ width: '68%', aspectRatio: '2/3', boxShadow: shadow }}
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        loading="eager"
        decoding="async"
      />
      {/* Subtle glass gloss */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.06),transparent_24%,transparent_76%,rgba(255,255,255,.05)_100%)] mix-blend-screen" />
      {children}
    </figure>
  )
}

/* ----------------------------- UI chrome ----------------------------- */

function FloatPill({ children, className = '' }) {
  return (
    <div
      className={[
        'absolute z-10 inline-flex items-center rounded-full px-2.5 py-1',
        'text-white/95 backdrop-blur-md',
        'border border-white/15',
        'bg-[linear-gradient(90deg,rgba(254,146,69,.9),rgba(235,66,59,.9))]',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
function CornerIcon({ children }) {
  return (
    <div
      className={[
        'absolute right-2 bottom-2 z-10 grid place-items-center',
        'h-7 w-7 rounded-full',
        'bg-white/10 text-white backdrop-blur-sm',
        'border border-white/15',
      ].join(' ')}
    >
      {children}
    </div>
  )
}
function Bubble({ children, className = '' }) {
  return (
    <div
      className={[
        'absolute z-10 grid place-items-center',
        'h-8 w-8 rounded-full',
        'bg-[radial-gradient(circle_at_30%_30%,#ff8a4f_0%,#fe4c3c_60%,#c43dff_100%)]',
        'shadow-[0_8px_20px_rgba(0,0,0,.35)]',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

/* --------------------------- inline icons --------------------------- */

function StarIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="m12 3.3 2.27 4.6 5.08.74-3.67 3.58.87 5.07L12 15.9l-4.55 2.39.87-5.07L4.65 8.64l5.08-.74L12 3.3Z"
        fill="currentColor"
      />
    </svg>
  )
}
function BookmarkIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M6.5 3h11A1.5 1.5 0 0 1 19 4.5v15.3a.7.7 0 0 1-1.1.6L12 17.2l-5.9 3.2a.7.7 0 0 1-1.1-.6V4.5A1.5 1.5 0 0 1 6.5 3Z"
        fill="currentColor"
      />
    </svg>
  )
}
function HeartIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12.1 20.3S4 15 4 9.7A4.7 4.7 0 0 1 8.7 5c1.6 0 2.8.7 3.4 1.7.6-1 1.8-1.7 3.4-1.7A4.7 4.7 0 0 1 20 9.7c0 5.3-8 10.6-7.9 10.6Z"
        fill="white"
      />
    </svg>
  )
}
function SparkIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 2.5 13.6 8l5.6 1.7-5.6 1.7L12 17l-1.6-5.6L4.8 9.7 10.4 8 12 2.5Z"
        fill="currentColor"
      />
    </svg>
  )
}