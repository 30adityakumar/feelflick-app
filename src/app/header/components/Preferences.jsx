// src/app/header/components/Preferences.jsx
/**
 * Minimal preferences shell for MVP.
 * Expand gradually (theme, autoplay trailers, subtitles, etc.).
 */
export default function Preferences() {
  return (
    <section
      className="mx-auto mt-14 max-w-[720px] rounded-2xl border border-white/10 bg-black/60 p-6 text-white shadow-2xl backdrop-blur-md"
      aria-labelledby="prefs-heading"
    >
      <h2 id="prefs-heading" className="mb-4 text-[22px] font-extrabold tracking-tight">
        Preferences
      </h2>
      <p className="text-white/80">
        Configure your viewing experience here. This page is intentionally minimal for MVP — add
        options over time (theme, autoplay trailers, language/subtitles, data saver, etc.).
      </p>
    </section>
  )
}