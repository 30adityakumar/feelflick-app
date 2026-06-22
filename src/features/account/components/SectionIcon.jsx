// src/features/account/components/SectionIcon.jsx
// Monochrome (currentColor) line glyphs for the Account nav + rows. Kept restrained per AEC —
// the active state is conveyed by rose + weight in CSS, not by per-section icon hues.

const PATHS = {
  overview: <><circle cx="12" cy="8" r="3.2" /><path d="M5.5 19a6.5 6.5 0 0 1 13 0" /></>,
  personal: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18" /><path d="M7 14h5" /></>,
  privacy: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  notifications: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  connections: <><path d="M9 12a3 3 0 0 1 3-3h3a3 3 0 0 1 0 6h-1" /><path d="M15 12a3 3 0 0 1-3 3H9a3 3 0 0 1 0-6h1" /></>,
  security: <><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></>,
  data: <><path d="M5 7h14" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" /></>,
  device: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8" /><path d="M12 16v4" /></>,
  check: <path d="M5 12l4 4 10-10" />,
  warning: <><path d="M12 4l9 16H3z" /><path d="M12 10v4" /><path d="M12 17h.01" /></>,
}

export default function SectionIcon({ name, size = 19, className = 'ff-acct__icon' }) {
  const glyph = PATHS[name] || PATHS.overview
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {glyph}
    </svg>
  )
}
