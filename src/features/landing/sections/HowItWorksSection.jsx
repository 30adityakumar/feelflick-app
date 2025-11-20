// src/features/landing/sections/HowItWorksSection.jsx
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'
import { Star, Sparkles, Play, ThumbsUp, ThumbsDown } from 'lucide-react'
import netflixLogo from '@/assets/icons/netflix-logo-icon.svg'
import primeLogo from '@/assets/icons/amazon-prime-video.svg'
import { useState } from 'react'

export default function HowItWorksSection() {
  const { containerRef, itemsVisible } = useStaggeredAnimation(3, 200)
  const [isCardHovered, setIsCardHovered] = useState(false)

  return (
    <section
      id="how-it-works"
      className="relative py-16 sm:py-20 lg:py-24 bg-neutral-950 overflow-hidden"
    >
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-amber-900/5" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 xl:gap-24 items-center">
          
          {/* 🎥 iPhone 16 Pro Mockup - Focused Recommendation Card */}
          <div className="relative mx-auto lg:mx-0 mb-12 lg:mb-0">
            {/* Outer Glow */}
            <div className="absolute -inset-4 bg-purple-500/20 rounded-3xl blur-xl animate-pulse" />
            
            {/* Phone Container - iPhone 16 Pro Dimensions (393x852 logical) */}
            <div 
              className="relative w-[393px] h-[852px] mx-auto transform scale-75 sm:scale-90 lg:scale-100 transition-transform duration-300 hover:scale-105"
              style={{ transformOrigin: 'center top' }}
            >
              {/* Phone Bezel */}
              <div className="absolute inset-0 bg-neutral-800 rounded-3xl shadow-2xl border-8 border-neutral-900/50" />
              
              {/* Screen */}
              <div className="absolute inset-4 bg-neutral-900 rounded-2xl overflow-hidden flex flex-col">
                {/* Dynamic Island (Notch Simulation) */}
                <div className="h-[59px] bg-neutral-900 border-b border-neutral-800 flex items-center justify-center">
                  <div className="w-[200px] h-2 bg-neutral-800 rounded-full" />
                </div>
                
                {/* App Content - Popped-Out Recommendation Card */}
                <div className="flex-1 p-6 flex items-center justify-center bg-neutral-950/50">
                  <div 
                    className={`relative w-full max-w-sm mx-auto p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300 ${
                      isCardHovered ? 'scale-105 shadow-purple-500/20' : 'scale-100'
                    }`}
                    onMouseEnter={() => setIsCardHovered(true)}
                    onMouseLeave={() => setIsCardHovered(false)}
                    role="img"
                    aria-label="FeelFlick recommendation for Inception"
                  >
                    {/* Poster */}
                    <div className="relative mb-4 rounded-xl overflow-hidden shadow-lg">
                      <img 
                        src="https://image.tmdb.org/t/p/w342/edvH7v6UFDpD8G0YPjUEQ3Q0HZc.jpg"
                        alt="Inception movie poster"
                        className="w-full h-48 object-cover"
                        loading="lazy"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      
                      {/* Play Button Overlay */}
                      <button className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 group">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30">
                          <Play className="w-6 h-6 text-white ml-1" />
                        </div>
                      </button>
                    </div>
                    
                    {/* Movie Title & Details */}
                    <h3 className="text-xl font-bold text-white mb-1 leading-tight">Inception</h3>
                    <p className="text-white/70 text-sm mb-2">2010 • 148 min</p>
                    <p className="text-white/60 text-xs mb-3">Sci-Fi, Action, Thriller</p>
                    
                    {/* Rating & Score */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-semibold text-white">8.8/10</span>
                      </div>
                      <span className="text-xs text-white/50">12K ratings</span>
                    </div>
                    
                    {/* Why Recommended */}
                    <p className="text-white/80 text-sm mb-4 italic leading-relaxed">
                      "Matches your 'thought-provoking thriller' vibe—mind-bending dreams and high-stakes action."
                    </p>
                    
                    {/* Streaming Sites */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg">
                        <img src={netflixLogo} alt="Netflix" className="w-5 h-5" />
                        <span className="text-xs text-white">HD</span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg">
                        <img src={primeLogo} alt="Prime Video" className="w-5 h-5" />
                        <span className="text-xs text-white">4K</span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button className="flex-1 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 py-2 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium">
                        <ThumbsDown className="w-4 h-4" />
                        Not Interested
                      </button>
                      <button className="flex-1 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center gap-2 py-2 text-green-400 hover:bg-green-500/20 transition-colors text-sm font-medium">
                        <ThumbsUp className="w-4 h-4" />
                        Love This
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Home Indicator */}
                <div className="h-[34px] bg-neutral-900 border-t border-neutral-800 flex items-center justify-center">
                  <div className="w-20 h-1 bg-neutral-700 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* 📝 Steps Content */}
          <div ref={containerRef} className="space-y-8 lg:space-y-10">
            <div className="text-center lg:text-left mb-8 lg:mb-0">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4 leading-tight">
                Your Personal <br className="hidden lg:block" />
                <span className="block bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Movie Curator
                </span>
              </h2>
              <p className="text-white/60 text-lg sm:text-xl max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Stop relying on random algorithms. Tell us how you feel, and we'll do the rest.
              </p>
            </div>
            
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

function Step({ icon, title, desc, isVisible }) {
  return (
    <div 
      className={`flex gap-6 p-6 rounded-2xl transition-all duration-500 hover:bg-white/5 border border-transparent hover:border-white/10 group ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
      }`}
    >
      <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-neutral-900 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-purple-500/20">
        {icon}
      </div>
      <div className="flex-1">
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
