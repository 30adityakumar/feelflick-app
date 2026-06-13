import { useEffect } from 'react'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import './landing.css'
import Header from './sections/Header'
import Hero from './sections/Hero'
import TheProblem from './sections/TheProblem'
import Ritual from './sections/Ritual'
import FilmFile from './sections/FilmFile'
import Briefing from './sections/Briefing'
import DNA from './sections/DNA'
import Community from './sections/Community'
import MLetter from './sections/MLetter'
import Pricing from './sections/Pricing'
import FinalCTA from './sections/FinalCTA'
import Footer from './sections/Footer'

export default function Landing(){
  usePageMeta({
    title: 'FeelFlick — The right film. Right now.',
    description: "Films that know you. Tuned to your mood, your taste, and everything you've ever loved on screen. Free forever.",
    url: 'https://app.feelflick.com/',
  })
  // Opt motion-enabled clients into Reveal's hide-then-fade-in animation.
  // Crawlers, screen readers reading the static DOM, and prefers-reduced-motion
  // users never receive this class — so they see the page already-visible.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    document.documentElement.classList.add('with-motion')
    return () => document.documentElement.classList.remove('with-motion')
  }, [])
  return(
    <div>
      {/* Keyboard-only skip link. Invisible until focused; jumps past the fixed header + nav. */}
      <a href="#main" className="ff-skip">Skip to content</a>
      <Header/>
      {/* F2-B: a <div>, not <main> — PublicShell (src/app/router.jsx) already
          wraps every public route in the document's single <main id="main">,
          which is also the skip-link target. A second main + duplicate id here
          was an a11y landmark violation. */}
      <div>
        <Hero/>
        <TheProblem/>
        <Ritual/>
        <FilmFile/>
        <Briefing/>
        <DNA/>
        <Community/>
        <MLetter/>
        <Pricing/>
        <FinalCTA/>
      </div>
      <Footer/>
    </div>
  );
}
