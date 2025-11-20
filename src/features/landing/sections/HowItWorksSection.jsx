// src/features/landing/sections/HowItWorksSection.jsx
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'
import { Star, Sparkles, Play, Heart, Clock } from 'lucide-react'
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

        <div className="lg:grid lg:grid-cols-2 lg:gap-20 items-center">
          
          {/* LEFT: Floating UI Cards */}
          <div className="relative mx-auto lg:mx-0 mb-16 lg:mb-0 h-[600px]">
            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/20 blur-[120px] rounded-full" />
            
            {/* Card Stack */}
            <div className="relative h-full flex items-center justify-center">
              
              {/* Card 1: Movie Match Card (Front) */}
              <MovieCard 
                title="Pulp Fiction"
                year="1994"
                genre="Crime, Drama"
                matchScore={98}
                poster="https://image.tmdb.org/t/p/w500/q6y0Go1rZgVoTFZYpK391L0imU.jpg"
                runtime="154 min"
              />

              {/* Card 2: Streaming Info (Back Left) */}
              <StreamingCard 
                className="absolute -left-8 top-16 rotate-[-8deg]"
              />

              {/* Card 3: Why Recommended (Back Right) */}
              <WhyCard 
                className="absolute -right-8 bottom-20 rotate-[6deg]"
              />
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

// 🎬 Main Movie Card
function MovieCard({ title, year, genre, matchScore, poster, runtime }) {
  return (
    <div className="relative z-10 w-[320px] sm:w-[360px] bg-neutral-900/90 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Poster */}
      <div className="relative h-[400px] overflow-hidden">
        <img 
          src={poster} 
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        {/* Match Score Badge */}
        <div className="absolute top-4 right-4 bg-green-500 text-black font-black px-3 py-1.5 rounded-xl text-sm shadow-lg">
          {matchScore}% MATCH
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
          <div className="flex items-center gap-3 text-white/60 text-sm">
            <span>{year}</span>
            <span>•</span>
            <span>{runtime}</span>
          </div>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="p-6 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10">{genre}</span>
          </div>
          <div className="flex gap-3">
            <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-colors">
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 📺 Streaming Services Card
function StreamingCard({ className }) {
  return (
    <div className={`w-[280px] bg-neutral-900/95 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Play className="w-5 h-5 text-teal-400" />
        <span className="text-sm font-bold text-white">Available On</span>
      </div>
      <div className="space-y-3">
        <ServiceRow logo={netflixLogo} name="Netflix" price="Included" />
        <ServiceRow logo={primeLogo} name="Prime Video" price="$3.99" />
      </div>
    </div>
  )
}

function ServiceRow({ logo, name, price }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
      <div className="flex items-center gap-3">
        <img src={logo} alt={name} className="w-6 h-6 object-contain" />
        <span className="text-sm font-medium text-white">{name}</span>
      </div>
      <span className="text-xs text-white/40">{price}</span>
    </div>
  )
}

// 💡 Why Recommended Card
function WhyCard({ className }) {
  return (
    <div className={`w-[280px] bg-neutral-900/95 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <span className="text-sm font-bold text-white">Why You'll Love It</span>
      </div>
      <ul className="space-y-2 text-sm text-white/70">
        <li className="flex items-start gap-2">
          <span className="text-purple-400 mt-0.5">•</span>
          <span>Dark humor & non-linear storytelling</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-purple-400 mt-0.5">•</span>
          <span>Iconic dialogue & memorable characters</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-purple-400 mt-0.5">•</span>
          <span>Matches your taste for crime dramas</span>
        </li>
      </ul>
    </div>
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
