// src/features/landing/WhyFeelFlick.jsx
import { Link } from 'react-router-dom'
import { Sparkles, ListChecks, Heart } from 'lucide-react'

export default function WhyFeelFlick() {
  return (
    <section
      id="why"
      aria-labelledby="why-title"
      className="relative overflow-hidden"
    >
      {/* subtle brand glow to tie section into the theme */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-50"
        style={{
          background:
            'radial-gradient(600px 240px at 12% 8%, rgba(254,146,69,.18), transparent 60%)',
        }}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="why-title"
            className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          >
            Why <span className="text-brand-100">FeelFlick</span>
          </h2>

          {/* concise line, not repeating hero copy */}
          <p className="mx-auto mt-3 max-w-2xl text-white/80">
            End decision fatigue with mood-first picks and small, watchable lists.
          </p>

          {/* compact feature pills */}
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FeaturePill icon={<Sparkles className="h-4 w-4" />} text="Mood-first picks" />
            <FeaturePill icon={<ListChecks className="h-4 w-4" />} text="6–12 choices, max" />
            <FeaturePill icon={<Heart className="h-4 w-4" />} text="Save & track easily" />
          </ul>

          {/* quiet secondary link to details (avoid duplicating CTAs from hero) */}
          <div className="mt-7">
            <Link
              to="/about"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/60"
            >
              How it works <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturePill({ icon, text }) {
  return (
    <li className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90">
      <span className="grid place-items-center rounded-md bg-white/10 p-1.5 text-brand-100">
        {icon}
      </span>
      <span className="truncate">{text}</span>
    </li>
  )
}