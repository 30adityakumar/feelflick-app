// src/features/landing/sections/FeaturesGrid.jsx
import { useRef } from 'react'
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'

export default function FeaturesGrid() {
  const { containerRef, itemsVisible } = useStaggeredAnimation(3, 180)

  return (
    <section id="features" className="relative pt-10 pb-14 sm:pt-16 sm:pb-20 bg-black overflow-hidden">
      {/* Ambient gradients for depth */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-[128px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 sm:mb-6">
            More Than Just <br />
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Recommendations</span>
          </h2>
          <p className="text-white/60 text-base sm:text-xl max-w-2xl mx-auto">
            A complete ecosystem for movie lovers. Discover, track, and watch—all in one place.
          </p>
        </div>

        {/* Feature cards grid */}
        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <FeatureCard
            title="AI Precision"
            desc="We don't just guess. We learn your emotional taste and surface films you'll actually finish."
            image="https://image.tmdb.org/t/p/w500/eCOtqtfvn7mxGl6nfmq4b1exJRc.jpg"
            overlayColor="from-purple-900/40"
            studio="A24"
            isVisible={itemsVisible.includes(0)}
            badge={
              <div className="absolute top-5 right-5 bg-green-500/90 text-black font-black px-3 py-1 rounded-lg rotate-3 shadow-[0_0_20px_rgba(34,197,94,0.4)] backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                98% MATCH
              </div>
            }
            tags={[
              "31,289 ratings",
              "Smart clustering"
            ]}
          />
          <FeatureCard
            title="Universal Watchlist"
            desc="One watchlist for every streaming service. Add once, forget never."
            image="https://image.tmdb.org/t/p/w500/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg"
            overlayColor="from-amber-900/40"
            studio="Disney"
            isVisible={itemsVisible.includes(1)}
            badge={
              <div className="absolute inset-0 p-4 sm:p-6 flex flex-col gap-2 opacity-20 pointer-events-none group-hover:opacity-50 transition-opacity">
                <div className="h-10 sm:h-12 bg-white/20 rounded-xl w-full backdrop-blur-md" />
                <div className="h-10 sm:h-12 bg-white/10 rounded-xl w-3/4 backdrop-blur-md" />
                <div className="h-10 sm:h-12 bg-white/5 rounded-xl w-5/6 backdrop-blur-md" />
              </div>
            }
            tags={[
              "Playlist sharing"
            ]}
          />
          <FeatureCard
            title="Stream Anywhere"
            desc="See exactly where to watch—Netflix, Prime, Hulu, Max, and 100+ more."
            image="https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg"
            overlayColor="from-blue-900/40"
            studio="Sony"
            isVisible={itemsVisible.includes(2)}
            badge={
              <div className="absolute top-5 right-5 flex -space-x-3">
                <div className="w-9 h-9 rounded-full bg-[#E50914] border-2 border-black shadow-lg flex items-center justify-center text-xs font-bold text-white">
                  N
                </div>
                <div className="w-9 h-9 rounded-full bg-[#00A8E1] border-2 border-black shadow-lg flex items-center justify-center text-xs font-bold text-white">
                  P
                </div>
                <div className="w-9 h-9 rounded-full bg-[#1CE783] border-2 border-black shadow-lg flex items-center justify-center text-xs font-bold text-black">
                  H
                </div>
              </div>
            }
            tags={[
              "100+ services"
            ]}
          />
        </div>
      </div>
    </section>
  )
}

// Cinematic FeatureCard
function FeatureCard({
  title,
  desc,
  image,
  overlayColor,
  isVisible,
  studio = null,
  badge = null,
  tags = [],
}) {
  const cardRef = useRef(null)

  // Card visual interaction (3D tilt)
  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = (y - centerY) / 16
    const rotateY = (centerX - x) / 16
    cardRef.current.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    cardRef.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)'
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative group h-[350px] sm:h-[400px] md:h-[420px] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 bg-neutral-900 shadow-lg hover:shadow-2xl transition-all duration-700
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{
        transition: 'transform 0.15s cubic-bezier(.17,.67,.83,.67), box-shadow 0.3s, opacity 0.7s, translate 0.7s'
      }}
    >
      {/* Layered backgrounds for cinematic depth */}
      <div className="absolute inset-0">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover opacity-55 group-hover:opacity-65 group-hover:scale-105 transition-all duration-700"
        />
        <div className={`absolute inset-0 bg-gradient-to-b ${overlayColor} via-black/30 to-black`} />
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent backdrop-blur-md" />
      </div>
      {/* Studio chip/ribbon for brand context */}
      {studio && (
        <div className="absolute top-5 left-5 bg-white/10 text-white font-bold px-3 py-1 rounded-full shadow backdrop-blur-lg z-30 text-xs sm:text-sm">
          {studio}
        </div>
      )}
      {/* Feature badge/overlay */}
      <div className="relative z-20">{badge}</div>
      {/* Main content with glass effect */}
      <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 z-30 transition-transform duration-500 group-hover:-translate-y-2 group-hover:backdrop-blur-xl">
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 drop-shadow-lg">{title}</h3>
        <p className="text-white/70 leading-relaxed text-sm sm:text-base font-medium mb-3 drop-shadow-md">{desc}</p>
        {/* Mini tags */}
        <div className="flex gap-2 flex-wrap">
          {tags.map((tag, i) => (
            <span key={i} className="inline-block px-2 py-1 rounded bg-purple-500/20 text-purple-200 font-bold text-xs">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
