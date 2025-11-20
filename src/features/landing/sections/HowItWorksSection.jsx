// src/features/landing/sections/HowItWorksSection.jsx
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'
import { Star, Sparkles, Play, ThumbsUp, ThumbsDown } from 'lucide-react'

export default function HowItWorksSection() {
  const { containerRef, itemsVisible } = useStaggeredAnimation(3, 150)

  return (
    <section
      id="how-it-works"
      className="relative pb-24 pt-12 bg-neutral-950 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          
          {/* 📱 iPhone Mockup - Optimized */}
          <div className="relative mx-auto lg:mx-0 w-[280px] sm:w-[320px] lg:w-[340px] mb-12 lg:mb-0 order-2 lg:order-1">
            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[400px] bg-purple-500/15 blur-[100px] rounded-full animate-pulse" />
            
            {/* Phone Frame */}
            <div className="relative z-10 w-full aspect-[9/19.5] border-[6px] border-neutral-800 bg-black rounded-[2.25rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] overflow-hidden ring-1 ring-white/5">
              
              {/* Screen Content */}
              <div className="absolute inset-0 bg-neutral-900 flex flex-col">
                
                {/* Status Bar */}
                <div className="h-7 w-full bg-black flex justify-between items-center px-5">
                  <div className="w-10 h-2.5 bg-neutral-700 rounded-full" />
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 bg-neutral-700 rounded-full" />
                    <div className="w-2.5 h-2.5 bg-neutral-700 rounded-full" />
                  </div>
                </div>
                
                {/* App Content */}
                <div className="flex-1 p-3 flex flex-col relative">
                  
                  {/* Movie Card */}
                  <div className="relative flex-1 rounded-xl overflow-hidden mb-3 shadow-lg">
                    <img 
                      src="https://image.tmdb.org/t/p/w780/q6y0Go1rZgVoTFZYpK391L0imU.jpg" 
                      alt="Pulp Fiction"
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />
                    
                    {/* Movie Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white text-lg sm:text-xl font-bold leading-tight mb-1">
                        Pulp Fiction
                      </h3>
                      <div className="flex items-center gap-1.5 text-white/60 text-xs">
                        <span>1994</span>
                        <span>•</span>
                        <span>Crime, Drama</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2.5 h-12">
                    <button 
                      className="flex-1 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-colors"
                      aria-label="Dislike"
                    >
                      <ThumbsDown className="w-5 h-5" />
                    </button>
                    <button 
                      className="flex-1 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 hover:bg-green-500/20 transition-colors"
                      aria-label="Like"
                    >
                      <ThumbsUp className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Bottom Nav */}
                <div className="h-14 bg-black border-t border-white/5 flex justify-around items-center px-4">
                  <div className="w-5 h-5 rounded-full bg-purple-500" />
                  <div className="w-5 h-5 rounded-full bg-neutral-700" />
                  <div className="w-5 h-5 rounded-full bg-neutral-700" />
                </div>
              </div>
            </div>
          </div>

          {/* 📝 Content - Steps */}
          <div ref={containerRef} className="space-y-8 order-1 lg:order-2">
            
            {/* Section Header */}
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

            {/* Steps */}
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

// Optimized Step Component
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
