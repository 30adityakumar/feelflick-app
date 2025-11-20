// src/features/landing/sections/HeroSection.jsx
import { useState } from 'react'
import { useScrollAnimation } from '@/features/landing/utils/scrollAnimations'
import { Sparkles, Play, ChevronDown } from 'lucide-react'
import InlineAuthModal from '@/features/auth/components/InlineAuthModal'

/**
 * 🎬 HERO SECTION - Netflix/Prime-Inspired
 * 
 * Cinematic hero with:
 * - Subtle movie poster backdrop
 * - Streaming service trust badges
 * - Strong value prop with urgency
 * - Dual CTAs (primary + demo)
 * - Visual product preview
 */
export default function HeroSection({ showInlineAuth, onAuthOpen, onAuthClose }) {
  const { ref, isVisible } = useScrollAnimation()
  const [showDemo, setShowDemo] = useState(false)

  const scrollToNext = () => {
    const nextSection = document.getElementById('how-it-works')
    if (nextSection) {
      const offset = 80
      const elementPosition = nextSection.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' })
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black" />
      
      {/* Subtle Movie Poster Grid (Ultra Low Opacity) */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="grid grid-cols-8 gap-2 h-full">
          {/* Placeholder for movie posters - replace with real images */}
          {[...Array(64)].map((_, i) => (
            <div key={i} className="bg-white/10 rounded animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>

      {/* Radial Spotlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div
        ref={ref}
        className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 text-center transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        
        {/* Early Access Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm mb-6 sm:mb-8 group hover:bg-purple-500/20 transition-all cursor-pointer">
          <Sparkles className="w-4 h-4 text-purple-400 group-hover:rotate-12 transition-transform" />
          <span className="text-sm font-medium text-purple-300">Join 10,000+ Movie Lovers</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-tight">
          <span className="text-white">Stop Scrolling.</span>
          <br />
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Start Watching.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl lg:text-2xl text-white/70 max-w-3xl mx-auto mb-4">
          Find movies you'll love in <span className="text-yellow-400 font-bold">60 seconds</span>—no endless scrolling, no decision fatigue.
        </p>

        {/* Trust Line */}
        <p className="text-sm text-white/50 mb-10 sm:mb-12">
          AI-powered recommendations • 100+ streaming services • Free forever
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          
          {/* Primary CTA */}
          <button
            onClick={onAuthOpen}
            className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60 transition-all duration-300 hover:scale-105 active:scale-95 w-full sm:w-auto"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              Get Started Free
            </span>
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
          </button>

          {/* Secondary CTA */}
          <button
            onClick={scrollToNext}
            className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-lg backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 w-full sm:w-auto group"
          >
            <span className="flex items-center justify-center gap-2">
              <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
              See How It Works
            </span>
          </button>
        </div>

        {/* Streaming Service Logos */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-xs text-white/40 uppercase tracking-wider">Works with your favorite services</p>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {/* Replace these with actual logo images */}
            <div className="text-white/30 font-bold text-sm hover:text-white/60 transition-colors">Netflix</div>
            <div className="text-white/30 font-bold text-sm hover:text-white/60 transition-colors">Prime Video</div>
            <div className="text-white/30 font-bold text-sm hover:text-white/60 transition-colors">Disney+</div>
            <div className="text-white/30 font-bold text-sm hover:text-white/60 transition-colors">Hulu</div>
            <div className="text-white/30 font-bold text-sm hover:text-white/60 transition-colors">HBO Max</div>
            <div className="text-white/30 font-bold text-sm hover:text-white/60 transition-colors">+95 more</div>
          </div>
        </div>

        {/* Social Proof Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto">
          <MetricCard number="10,000+" label="Users" />
          <MetricCard number="4.8/5" label="Rating" />
          <MetricCard number="92%" label="Accuracy" accent />
          <MetricCard number="100+" label="Services" />
        </div>
      </div>

      {/* Scroll Indicator */}
      <button
        onClick={scrollToNext}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 hover:text-white/70 transition-colors group animate-bounce"
      >
        <ChevronDown className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>

      {/* Inline Auth Modal */}
      {showInlineAuth && (
        <InlineAuthModal onClose={onAuthClose} />
      )}
    </section>
  )
}

/**
 * Metric Card Component
 */
function MetricCard({ number, label, accent }) {
  return (
    <div className="text-center group cursor-default">
      <div className={`text-3xl sm:text-4xl font-black mb-2 ${
        accent 
          ? 'bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent' 
          : 'text-white'
      } group-hover:scale-110 transition-transform`}>
        {number}
      </div>
      <div className="text-sm text-white/50">{label}</div>
    </div>
  )
}
