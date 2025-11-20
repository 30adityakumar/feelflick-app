// src/features/landing/sections/HowItWorksSection.jsx
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'
import { Star, Sparkles, Play, ThumbsUp, ThumbsDown } from 'lucide-react'

export default function HowItWorksSection() {
  const { containerRef, itemsVisible } = useStaggeredAnimation(3, 200)

  return (
    <section
      id="how-it-works"
      className="relative py-24 bg-neutral-950 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-20 items-center">
          {/* 📱 iPhone mockup */}
          <div className="relative mx-auto lg:mx-0 max-w-[320px] lg:max-w-none mb-16 lg:mb-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[500px] bg-purple-500/20 blur-[80px] rounded-full animate-pulse" />

            <div className="relative z-10 border-[8px] border-neutral-800 bg-black rounded-[2.5rem] shadow-2xl overflow-hidden aspect-[9/19] ring-1 ring-white/10">
              <div className="absolute inset-0 bg-neutral-900 flex flex-col">
                {/* Status bar */}
                <div className="h-8 w-full bg-black flex justify-between items-center px-6">
                  <div className="w-12 h-3 bg-neutral-800 rounded-full" />
                  <div className="flex gap-1">
                    <div className="w-3 h-3 bg-neutral-800 rounded-full" />
                    <div className="w-3 h-3 bg-neutral-800 rounded-full" />
                  </div>
                </div>

                {/* Screen content */}
                <div className="flex-1 p-4 flex flex-col relative">
                  <div className="relative flex-1 rounded-2xl overflow-hidden mb-4 shadow-lg group">
                    <img
                      src="https://image.tmdb.org/t/p/w780/q6y0Go1rZgVoTFZYpK391L0imU.jpg"
                      alt="Pulp Fiction"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="text-white text-2xl font-bold leading-tight">
                        Pulp Fiction
                      </h3>
                      <div className="flex items-center gap-2 mt-2 text-white/60 text-sm">
                        <span>1994</span>
                        <span>•</span>
                        <span>Crime, Drama</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 h-16">
                    <button className="flex-1 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-colors">
                      <ThumbsDown className="w-6 h-6" />
                    </button>
                    <button className="flex-1 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 hover:bg-green-500/20 transition-colors">
                      <ThumbsUp className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Bottom nav */}
                <div className="h-16 bg-black border-t border-white/5 flex justify-around items-center px-4">
                  <div className="w-6 h-6 rounded-full bg-purple-500" />
                  <div className="w-6 h-6 rounded-full bg-neutral-800" />
                  <div className="w-6 h-6 rounded-full bg-neutral-800" />
                </div>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div ref={containerRef} className="space-y-12">
            <div className="text-center lg:text-left mb-12">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                Your Personal <br />
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Movie Curator
                </span>
              </h2>
              <p className="text-white/60 text-lg">
                Stop relying on random algorithms. Tell us how you feel, and
                we&apos;ll do the rest.
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
              desc="See exactly where each movie is streaming across 100+ services. No more dead ends."
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
        <p className="text-white/60 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}
