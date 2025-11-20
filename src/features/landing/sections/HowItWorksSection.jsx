// src/features/landing/sections/HowItWorksSection.jsx
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'
import { Star, Sparkles, Play, ThumbsUp, ThumbsDown } from 'lucide-react'
import netflixIcon from '@/assets/icons/netflix-logo-icon.svg'
import primeIcon from '@/assets/icons/amazon-prime-video.svg'

export default function HowItWorksSection() {
  const { containerRef, itemsVisible } = useStaggeredAnimation(3, 200)

  return (
    <section
      id="how-it-works"
      className="relative pb-24 bg-neutral-950 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-20 items-center">
          
          {/* 📱 VISUAL: iPhone 16 Pro Mockup */}
          <div className="relative mx-auto lg:mx-0 w-[320px] h-[660px] mb-16 lg:mb-0">
            {/* Glow Effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[600px] bg-purple-500/20 blur-[100px] rounded-full" />
            
            {/* Phone Frame (Titanium Finish) */}
            <div className="relative z-10 w-full h-full border-[6px] border-neutral-800 bg-black rounded-[3rem] shadow-2xl overflow-hidden ring-1 ring-white/20">
              
              {/* Dynamic Island */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full z-30 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-neutral-900/50" />
              </div>

              {/* Screen Content */}
              <div className="absolute inset-0 bg-black flex flex-col">
                
                {/* 🎬 Movie Poster Background (Inception) */}
                <div className="relative h-3/5 w-full">
                  <img 
                    src="https://image.tmdb.org/t/p/w780/9gk7admal4zl22Pb0IBRurlk4fW.jpg" 
                    alt="Inception"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  
                  {/* Floating "Match" Badge */}
                  <div className="absolute top-16 right-6 bg-green-500/90 text-black text-xs font-black px-3 py-1 rounded-full shadow-lg backdrop-blur-md transform rotate-2">
                    98% MATCH
                  </div>
                </div>

                {/* 📝 Movie Details (Popped Out Style) */}
                <div className="flex-1 px-6 -mt-12 relative z-20 flex flex-col gap-6">
                  
                  {/* Title & Genre */}
                  <div>
                    <h3 className="text-3xl font-bold text-white leading-tight drop-shadow-lg">Inception</h3>
                    <div className="flex items-center gap-2 mt-2 text-white/70 text-sm font-medium">
                      <span className="bg-white/10 px-2 py-0.5 rounded text-xs">Sci-Fi</span>
                      <span className="bg-white/10 px-2 py-0.5 rounded text-xs">Thriller</span>
                      <span>•</span>
                      <span>2010</span>
                    </div>
                  </div>

                  {/* Why Recommended */}
                  <div className="bg-neutral-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-wide">Why you'll like it</span>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">
                      Matches your love for <span className="text-white font-semibold">mind-bending plots</span> and high-stakes tension.
                    </p>
                  </div>

                  {/* Streaming Availability */}
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-3">
                      {/* Using real SVGs if available, else fallback to colored circles */}
                      <div className="w-10 h-10 rounded-full bg-black border-2 border-neutral-800 flex items-center justify-center overflow-hidden shadow-lg z-10">
                        <img src={netflixIcon} alt="Netflix" className="w-full h-full object-cover scale-110" />
                      </div>
                      <div className="w-10 h-10 rounded-full bg-black border-2 border-neutral-800 flex items-center justify-center overflow-hidden shadow-lg z-0">
                        <img src={primeIcon} alt="Prime" className="w-full h-full object-cover scale-110" />
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-red-400 hover:bg-neutral-700 transition-colors">
                        <ThumbsDown className="w-5 h-5" />
                      </button>
                      <button className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        <ThumbsUp className="w-6 h-6 fill-current" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* CONTENT: Steps */}
          <div ref={containerRef} className="space-y-12">
            <div className="text-center lg:text-left mb-12">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                Your Personal <br/>
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Movie Curator
                </span>
              </h2>
              <p className="text-white/60 text-lg">Stop relying on random algorithms. Tell us how you feel, and we&apos;ll do the rest.</p>
            </div>
            <Step icon={<Star className="w-6 h-6 text-amber-400" />} title="1. Rate what you've seen" desc="Swipe through movies you know. Love it? Hate it? Every rating sharpens your taste profile." isVisible={itemsVisible.includes(0)} />
            <Step icon={<Sparkles className="w-6 h-6 text-purple-400" />} title="2. Get mood-based matches" desc="Our AI analyzes emotional tone, pacing, and crowd sentiment—not just genre tags." isVisible={itemsVisible.includes(1)} />
            <Step icon={<Play className="w-6 h-6 text-teal-400" />} title="3. Watch instantly" desc="See exactly where to stream it. Netflix, Prime, Hulu, Max—we check 100+ services." isVisible={itemsVisible.includes(2)} />
          </div>
        </div>
      </div>
    </section>
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
