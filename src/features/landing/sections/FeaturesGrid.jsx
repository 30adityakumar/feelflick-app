// src/features/landing/sections/FeaturesGrid.jsx
import { useRef, useState } from 'react'
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'
import { Sparkles, TrendingUp, Zap } from 'lucide-react'

export default function FeaturesGrid() {
  const { containerRef, itemsVisible } = useStaggeredAnimation(3, 180)

  return (
    <section id="features" className="relative pt-6 pb-8 sm:pt-10 sm:pb-12 md:pt-12 md:pb-16 bg-black overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-[128px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 sm:mb-6">
            More Than Just <br />
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Recommendations</span>
          </h2>
          <p className="text-white/60 text-base sm:text-xl max-w-2xl mx-auto">A complete ecosystem for movie lovers. Discover, track, and watch—all in one place.</p>
        </div>

        {/* Cards */}
        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1: AI Precision */}
          <RichFeatureCard 
            title="AI Precision"
            desc="We don't just guess. We learn your emotional taste and surface films you'll actually finish."
            image="https://image.tmdb.org/t/p/w500/eCOtqtfvn7mxGl6nfmq4b1exJRc.jpg"
            overlayColor="from-purple-900/50"
            accentColor="purple"
            isVisible={itemsVisible.includes(0)}
          >
            {/* Animated Match Badge */}
            <div className="absolute top-5 right-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-black px-4 py-2 rounded-xl rotate-3 shadow-[0_0_30px_rgba(34,197,94,0.5)] backdrop-blur-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="text-sm">98% MATCH</span>
              </div>
            </div>
            
            {/* Floating Stats */}
            <div className="absolute bottom-24 left-5 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:translate-y-[-8px]">
              <div className="flex items-center gap-2 text-xs text-white/90">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="font-semibold">+15% accuracy this month</span>
              </div>
            </div>
          </RichFeatureCard>

          {/* Card 2: Universal Watchlist */}
          <RichFeatureCard 
            title="Universal Watchlist"
            desc="One watchlist for every streaming service. Add once, forget never."
            image="https://image.tmdb.org/t/p/w500/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg"
            overlayColor="from-amber-900/50"
            accentColor="amber"
            isVisible={itemsVisible.includes(1)}
          >
            {/* Stacked List Preview */}
            <div className="absolute inset-0 p-4 sm:p-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="h-12 bg-white/15 rounded-xl w-full backdrop-blur-md border border-white/10 flex items-center px-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-400 to-orange-500" />
                <div className="ml-3 flex-1">
                  <div className="h-2 bg-white/40 rounded w-3/4" />
                </div>
              </div>
              <div className="h-12 bg-white/10 rounded-xl w-3/4 backdrop-blur-md border border-white/10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75" />
              <div className="h-12 bg-white/5 rounded-xl w-5/6 backdrop-blur-md border border-white/10 transform translate-y-6 group-hover:translate-y-0 transition-transform duration-300 delay-150" />
            </div>

            {/* Count Badge */}
            <div className="absolute top-5 right-5 bg-amber-500/20 backdrop-blur-md border border-amber-500/30 rounded-full px-4 py-2 group-hover:scale-110 transition-transform duration-300">
              <span className="text-sm font-bold text-amber-300">47 movies</span>
            </div>
          </RichFeatureCard>

          {/* Card 3: Stream Anywhere */}
          <RichFeatureCard 
            title="Stream Anywhere"
            desc="See exactly where to watch—Netflix, Prime, Hulu, Max, and 100+ more."
            image="https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg"
            overlayColor="from-blue-900/50"
            accentColor="blue"
            isVisible={itemsVisible.includes(2)}
          >
            {/* Streaming Service Badges */}
            <div className="absolute top-5 right-5 flex -space-x-3 group-hover:space-x-1 transition-all duration-300">
              <div className="w-10 h-10 rounded-full bg-[#E50914] border-2 border-black shadow-lg flex items-center justify-center text-xs font-bold text-white transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">N</div>
              <div className="w-10 h-10 rounded-full bg-[#00A8E1] border-2 border-black shadow-lg flex items-center justify-center text-xs font-bold text-white transform group-hover:scale-110 transition-all duration-300 delay-75">P</div>
              <div className="w-10 h-10 rounded-full bg-[#1CE783] border-2 border-black shadow-lg flex items-center justify-center text-xs font-bold text-black transform group-hover:scale-110 group-hover:rotate-[-6deg] transition-all duration-300 delay-150">H</div>
            </div>

            {/* Availability Indicator */}
            <div className="absolute bottom-24 right-5 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:translate-y-[-8px]">
              <div className="flex items-center gap-2 text-xs text-white/90">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="font-semibold">100+ services</span>
              </div>
            </div>
          </RichFeatureCard>
        </div>
      </div>
    </section>
  )
}

// Enhanced 3D card with rich interactions
function RichFeatureCard({ title, desc, image, overlayColor, accentColor, children, isVisible }) {
  const cardRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)

  // 3D tilt handler
  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = (y - centerY) / 20
    const rotateY = (centerX - x) / 20
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)'
    setIsHovered(false)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  // Accent color classes
  const accentClasses = {
    purple: 'from-purple-500/20 to-transparent',
    amber: 'from-amber-500/20 to-transparent',
    blue: 'from-blue-500/20 to-transparent',
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      className={`relative group h-[350px] sm:h-[400px] md:h-[420px] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 bg-neutral-900 shadow-2xl hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)] transition-all duration-700
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{
        transition: 'transform 0.15s cubic-bezier(.17,.67,.83,.67), box-shadow 0.3s, opacity 0.7s, translate 0.7s'
      }}
    >
      {/* Background Image with Parallax */}
      <div className="absolute inset-0">
        <img 
          src={image}
          alt={title}
          className="w-full h-full object-cover opacity-40 group-hover:opacity-55 group-hover:scale-110 transition-all duration-1000"
        />
        {/* Layered Gradients for Depth */}
        <div className={`absolute inset-0 bg-gradient-to-b ${overlayColor} via-black/30 to-black`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        <div className={`absolute inset-0 bg-gradient-to-br ${accentClasses[accentColor]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      </div>

      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay pointer-events-none" 
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} 
      />

      {/* Top-right badges and overlays */}
      <div className="relative z-20">{children}</div>

      {/* Card Content with Slide-Up Animation */}
      <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 transform transition-all duration-500 group-hover:-translate-y-2 z-20">
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 drop-shadow-2xl group-hover:text-white transition-colors">{title}</h3>
        <p className="text-white/70 leading-relaxed text-sm sm:text-base font-medium drop-shadow-lg group-hover:text-white/90 transition-colors">{desc}</p>
      </div>

      {/* Bottom Glow Line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${accentColor === 'purple' ? 'from-purple-500 to-pink-500' : accentColor === 'amber' ? 'from-amber-500 to-orange-500' : 'from-blue-500 to-cyan-500'} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
    </div>
  )
}
