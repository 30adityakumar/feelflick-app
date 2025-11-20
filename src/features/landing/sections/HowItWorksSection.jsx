// src/features/landing/sections/HowItWorksSection.jsx
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'
import { Star, Sparkles, Play, Clock } from 'lucide-react'
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
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          
          {/* 🎬 VISUAL: Floating Movie Card (iPhone 16 Pro Style) */}
          <div className="relative mx-auto lg:mx-0 max-w-sm mb-16 lg:mb-0">
            {/* Glow effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/20 blur-[100px] rounded-full animate-pulse" />
            
            {/* Movie Card */}
            <div className="relative z-10 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 rounded-3xl shadow-2xl overflow-hidden border border-white/10 hover:scale-[1.02] transition-transform duration-300">
              
              {/* Poster with gradient overlay */}
              <div className="relative h-80 overflow-hidden">
                <img 
                  src="https://image.tmdb.org/t/p/w780/gEU2QniL6E77NI6lCU6MxlNBvIx.jpg" 
                  alt="Interstellar"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/60 to-transparent" />
                
                {/* Match badge */}
                <div className="absolute top-4 right-4 bg-green-500 text-black font-black px-3 py-1.5 rounded-lg text-sm shadow-lg">
                  98% MATCH
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Title & Year */}
                <div>
                  <h3 className="text-2xl font-black text-white mb-1">Interstellar</h3>
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <span>2014</span>
                    <span>•</span>
                    <span>2h 49m</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      8.7
                    </span>
                  </div>
                </div>

                {/* Genre tags */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold">
                    Sci-Fi
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold">
                    Drama
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                    Adventure
                  </span>
                </div>

                {/* Why recommended */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-start gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs font-semibold text-purple-400">WHY YOU'LL LOVE THIS</div>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Epic visuals, mind-bending story, emotional depth. Perfect for fans of thought-provoking sci-fi with stunning cinematography.
                  </p>
                </div>

                {/* Streaming services */}
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-xs text-white/40 font-medium">WATCH ON</span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center hover:scale-110 transition-transform">
                      <img src={netflixLogo} alt="Netflix" className="w-5 h-5" />
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center hover:scale-110 transition-transform">
                      <img src={primeLogo} alt="Prime Video" className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 📝 CONTENT: Steps */}
          <div ref={containerRef} className="space-y-10">
            <div className="text-center lg:text-left mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4 leading-tight">
                Your Perfect Movie
                <br />
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  In 3 Simple Steps
                </span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed">
                No complex setup. No algorithm training. Just instant, accurate recommendations.
              </p>
            </div>

            <Step 
              icon={<Star className="w-6 h-6 text-amber-400" />} 
              number="01"
              title="Rate movies you've seen" 
              desc="Swipe through familiar titles. Love it? Hate it? Each rating teaches our AI your unique taste." 
              isVisible={itemsVisible.includes(0)} 
            />
            
            <Step 
              icon={<Sparkles className="w-6 h-6 text-purple-400" />} 
              number="02"
              title="Get mood-based matches" 
              desc="Our AI analyzes emotional tone, pacing, and sentiment—not just genre tags. See exactly why each movie is recommended." 
              isVisible={itemsVisible.includes(1)} 
            />
            
            <Step 
              icon={<Play className="w-6 h-6 text-teal-400" />} 
              number="03"
              title="Watch instantly anywhere" 
              desc="See where to stream across 100+ services. Netflix, Prime, Hulu, Max—all in one place. No more dead ends." 
              isVisible={itemsVisible.includes(2)} 
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function Step({ icon, number, title, desc, isVisible }) {
  return (
    <div 
      className={`flex gap-5 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
      }`}
    >
      {/* Number badge */}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
          <span className="text-lg font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {number}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pt-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-white/60">{icon}</div>
          <h3 className="text-xl font-bold text-white">
            {title}
          </h3>
        </div>
        <p className="text-white/60 leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  )
}
