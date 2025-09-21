// src/features/landing/WhyFeelFlick.jsx
import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Sparkles, ListChecks, Heart, ShieldCheck } from "lucide-react"

/**
 * WhyFeelFlick – concise value section under the hero
 * - Lighter cards & tighter spacing on mobile
 * - In-view reveal (respects reduced-motion)
 * - Copy avoids repeating the hero
 */
export default function WhyFeelFlick() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const m = window.matchMedia?.("(prefers-reduced-motion: reduce)")
    if (m?.matches) { setVisible(true); return }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setVisible(true)
    }, { threshold: 0.2 })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])

  return (
    <section ref={ref} className="relative overflow-hidden" aria-labelledby="why-title">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <div
          className={[
            "grid items-start gap-8 md:grid-cols-2 md:gap-10",
            "transition-all duration-700 motion-safe",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          ].join(" ")}
        >
          {/* Left: headline + benefits */}
          <div>
            <h2 id="why-title" className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Why <span className="text-brand-100">FeelFlick</span>
            </h2>

            {/* Short, non-redundant explainer */}
            <p className="mt-3 max-w-xl text-white/80">
              Built to end indecision: mood-first picks, short lists, and a tidy place to
              keep what you loved—so movie night starts sooner.
            </p>

            {/* Benefits */}
            <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Benefit icon={<Sparkles className="h-4 w-4" />} title="Mood engine">
                Tell us the vibe; we’ll surface the right films.
              </Benefit>
              <Benefit icon={<ListChecks className="h-4 w-4" />} title="Shortlists, not feeds">
                6–12 choices you can actually pick from.
              </Benefit>
              <Benefit icon={<Heart className="h-4 w-4" />} title="Watchlist & history">
                Save, rate, and revisit with one tap.
              </Benefit>
              <Benefit icon={<ShieldCheck className="h-4 w-4" />} title="No spam, ever">
                Start free. You stay in control.
              </Benefit>
            </ul>

            {/* CTA (kept compact to avoid repeating hero) */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
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
              <span className="ml-1 text-sm text-white/60">Create a free account in seconds.</span>
            </div>
          </div>

          {/* Right: lightweight “UI vibe” mock */}
          <div className="relative">
            <div className="relative mx-auto w-full max-w-sm md:max-w-md">
              <MockCard
                title="Shared with you"
                subtitle="@jason • 2h"
                body="“Smart, human, and unforgettable. Perfect when you want something hopeful.”"
                accent="from-brand-500/25 to-transparent"
                delay="0ms"
                visible={visible}
              />
              <MockCard
                className="mt-4 ml-8"
                title="Tonight’s picks"
                subtitle="6 items • mood: cozy"
                body="A small, spot-on list—no endless scrolling."
                accent="from-fuchsia-500/25 to-transparent"
                delay="120ms"
                visible={visible}
              />
              <MockCard
                className="mt-4 -ml-2"
                title="Watchlist"
                subtitle="12 saved"
                body="Keep what you love in one place."
                accent="from-sky-500/25 to-transparent"
                delay="240ms"
                visible={visible}
              />
            </div>

            {/* Tiny social proof */}
            <div
              className={[
                "mt-6 flex items-center justify-center gap-1 text-brand-100/90",
                "transition-opacity duration-700 motion-safe",
                visible ? "opacity-100" : "opacity-0",
              ].join(" ")}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L10 14.9l-5.2 2.6.99-5.78L1.5 7.62l5.82-.85L10 1.5z" />
                </svg>
              ))}
            </div>
            <p className="mt-2 text-center text-xs text-white/60">
              Loved by movie fans who value time over scrolling.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* --------------------------- small components --------------------------- */

function Benefit({ icon, title, children }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/90">
      <span className="mt-0.5 grid place-items-center rounded-md bg-white/10 p-1.5 text-brand-100">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="truncate font-semibold">{title}</div>
        <div className="text-white/70">{children}</div>
      </div>
    </li>
  )
}

function MockCard({ title, subtitle, body, className = "", accent = "from-brand-500/20 to-transparent", delay = "0ms", visible }) {
  return (
    <div
      className={[
        "rounded-xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-sm",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset]",
        "transition-all duration-700 motion-safe",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
        className,
      ].join(" ")}
      style={{ transitionDelay: delay }}
    >
      <div className="relative overflow-hidden rounded-xl">
        <div className={`absolute inset-0 -z-10 rounded-xl bg-gradient-to-tr ${accent}`} />
        <div className="flex items-center justify-between gap-3 p-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white/95">{title}</div>
            <div className="truncate text-xs text-white/60">{subtitle}</div>
          </div>
          <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-white/90 to-white/70 text-[11px] font-bold text-neutral-900 ring-1 ring-white/40">
            A
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-neutral-900/60 p-3 text-sm text-white/80">
          {body}
        </div>
      </div>
    </div>
  )
}