// src/features/landing/sections/HowItWorksSection.jsx
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'
import { Star, Sparkles, Play, Heart, CheckCircle2 } from 'lucide-react'
import netflixLogo from '@/assets/icons/netflix-logo-icon.svg'
import primeLogo from '@/assets/icons/amazon-prime-video.svg'

export default function HowItWorksSection() {
  const { containerRef, itemsVisible } = useStaggeredAnimation(3, 200)

  return (
    <section
      id="how-it-works"
      className="relative pb-24 bg-black overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-6">
            Your Personal{' '}
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Movie Curator
            </span>
          </h2>
          <p className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto">
            Stop relying on random algorithms. Tell us how you feel, and we'll do the rest.
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          
          {/* LEFT: Single Hero Card */}
          <div className="relative mx-auto lg:mx-0 mb-16 lg:mb-0">
            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/20 blur-[120px] rounded-full" />
            
            {/* Main Movie Card */}
            <div className="relative z-10">
              <MovieCard />
            </div>
          </div>

          {/* RIGHT: Steps */}
          <div ref={containerRef} className="space-y-8">
            <Step 
              icon={<Star className="w-6 h-6 text-amber-400" />} 
              title="1. Rate what you've seen" 
              desc="Swipe through movies you know. Love it? Hate it? Every rating sharpens your taste profile." 
              isVisible={itemsVisible.includes(0)} 
            />
            <Step 
              icon={<Sparkles className="w-6 h-6 text-purple-400" />} 
              title="2. Get mood-based matches" 
              desc="Our AI analyzes emotional tone, pacing, and crowd sentiment—not just genre tags." 
              isVisible={itemsVisible.includes(1)} 
            />
            <Step 
              icon={<Play className="w-6 h-6 text-teal-400" />} 
              title="3. Watch instantly" 
              desc="See exactly where to stream it. Netflix, Prime, Hulu, Max—we check 100+ services." 
              isVisible={itemsVisible.includes(2)} 
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// 🎬 Single Hero Movie Card
function MovieCard() {
  return (
    <div className="max-w-md mx-auto group">
      {/* Main Card Container */}
      <div className="bg-neutral-900/90 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-500 hover:shadow-purple-500/20 hover:border-white/20 hover:-translate-y-2">
        
        {/* Poster Section */}
        <div className="relative h-[420px] overflow-hidden">
          <img 
            src="https://image.tmdb.org/t/p/w780/q6y0Go1rZgVoTFZYpK391L0imU.jpg" 
            alt="Pulp Fiction"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          {/* Match Score Badge */}
          <div className="absolute top-4 right-4 bg-green-500 text-black font-black px-4 py-2 rounded-xl text-base shadow-lg shadow-green-500/50 animate-pulse">
            98% MATCH
          </div>

          {/* Watchlist Button */}
          <button className="absolute top-4 left-4 w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white hover:scale-110 transition-all duration-300">
            <Heart className="w-5 h-5" />
          </button>

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className="text-3xl font-bold text-white mb-2">Pulp Fiction</h3>
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <span>1994</span>
              <span>•</span>
              <span>154 min</span>
              <span>•</span>
              <span>⭐ 8.9</span>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-6 space-y-5">
          
          {/* Genre Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm font-medium">
              Crime
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm font-medium">
              Drama
            </span>
          </div>

          {/* Streaming Services */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <Play className="w-4 h-4 text-teal-400" />
              <span>Available On</span>
            </div>
            <div className="flex items-center gap-3">
              <StreamingBadge logo={netflixLogo} name="Netflix" />
              <StreamingBadge logo={primeLogo} name="Prime Video" />
            </div>
          </div>

          {/* Why You'll Love It */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Why You'll Love It</span>
            </div>
            <ul className="space-y-2">
              <WhyBullet text="Dark humor & non-linear storytelling" />
              <WhyBullet text="Iconic dialogue & memorable characters" />
              <WhyBullet text="Matches your taste for crime dramas" />
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Streaming Service Badge
function StreamingBadge({ logo, name }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group">
      <img src={logo} alt={name} className="w-6 h-6 object-contain group-hover:scale-110 transition-transform" />
      <span className="text-xs text-white/60 group-hover:text-white/90 transition-colors font-medium">
        {name}
      </span>
    </div>
  )
}

// Why Bullet Point
function WhyBullet({ text }) {
  return (
    <li className="flex items-start gap-2 text-sm text-white/70">
      <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
      <span>{text}</span>
    </li>
  )
}

// Step Component
function Step({ icon, title, desc, isVisible }) {
  return (
    <div 
      className={`flex gap-6 p-6 rounded-2xl transition-all duration-500 hover:bg-white/5 border border-transparent hover:border-white/5 group ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
      }`}
    >
      <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-neutral-900 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform shadow-lg">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
          {title}
        </h3>
        <p className="text-white/60 leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  )
}
