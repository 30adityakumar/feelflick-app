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
      className="relative pt-24 pb-24 bg-black overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-20">
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
          
          {/* LEFT: iPhone 16 Pro Mockup */}
          <div className="relative mx-auto lg:mx-0 mb-16 lg:mb-0 flex justify-center">
            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />
            
            {/* iPhone Frame - guaranteed visible */}
            <div className="relative z-10 w-full max-w-[375px]">
              <iPhone16ProFrame />
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

// 📱 iPhone 16 Pro Frame Component
function iPhone16ProFrame() {
  return (
    <div className="relative w-full">
      {/* Phone outer shell */}
      <div className="relative bg-neutral-900 rounded-[3.5rem] p-3 shadow-2xl ring-1 ring-white/10">
        
        {/* Screen container with proper aspect ratio */}
        <div className="relative bg-black rounded-[3rem] overflow-hidden" style={{ paddingBottom: '216.67%' }}>
          
          {/* Absolute positioned content */}
          <div className="absolute inset-0">
            
            {/* Dynamic Island */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-32 h-9 bg-black rounded-full z-50 shadow-xl" />
            
            {/* Status Bar */}
            <div className="absolute top-0 inset-x-0 h-14 flex items-center justify-between px-8 pt-3 z-40">
              <span className="text-white text-sm font-semibold">9:41</span>
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-0.5 h-3 bg-white rounded-full" style={{ opacity: 1 - i * 0.2 }} />
                  ))}
                </div>
                <svg className="w-6 h-3" viewBox="0 0 24 12" fill="white">
                  <rect x="0" y="0" width="18" height="12" rx="2" opacity="0.35"/>
                  <rect x="0" y="0" width="14" height="12" rx="2" opacity="1"/>
                  <rect x="20" y="4" width="2" height="4" rx="0.5" opacity="0.4"/>
                </svg>
              </div>
            </div>

            {/* Screen Content - Scrollable */}
            <div className="absolute inset-0 overflow-y-auto pt-16 pb-8 px-4 bg-neutral-950">
              <MovieScreenContent />
            </div>
          </div>
        </div>
      </div>

      {/* Side buttons */}
      <div className="absolute left-0 top-24 w-1 h-12 bg-neutral-800 rounded-r-sm -translate-x-full" />
      <div className="absolute left-0 top-40 w-1 h-16 bg-neutral-800 rounded-r-sm -translate-x-full" />
      <div className="absolute right-0 top-32 w-1 h-20 bg-neutral-800 rounded-l-sm translate-x-full" />
    </div>
  )
}

// 📱 Movie Screen Content (what's inside the phone)
function MovieScreenContent() {
  return (
    <div className="space-y-4">
      
      {/* Movie Poster Card */}
      <div className="relative rounded-3xl overflow-hidden group">
        <img 
          src="https://image.tmdb.org/t/p/w780/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg" 
          alt="Inception"
          className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        {/* Match Score Badge */}
        <div className="absolute top-4 right-4 bg-green-500 text-black font-black px-3 py-1.5 rounded-xl text-sm shadow-lg shadow-green-500/50">
          96% MATCH
        </div>

        {/* Watchlist Button */}
        <button className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white transition-all">
          <Heart className="w-5 h-5" />
        </button>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="text-2xl font-bold text-white mb-1">Inception</h3>
          <div className="flex items-center gap-2 text-white/70 text-xs">
            <span>2010</span>
            <span>•</span>
            <span>148 min</span>
            <span>•</span>
            <span>⭐ 8.8</span>
          </div>
        </div>
      </div>

      {/* Genre Tags */}
      <div className="flex items-center gap-2 px-1">
        <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/80 text-xs font-medium">
          Sci-Fi
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/80 text-xs font-medium">
          Action
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/80 text-xs font-medium">
          Thriller
        </span>
      </div>

      {/* Streaming Services */}
      <div className="bg-neutral-900/50 backdrop-blur-md rounded-2xl p-4 border border-white/10">
        <div className="flex items-center gap-2 text-sm font-semibold text-white/90 mb-3">
          <Play className="w-4 h-4 text-teal-400" />
          <span>Available On</span>
        </div>
        <div className="flex items-center gap-2">
          <StreamingBadge logo={netflixLogo} name="Netflix" />
          <StreamingBadge logo={primeLogo} name="Prime" />
        </div>
      </div>

      {/* Why You'll Love It */}
      <div className="bg-neutral-900/50 backdrop-blur-md rounded-2xl p-4 border border-white/10">
        <div className="flex items-center gap-2 text-sm font-semibold text-white/90 mb-3">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Why You'll Love It</span>
        </div>
        <ul className="space-y-2">
          <WhyBullet text="Mind-bending plot with layered storytelling" />
          <WhyBullet text="Stunning visuals & practical effects" />
          <WhyBullet text="Perfect for fans of intelligent thrillers" />
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/70 font-semibold text-sm hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Pass
        </button>
        <button className="py-3 px-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 font-semibold text-sm hover:bg-green-500/30 transition-all flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Watch
        </button>
      </div>
    </div>
  )
}

// Streaming Service Badge (compact for mobile)
function StreamingBadge({ logo, name }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
      <img src={logo} alt={name} className="w-5 h-5 object-contain" />
      <span className="text-xs text-white/70 font-medium">
        {name}
      </span>
    </div>
  )
}

// Why Bullet Point
function WhyBullet({ text }) {
  return (
    <li className="flex items-start gap-2 text-xs text-white/70">
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
