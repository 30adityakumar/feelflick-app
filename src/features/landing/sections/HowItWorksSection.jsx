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
      className="relative py-24 bg-black overflow-hidden"
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

        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* LEFT: iPhone 16 Pro Mockup */}
          <div className="w-full lg:w-1/2 flex justify-center relative">
            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />
            
            {/* iPhone Frame */}
            <div className="relative z-10 w-full max-w-[340px] mx-auto">
              <iPhone16ProFrame />
            </div>
          </div>

          {/* RIGHT: Steps */}
          <div ref={containerRef} className="w-full lg:w-1/2 space-y-8">
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
      <div className="relative bg-neutral-900 rounded-[3rem] p-3 shadow-2xl ring-1 ring-white/10">
        
        {/* Screen container */}
        <div className="relative bg-black rounded-[2.5rem] overflow-hidden aspect-[9/19.5] w-full">
          
          {/* Dynamic Island */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full z-50 shadow-xl" />
          
          {/* Status Bar */}
          <div className="absolute top-0 inset-x-0 h-12 flex items-center justify-between px-6 pt-3 z-40">
            <span className="text-white text-[10px] font-semibold">9:41</span>
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-0.5 h-2.5 bg-white rounded-full" style={{ opacity: 1 - i * 0.2 }} />
                ))}
              </div>
              <div className="w-5 h-2.5 border border-white/30 rounded-[2px] relative">
                <div className="absolute inset-0.5 bg-white rounded-[1px]" />
              </div>
            </div>
          </div>

          {/* Screen Content */}
          <div className="absolute inset-0 pt-14 pb-6 px-4 bg-neutral-950 overflow-hidden">
            <MovieScreenContent />
          </div>
        </div>
      </div>

      {/* Side buttons */}
      <div className="absolute left-0 top-24 w-1 h-10 bg-neutral-800 rounded-r-sm -translate-x-full" />
      <div className="absolute left-0 top-40 w-1 h-14 bg-neutral-800 rounded-r-sm -translate-x-full" />
      <div className="absolute right-0 top-32 w-1 h-16 bg-neutral-800 rounded-l-sm translate-x-full" />
    </div>
  )
}

// 📱 Movie Screen Content
function MovieScreenContent() {
  return (
    <div className="space-y-4 h-full flex flex-col">
      
      {/* Movie Poster */}
      <div className="relative rounded-2xl overflow-hidden group aspect-[2/3] w-full">
        <img 
          src="https://image.tmdb.org/t/p/w780/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg" 
          alt="Inception"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        
        {/* Match Badge */}
        <div className="absolute top-3 right-3 bg-green-500 text-black font-black px-2 py-1 rounded-lg text-xs shadow-lg">
          96% MATCH
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl font-bold text-white mb-1">Inception</h3>
          <div className="flex items-center gap-2 text-white/70 text-[10px]">
            <span>2010</span><span>•</span><span>148m</span><span>•</span><span>⭐ 8.8</span>
          </div>
        </div>
      </div>

      {/* Streaming Services */}
      <div className="bg-neutral-900/50 rounded-xl p-3 border border-white/10">
        <div className="flex items-center gap-2 text-xs font-semibold text-white/90 mb-2">
          <Play className="w-3 h-3 text-teal-400" />
          <span>Available On</span>
        </div>
        <div className="flex items-center gap-2">
          <img src={netflixLogo} alt="Netflix" className="h-5 w-auto" />
          <img src={primeLogo} alt="Prime" className="h-5 w-auto" />
        </div>
      </div>

      {/* Why You'll Love It */}
      <div className="bg-neutral-900/50 rounded-xl p-3 border border-white/10 flex-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-white/90 mb-2">
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span>Why You'll Love It</span>
        </div>
        <ul className="space-y-2">
          <WhyBullet text="Mind-bending plot" />
          <WhyBullet text="Stunning visuals" />
          <WhyBullet text="Intelligent thriller" />
        </ul>
      </div>
    </div>
  )
}

function WhyBullet({ text }) {
  return (
    <li className="flex items-start gap-2 text-[10px] text-white/70">
      <CheckCircle2 className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
      <span>{text}</span>
    </li>
  )
}

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
