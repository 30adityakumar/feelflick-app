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
      className="relative pb-20 pt-16 sm:pb-24 sm:pt-20 lg:pb-32 lg:pt-24 bg-gradient-to-b from-neutral-950 via-black to-black overflow-hidden"
    >
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/3 -right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[128px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className={`text-center mb-12 sm:mb-16 lg:mb-20 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 sm:mb-6">
            How{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-transparent">
              FeelFlick
            </span>
            {' '}Works
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            Discover your perfect movie in three simple steps. No endless scrolling, no decision fatigue.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-center">
          
          {/* 📱 Phone Mockup - Optimized for all screens */}
          <div className={`relative mx-auto lg:mx-0 transition-all duration-1000 delay-200 ${inView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            
            {/* Glow effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] sm:w-[280px] lg:w-[320px] h-[360px] sm:h-[420px] lg:h-[480px] bg-purple-500/20 blur-[100px] rounded-full animate-pulse" />
            
            {/* Phone container */}
            <div className="relative z-10 w-[280px] sm:w-[320px] lg:w-[360px] xl:w-[380px] mx-auto">
              
              {/* Phone frame */}
              <div className="relative w-full aspect-[9/19.5] bg-black border-[6px] sm:border-[8px] border-neutral-800 rounded-[2.5rem] sm:rounded-[3rem] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.9)] ring-1 ring-white/10 overflow-hidden">
                
                {/* Screen content */}
                <div className="absolute inset-0 bg-neutral-900 flex flex-col">
                  
                  {/* Status bar */}
                  <div className="h-6 sm:h-7 w-full bg-black/90 backdrop-blur-sm flex justify-between items-center px-4 sm:px-6 border-b border-white/5">
                    <div className="w-8 sm:w-10 h-2 bg-neutral-700 rounded-full" />
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <div className="w-2 h-2 bg-neutral-700 rounded-full" />
                    </div>
                  </div>
                  
                  {/* App header */}
                  <div className="h-10 sm:h-12 bg-neutral-900/95 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-3 sm:px-4">
                    <div className="text-white/50 text-[10px] sm:text-xs font-medium">← Discover</div>
                    <div className="text-white text-xs sm:text-sm font-bold">Movie Detail</div>
                    <div className="w-4" />
                  </div>
                  
                  {/* Scrollable area */}
                  <div className="flex-1 overflow-hidden">
                    
                    {/* Movie poster - Full bleed */}
                    <div className="relative w-full aspect-[2/3]">
                      <img 
                        src="https://image.tmdb.org/t/p/w780/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg" 
                        alt="Inception"
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent" />
                      
                      {/* Movie info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                        <h3 className="text-white text-base sm:text-lg lg:text-xl font-black leading-tight mb-1">
                          Inception
                        </h3>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-white/60 text-[10px] sm:text-xs mb-2">
                          <span>2010</span>
                          <span>•</span>
                          <span>2h 28m</span>
                          <span>•</span>
                          <div className="flex items-center gap-0.5 text-amber-400">
                            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400" />
                            <span className="text-white font-semibold text-[10px] sm:text-xs">8.8</span>
                          </div>
                        </div>
                        <div className="flex gap-1 sm:gap-1.5">
                          <span className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-white/10 text-white/80 border border-white/10">Sci-Fi</span>
                          <span className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-white/10 text-white/80 border border-white/10">Thriller</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* CTA button */}
                    <div className="px-3 sm:px-4 py-2.5 sm:py-3">
                      <button className="w-full h-9 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-purple-500/30">
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Added to Watchlist</span>
                      </button>
                    </div>
                    
                    {/* Streaming platforms */}
                    <div className="px-3 sm:px-4 pb-2.5 sm:pb-3">
                      <div className="text-white text-[10px] sm:text-xs font-semibold mb-1.5 sm:mb-2">Watch from these locations</div>
                      <div className="flex gap-1.5 sm:gap-2">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#E50914] flex items-center justify-center shadow-lg">
                          <span className="text-white text-base sm:text-lg font-black">N</span>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#00A8E1] flex items-center justify-center shadow-lg">
                          <span className="text-white text-base sm:text-lg font-black">P</span>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#1CE783] flex items-center justify-center shadow-lg">
                          <span className="text-black text-base sm:text-lg font-black">H</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bottom navigation */}
                  <div className="h-12 sm:h-14 bg-black/95 backdrop-blur-sm border-t border-white/5 flex justify-around items-center px-3 sm:px-4">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-purple-500" />
                      <div className="w-1 h-1 rounded-full bg-purple-500" />
                    </div>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-neutral-700" />
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-neutral-700" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 📝 Steps Content */}
          <div className="space-y-6 sm:space-y-8 lg:space-y-10">
            <Step 
              icon={<Star className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />}
              number="01"
              title="Rate movies you've seen" 
              desc="Love it or hate it? Every swipe sharpens your taste profile and helps our AI understand your preferences." 
              delay="delay-300"
              inView={inView}
            />
            <Step 
              icon={<Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />}
              number="02"
              title="Get mood-based matches" 
              desc="Our AI analyzes emotional tone, pacing, and crowd sentiment—delivering recommendations based on how you feel right now." 
              delay="delay-500"
              inView={inView}
            />
            <Step 
              icon={<Play className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400" />}
              number="03"
              title="Watch instantly" 
              desc="See exactly where to stream across Netflix, Prime, Hulu, Max, and 100+ other services. No more app-hopping." 
              delay="delay-700"
              inView={inView}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// Enhanced Step Component with number badge
function Step({ icon, number, title, desc, delay, inView }) {
  return (
    <div 
      className={`group relative flex gap-4 sm:gap-5 p-4 sm:p-6 rounded-2xl transition-all duration-700 hover:bg-white/5 border border-white/5 hover:border-white/10 ${delay} ${
        inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
      }`}
    >
      {/* Number badge */}
      <div className="absolute -top-3 -left-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs sm:text-sm font-black shadow-lg shadow-purple-500/50 ring-4 ring-black">
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
