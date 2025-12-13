// src/shared/components/FeelFlickLoader.jsx
import { useState, useEffect } from 'react'
import { Film, Sparkles, Heart } from 'lucide-react'

export default function FeelFlickLoader({ stage = 1 }) {
  const [dots, setDots] = useState('')
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const stages = [
    { icon: Film, text: "Checking your profile", color: "purple" },
    { icon: Sparkles, text: "Finding your perfect picks", color: "pink" },
    { icon: Heart, text: "Almost ready", color: "rose" }
  ]

  const current = stages[Math.min(stage - 1, 2)]
  const Icon = current.icon

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-[#0a121a] via-[#0d1722] to-[#0c1017]">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '10s', animationDelay: '1s' }} />
      </div>

      {/* Center Content */}
      <div className="relative h-full flex flex-col items-center justify-center gap-8 px-4">
        {/* Logo/Brand */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/50">
            <Film className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            FeelFlick
          </h1>
        </div>

        {/* Animated Icon */}
        <div className="relative">
          <div className={`absolute inset-0 bg-${current.color}-500/20 rounded-full blur-2xl animate-pulse`} />
          <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br from-${current.color}-500/20 to-${current.color}-600/20 
                           border-2 border-${current.color}-400/30 flex items-center justify-center animate-float`}>
            <Icon className={`w-10 h-10 text-${current.color}-400 animate-pulse`} />
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                s <= stage 
                  ? 'w-16 bg-gradient-to-r from-purple-500 to-pink-500' 
                  : 'w-8 bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Status Text */}
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-white/90">
            {current.text}{dots}
          </p>
          <p className="text-sm text-white/50">
            This will only take a moment
          </p>
        </div>
      </div>

      {/* Floating Animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}