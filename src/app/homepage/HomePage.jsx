// src/app/homepage/HomePage.jsx
import { useEffect, useState } from "react"
import { Sparkles, X, Check } from "lucide-react"
import CarouselRow from "@/app/homepage/components/CarouselRow"

export default function HomePage() {
  const [showMood, setShowMood] = useState(false)
  const [mood, setMood] = useState(() => localStorage.getItem("feelflick_mood") || "")

  // Keyboard shortcut: press "m" to open/close mood picker
  useEffect(() => {
    const onKey = (e) => {
      if (e.key?.toLowerCase() === "m") setShowMood((s) => !s)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  function handleApplyMood(val) {
    setMood(val || "")
  }

  function clearMood() {
    localStorage.removeItem("feelflick_mood")
    setMood("")
  }

  return (
    <div className="w-full min-h-screen pb-14 bg-zinc-950">
      {/* tiny helper row (left message + mood button) */}
      <div className="mx-auto w-full max-w-[1100px] px-4 md:px-0 pt-3 flex items-center justify-between">
        <div className="text-white/70 text-[13px]">
          {mood ? "Personalized for your mood." : "Try a mood to personalize results."}
        </div>
        <button
          onClick={() => setShowMood(true)}
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[.06] px-3.5 py-1.5 text-[13.5px] font-semibold text-white/95 hover:bg-white/10 active:scale-[.99] focus:outline-none"
          aria-label="Match my mood"
          title="Match my mood (M)"
        >
          <Sparkles className="h-4 w-4 text-brand-100" />
          Match my mood
          <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-white/70">M</span>
        </button>
      </div>

      {/* context chips row */}
      <ContextChips mood={mood} onClearMood={clearMood} />

      {/* your rows */}
      <div className="flex flex-col gap-6 md:gap-10 max-w-full md:max-w-[1100px] mx-auto mt-4">
        <CarouselRow
          title={mood ? `Because you’re feeling ${pretty(mood)}` : "Popular Now"}
          endpoint="popular"
          // later: pass `mood` to bias results server-side or re-rank client-side
        />
        <CarouselRow title="Top Rated" endpoint="top_rated" />
      </div>

      {/* inlined overlay (no new files) */}
      <MoodPickerOverlay
        open={showMood}
        initialMood={mood}
        onClose={() => setShowMood(false)}
        onApply={handleApplyMood}
      />
    </div>
  )
}

/* ------------------------- Inlined helper components ------------------------- */

function ContextChips({ mood, onClearMood, extra = [] }) {
  const hasAnything = Boolean(mood) || extra.length > 0
  if (!hasAnything) return null

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 md:px-0 mt-3">
      <div className="flex flex-wrap items-center gap-2">
        {mood && (
          <span
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-3 py-1.5 text-[13px] text-white/90"
            title="Active mood"
          >
            Mood: <strong className="font-semibold">{moodLabel(mood)}</strong>
            <button
              onClick={onClearMood}
              className="ml-1 rounded-full p-0.5 text-white/70 hover:bg-white/10 focus:outline-none"
              aria-label="Clear mood"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        )}

        {extra.map((chip) => (
          <span
            key={`${chip.kind}:${chip.value}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[.05] px-3 py-1.5 text-[13px] text-white/85"
          >
            {chip.kind}: <strong className="font-medium">{chip.value}</strong>
          </span>
        ))}
      </div>
    </div>
  )
}

function MoodPickerOverlay({ open, initialMood, onClose, onApply, allowMulti = false }) {
  const MOODS = [
    { key: "cozy",        label: "Cozy",        grad: "from-[#fe9245] to-[#eb423b]" },
    { key: "uplifting",   label: "Uplifting",   grad: "from-[#ffb86b] to-[#ff6b6b]" },
    { key: "nostalgic",   label: "Nostalgic",   grad: "from-[#ff8a5b] to-[#2D77FF]" },
    { key: "romantic",    label: "Romantic",    grad: "from-[#ff6b9d] to-[#ff9a8b]" },
    { key: "intense",     label: "Intense",     grad: "from-[#eb423b] to-[#7b2cff]" },
    { key: "wholesome",   label: "Wholesome",   grad: "from-[#20c997] to-[#198754]" },
    { key: "mysterious",  label: "Mysterious",  grad: "from-[#2D77FF] to-[#00D1FF]" },
    { key: "mindbending", label: "Mind-bending",grad: "from-[#00D1FF] to-[#7b2cff]" },
    { key: "epic",        label: "Epic",        grad: "from-[#ff6b6b] to-[#ffcc70]" },
    { key: "dark",        label: "Dark",        grad: "from-[#23242a] to-[#0f1115]" },
  ]

  const [value, setValue] = useState(() => {
    if (allowMulti) return Array.isArray(initialMood) ? initialMood : []
    return typeof initialMood === "string" ? initialMood : (localStorage.getItem("feelflick_mood") || "")
  })

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.()
      if (e.key === "Enter") handleApply()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function toggle(m) {
    if (!allowMulti) return setValue(m)
    setValue((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))
  }

  function handleApply() {
    if (!allowMulti) {
      if (typeof value === "string") localStorage.setItem("feelflick_mood", value)
      onApply?.(value || "")
      onClose?.()
      return
    }
    onApply?.(Array.isArray(value) ? value : [])
    onClose?.()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center" role="dialog" aria-modal="true">
      {/* landing/auth style background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)] opacity-95" />
        <div className="pointer-events-none absolute -top-40 -left-40 h-[65vmin] w-[65vmin] rounded-full blur-3xl opacity-60 bg-[radial-gradient(closest-side,rgba(254,146,69,0.45),rgba(254,146,69,0)_70%)]" />
        <div className="pointer-events-none absolute -bottom-44 -right-44 h-[70vmin] w-[70vmin] rounded-full blur-3xl opacity-55 bg-[radial-gradient(closest-side,rgba(235,66,59,0.38),rgba(235,66,59,0)_70%)]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(45,119,255,0.35),rgba(45,119,255,0)_70%)]" />
      </div>

      {/* card */}
      <div className="relative w-[min(92vw,880px)] rounded-[22px] p-[1px] bg-[linear-gradient(135deg,rgba(254,146,69,.45),rgba(235,66,59,.35),rgba(45,119,255,.35),rgba(0,209,255,.35))] shadow-[0_40px_120px_rgba(0,0,0,.55)]">
        <div className="rounded-[21px] bg-black/50 backdrop-blur-lg ring-1 ring-white/10">
          {/* header */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2 text-white/90">
              <Sparkles className="h-5 w-5 text-brand-100" />
              <h2 className="text-[clamp(1.05rem,2.2vw,1.4rem)] font-extrabold tracking-tight">
                Match my mood
              </h2>
            </div>
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/85 hover:bg-white/10 focus:outline-none"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* body */}
          <div className="px-5 pb-5 sm:px-7 sm:pb-7">
            <p className="text-[13px] text-white/70 mb-4">
              Pick a mood to tailor recommendations. You can change this anytime.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {MOODS.map((m) => {
                const active = allowMulti ? Array.isArray(value) && value.includes(m.key) : value === m.key
                return (
                  <button
                    key={m.key}
                    onClick={() => toggle(m.key)}
                    className={[
                      "group relative rounded-xl px-3 py-3 text-left ring-1 ring-white/10 bg-white/[.04] hover:bg-white/[.08] transition",
                      active ? "ring-2 ring-white/30 bg-white/[.08]" : "",
                    ].join(" ")}
                  >
                    <div className={`h-8 w-8 rounded-md bg-gradient-to-r ${m.grad} opacity-80`} />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[0.95rem] font-semibold text-white/95">{m.label}</span>
                      {active && <Check className="h-4 w-4 text-white/90" />}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  if (allowMulti) setValue([])
                  else setValue("")
                }}
                className="text-[13px] text-white/70 hover:text-white/90 focus:outline-none"
              >
                Clear
              </button>
              <button
                onClick={handleApply}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#fe9245] to-[#eb423b] px-5 py-2.5 text-[0.95rem] font-semibold text-white focus:outline-none active:scale-[.99]"
              >
                Apply mood
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------- helpers -------------------------------- */

function moodLabel(key) {
  const map = {
    cozy: "Cozy",
    uplifting: "Uplifting",
    nostalgic: "Nostalgic",
    romantic: "Romantic",
    intense: "Intense",
    wholesome: "Wholesome",
    mysterious: "Mysterious",
    mindbending: "Mind-bending",
    epic: "Epic",
    dark: "Dark",
  }
  return map[key] || key
}

function pretty(s) {
  return s
    .replace("-", " ")
    .replace("mindbending", "Mind-bending")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}