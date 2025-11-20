// src/features/landing/sections/HowItWorksSection.jsx
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'
import { Star, Sparkles, Play, ThumbsUp, ThumbsDown } from 'lucide-react'

export default function HowItWorksSection() {
  const { containerRef, itemsVisible } = useStaggeredAnimation(3, 200)

  return (
    <section
      id="how-it-works"
      className="relative pb-20 pt-12 sm:pt-16 bg-neutral-950 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-24 items-center">
          {/* iPhone UI Demo */}
          <div className="relative flex flex-col items-center w-full max-w-xs min-[400px]:max-w-sm mx-auto mb-14 lg:mb-0">
            {/* Aura (subtle, not overpowering) */}
            <div className="absolute bottom-4 left-2/4 -translate-x-2/4 w-72 h-28 bg-pink-500/10 blur-[48px] rounded-full z-0" />

            <div className="w-full aspect-[9/19.5] bg-black border-[6px] border-neutral-900 rounded-[2rem] shadow-2xl relative z-10 overflow-hidden flex flex-col">
              {/* Status Bar */}
              <div className="h-8 bg-black flex justify-between items-center px-4">
                <div className="w-12 h-3 bg-neutral-800 rounded-full" />
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-neutral-800 rounded-full" />
                  <div className="w-3 h-3 bg-neutral-800 rounded-full" />
                </div>
              </div>

              {/* Movie Card Demo */}
              <div className="relative flex-1 p-4 flex flex-col">
                <div className="relative flex-1 rounded-2xl overflow-hidden shadow-lg">
                  <img
                    src="https://image.tmdb.org/t/p/w780/q6y0Go1rZgVoTFZYpK391L0imU.jpg"
                    alt="Pulp Fiction"
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white text-lg font-bold">Pulp Fiction</h3>
                    <div className="flex items-center gap-2 text-xs text-white/60 mt-1">
                      <span>1994</span>
                      <span>•</span>
                      <span>Crime, Drama</span>
                    </div>
                  </div>
                </div>

                {/* Thumb Actions */}
                <div className="flex gap-4 h-12 mt-4">
                  <button
                    className="flex-1 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-colors"
                    tabIndex={-1}
                    aria-label="Dislike"
                  >
                    <ThumbsDown className="w-5 h-5" />
                  </button>
                  <button
                    className="flex-1 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 hover:bg-green-500/20 transition-colors"
                    tabIndex={-1}
                    aria-label="Like"
                  >
                    <ThumbsUp className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Bottom Nav */}
              <div className="h-12 bg-black border-t border-white/5 flex justify-around items-center px-6">
                <div className="w-5 h-5 rounded-full bg-purple-500" />
                <div className="w-5 h-5 rounded-full bg-neutral-800" />
                <div className="w-5 h-5 rounded-full bg-neutral-800" />
              </div>
            </div>
          </div>

          {/* HOW IT WORKS STEPS */}
          <div ref={containerRef} className="flex flex-col justify-center space-y-8 md:space-y-12 px-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 lg:mb-4 text-center lg:text-left leading-snug">
              How <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">FeelFlick</span> Works
            </h2>
            <Step
              icon={<Star className="w-6 h-6 text-amber-400" />}
              title="1. Rate what you've seen"
              desc="Swipe right if you loved it, left if you didn't. Every rating sharpens your profile."
              isVisible={itemsVisible.includes(0)}
            />
            <Step
              icon={<Sparkles className="w-6 h-6 text-purple-400" />}
              title="2. Instantly match your mood"
              desc="AI recommends films based on emotion, pacing, and how you feel—not just genre."
              isVisible={itemsVisible.includes(1)}
            />
            <Step
              icon={<Play className="w-6 h-6 text-teal-400" />}
              title="3. Watch right away"
              desc="See exactly where to stream it. No more dead ends on Netflix, Prime, Hulu, or Max."
              isVisible={itemsVisible.includes(2)}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function Step({ icon, title, desc, isVisible }) {
  return (
    <div
      className={`flex gap-5 p-5 rounded-2xl transition-all duration-500 hover:bg-white/5 border border-transparent hover:border-white/5 group items-start ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
      }`}
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform shadow-lg mt-1">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">
          {title}
        </h3>
        <p className="text-white/60 leading-snug text-base">{desc}</p>
      </div>
    </div>
  )
}
