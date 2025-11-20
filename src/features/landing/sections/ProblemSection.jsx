// src/features/landing/sections/ProblemSection.jsx
import { Clock, Film } from 'lucide-react'

export default function ProblemSection() {
  return (
    <section className="relative py-16 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          
          {/* Netflix */}
          <StatCard
            count="15,000+"
            label="Movies on Netflix"
            icon={<Film className="h-6 w-6" />}
          />

          {/* Prime */}
          <StatCard
            count="12,000+"
            label="Movies on Prime"
            icon={<Film className="h-6 w-6" />}
          />

          {/* Time Wasted */}
          <StatCard
            count="30 min"
            label="Average time scrolling"
            icon={<Clock className="h-6 w-6" />}
            accent
          />
        </div>
      </div>
    </section>
  )
}

function StatCard({ count, label, icon, accent = false }) {
  return (
    <div className={`p-6 rounded-2xl bg-neutral-900/50 backdrop-blur-sm border ${
      accent ? 'border-purple-500/30' : 'border-white/10'
    } text-center`}>
      <div className={`mb-2 flex justify-center ${accent ? 'text-purple-400' : 'text-white/40'}`}>
        {icon}
      </div>
      <div className={`text-3xl font-black mb-1 ${accent ? 'text-purple-400' : 'text-white'}`}>
        {count}
      </div>
      <div className="text-sm text-white/50">{label}</div>
    </div>
  )
}
