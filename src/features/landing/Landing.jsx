// src/features/landing/Landing.jsx
import TopNav from './components/TopNav'
import LandingHero from './components/LandingHero'
import Footer from './components/Footer'

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-black text-white">
      <TopNav />
      <LandingHero />
      <Footer />
    </div>
  )
}
