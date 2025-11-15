// src/features/landing/components/LandingHero.jsx
import { useNavigate } from 'react-router-dom'
import { Heart, Sparkles, Users, TrendingUp } from 'lucide-react'

export default function LandingHero() {
  const navigate = useNavigate()

  const handleGetStarted = () => {
    navigate('/', { state: { showAuth: true } })
  }

  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 md:pt-32 pb-16 sm:pb-20 md:pb-24">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-2 mb-6 sm:mb-8">
            <Sparkles className="h-4 w-4 text-[#FF9245]" />
            <span className="text-xs sm:text-sm font-semibold text-white/90">
              Your Mood. Your Movie. Instantly.
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6 sm:mb-8">
            <span className="text-white">Movies That Match</span>
            <br />
            <span className="bg-gradient-to-r from-[#FF9245] via-[#EB423B] to-[#E03C9E] bg-clip-text text-transparent">
              How You Feel
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto max-w-2xl text-base sm:text-lg md:text-xl text-white/80 leading-relaxed mb-8 sm:mb-10">
            Whether you're stressed, excited, curious, or just want to unwind—FeelFlick finds the perfect movie for your vibe in seconds. No endless scrolling. Just pure emotional discovery.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#FF9245] to-[#EB423B] hover:to-[#E03C9E] px-8 py-4 text-base sm:text-lg font-bold text-white shadow-2xl hover:shadow-[#FF9245]/30 transition-all hover:scale-105 active:scale-95"
            >
              Start Discovering
            </button>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 px-8 py-4 text-base sm:text-lg font-bold text-white transition-all hover:scale-105 active:scale-95"
            >
              See How It Works
            </a>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
            Three Steps to Your Perfect Movie
          </h2>
          <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto">
            Finding movies that match your mood has never been this simple
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Step 1 */}
          <div className="group relative rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 sm:p-8 hover:bg-white/10 hover:border-[#FF9245]/30 transition-all">
            <div className="absolute -top-4 left-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#FF9245] to-[#EB423B] h-8 w-8 text-sm font-bold text-white shadow-lg">
              1
            </div>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9245]/20 to-[#EB423B]/20 text-[#FF9245]">
              <Heart className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Pick Your Mood</h3>
            <p className="text-sm sm:text-base text-white/70 leading-relaxed">
              Tell us how you're feeling—happy, sad, adventurous, or anything in between.
            </p>
          </div>

          {/* Step 2 */}
          <div className="group relative rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 sm:p-8 hover:bg-white/10 hover:border-[#EB423B]/30 transition-all">
            <div className="absolute -top-4 left-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#EB423B] to-[#E03C9E] h-8 w-8 text-sm font-bold text-white shadow-lg">
              2
            </div>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#EB423B]/20 to-[#E03C9E]/20 text-[#EB423B]">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Get Instant Recs</h3>
            <p className="text-sm sm:text-base text-white/70 leading-relaxed">
              Our mood-based engine curates movies perfectly matched to your vibe.
            </p>
          </div>

          {/* Step 3 */}
          <div className="group relative rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 sm:p-8 hover:bg-white/10 hover:border-[#E03C9E]/30 transition-all">
            <div className="absolute -top-4 left-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#E03C9E] to-[#FF9245] h-8 w-8 text-sm font-bold text-white shadow-lg">
              3
            </div>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#E03C9E]/20 to-[#FF9245]/20 text-[#E03C9E]">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Start Watching</h3>
            <p className="text-sm sm:text-base text-white/70 leading-relaxed">
              Track your favorites, share with friends, and discover more as we learn your taste.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <div className="text-center md:text-left">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9245]/20 to-[#EB423B]/20">
              <Heart className="h-5 w-5 text-[#FF9245]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Mood-Based</h3>
            <p className="text-sm text-white/60">Find movies by emotion, not just genre</p>
          </div>

          <div className="text-center md:text-left">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#EB423B]/20 to-[#E03C9E]/20">
              <Sparkles className="h-5 w-5 text-[#EB423B]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Personalized</h3>
            <p className="text-sm text-white/60">Recommendations that learn your taste</p>
          </div>

          <div className="text-center md:text-left">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#E03C9E]/20 to-[#FF9245]/20">
              <Users className="h-5 w-5 text-[#E03C9E]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Social</h3>
            <p className="text-sm text-white/60">Share watchlists and discover together</p>
          </div>

          <div className="text-center md:text-left">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9245]/20 to-[#E03C9E]/20">
              <TrendingUp className="h-5 w-5 text-[#FF9245]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Always Free</h3>
            <p className="text-sm text-white/60">Full features, no subscription required</p>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24">
        <div className="rounded-3xl bg-gradient-to-r from-[#FF9245] via-[#EB423B] to-[#E03C9E] p-8 sm:p-12 md:p-16 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            Ready to FeelFlick?
          </h2>
          <p className="text-base sm:text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands discovering movies that truly match their mood
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center justify-center rounded-xl bg-black hover:bg-black/90 px-8 py-4 text-base sm:text-lg font-bold text-white shadow-2xl transition-all hover:scale-105 active:scale-95"
          >
            Get Started Free
          </button>
        </div>
      </div>
    </div>
  )
}
