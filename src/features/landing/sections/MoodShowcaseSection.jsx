// src/features/landing/sections/MoodShowcaseSection.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'

const MOODS = [
  {
    id: 'nostalgic',
    emoji: '🌅',
    label: 'Nostalgic',
    borderColor: 'border-amber-500/40',
    textColor: 'text-amber-300',
    posters: [
      '/saHP97rTPS5eLmrLQEcANmKrsFl.jpg',
      '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
      '/q719jXXEzOoYaps6babgKnONONX.jpg',
    ],
    films: ['Forrest Gump', 'Amélie', 'Your Name'],
  },
  {
    id: 'tense',
    emoji: '⚡',
    label: 'Tense',
    borderColor: 'border-red-500/40',
    textColor: 'text-red-300',
    posters: [
      '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
      '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
      '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    ],
    films: ['Parasite', 'The Dark Knight', 'Fight Club'],
  },
  {
    id: 'cozy',
    emoji: '☕',
    label: 'Cozy',
    borderColor: 'border-indigo-400/40',
    textColor: 'text-indigo-300',
    posters: [
      '/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg',
      '/hlK0e0wAQ3VLuJcsfIYPvb4JVud.jpg',
      '/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',
    ],
    films: ['Spirited Away', 'Zootopia', 'La La Land'],
  },
  {
    id: 'melancholy',
    emoji: '🌧',
    label: 'Melancholy',
    borderColor: 'border-blue-500/40',
    textColor: 'text-blue-300',
    posters: [
      '/eCOtqtfvn7mxGl6nfmq4b1exJRc.jpg',
      '/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg',
      '/9OkCLM73MIU2CrKZbqiT8Ln1wY2.jpg',
    ],
    films: ['Her', 'The Lord of the Rings', 'Goodfellas'],
  },
  {
    id: 'euphoric',
    emoji: '✨',
    label: 'Euphoric',
    borderColor: 'border-pink-400/40',
    textColor: 'text-pink-300',
    posters: [
      '/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg',
      '/7fn624j5lj3xTme2SgiLCeuedmO.jpg',
      '/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg',
    ],
    films: ['Interstellar', 'Whiplash', 'Pulp Fiction'],
  },
  {
    id: 'curious',
    emoji: '🔭',
    label: 'Curious',
    borderColor: 'border-teal-400/40',
    textColor: 'text-teal-300',
    posters: [
      '/u68AjlvlutfEIcpmbYpKcdi09ut.jpg',
      '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
      '/pEzNVQfdzYDzVK0XqxERIw2x2se.jpg',
    ],
    films: ['Everything Everywhere', 'The Godfather', 'Arrival'],
  },
]

function PosterStrip({ mood }) {
  return (
    <motion.div
      initial={{ clipPath: 'inset(0 0 100% 0)', opacity: 0 }}
      animate={{ clipPath: 'inset(0 0 0% 0)', opacity: 1 }}
      exit={{ clipPath: 'inset(0 0 100% 0)', opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mt-3 px-1 pb-1"
      role="region"
      aria-label={`${mood.label} film picks`}
    >
      <div className="flex gap-3">
        {mood.posters.map((path, i) => (
          <motion.div
            key={path}
            initial={{ opacity: 0, scale: 0.80, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: i * 0.09, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col gap-2"
          >
            <div className="rounded-xl overflow-hidden aspect-[2/3] bg-neutral-900 border border-white/8">
              <img
                src={`https://image.tmdb.org/t/p/w342${path}`}
                alt={mood.films[i]}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-white/40 text-center font-medium truncate px-1">
              {mood.films[i]}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function MoodPill({ mood, isOpen, isVisible, index, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <button
        onClick={onClick}
        aria-expanded={isOpen}
        aria-label={`Show ${mood.label} film picks`}
        className={`
          relative w-full flex items-center gap-3 px-5 py-4 rounded-2xl
          border transition-all duration-300 cursor-pointer touch-target
          ${isOpen
            ? `bg-white/[0.07] ${mood.borderColor}`
            : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.06] hover:border-white/18'
          }
        `}
      >
        <span className="text-2xl leading-none" aria-hidden="true">{mood.emoji}</span>
        <span className={`text-lg font-bold tracking-tight transition-colors duration-300 ${isOpen ? mood.textColor : 'text-white/80'}`}>
          {mood.label}
        </span>
        <span className="ml-auto text-white/25 text-xs font-medium shrink-0">
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
  const [activeMood, setActiveMood] = useState(null)

  return (
    <section
      id="mood-demo"
      className="relative pt-20 pb-24 sm:pt-24 sm:pb-28 bg-black overflow-hidden"
      aria-labelledby="mood-demo-heading"
    >
      {/* Subtle top border */}
      <div className="absolute top-0 inset-x-0 h-px bg-white/8" aria-hidden="true" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2
            id="mood-demo-heading"
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4 leading-tight"
          >
            <span className="text-white">Pick a mood. </span>
            <span className="text-white/60">We'll find your film.</span>
          </h2>
          <p className="text-base sm:text-lg text-white/40 max-w-xl mx-auto">
            Tap any mood to see what FeelFlick would serve you right now.
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
                isOpen={activeMood === mood.id}
                isVisible={itemsVisible.includes(index)}
                index={index}
                onClick={() => setActiveMood(prev => prev === mood.id ? null : mood.id)}
              />
            </div>
          ))}
        </div>

        {/* Footnote */}
        <p className="text-center text-sm text-white/25 mt-10 font-medium">
          Sign in to get picks tailored to your exact taste.
        </p>
      </div>
    </section>
  )
}
