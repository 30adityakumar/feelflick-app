// src/features/landing/sections/MoodShowcaseSection.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MOODS = [
  {
    id: 'nostalgic',
    emoji: '🌅',
    label: 'Nostalgic',
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
    posters: [
      '/u68AjlvlutfEIcpmbYpKcdi09ut.jpg',
      '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
      '/pEzNVQfdzYDzVK0XqxERIw2x2se.jpg',
    ],
    films: ['Everything Everywhere', 'The Godfather', 'Arrival'],
  },
]

export default function MoodShowcaseSection() {
  const [activeMood, setActiveMood] = useState(MOODS[0].id)
  const currentMood = MOODS.find(m => m.id === activeMood)

  return (
    <section
      id="mood-demo"
      className="relative pt-20 pb-24 sm:pt-24 sm:pb-28 bg-black overflow-hidden"
      aria-labelledby="mood-demo-heading"
    >
      {/* Subtle top border */}
      <div className="absolute top-0 inset-x-0 h-px bg-white/8" aria-hidden="true" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-10 sm:mb-12">
          <h2
            id="mood-demo-heading"
            className="text-4xl sm:text-5xl font-black tracking-tight mb-3 leading-tight"
          >
            <span className="text-white">Pick a mood. </span>
            <span className="text-white/55">Get a film.</span>
          </h2>
          <p className="text-base text-white/40 max-w-sm mx-auto">
            See exactly what FeelFlick would recommend right now.
          </p>
        </div>

        {/* Mood tab row */}
        <div
          className="flex gap-2 overflow-x-auto pb-1 mb-8 scrollbar-hide justify-start sm:justify-center"
          role="tablist"
          aria-label="Select a mood"
        >
          {MOODS.map(mood => (
            <button
              key={mood.id}
              role="tab"
              aria-selected={activeMood === mood.id}
              aria-controls="mood-films-panel"
              onClick={() => setActiveMood(mood.id)}
              className={`
                shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold
                transition-all duration-200 whitespace-nowrap touch-target
                ${activeMood === mood.id
                  ? 'bg-white text-black'
                  : 'bg-white/8 text-white/55 hover:bg-white/13 hover:text-white/80'
                }
              `}
            >
              <span aria-hidden="true">{mood.emoji}</span>
              <span>{mood.label}</span>
            </button>
          ))}
        </div>

        {/* Film cards — always visible, fades on mood change */}
        <div
          id="mood-films-panel"
          role="tabpanel"
          aria-label={`${currentMood.label} film picks`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMood}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="grid grid-cols-3 gap-3 sm:gap-4"
            >
              {currentMood.posters.map((path, i) => (
                <div key={path} className="flex flex-col gap-2">
                  <div className="rounded-xl overflow-hidden aspect-[2/3] bg-neutral-900 border border-white/8">
                    <img
                      src={`https://image.tmdb.org/t/p/w342${path}`}
                      alt={currentMood.films[i]}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-white/50 text-center font-medium truncate px-1">
                    {currentMood.films[i]}
                  </p>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footnote */}
        <p className="text-center text-sm text-white/25 mt-8 font-medium">
          Sign in to get picks tailored to your exact taste.
        </p>
      </div>
    </section>
  )
}
