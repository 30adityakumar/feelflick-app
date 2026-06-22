// src/features/history/components/DiaryHeader.jsx
// Diary masthead on the Library foundation (warm Ink + Inter): "Your library" eyebrow, the single
// visible <h1> "Diary", and the truthful subtitle. The Library section nav is rendered ABOVE this
// by the route shell; the compact stats render below.

import Eyebrow from '@/shared/ui/Eyebrow'

export default function DiaryHeader() {
  return (
    <section className="ff-diary-section ff-diary-masthead">
      <Eyebrow color="var(--ts-text-secondary, #beb8ad)" spacing="0.32em" size={10}>Your library</Eyebrow>
      <h1 className="ff-diary-hero">Diary</h1>
      <p className="ff-diary-masthead__sub">A chronological record of films you watched and what you thought.</p>
    </section>
  )
}
