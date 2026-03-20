// src/features/landing/sections/MoodShowcaseSection.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'

const MOODS = [
  {
    id: 'nostalgic',
    emoji: '🌅',
    label: 'Nostalgic',
    gradient: 'from-amber-500/15 to-orange-600/15',
    hoverGradient: 'from-amber-500/25 to-orange-600/25',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-300',
    posters: [
      '/rHbEu9QQKFQFM7u8RKSVmrXKBfq.jpg',
      '/obE7o9Ah9SBFBNlFoPx7F2nI5nW.jpg',
      '/saHP97rTPS5eLmrLQEcANmKrsFl.jpg',
    ],
    films: ['Stand By Me', 'Cinema Paradiso', 'Forrest Gump'],
  },
  {
    id: 'tense',
    emoji: '⚡',
    label: 'Tense',
    gradient: 'from-red-600/15 to-rose-700/15',
    hoverGradient: 'from-red-600/25 to-rose-700/25',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-300',
    posters: [
      '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
      '/6d5XkE9LMD5NOXmWwAvlGMoiPbE.jpg',
      '/bqoHnVaN0bH4K4PdthxhU0u7Gm4.jpg',
    ],
    films: ['Parasite', 'No Country for Old Men', 'Zodiac'],
  },
  {
    id: 'cozy',
    emoji: '☁️',
    label: 'Cozy',
    gradient: 'from-indigo-500/15 to-purple-600/15',
    hoverGradient: 'from-indigo-500/25 to-purple-600/25',
    borderColor: 'border-indigo-400/30',
    textColor: 'text-indigo-300',
    posters: [
      '/eWdyYQreja6JKmallmiTigVg404.jpg',
      '/qSm2aeBsF5SJObPB8ELgRCFXRzN.jpg',
      '/2fBJbkMWqpv2j3MIpfk5I9gAaVp.jpg',
    ],
    films: ['The Grand Budapest Hotel', 'Paddington 2', 'Chef'],
  },
  {
    id: 'melancholy',
    emoji: '🌧',
    label: 'Melancholy',
    gradient: 'from-blue-600/15 to-indigo-700/15',
    hoverGradient: 'from-blue-600/25 to-indigo-700/25',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-300',
    posters: [
      '/ssCNSZOrB3Z7FLMmCWNnHGKQ5XH.jpg',
      '/lEIaL12hSkqqe83kgADkbUkHqHs.jpg',
      '/5MwkWH9tYHv3mV9OdYTMR5qreIz.jpg',
    ],
    films: ['Lost in Translation', 'Her', 'Eternal Sunshine'],
  },
  {
    id: 'euphoric',
    emoji: '✨',
    label: 'Euphoric',
    gradient: 'from-pink-500/15 to-fuchsia-600/15',
    hoverGradient: 'from-pink-500/25 to-fuchsia-600/25',
    borderColor: 'border-pink-400/30',
    textColor: 'text-pink-300',
    posters: [
      '/uDO8zWDhfWwoFdKS4fzkUJt0Bs0.jpg',
      '/7fn624j5lj3xTme2SgiLCeuedmO.jpg',
      '/ddMDzejGrslEMDFJHRFBpQjPGe3.jpg',
    ],
    films: ['La La Land', 'Whiplash', 'Baby Driver'],
  },
  {
    id: 'curious',
    emoji: '🔭',
    label: 'Curious',
    gradient: 'from-teal-500/15 to-cyan-600/15',
    hoverGradient: 'from-teal-500/25 to-cyan-600/25',
    borderColor: 'border-teal-400/30',
    textColor: 'text-teal-300',
    posters: [
      '/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg',
      '/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg',
      '/gEU2QniL6E77NI6lCU6MxlNBvIx.jpg',
    ],
    films: ['Arrival', 'Everything Everywhere', 'Interstellar'],
  },
]

function PosterStrip({ mood }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
      role="region"
      aria-label={`${mood.label} film picks`}
    >
      <div className="mt-2.5 flex gap-2.5 px-1 pb-1">
        {mood.posters.map((path, i) => (
          <motion.div
            key={path}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 rounded-xl overflow-hidden aspect-[2/3] bg-neutral-800 border border-white/10"
          >
            <img
              src={`https://image.tmdb.org/t/p/w185${path}`}
              alt={mood.films[i]}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function MoodPill({ mood, isVisible, index }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-label={`Show ${mood.label} film picks`}
        className={`
          relative w-full flex items-center gap-3 px-5 py-4 rounded-2xl
          bg-gradient-to-br ${isOpen ? mood.hoverGradient : mood.gradient}
          border ${mood.borderColor}
          backdrop-blur-sm
          transition-all duration-300
          hover:scale-[1.02] active:scale-[0.98]
          cursor-pointer touch-target
        `}
      >
        <span className="text-2xl leading-none" aria-hidden="true">{mood.emoji}</span>
        <span className={`text-lg font-bold tracking-tight ${mood.textColor}`}>{mood.label}</span>
        <span className="ml-auto text-white/30 text-xs font-medium shrink-0">
          {isOpen ? '↑ close' : '3 picks →'}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && <PosterStrip mood={mood} />}
      </AnimatePresence>
    </motion.div>
  )
}

export default function MoodShowcaseSection() {
  const { containerRef, itemsVisible } = useStaggeredAnimation(6, 80)

  return (
    <section
      id="mood-demo"
      className="relative pt-20 pb-24 sm:pt-24 sm:pb-28 bg-black overflow-hidden"
      aria-labelledby="mood-demo-heading"
    >
      {/* Ambient gradient */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-purple-500/8 via-pink-500/8 to-amber-500/8 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2
            id="mood-demo-heading"
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4 leading-tight"
          >
            <span className="text-white">Pick a mood. </span>
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-transparent">
              We'll find your movie.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-white/50 max-w-xl mx-auto">
            <span className="hidden sm:inline">Hover</span>
            <span className="sm:hidden">Tap</span>
            {' '}any mood to see what FeelFlick would serve you right now.
          </p>
        </div>

        {/* Mood grid */}
        <div
          ref={containerRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          role="list"
          aria-label="Browse films by mood"
        >
          {MOODS.map((mood, index) => (
            <div key={mood.id} role="listitem">
              <MoodPill
                mood={mood}
                isVisible={itemsVisible.includes(index)}
                index={index}
              />
            </div>
          ))}
        </div>

        {/* Footnote */}
        <p className="text-center text-sm text-white/30 mt-8 font-medium">
          Sign in to get picks tailored to your exact taste.
        </p>
      </div>
    </section>
  )
}
