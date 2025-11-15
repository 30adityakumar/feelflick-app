// src/features/landing/Landing.jsx
import TopNav from './components/TopNav'
import LandingHero from './components/LandingHero'
import Footer from './components/Footer'

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* FeelFlick Cinematic Background */}
      <div aria-hidden className="fixed inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-neutral-950 to-black" />
        
        {/* Animated gradient blobs */}
        <div className="absolute -top-40 -left-40 h-[60vmin] w-[60vmin] rounded-full blur-3xl opacity-40 bg-gradient-to-br from-[#FF9245] to-[#EB423B] animate-pulse" />
        <div className="absolute -bottom-44 -right-44 h-[70vmin] w-[70vmin] rounded-full blur-3xl opacity-35 bg-gradient-to-br from-[#EB423B] to-[#E03C9E] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-[#E03C9E] via-[#EB423B] to-[#FF9245]" />
        
        {/* Subtle grain texture */}
        <div className="absolute inset-0 opacity-[0.015] mix-blend-soft-light bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <TopNav />
        <LandingHero />
        <Footer />
      </div>
    </div>
  )
}
