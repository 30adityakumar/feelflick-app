// src/features/landing/sections/FeaturesGrid.jsx
import { useRef, useState, useEffect } from 'react'
import { Sparkles, BookmarkCheck, MonitorPlay, Heart } from 'lucide-react'

/**
 * Animated counter for numbers with performance optimization
 */
const AnimatedNumber = ({ value, suffix = '', isVisible }) => {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    if (!isVisible) return
    const target = parseInt(value)
    if (isNaN(target)) return
    
    const duration = 1500
    const increment = target / (duration / 16)
    let current = 0
    
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, 16)
    
    return () => clearInterval(timer)
  }, [isVisible, value])
  
  return <>{count}{suffix}</>
}

/**
 * Premium gradient badge with glow
 */
function FeatureBadge({ children, color = 'purple', glow = true }) {
  const colorMap = {
    purple: {
      gradient: 'from-purple-500 via-pink-500 to-purple-400',
      shadow: glow ? 'shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'shadow-md',
      border: 'border-purple-400/40'
    },
    amber: {
      gradient: 'from-amber-500 via-orange-400 to-amber-400',
      shadow: glow ? 'shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'shadow-md',
      border: 'border-amber-400/40'
    },
    pink: {
      gradient: 'from-pink-500 via-fuchsia-500 to-pink-400',
      shadow: glow ? 'shadow-[0_0_20px_rgba(236,72,153,0.4)]' : 'shadow-md',
      border: 'border-pink-400/40'
    }
  }
  
  const colors = colorMap[color]
  
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full
        text-xs font-bold uppercase tracking-widest
        bg-gradient-to-r ${colors.gradient}
        text-white border ${colors.border} backdrop-blur-xl ${colors.shadow}
        transition-all duration-300 hover:scale-105
      `}
    >
      {children}
    </span>
  )
}

/**
 * Streaming service icons with stagger animation
 */
function ServiceIconsRow({ isVisible }) {
  const services = [
    { color: "#E50914", label: "N", name: "Netflix" },
    { color: "#00A8E1", label: "P", name: "Prime Video" },
    { color: "#1CE783", label: "H", name: "Hulu" },
    { color: "#00D9FF", label: "D", name: "Disney+" },
  ]
  
  return (
    <div className="flex items-center gap-2.5 mt-4" role="list" aria-label="Available streaming services">
      {services.map((s, idx) => (
        <div
          key={s.label}
          role="listitem"
          className={`
            w-9 h-9 rounded-full flex justify-center items-center 
            text-xs font-black text-white shadow-lg
            transition-all duration-500 hover:scale-125 hover:-translate-y-1 cursor-pointer
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ 
            background: s.color, 
            boxShadow: `0 4px 12px ${s.color}66`,
            transitionDelay: `${idx * 75}ms`
          }}
          title={s.name}
          aria-label={s.name}
        >
          {s.label}
        </div>
      ))}
      <span className="ml-2 text-xs text-white/50 font-medium" aria-label="And 100 more services">
        +100 more
      </span>
    </div>
  )
}

/**
 * Floating UI element for Card 1 (Watchlist items preview)
 */
function WatchlistPreview({ isHovered }) {
  return (
    <div 
      className={`
        absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] pointer-events-none
        transition-all duration-700 z-30
        ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
      `}
      aria-hidden="true"
    >
      {/* First item */}
      <div className="bg-neutral-900/95 backdrop-blur-xl border border-amber-400/30 rounded-xl p-3 mb-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] transform transition-all duration-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-14 bg-gradient-to-br from-amber-500/40 to-orange-600/30 rounded-md shrink-0 shadow-inner" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2 bg-white/30 rounded-full w-3/4" />
            <div className="h-1.5 bg-white/20 rounded-full w-1/2" />
          </div>
          <BookmarkCheck className="w-5 h-5 text-amber-400" />
        </div>
      </div>
      {/* Second item (dimmed) */}
      <div className="bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] opacity-70 scale-[0.97]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-14 bg-white/10 rounded-md shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2 bg-white/20 rounded-full w-2/3" />
            <div className="h-1.5 bg-white/15 rounded-full w-1/3" />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Floating mood indicator for Card 2
 */
function MoodIndicator({ isHovered }) {
  return (
    <div 
      className={`
        absolute bottom-28 left-6 z-30 pointer-events-none
        transition-all duration-500 delay-100
        ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      aria-hidden="true"
    >
      <div className="bg-black/80 backdrop-blur-xl border border-purple-400/30 rounded-xl p-3 flex items-center gap-3 shadow-[0_0_40px_rgba(168,85,247,0.3)]">
        <div className="bg-purple-500/20 p-2 rounded-lg">
          <Heart className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <div className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Your Vibe</div>
          <div className="text-sm font-semibold text-white">Intense & Thoughtful</div>
        </div>
      </div>
    </div>
  )
}

/**
 * Match score badge for Card 2
 */
function MatchScoreBadge({ isVisible }) {
  return (
    <div 
      className={`
        absolute top-6 right-6 z-30
        transition-all duration-700 delay-200
        ${isVisible ? 'opacity-100 rotate-2 scale-100' : 'opacity-0 rotate-0 scale-90'}
      `}
      aria-hidden="true"
    >
      <div className="bg-white/5 backdrop-blur-xl border border-purple-400/40 px-4 py-2 rounded-full shadow-[0_0_30px_rgba(168,85,247,0.4)] flex items-center gap-2 hover:scale-110 hover:rotate-3 transition-all duration-300">
        <Sparkles className="w-4 h-4 text-purple-300 fill-purple-300 animate-pulse" />
        <span className="text-sm font-bold text-white tracking-wide">
          <AnimatedNumber value="98" isVisible={isVisible} />% MATCH
        </span>
      </div>
    </div>
  )
}

/**
 * Available now indicator for Card 3
 */
function AvailableNowBadge({ isHovered }) {
  return (
    <div 
      className={`
        absolute bottom-28 right-6 z-30 pointer-events-none
        transition-all duration-500 delay-150
        ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      aria-hidden="true"
    >
      <div className="bg-pink-500/20 backdrop-blur-xl border border-pink-400/40 px-4 py-2 rounded-xl flex items-center gap-2 shadow-[0_0_30px_rgba(236,72,153,0.35)]">
        <MonitorPlay className="w-4 h-4 text-pink-300" />
        <span className="text-sm font-bold text-pink-100">Streaming Now</span>
      </div>
      {/* Pulse dot */}
      <div className="absolute -top-1 -right-1 w-2 h-2">
        <div className="absolute inset-0 bg-pink-400 rounded-full" />
        <div className="absolute inset-0 bg-pink-400 rounded-full animate-ping" />
      </div>
    </div>
  )
}

export default function FeaturesGrid() {
  const [visibleCards, setVisibleCards] = useState([])
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCards([0, 1, 2])
            observer.disconnect()
          }
        })
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section 
      id="features"
      ref={sectionRef}
      className="relative pt-20 pb-24 sm:pt-24 sm:pb-32 bg-black overflow-hidden"
      aria-labelledby="features-heading"
    >
      {/* Enhanced ambient backgrounds */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/8 rounded-full blur-[140px] animate-pulse pointer-events-none" style={{ animationDuration: '10s' }} aria-hidden="true" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-pink-500/8 rounded-full blur-[140px] animate-pulse pointer-events-none" style={{ animationDuration: '12s', animationDelay: '2s' }} aria-hidden="true" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-amber-500/5 rounded-full blur-[160px] pointer-events-none" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <div className="text-center mb-14 sm:mb-20">
          <h2 
            id="features-heading"
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-5 sm:mb-6 leading-tight"
          >
            The{' '}
            <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 bg-clip-text text-transparent">
              FeelFlick
            </span>{' '}
            Difference
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed px-4">
            Built for mood-driven discovery—with a premium watchlist, precision AI matches, and instant streaming everywhere.
          </p>
        </div>

        {/* Cards grid */}
        <div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10"
          role="list"
          aria-label="Key features"
        >
          {/* Card 1: Watchlist */}
          <FeatureCard
            index={0}
            isVisible={visibleCards.includes(0)}
            img="https://image.tmdb.org/t/p/w780/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg"
            imgAlt="Movie poster showing space exploration scene"
            overlay="from-amber-950/90 via-black/80 to-black/95"
            accentGradient="from-amber-500/20 via-orange-500/10 to-transparent"
            badge={<FeatureBadge color="amber"><BookmarkCheck className="w-3.5 h-3.5" />Saved</FeatureBadge>}
            iconBg="bg-amber-500/15 shadow-amber-500/20"
            icon={<BookmarkCheck className="w-6 h-6 text-amber-300" />}
            title="One Watchlist. Every Mood."
            desc="Never lose a movie again. Save all your finds, mood picks, and friend recommendations in one beautiful place—your next film is always a tap away."
            floatingElement={(isHovered) => <WatchlistPreview isHovered={isHovered} />}
          />

          {/* Card 2: Mood Precision */}
          <FeatureCard
            index={1}
            isVisible={visibleCards.includes(1)}
            img="https://image.tmdb.org/t/p/w780/eCOtqtfvn7mxGl6nfmq4b1exJRc.jpg"
            imgAlt="Movie poster showing thought-provoking scene"
            overlay="from-purple-950/90 via-black/80 to-black/95"
            accentGradient="from-purple-500/20 via-pink-500/10 to-transparent"
            badge={<FeatureBadge color="purple"><Sparkles className="w-3.5 h-3.5" />Mood Match</FeatureBadge>}
            iconBg="bg-purple-500/15 shadow-purple-500/20"
            icon={<Sparkles className="w-6 h-6 text-purple-300" />}
            title="Mood-Matching Magic"
            desc="We go deeper than genres. FeelFlick's AI reads emotional tone, pacing, and atmosphere—connecting you with films that truly resonate."
            floatingElement={(isHovered, isVisible) => (
              <>
                <MatchScoreBadge isVisible={isVisible} />
                <MoodIndicator isHovered={isHovered} />
              </>
            )}
          />

          {/* Card 3: Stream Anywhere */}
          <FeatureCard
            index={2}
            isVisible={visibleCards.includes(2)}
            img="https://image.tmdb.org/t/p/w780/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg"
            imgAlt="Movie poster showing vibrant animated scene"
            overlay="from-pink-950/90 via-black/80 to-black/95"
            accentGradient="from-pink-500/20 via-fuchsia-500/10 to-transparent"
            badge={<FeatureBadge color="pink"><MonitorPlay className="w-3.5 h-3.5" />Available</FeatureBadge>}
            iconBg="bg-pink-500/15 shadow-pink-500/20"
            icon={<MonitorPlay className="w-6 h-6 text-pink-300" />}
            title="Watch Instantly, Anywhere"
            desc="See where every recommendation is streaming. Real-time links to Netflix, Prime, Disney+, and more—your next favorite is just a click away."
            bottom={(isVisible) => <ServiceIconsRow isVisible={isVisible} />}
            floatingElement={(isHovered) => <AvailableNowBadge isHovered={isHovered} />}
          />
        </div>
      </div>
    </section>
  )
}

/**
 * Feature card with optimized animations
 */
function FeatureCard({ 
  index, 
  isVisible, 
  img, 
  imgAlt, 
  overlay, 
  accentGradient,
  badge, 
  icon, 
  iconBg, 
  title, 
  desc, 
  bottom,
  floatingElement 
}) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <article
      className={`
        group relative rounded-2xl sm:rounded-3xl overflow-hidden 
        bg-neutral-950 border border-white/10
        transition-all duration-700 ease-out
        hover:border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)]
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}
      `}
      style={{
        transitionDelay: `${index * 100}ms`,
        minHeight: '460px',
        willChange: isHovered ? 'transform' : 'auto',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="listitem"
    >
      {/* Image section */}
      <div className="relative h-64 sm:h-72 overflow-hidden">
        {/* Loading skeleton */}
        {!imageLoaded && !imageFailed && (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900 animate-pulse" />
        )}
        
        {/* Fallback for failed images */}
        {imageFailed && (
          <div className={`absolute inset-0 bg-gradient-to-br ${overlay}`} />
        )}
        
        {/* Actual image */}
        {!imageFailed && (
          <img
            src={img}
            alt={imgAlt}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageFailed(true)}
            className={`
              w-full h-full object-cover transition-all duration-[2s] ease-out
              ${imageLoaded ? 'opacity-70' : 'opacity-0'}
            `}
          />
        )}
        
        {/* Multi-layer overlays */}
        <div className={`absolute inset-0 bg-gradient-to-b ${overlay}`} />
        <div className={`absolute inset-0 bg-gradient-to-br ${accentGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

        {/* Floating elements */}
        {floatingElement && floatingElement(isHovered, isVisible)}
      </div>

      {/* Content section */}
      <div className="relative p-6 sm:p-7 md:p-8 space-y-4">
        {/* Icon + Badge row */}
        <div className="flex items-center justify-between gap-3">
          <div className={`rounded-xl p-2.5 shadow-lg ${iconBg} transition-transform duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}>
            {icon}
          </div>
          <div className="transform transition-transform duration-300 group-hover:scale-105">
            {badge}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-tight tracking-tight">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm sm:text-base text-white/80 leading-relaxed font-medium">
          {desc}
        </p>

        {/* Bottom content (e.g., streaming icons) */}
        {bottom && bottom(isVisible)}
      </div>
    </article>
  )
}