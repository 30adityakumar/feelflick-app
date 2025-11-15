// src/features/landing/Landing.jsx
import TopNav from './components/TopNav'
import LandingHero from './components/LandingHero'
import Footer from './components/Footer'

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-white">
      <TopNav />
      <main>
        <LandingHero />
        {/* Future: Add Features, How It Works, Testimonials sections */}
      </main>
      <Footer />
    </div>
  )
}
