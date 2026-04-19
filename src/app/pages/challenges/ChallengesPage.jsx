import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Compass, Sparkles } from 'lucide-react'

import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { getChallengesForUser, getChallengeFilms } from '@/shared/services/challenges'
import MovieCardRating from '@/shared/components/MovieCardRating'

// === CHALLENGE BLOCK ===

function ChallengeBlock({ challenge, userId, onOpen }) {
  const [films, setFilms] = useState(null)

  useEffect(() => {
    let cancelled = false
    getChallengeFilms(challenge, userId).then(data => {
      if (cancelled) return
      setFilms(data)
    })
    return () => { cancelled = true }
  }, [challenge, userId])

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1.5">
              {challenge.severity === 'unexplored' ? 'Unexplored' : 'Underexplored'}
            </p>
            <h2 className="text-2xl font-black text-white mb-2">{challenge.title}</h2>
            <p className="text-sm text-white/65 mb-2">{challenge.description}</p>
            <p className="text-xs text-white/40 italic">{challenge.reason}</p>
          </div>
        </div>
      </div>
      <div className="p-5">
        {films == null ? (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-lg bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : films.length === 0 ? (
          <p className="text-sm text-white/40 py-6 text-center">No recommendations available.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {films.map(m => (
              <button
                key={m.id}
                onClick={() => onOpen(m.tmdb_id)}
                className="group text-left rounded-lg overflow-hidden bg-white/[0.02] hover:ring-2 hover:ring-purple-500/40 transition-all"
              >
                <div className="relative aspect-[2/3]">
                  <img
                    src={`https://image.tmdb.org/t/p/w342${m.poster_path}`}
                    alt={m.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1.5 right-1.5">
                    <MovieCardRating movie={m} size="sm" />
                  </div>
                </div>
                <div className="px-1.5 py-1.5">
                  <p className="text-[11px] font-bold text-white line-clamp-1">{m.title}</p>
                  <p className="text-[10px] text-white/40">{m.release_year}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// === PAGE ===

export default function ChallengesPage() {
  const { user } = useAuthSession()
  const navigate = useNavigate()
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)

  usePageMeta({ title: 'Taste Challenges · FeelFlick' })

  useEffect(() => {
    if (!user?.id) { setLoading(false); return }
    let cancelled = false
    getChallengesForUser(user.id).then(list => {
      if (cancelled) return
      setChallenges(list)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [user?.id])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/40">
        Sign in to see taste challenges
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <Compass className="h-5 w-5 text-purple-400" />
            <p className="text-[11px] font-semibold uppercase tracking-widest text-purple-300/80">Taste Challenges</p>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">Expand your cinema</h1>
          <p className="text-white/60 max-w-2xl">
            Gaps we&apos;ve noticed in what you&apos;ve watched. Each challenge suggests accessible entry points — films critics and audiences both love.
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 animate-pulse h-64" />
            ))}
          </div>
        ) : challenges.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-10 text-center">
            <Sparkles className="h-8 w-8 text-purple-400 mx-auto mb-3" />
            <p className="text-lg font-semibold text-white mb-2">You&apos;re well-rounded</p>
            <p className="text-sm text-white/60">
              Your watch history spans moods and film types. Keep exploring.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {challenges.map(c => (
              <ChallengeBlock
                key={c.id}
                challenge={c}
                userId={user.id}
                onOpen={tmdbId => navigate(`/movie/${tmdbId}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
