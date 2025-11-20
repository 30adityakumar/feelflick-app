// src/features/landing/sections/HowItWorksSection.jsx
import { useState } from 'react'
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'
import { Star, Sparkles, Play, ThumbsUp, ThumbsDown } from 'lucide-react'
import netflixLogo from '@/assets/icons/netflix-logo-icon.svg'
import primeLogo from '@/assets/icons/amazon-prime-video.svg'

export default function HowItWorksSection() {
  const { containerRef, itemsVisible } = useStaggeredAnimation(3, 200)

  return (
    <section
      id="how-it-works"
      className="relative pb-24 bg-neutral-950 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-20 items-center">
          
          {/* VISUAL: Floating Movie Card */}
          <MovieCardDemo />

          {/* CONTENT: Steps */}
          <div ref={containerRef} className="space-y-12 mt-16 lg:mt-0">
            <div className="text-center lg:text-left mb-12">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                Your Personal <br/>
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Movie Curator
                </span>
              </h2>
              <p className="text-white/60 text-lg">
                Stop relying on random algorithms. Tell us how you feel, and we&apos;ll do the rest.
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

// 🎬 Floating Movie Card Component
function MovieCardDemo() {
  const [liked, setLiked] = useState(null)

  return (
    <div className="relative mx-auto lg:mx-0 w-full max-w-sm mb-16 lg:mb-0">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/20 blur-[120px] rounded-full animate-pulse" />
      
      {/* Card */}
      <div className="relative z-10 bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-3xl shadow-2xl border border-white/10 overflow-hidden group">
        
        {/* Poster Image */}
        <div className="relative aspect-[2/3] overflow-hidden">
          <img 
            src="https://image.tmdb.org/t/p/w780/q6y0Go1rZgVoTFZYpK391L0imU.jpg" 
            alt="Pulp Fiction"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          
          {/* Match Badge */}
          <div className="absolute top-4 right-4 bg-green-500 text-black font-black px-3 py-1 rounded-lg text-sm rotate-3 shadow-lg">
            98% MATCH
          </div>
          
          {/* Streaming Services */}
          <div className="absolute top-4 left-4 flex gap-2">
            <div className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 p-1 flex items-center justify-center">
              <img src={netflixLogo} alt="Netflix" className="w-full h-full object-contain" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 p-1 flex items-center justify-center">
              <img src={primeLogo} alt="Prime Video" className="w-full h-full object-contain" />
            </div>
          </div>
          
          {/* Movie Info (bottom overlay) */}
          <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
            <h3 className="text-2xl font-black text-white mb-2 drop-shadow-lg">
              Pulp Fiction
            </h3>
            <div className="flex items-center gap-3 text-sm text-white/80 mb-3">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="font-bold">8.9</span>
              </div>
              <span>•</span>
              <span>1994</span>
              <span>•</span>
              <span>2h 34m</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <GenreTag>Crime</GenreTag>
              <GenreTag>Drama</GenreTag>
              <GenreTag>Thriller</GenreTag>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 flex gap-4">
          <button
            onClick={() => setLiked(false)}
            className={`flex-1 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
              liked === false
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/50 scale-95'
                : 'bg-red-500/10 border-2 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:scale-105'
            }`}
          >
            <ThumbsDown className="w-5 h-5" />
            <span>Nope</span>
          </button>
          <button
            onClick={() => setLiked(true)}
            className={`flex-1 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
              liked === true
                ? 'bg-green-500 text-black shadow-lg shadow-green-500/50 scale-95'
                : 'bg-green-500/10 border-2 border-green-500/30 text-green-400 hover:bg-green-500/20 hover:scale-105'
            }`}
          >
            <ThumbsUp className="w-5 h-5" />
            <span>Love It</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// 🏷️ Genre Tag Component
function GenreTag({ children }) {
  return (
    <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white/90">
      {children}
    </span>
  )
}

// 📝 Step Component
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
