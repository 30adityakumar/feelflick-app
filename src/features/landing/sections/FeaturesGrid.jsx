// src/features/landing/sections/FeaturesGrid.jsx
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'

export default function FeaturesGrid() {
  const { containerRef, itemsVisible } = useStaggeredAnimation(3, 200)

  return (
    <section id="features" className="py-24 bg-black relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-[128px]" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-6">
            More Than Just <br/>
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Recommendations
            </span>
          </h2>
          <p className="text-white/60 text-xl max-w-2xl mx-auto">
            A complete ecosystem for movie lovers. Discover, track, and watch—all in one place.
          </p>
        </div>
        
        <div 
          ref={containerRef}
          className="grid md:grid-cols-3 gap-8"
        >
          {/* Card 1: AI Precision */}
          <FeatureCard 
            title="AI Precision"
            desc="We don't just guess. We know what you'll love based on emotional context."
            image="https://image.tmdb.org/t/p/w500/gEU2QniL6E77NI6lCU6MxlNBvIx.jpg" // Interstellar
            overlayColor="from-purple-900/40"
            isVisible={itemsVisible.includes(0)}
          >
            <div className="absolute top-6 right-6 bg-green-500/90 text-black font-black px-3 py-1 rounded-lg rotate-3 shadow-[0_0_20px_rgba(34,197,94,0.4)] backdrop-blur-sm transform group-hover:scale-110 transition-transform duration-300">
              98% MATCH
            </div>
          </FeatureCard>

          {/* Card 2: Universal Watchlist */}
          <FeatureCard 
            title="Universal Watchlist"
            desc="One list for every streaming service. Never forget a recommendation again."
            image="https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8UIyBSXL3b.jpg" // Dune Part Two (Visual stunning)
            overlayColor="from-amber-900/40"
            isVisible={itemsVisible.includes(1)}
          >
            {/* Abstract List UI */}
            <div className="absolute inset-0 p-6 flex flex-col gap-3 opacity-40 pointer-events-none">
              <div className="h-12 bg-white/20 rounded-xl w-full backdrop-blur-md" />
              <div className="h-12 bg-white/10 rounded-xl w-3/4 backdrop-blur-md" />
              <div className="h-12 bg-white/5 rounded-xl w-5/6 backdrop-blur-md" />
            </div>
          </FeatureCard>

          {/* Card 3: Stream Anywhere */}
          <FeatureCard 
            title="Stream Anywhere"
            desc="Instantly see where it's streaming. We index Netflix, Hulu, Prime, and 100+ others."
            image="https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg" // Spider-Verse (Colorful)
            overlayColor="from-blue-900/40"
            isVisible={itemsVisible.includes(2)}
          >
            {/* Service Logos Placeholder */}
            <div className="absolute top-6 right-6 flex -space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#E50914] border-2 border-black shadow-lg flex items-center justify-center text-[10px] font-bold text-white">N</div>
              <div className="w-10 h-10 rounded-full bg-[#00A8E1] border-2 border-black shadow-lg flex items-center justify-center text-[10px] font-bold text-white">P</div>
              <div className="w-10 h-10 rounded-full bg-[#1CE783] border-2 border-black shadow-lg flex items-center justify-center text-[10px] font-bold text-black">H</div>
            </div>
          </FeatureCard>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ title, desc, image, overlayColor, children, isVisible }) {
  return (
    <div 
      className={`relative group h-[420px] rounded-3xl overflow-hidden border border-white/10 bg-neutral-900 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover opacity-50 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700"
        />
        {/* Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-b ${overlayColor} via-black/20 to-black`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </div>

      {/* Custom Visual Elements (Badges/UI) */}
      {children}

      {/* Text Content */}
      <div className="absolute bottom-0 inset-x-0 p-8 transform transition-transform duration-500 group-hover:-translate-y-2">
        <h3 className="text-2xl font-bold text-white mb-3 drop-shadow-lg">
          {title}
        </h3>
        <p className="text-white/70 leading-relaxed text-sm font-medium drop-shadow-md">
          {desc}
        </p>
      </div>
    </div>
  )
}
