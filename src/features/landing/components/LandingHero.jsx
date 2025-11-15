// src/features/landing/components/LandingHero.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, TrendingUp, Users, Sparkles } from 'lucide-react'

export default function LandingHero() {
  const navigate = useNavigate()
  const [videoLoaded, setVideoLoaded] = useState(false)

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        {!videoLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-neutral-900 animate-pulse" />
        )}
        <video
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 md:py-32 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 sm:mb-8">
          <Sparkles className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-medium text-white">
            Your mood. Your movie. Instantly.
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6 sm:mb-8">
          <span className="block text-white mb-2">
            Discover Movies
          </span>
          <span className="block bg-gradient-to-r from-[#FF9245] via-[#EB423B] to-[#E03C9E] bg-clip-text text-transparent">
            That Match Your Mood
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-10 sm:mb-12 leading-relaxed">
          Stop endless scrolling. Tell us how you feel, and we'll find the perfect movie for you.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-[#FF9245] to-[#EB423B] text-white font-bold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/50 hover:scale-105 active:scale-95 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3">
              <Play className="h-5 w-5 fill-current" />
              Get Started Free
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#EB423B] to-[#E03C9E] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          <button
            onClick={() => {
              document.getElementById('how-it-works')?.scrollIntoView({ 
                behavior: 'smooth' 
              })
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-lg transition-all duration-300 hover:bg-white/20 hover:scale-105 active:scale-95"
          >
            Learn More
          </button>
        </div>

        {/* Social Proof */}
        <div className="mt-16 sm:mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-3xl mx-auto">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-3xl font-black text-white">
              <TrendingUp className="h-8 w-8 text-orange-400" />
              <span>10K+</span>
            </div>
            <p className="text-sm text-white/60">Movies Curated</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-3xl font-black text-white">
              <Users className="h-8 w-8 text-orange-400" />
              <span>5K+</span>
            </div>
            <p className="text-sm text-white/60">Happy Users</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-3xl font-black text-white">
              <Sparkles className="h-8 w-8 text-orange-400" />
              <span>100%</span>
            </div>
            <p className="text-sm text-white/60">Free Forever</p>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 rounded-full bg-white/60" />
        </div>
      </div>
    </section>
  )
}
