// src/features/landing/sections/HowItWorksSection.jsx
import { useState, useEffect, useRef } from 'react'
import { Star, Sparkles, Play, Check } from 'lucide-react'

export default function HowItWorksSection() {
  const [inView, setInView] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative min-h-screen flex items-center py-16 lg:py-0 bg-gradient-to-b from-black via-neutral-950 to-black overflow-hidden"
    >
      {/* Ambient glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/3 -right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[128px]" />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className={`text-center mb-12 lg:mb-16 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 sm:mb-6">
            How{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-transparent">
              FeelFlick
            </span>
            {' '}Works
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            Discover your perfect movie in three simple steps.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-center">
          
          {/* 📱 iPhone Mockup - Compact & Optimized */}
          <div className={`relative mx-auto lg:mx-0 transition-all duration-1000 delay-200 ${inView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            
            {/* Glow effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] sm:w-[300px] lg:w-[320px] h-[360px] sm:h-[420px] lg:h-[440px] bg-purple-500/20 blur-[100px] rounded-full animate-pulse" />
            
            {/* iPhone container */}
            <div className="relative z-10 w-[260px] sm:w-[300px] lg:w-[320px] mx-auto">
              
              {/* iPhone frame with Dynamic Island */}
              <div className="relative w-full aspect-[9/19.5] bg-black border-[8px] border-neutral-900 rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.95)] ring-1 ring-white/10 overflow-hidden">
                
                {/* Screen content */}
                <div className="absolute inset-0 bg-neutral-950 flex flex-col">
                  
                  {/* iPhone Status Bar with Dynamic Island */}
                  <div className="h-9 w-full bg-black/95 backdrop-blur-sm flex justify-between items-start px-6 pt-2 relative">
                    {/* Dynamic Island */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full" />
                    
                    <div className="text-white text-xs font-semibold">9:41</div>
                    <div className="flex gap-1 items-center">
                      <div className="flex gap-0.5">
                        <div className="w-0.5 h-2 bg-white rounded-full" />
                        <div className="w-0.5 h-2.5 bg-white rounded-full" />
                        <div className="w-0.5 h-3 bg-white rounded-full" />
                        <div className="w-0.5 h-3.5 bg-white rounded-full" />
                      </div>
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="7" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                        <rect x="21" y="9.5" width="2" height="5" rx="0.5" fill="currentColor"/>
                      </svg>
                    </div>
                  </div>
                  
                  {/* App header - Compact */}
                  <div className="h-10 bg-neutral-950/95 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-4">
                    <div className="text-white/50 text-xs font-medium">← Discover</div>
                    <div className="text-white text-sm font-bold">Inception</div>
                    <div className="w-4" />
                  </div>
                  
                  {/* Scrollable content area - COMPACT POSTER */}
                  <div className="flex-1 overflow-hidden flex flex-col">
                    
                    {/* Movie poster - REDUCED HEIGHT */}
                    <div className="relative w-full h-48">
                      <img 
                        src="https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg" 
                        alt="Inception"
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neutral-950/40 to-neutral-950" />
                    </div>
                    
                    {/* Movie info - More prominent */}
                    <div className="flex-1 bg-neutral-950 px-4 pt-3 pb-2 space-y-3">
                      
                      {/* Title & metadata */}
                      <div>
                        <h3 className="text-white text-lg font-black leading-tight mb-1.5">
                          Inception
                        </h3>
                        <div className="flex items-center gap-2 text-white/60 text-xs mb-2">
                          <span className="font-medium">2010</span>
                          <span>•</span>
                          <span>2h 28m</span>
                          <span>•</span>
                          <div className="flex items-center gap-1 text-amber-400">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span className="text-white font-bold">8.8</span>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">Sci-Fi</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-500/10 text-pink-300 border border-pink-500/20">Thriller</span>
                        </div>
                      </div>
                      
                      {/* CTA button - Plex yellow style */}
                      <button className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 hover:from-amber-500 hover:to-amber-600 transition-all">
                        <Check className="w-4 h-4" />
                        <span>Added to Watchlist</span>
                      </button>
                      
                      {/* Streaming platforms */}
                      <div>
                        <div className="text-white text-[10px] font-semibold mb-1.5 opacity-60">Stream on</div>
                        <div className="flex gap-2">
                          <div className="w-10 h-10 rounded-lg bg-[#E50914] flex items-center justify-center shadow-md">
                            <span className="text-white text-base font-black">N</span>
                          </div>
                          <div className="w-10 h-10 rounded-lg bg-[#00A8E1] flex items-center justify-center shadow-md">
                            <span className="text-white text-base font-black">P</span>
                          </div>
                          <div className="w-10 h-10 rounded-lg bg-[#1CE783] flex items-center justify-center shadow-md">
                            <span className="text-black text-base font-black">H</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bottom tab bar */}
                  <div className="h-14 bg-black/95 backdrop-blur-sm border-t border-white/5 flex justify-around items-center px-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-5 h-5 rounded-full bg-purple-500" />
                      <div className="w-1 h-1 rounded-full bg-purple-500" />
                    </div>
                    <div className="w-5 h-5 rounded-full bg-neutral-700" />
                    <div className="w-5 h-5 rounded-full bg-neutral-700" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 📝 Steps Content */}
          <div className="space-y-6 lg:space-y-8">
            <Step 
              icon={<Star className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />}
              number="01"
              title="Rate movies you've seen" 
              desc="Love it or hate it? Every swipe sharpens your taste profile." 
              delay="delay-300"
              inView={inView}
            />
            <Step 
              icon={<Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />}
              number="02"
              title="Get mood-based matches" 
              desc="AI analyzes emotion, pacing, and tone—not just genre tags." 
              delay="delay-500"
              inView={inView}
            />
            <Step 
              icon={<Play className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400" />}
              number="03"
              title="Watch instantly" 
              desc="See where to stream across all your services. No more app-hopping." 
              delay="delay-700"
              inView={inView}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// Step Component
function Step({ icon, number, title, desc, delay, inView }) {
  return (
    <div 
      className={`group relative flex gap-4 sm:gap-5 p-4 sm:p-6 rounded-2xl transition-all duration-700 hover:bg-white/5 border border-white/5 hover:border-white/10 ${delay} ${
        inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
      }`}
    >
      {/* Number badge */}
      <div className="absolute -top-3 -left-3 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs sm:text-sm font-black shadow-lg shadow-purple-500/50 ring-4 ring-black">
        {number}
      </div>
      
      {/* Icon */}
      <div className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-neutral-900 flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:border-white/20 group-hover:bg-neutral-800 transition-all duration-300 shadow-lg">
        {icon}
      </div>
      
      {/* Content */}
      <div className="flex-1 pt-1">
        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
          {title}
        </h3>
        <p className="text-sm sm:text-base text-white/60 leading-relaxed group-hover:text-white/70 transition-colors">
          {desc}
        </p>
      </div>
    </div>
  )
}
