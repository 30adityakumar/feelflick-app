// src/features/landing/sections/HowItWorksSection.jsx
import { useState, useEffect, useRef } from 'react'
import { Star, Sparkles, Play, Heart, X } from 'lucide-react'

// Import streaming icons
import netflixIcon from '@/assets/icons/Netflix.svg'
import primeIcon from '@/assets/icons/Prime.svg'
import huluIcon from '@/assets/icons/Hulu.svg'

export default function HowItWorksSection() {
  const [inView, setInView] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Auto-cycle through steps every 3 seconds
  useEffect(() => {
    if (!inView) return
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3)
    }, 3000)
    return () => clearInterval(interval)
  }, [inView])

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative h-screen flex items-center bg-black overflow-hidden py-8"
    >
      {/* Subtle ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative w-full max-w-[1400px] mx-auto px-6 lg:px-8">
        
        {/* Section Title */}
        <div className={`text-center mb-8 lg:mb-12 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight">
            How{' '}
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              FeelFlick
            </span>
            {' '}Works
          </h2>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* LEFT: Exploded iPhone UI */}
          <div className={`relative h-[580px] transition-all duration-1000 delay-200 ${inView ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            
            {/* Background iPhone (semi-transparent) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] opacity-15">
              <div className="relative w-full aspect-[9/19.5] bg-neutral-900 border-[3px] border-neutral-700 rounded-[3rem] shadow-2xl" />
            </div>

            {/* Exploded UI Cards */}
            <div className="relative h-full flex flex-col justify-center items-center gap-6">
              
              {/* 1. Rating Card (Top) */}
              <div 
                className={`relative w-[320px] transition-all duration-700 cursor-pointer ${
                  activeStep === 0 ? 'scale-105 opacity-100 translate-y-0 z-30' : 'scale-90 opacity-30 translate-y-4 z-10'
                }`}
                onClick={() => setActiveStep(0)}
              >
                {activeStep === 0 && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-2xl blur-2xl" />
                )}
                <div className="relative bg-neutral-900 rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
                  <div className="relative w-full aspect-[3/4.2]">
                    <img 
                      src="https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg"
                      alt="Inception"
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white text-xl font-bold mb-1">Inception</h3>
                      <p className="text-white/60 text-sm">2010 · Sci-Fi, Thriller</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-4">
                    <button className="flex-1 h-14 rounded-xl bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-all">
                      <X className="w-7 h-7" />
                    </button>
                    <button className="flex-1 h-14 rounded-xl bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center text-green-500 hover:bg-green-500/20 transition-all">
                      <Heart className="w-7 h-7" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Match Card (Middle) */}
              <div 
                className={`relative w-[320px] transition-all duration-700 cursor-pointer ${
                  activeStep === 1 ? 'scale-105 opacity-100 translate-y-0 z-30' : 'scale-90 opacity-30 translate-y-4 z-10'
                }`}
                onClick={() => setActiveStep(1)}
              >
                {activeStep === 1 && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-2xl blur-2xl" />
                )}
                <div className="relative bg-neutral-900 rounded-2xl border border-white/20 p-6 shadow-2xl">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-bold text-lg mb-1">98% Match</div>
                      <div className="text-white/60 text-sm">Based on your mood</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-white/80 text-sm">Emotional tone: Intense</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-pink-500" />
                      <span className="text-white/80 text-sm">Pacing: Fast-paced</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-white/80 text-sm">Vibe: Mind-bending</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Streaming Card (Bottom) */}
              <div 
                className={`relative w-[320px] transition-all duration-700 cursor-pointer ${
                  activeStep === 2 ? 'scale-105 opacity-100 translate-y-0 z-30' : 'scale-90 opacity-30 translate-y-4 z-10'
                }`}
                onClick={() => setActiveStep(2)}
              >
                {activeStep === 2 && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-2xl blur-2xl" />
                )}
                <div className="relative bg-neutral-900 rounded-2xl border border-white/20 p-6 shadow-2xl">
                  <div className="text-white font-bold text-lg mb-4">Available on</div>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Real streaming icons */}
                    <div className="aspect-square rounded-xl bg-neutral-800 flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer border border-white/10 p-2">
                      <img src={netflixIcon} alt="Netflix" className="w-full h-full object-contain" />
                    </div>
                    <div className="aspect-square rounded-xl bg-neutral-800 flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer border border-white/10 p-2">
                      <img src={primeIcon} alt="Prime Video" className="w-full h-full object-contain" />
                    </div>
                    <div className="aspect-square rounded-xl bg-neutral-800 flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer border border-white/10 p-2">
                      <img src={huluIcon} alt="Hulu" className="w-full h-full object-contain" />
                    </div>
                  </div>
                  <button className="w-full mt-4 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-purple-500/50 transition-all hover:scale-105">
                    Watch Now
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Interactive Steps */}
          <div className="space-y-5">
            <InteractiveStep 
              number="01"
              icon={<Star className="w-6 h-6 text-amber-400" />}
              title="Rate what you've seen"
              desc="Swipe through movies you know. Every rating teaches our AI your unique taste."
              isActive={activeStep === 0}
              onClick={() => setActiveStep(0)}
              inView={inView}
              delay="delay-300"
            />
            <InteractiveStep 
              number="02"
              icon={<Sparkles className="w-6 h-6 text-purple-400" />}
              title="Get mood-based matches"
              desc="Our AI analyzes emotion, pacing, and crowd sentiment—not just genre tags."
              isActive={activeStep === 1}
              onClick={() => setActiveStep(1)}
              inView={inView}
              delay="delay-500"
            />
            <InteractiveStep 
              number="03"
              icon={<Play className="w-6 h-6 text-teal-400" />}
              title="Watch instantly"
              desc="See exactly where to stream across Netflix, Prime, Hulu, and 100+ services."
              isActive={activeStep === 2}
              onClick={() => setActiveStep(2)}
              inView={inView}
              delay="delay-700"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// Interactive Step Component
function InteractiveStep({ number, icon, title, desc, isActive, onClick, inView, delay }) {
  return (
    <button
      onClick={onClick}
      className={`group relative w-full flex gap-5 p-5 lg:p-6 rounded-2xl transition-all duration-700 text-left ${delay} ${
        isActive 
          ? 'bg-white/10 border-2 border-purple-500 shadow-lg shadow-purple-500/20 scale-[1.02]' 
          : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
      } ${
        inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
      }`}
    >
      {/* Number badge */}
      <div className={`absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black shadow-lg ring-4 ring-black transition-all ${
        isActive 
          ? 'bg-gradient-to-br from-purple-500 to-pink-500 scale-110' 
          : 'bg-neutral-800'
      }`}>
        {number}
      </div>
      
      {/* Icon */}
      <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center border transition-all duration-300 ${
        isActive 
          ? 'border-purple-500 scale-110' 
          : 'border-white/10 group-hover:scale-105'
      }`}>
        {icon}
      </div>
      
      {/* Content */}
      <div className="flex-1 pt-1">
        <h3 className={`text-base lg:text-lg font-bold mb-2 transition-colors ${
          isActive ? 'text-purple-300' : 'text-white group-hover:text-purple-300'
        }`}>
          {title}
        </h3>
        <p className="text-sm text-white/60 leading-relaxed group-hover:text-white/70 transition-colors">
          {desc}
        </p>
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
        </div>
      )}
    </button>
  )
}
