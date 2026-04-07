import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMovieExplanation } from '@/shared/hooks/useMovieExplanation'
import { useMoodSession } from '@/shared/hooks/useMoodSession'
import { useRecommendationTracking } from '@/shared/hooks/useRecommendationTracking'
import { useRecommendations } from '@/shared/hooks/useRecommendations'

const MOODS = [
  { id: 1, name: 'Cozy', emoji: '☕', description: 'Warm and comforting', color: 'from-orange-500 to-amber-600' },
  { id: 2, name: 'Adventurous', emoji: '🗺️', description: 'Bold and exciting', color: 'from-blue-500 to-cyan-600' },
  { id: 3, name: 'Heartbroken', emoji: '💔', description: 'Emotionally raw', color: 'from-pink-500 to-rose-600' },
  { id: 4, name: 'Curious', emoji: '🔍', description: 'Mind-expanding', color: 'from-purple-500 to-violet-600' },
  { id: 5, name: 'Nostalgic', emoji: '🎞️', description: 'Classic favorites', color: 'from-yellow-500 to-orange-600' },
  { id: 6, name: 'Energized', emoji: '⚡', description: 'High-energy fun', color: 'from-green-500 to-emerald-600' },
  { id: 7, name: 'Anxious', emoji: '😰', description: 'Need something calming', color: 'from-indigo-500 to-blue-600' },
  { id: 8, name: 'Romantic', emoji: '💕', description: 'Love and connection', color: 'from-red-500 to-pink-600' },
  { id: 9, name: 'Inspired', emoji: '✨', description: 'Uplifting stories', color: 'from-amber-500 to-yellow-600' },
  { id: 10, name: 'Silly', emoji: '🤪', description: 'Light and funny', color: 'from-lime-500 to-green-600' },
  { id: 11, name: 'Dark', emoji: '🌑', description: 'Gritty and intense', color: 'from-gray-700 to-gray-900' },
  { id: 12, name: 'Overwhelmed', emoji: '😵', description: 'Complete escape', color: 'from-teal-500 to-cyan-600' },
]

const VIEWING_CONTEXTS = [
  { id: 1, name: 'Alone', icon: '🧘' },
  { id: 2, name: 'Partner', icon: '💑' },
  { id: 3, name: 'Friends', icon: '👥' },
  { id: 4, name: 'Family', icon: '👨‍👩‍👧‍👦' },
  { id: 5, name: 'Kids', icon: '👶' },
]

const EXPERIENCE_TYPES = [
  { id: 1, name: 'Escape' },
  { id: 2, name: 'Laugh' },
  { id: 3, name: 'Cry' },
  { id: 4, name: 'Think' },
  { id: 5, name: 'Zone Out' },
]

function RecommendationExplanation({ movie, moodName }) {
  const { explanation } = useMovieExplanation(movie, moodName, movie.match_percentage)

  return <div className="mt-1 line-clamp-1 text-xs text-purple-300/80">{explanation}</div>
}

function RecommendationCard({
  movie,
  index,
  moodName,
  onOpenMovie,
}) {
  return (
    <button
      type="button"
      onClick={onOpenMovie}
      className="w-full cursor-pointer overflow-hidden rounded-xl bg-white/5 text-left transition-transform transition-colors hover:scale-[1.02] hover:bg-white/10"
      aria-label={`Open ${movie.title}`}
    >
      {movie.poster_path ? (
        <img
          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
          alt={movie.title}
          width="300"
          height="450"
          loading="lazy"
          className="aspect-[2/3] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[2/3] w-full items-center justify-center bg-gray-800">
          <span className="text-4xl" aria-hidden="true">🎬</span>
        </div>
      )}

      <div className="p-3">
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="text-xs font-bold text-purple-400">#{index + 1}</div>
          <div className="rounded bg-green-500/20 px-2 py-0.5 text-xs font-bold text-green-400">
            {movie.match_percentage}%
          </div>
        </div>
        <h3 className="line-clamp-2 text-sm font-medium">{movie.title}</h3>
        <RecommendationExplanation movie={movie} moodName={moodName} />
      </div>
    </button>
  )
}

export default function DiscoverPage() {
  const navigate = useNavigate()
  const [selectedMood, setSelectedMood] = useState(null)
  const [viewingContext, setViewingContext] = useState(1)
  const [experienceType, setExperienceType] = useState(1)
  const [isPending, startTransition] = useTransition()

  const trackedResultsKeyRef = useRef('')

  const { sessionId, createMoodSession, endMoodSession } = useMoodSession()
  const { trackRecommendationShown, trackRecommendationClicked } = useRecommendationTracking()

  const { recommendations, loading, error } = useRecommendations(
    selectedMood,
    viewingContext,
    experienceType,
    5,
  )

  const selectedMoodOption = useMemo(
    () => MOODS.find((mood) => mood.id === selectedMood) ?? null,
    [selectedMood],
  )

  useEffect(() => {
    if (!selectedMood) return

    createMoodSession(selectedMood, viewingContext, experienceType)
  }, [createMoodSession, experienceType, selectedMood, viewingContext])

  useEffect(() => {
    return () => {
      endMoodSession()
    }
  }, [endMoodSession])

  useEffect(() => {
    if (!sessionId || recommendations.length === 0) return

    const trackingKey = `${sessionId}:${recommendations
      .map((movie) => `${movie.movie_id}:${movie.final_score}`)
      .join('|')}`

    if (trackedResultsKeyRef.current === trackingKey) return
    trackedResultsKeyRef.current = trackingKey

    recommendations.forEach((movie, index) => {
      trackRecommendationShown(sessionId, movie.movie_id, index + 1, movie.final_score)
    })
  }, [recommendations, sessionId, trackRecommendationShown])

  const isLoading = loading || isPending

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-black text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text md:text-5xl text-balance">
            How do you feel?
          </h1>
          <p className="text-lg text-white/60">
            Pick a mood and FeelFlick will narrow the night in seconds.
          </p>
        </div>

        <div className="mb-12">
          <h2 className="mb-6 text-xl font-bold">Select Your Mood</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {MOODS.map((mood) => (
              <button
                key={mood.id}
                type="button"
                onClick={() => startTransition(() => setSelectedMood(mood.id))}
                aria-pressed={selectedMood === mood.id}
                className={`relative rounded-2xl p-6 transition-transform transition-colors ${
                  selectedMood === mood.id
                    ? `scale-[1.02] bg-gradient-to-br ${mood.color} shadow-2xl`
                    : 'bg-white/5 hover:scale-[1.01] hover:bg-white/10'
                }`}
              >
                <div className="mb-2 text-4xl" aria-hidden="true">{mood.emoji}</div>
                <div className="text-lg font-bold">{mood.name}</div>
                <div className="mt-1 text-sm text-white/60">{mood.description}</div>
              </button>
            ))}
          </div>
        </div>

        {selectedMood && (
          <div className="mb-12 space-y-8">
            <div>
              <h2 className="mb-4 text-xl font-bold">Who&apos;s Watching?</h2>
              <div className="flex flex-wrap gap-3">
                {VIEWING_CONTEXTS.map((context) => (
                  <button
                    key={context.id}
                    type="button"
                    onClick={() => startTransition(() => setViewingContext(context.id))}
                    aria-pressed={viewingContext === context.id}
                    className={`rounded-full px-6 py-3 font-medium transition-colors ${
                      viewingContext === context.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {context.icon} {context.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-bold">What Kind of Experience?</h2>
              <div className="flex flex-wrap gap-3">
                {EXPERIENCE_TYPES.map((experience) => (
                  <button
                    key={experience.id}
                    type="button"
                    onClick={() => startTransition(() => setExperienceType(experience.id))}
                    aria-pressed={experienceType === experience.id}
                    className={`rounded-full px-6 py-3 font-medium transition-colors ${
                      experienceType === experience.id
                        ? 'bg-pink-600 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {experience.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedMood && (
          <div>
            {isLoading && (
              <div className="py-12 text-center" aria-live="polite">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
                <p className="mt-4 text-white/60">
                  Finding the best picks for {selectedMoodOption?.name?.toLowerCase()} nights…
                </p>
              </div>
            )}

            {error && !isLoading && (
              <div className="rounded-lg border border-red-500 bg-red-500/10 p-4">
                <p className="font-medium text-red-300">We couldn&apos;t load recommendations right now.</p>
                <p className="mt-1 text-sm text-red-200/80">
                  Try switching mood filters or refreshing the page. Details: {error}
                </p>
              </div>
            )}

            {!isLoading && !error && recommendations.length > 0 && (
              <div>
                <h2 className="mb-6 text-2xl font-bold">
                  Your Matches ({recommendations.length})
                </h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                  {recommendations.map((movie, index) => (
                    <RecommendationCard
                      key={movie.movie_id}
                      movie={movie}
                      index={index}
                      moodName={selectedMoodOption?.name}
                      onOpenMovie={() => {
                        if (sessionId) {
                          trackRecommendationClicked(sessionId, movie.movie_id)
                        }

                        navigate(`/movie/${movie.tmdb_id}`, {
                          state: { sessionId, movieId: movie.movie_id },
                        })
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
