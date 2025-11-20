// src/features/landing/sections/HowItWorksSection.jsx
import { useState, useEffect, useRef } from 'react'
import { Star, Sparkles, Play } from 'lucide-react'

// Import streaming icons
import netflixIcon from '@/assets/icons/Netflix.svg'
import primeIcon from '@/assets/icons/Prime.svg'
import huluIcon from '@/assets/icons/Hulu.svg'

export default function HowItWorksSection() {
  const [inView, setInView] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true)
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative min-h-screen flex items-center bg-black py-16"
    >
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 via-transparent to-pink-600/5 pointer-events-none" />

      <div className="relative w-full max-w-6xl mx-auto px-6">
        
        {/* Title */}
        <div className={`text-center mb-16 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4">
            How{' '}
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              FeelFlick
            </span>
            {' '}Works
          </h2>
          <p className="text-white/60 text-lg">Three simple steps to your perfect movie</p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          
          {/* Step 1: Rate */}
          <Step 
            number="01"
            icon={<Star className="w-8 h-8 text-amber-400" />}
            title="Rate movies"
            description="Swipe to rate. Our AI learns your taste with every choice."
            image="https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg"
            delay="delay-200"
            inView={inView}
          />

          {/* Step 2: Match */}
          <Step 
            number="02"
            icon={<Sparkles className="w-8 h-8 text-purple-400" />}
            title="Get matched"
            description="AI analyzes mood, pacing, and emotional tone for perfect recommendations."
            matchBadge="98% Match"
            delay="delay-400"
            inView={inView}
          />

          {/* Step 3: Watch */}
          <Step 
            number="03"
            icon={<Play className="w-8 h-8 text-teal-400" />}
            title="Watch instantly"
            description="See where to stream across all your services."
            streamingIcons={[netflixIcon, primeIcon, huluIcon]}
            delay="delay-600"
            inView={inView}
          />
        </div>
      </div>
    </section>
  )
}

// Minimal Step Component
function Step({ number, icon, title, description, image, matchBadge, streamingIcons, delay, inView }) {
  return (
    <div 
      className={`group relative transition-all duration-700 ${delay} ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {/* Card */}
      <div className="relative bg-neutral-900 rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all hover:scale-105">
        
        {/* Visual Content */}
        <div className="relative h-64 bg-neutral-800 overflow-hidden">
          
          {/* Movie Poster */}
          {image && (
            <>
              <img 
                src={image}
                alt="Movie example"
                className="absolute inset-0 w-full h-full object-cover opacity-70"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent" />
            </>
          )}

          {/* Match Badge */}
          {matchBadge && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-neutral-900/90 backdrop-blur-sm rounded-2xl border border-purple-500/50 px-6 py-8 text-center">
                <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <div className="text-3xl font-black text-white mb-1">{matchBadge}</div>
                <div className="text-white/60 text-sm">Based on your mood</div>
              </div>
            </div>
          )}

          {/* Streaming Icons */}
          {streamingIcons && (
            <div className="absolute inset-0 flex items-center justify-center gap-4">
              {streamingIcons.map((icon, i) => (
                <div 
                  key={i}
                  className="w-16 h-16 rounded-xl bg-neutral-900/90 backdrop-blur-sm border border-white/10 flex items-center justify-center p-3 hover:scale-110 transition-transform"
                >
                  <img src={icon} alt="Streaming service" className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Text Content */}
        <div className="p-6">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-neutral-800 border border-white/10 flex items-center justify-center">
              {icon}
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>
          <p className="text-white/60 text-sm leading-relaxed">{description}</p>
        </div>

        {/* Number Badge */}
        <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-black shadow-lg ring-4 ring-black">
          {number}
        </div>
      </div>
    </div>
  )
}
