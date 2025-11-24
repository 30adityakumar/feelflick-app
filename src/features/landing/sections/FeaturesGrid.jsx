// src/features/landing/sections/FeaturesGrid.jsx
import { useRef, useState, useCallback } from 'react'
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'
import { Sparkles, TrendingUp, Zap, CheckCircle2, MonitorPlay } from 'lucide-react'

export default function FeaturesGrid() {
  const { containerRef, itemsVisible } = useStaggeredAnimation(3, 180)

  return (
    <section id="features" className="relative pt-16 pb-24 bg-black overflow-hidden">
      {/* Deep Ambient Backgrounds - Subtler and Darker */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6">
            More Than Just <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-transparent">
              Recommendations
            </span>
          </h2>
          <p className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            A complete ecosystem for movie lovers. Discover with mood, track your watchlist, and find where to stream—all in one beautiful interface.
          </p>
        </div>

        {/* Grid */}
        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: AI Precision */}
          <RichFeatureCard 
            title="Mood Precision"
            desc="We don't guess. We analyze emotional tone to surface films you'll actually finish."
            image="https://image.tmdb.org/t/p/w780/eCOtqtfvn7mxGl6nfmq4b1exJRc.jpg" // Inception
            overlayColor="from-purple-950/80"
            accentColor="purple"
            isVisible={itemsVisible.includes(0)}
          >
            {/* Floating UI Element: Match Score */}
            <div className="absolute top-6 right-6">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.2)] flex items-center gap-2 transform rotate-3 transition-transform group-hover:rotate-6 group-hover:scale-105 duration-500">
                <Sparkles className="w-4 h-4 text-purple-300 fill-purple-300 animate-pulse" />
                <span className="text-sm font-bold text-white tracking-wide">98% MATCH</span>
              </div>
            </div>

            {/* Floating UI Element: Context */}
            <div className="absolute bottom-28 left-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
              <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-3 flex items-center gap-3 shadow-xl">
                <div className="bg-green-500/20 p-1.5 rounded-md">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <div className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Analysis</div>
                  <div className="text-xs font-semibold text-white">High emotional resonance</div>
                </div>
              </div>
            </div>
          </RichFeatureCard>

          {/* Card 2: Universal Watchlist */}
          <RichFeatureCard 
            title="One Watchlist"
            desc="Stop scattering movies across Notes apps and screenshots. Add once, track forever."
            image="https://image.tmdb.org/t/p/w780/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg" // The Martian
            overlayColor="from-amber-950/80"
            accentColor="amber"
            isVisible={itemsVisible.includes(1)}
          >
            {/* Floating UI Element: List Items */}
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
               <div className="w-4/5 bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 mb-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-10 bg-amber-500/20 rounded-sm shrink-0" />
                    <div className="h-2 bg-white/20 rounded w-1/2" />
                    <CheckCircle2 className="w-4 h-4 text-amber-500 ml-auto" />
                  </div>
               </div>
               <div className="w-4/5 bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 transform translate-y-8 group-hover:translate-y-0 transition-all duration-500 delay-75 shadow-2xl scale-95 opacity-80">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-10 bg-white/10 rounded-sm shrink-0" />
                    <div className="h-2 bg-white/20 rounded w-1/3" />
                  </div>
               </div>
            </div>
          </RichFeatureCard>

          {/* Card 3: Stream Anywhere */}
          <RichFeatureCard 
            title="Stream Anywhere"
            desc="We check Netflix, Prime, Hulu, Max, and 100+ others so you don't have to."
            image="https://image.tmdb.org/t/p/w780/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg" // Spider-Verse
            overlayColor="from-blue-950/80"
            accentColor="blue"
            isVisible={itemsVisible.includes(2)}
          >
             {/* Floating UI Element: Service Icons */}
             <div className="absolute top-6 right-6 flex -space-x-3">
                <ServiceBadge color="#E50914" label="N" delay={0} />
                <ServiceBadge color="#00A8E1" label="P" delay={75} />
                <ServiceBadge color="#00D856" label="H" delay={150} />
             </div>

             <div className="absolute bottom-28 right-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
                <div className="bg-blue-500/20 backdrop-blur-md border border-blue-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <MonitorPlay className="w-3.5 h-3.5 text-blue-300" />
                  <span className="text-xs font-bold text-blue-100">Available Now</span>
                </div>
             </div>
          </RichFeatureCard>

        </div>
      </div>
    </section>
  )
}

// Helper for Service Icons
function ServiceBadge({ color, label, delay }) {
  return (
    <div 
      className="w-9 h-9 rounded-full border-2 border-black shadow-lg flex items-center justify-center text-[10px] font-black text-white transform transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1"
      style={{ backgroundColor: color, transitionDelay: `${delay}ms` }}
    >
      {label}
    </div>
  )
}

// 🎥 The Rich 3D Card Component
function RichFeatureCard({ title, desc, image, overlayColor, accentColor, children, isVisible }) {
  const cardRef = useRef(null)
  const [rotate, setRotate] = useState({ x: 0, y: 0 })

  // 🖱️ SMOOTHER Mouse Movement
  const onMouseMove = useCallback((e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Reduced sensitivity (dividing by 40 instead of 20) for less "shake"
    const rotateY = ((mouseX - width / 2) / 40) 
    const rotateX = ((height / 2 - mouseY) / 40)

    setRotate({ x: rotateX, y: rotateY })
  }, [])

  const onMouseLeave = () => {
    setRotate({ x: 0, y: 0 })
  }

  const accentGradients = {
    purple: 'from-purple-500 via-pink-500 to-transparent',
    amber: 'from-amber-500 via-orange-500 to-transparent',
    blue: 'from-blue-500 via-cyan-500 to-transparent',
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={`group relative h-[420px] rounded-3xl overflow-hidden bg-neutral-900 transition-all duration-1000 ease-out transform perspective-1000
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
      style={{
        transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(1, 1, 1)`,
        transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 1s ease-out, translate 1s ease-out'
      }}
    >
      {/* Background Image with Zoom Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={image} 
          alt="" 
          className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110 opacity-60"
        />
      </div>

      {/* Multi-layer Gradient Overlays for Legibility */}
      <div className={`absolute inset-0 bg-gradient-to-t ${overlayColor} via-black/40 to-transparent`} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90" />
      
      {/* Hover Accent Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${accentGradients[accentColor]} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />

      {/* Card Content (Pinned to bottom) */}
      <div className="absolute bottom-0 left-0 right-0 p-8 z-20 transform transition-transform duration-500 group-hover:-translate-y-2">
        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 drop-shadow-md">{title}</h3>
        <p className="text-white/80 text-sm sm:text-base font-medium leading-relaxed line-clamp-3 group-hover:text-white transition-colors">
          {desc}
        </p>
      </div>

      {/* Border Glow */}
      <div className="absolute inset-0 border border-white/10 rounded-3xl pointer-events-none group-hover:border-white/20 transition-colors duration-300" />
      
      {/* Inject Custom UI Elements */}
      <div className="relative w-full h-full z-10">
        {children}
      </div>
    </div>
  )
}
