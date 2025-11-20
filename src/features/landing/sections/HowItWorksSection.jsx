// src/features/landing/sections/HowItWorksSection.jsx
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'
import { Star, Sparkles, Play, Check } from 'lucide-react'

export default function HowItWorksSection() {
  const { containerRef, itemsVisible } = useStaggeredAnimation(3, 150)

  return (
    <section
      id="how-it-works"
      className="relative pb-24 pt-12 bg-neutral-950 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          
          {/* 📱 PLEX-INSPIRED iPhone Mockup */}
          <div className="relative mx-auto lg:mx-0 w-[280px] sm:w-[320px] lg:w-[340px] mb-12 lg:mb-0">
            
            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[400px] bg-purple-500/15 blur-[100px] rounded-full" />
            
            {/* Phone Frame */}
            <div className="relative z-10 w-full aspect-[9/19.5] border-[6px] border-neutral-800 bg-neutral-900 rounded-[2.5rem] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.9)] overflow-hidden ring-1 ring-white/5">
              
              {/* Screen Content */}
              <div className="absolute inset-0 bg-neutral-900 flex flex-col">
                
                {/* Status Bar */}
                <div className="h-7 w-full bg-black/90 backdrop-blur-md flex justify-between items-center px-5 border-b border-white/5">
                  <div className="w-10 h-2.5 bg-neutral-700 rounded-full" />
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                    <div className="w-2.5 h-2.5 bg-neutral-700 rounded-full" />
                  </div>
                </div>
                
                {/* App Header */}
                <div className="h-12 bg-neutral-900/95 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4">
                  <div className="text-white/60 text-xs font-medium">← Discover</div>
                  <div className="text-white text-sm font-bold">Movie Detail</div>
                  <div className="w-5" />
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-hidden">
                  
                  {/* Hero Image (Plex-style: full bleed, no padding) */}
                  <div className="relative w-full aspect-[2/3] overflow-hidden">
                    <img 
                      src="https://image.tmdb.org/t/p/w780/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg" 
                      alt="Inception"
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
                    
                    {/* Movie Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-neutral-900 to-transparent">
                      <h3 className="text-white text-xl font-black leading-tight mb-1.5">
                        Inception
                      </h3>
                      <div className="flex items-center gap-2 text-white/60 text-xs mb-2">
                        <span>2010</span>
                        <span>•</span>
                        <span>2h 28m</span>
                        <span>•</span>
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span className="text-white font-semibold">8.8</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/80 border border-white/10">Sci-Fi</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/80 border border-white/10">Thriller</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* CTA Button (Plex-style: high contrast) */}
                  <div className="px-4 py-3">
                    <button className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30">
                      <Check className="w-4 h-4" />
                      <span>Added to Watchlist</span>
                    </button>
                  </div>
                  
                  {/* Streaming Availability (Plex-style) */}
                  <div className="px-4 pb-3">
                    <div className="text-white text-xs font-semibold mb-2">Watch from these locations</div>
                    <div className="flex gap-2">
                      <div className="w-12 h-12 rounded-lg bg-[#E50914] flex items-center justify-center shadow-lg">
                        <span className="text-white text-xl font-black">N</span>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-[#00A8E1] flex items-center justify-center shadow-lg">
                        <span className="text-white text-xl font-black">P</span>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-[#1CE783] flex items-center justify-center shadow-lg">
                        <span className="text-black text-xl font-black">H</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Bottom Nav */}
                <div className="h-14 bg-black/95 backdrop-blur-md border-t border-white/5 flex justify-around items-center px-4">
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

          {/* 📝 Content Steps */}
          <div ref={containerRef} className="space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4 leading-tight">
                How{' '}
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  FeelFlick
                </span>
                {' '}Works
              </h2>
              <p className="text-white/60 text-lg max-w-xl">
                Three simple steps to discover your next favorite movie.
              </p>
            </div>

            <div className="space-y-6">
              <Step 
                icon={<Star className="w-6 h-6 text-amber-400" />} 
                title="1. Rate movies you've seen" 
                desc="Love it or hate it? Every swipe sharpens your taste profile." 
                isVisible={itemsVisible.includes(0)} 
              />
              <Step 
                icon={<Sparkles className="w-6 h-6 text-purple-400" />} 
                title="2. Get mood-based matches" 
                desc="AI analyzes emotion, pacing, and tone—not just genre." 
                isVisible={itemsVisible.includes(1)} 
              />
              <Step 
                icon={<Play className="w-6 h-6 text-teal-400" />} 
                title="3. Watch instantly" 
                desc="See exactly where to stream across all your services." 
                isVisible={itemsVisible.includes(2)} 
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Step({ icon, title, desc, isVisible }) {
  return (
    <div 
      className={`flex gap-5 p-5 rounded-xl transition-all duration-500 hover:bg-white/5 border border-transparent hover:border-white/5 group ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
      }`}
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:border-white/20 transition-all shadow-lg">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-purple-300 transition-colors">
          {title}
        </h3>
        <p className="text-white/60 text-sm leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  )
}
