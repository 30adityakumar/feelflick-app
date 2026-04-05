// src/app/homepage/components/MoodQuickSelect.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MoodCarouselRow from './MoodCarouselRow'

const FEATURED_MOODS = [
  { id: 1,  name: 'Cozy',      emoji: '☕' },
  { id: 5,  name: 'Nostalgic', emoji: '🎞️' },
  { id: 6,  name: 'Energized', emoji: '⚡' },
  { id: 4,  name: 'Curious',   emoji: '🔍' },
  { id: 11, name: 'Dark',      emoji: '🌑' },
  { id: 8,  name: 'Romantic',  emoji: '💕' },
]

export default function MoodQuickSelect({ userId }) {
  const [activeMood, setActiveMood] = useState(null)
  const navigate = useNavigate()
  const current = FEATURED_MOODS.find(m => m.id === activeMood)

  return (
    <section aria-label="Mood picks">
      {/* Header — matches CarouselRow visual weight */}
      <div className="px-4 sm:px-6 lg:px-8 mb-3 sm:mb-4">
        <div className="flex items-center justify-end mb-2">
          <button
            onClick={() => navigate('/discover')}
            className="text-xs font-semibold text-white/30 hover:text-white/60 transition-colors duration-200"
          >
            All moods →
          </button>
        </div>

        {/* Mood pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
          {FEATURED_MOODS.map(mood => (
            <button
              key={mood.id}
              onClick={() => setActiveMood(prev => prev === mood.id ? null : mood.id)}
              className={`
                flex-none flex items-center gap-1.5 px-3.5 py-1.5 rounded-full
                text-sm font-semibold transition-all duration-200 border whitespace-nowrap
                ${activeMood === mood.id
                  ? 'bg-white text-black border-white shadow-md'
                  : 'bg-white/6 text-white/55 border-white/10 hover:bg-white/11 hover:text-white/80 hover:border-white/18'
                }
              `}
            >
              <span className="text-base leading-none">{mood.emoji}</span>
              <span>{mood.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Inline mood results — fades in when a mood is selected */}
      {activeMood && current && (
        <MoodCarouselRow
          moodId={activeMood}
          moodName={current.name}
          moodEmoji={current.emoji}
          userId={userId}
          staggerMs={0}
        />
      )}
    </section>
  )
}
