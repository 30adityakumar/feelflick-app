// src/app/pages/discover/DiscoverPage.jsx
import { useState, useEffect } from 'react';
import { useRecommendations } from '@/shared/hooks/useRecommendations';
import { useNavigate } from 'react-router-dom';
import { useMoodSession } from '@/shared/hooks/useMoodSession';
import { useRecommendationTracking } from '@/shared/hooks/useRecommendationTracking';
import { useMovieExplanation } from '@/shared/hooks/useMovieExplanation';

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState(null);
  const [viewingContext, setViewingContext] = useState(1);
  const [experienceType, setExperienceType] = useState(1);

  const { sessionId, createMoodSession, endMoodSession } = useMoodSession();
  const { trackRecommendationShown, trackRecommendationClicked } = useRecommendationTracking();

  const { recommendations, loading, error } = useRecommendations(
    selectedMood,
    viewingContext,
    experienceType,
    5
  );

  // Create mood session when mood selected
useEffect(() => {
  if (selectedMood) {
    createMoodSession(selectedMood, viewingContext, experienceType);
  }
  return () => {
    if (sessionId) {
      endMoodSession();
    }
  };
}, [selectedMood, viewingContext, experienceType, createMoodSession, endMoodSession, sessionId]);

// Track recommendations shown
useEffect(() => {
  if (sessionId && recommendations.length > 0) {
    recommendations.forEach((movie, idx) => {
      trackRecommendationShown(sessionId, movie.movie_id, idx + 1, movie.final_score);
    });
  }
}, [sessionId, recommendations, trackRecommendationShown]);

  const moods = [
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
    { id: 12, name: 'Overwhelmed', emoji: '😵', description: 'Complete escape', color: 'from-teal-500 to-cyan-600' }
  ];

  const viewingContexts = [
    { id: 1, name: 'Alone', icon: '🧘' },
    { id: 2, name: 'Partner', icon: '💑' },
    { id: 3, name: 'Friends', icon: '👥' },
    { id: 4, name: 'Family', icon: '👨‍👩‍👧‍👦' },
    { id: 5, name: 'Kids', icon: '👶' }
  ];

  const experienceTypes = [
    { id: 1, name: 'Escape' },
    { id: 2, name: 'Laugh' },
    { id: 3, name: 'Cry' },
    { id: 4, name: 'Think' },
    { id: 5, name: 'Zone Out' }
  ];

  function MovieExplanation({ movie, moodName }) {
    const { explanation } = useMovieExplanation(movie, moodName, movie.match_percentage);
    
    return (
      <div className="text-xs text-purple-300/80 mt-1 line-clamp-1">
        {explanation}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
            How do you feel?
          </h1>
          <p className="text-white/60 text-lg">
            Tell us your mood and we&apos;ll find the perfect movie
          </p>
        </div>

        {/* Mood Selection */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-6">Select your mood:</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {moods.map(mood => (
              <button
                key={mood.id}
                onClick={() => setSelectedMood(mood.id)}
                className={`relative p-6 rounded-2xl transition-all transform hover:scale-105 ${
                  selectedMood === mood.id
                    ? `bg-gradient-to-br ${mood.color} shadow-2xl scale-105`
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="text-4xl mb-2">{mood.emoji}</div>
                <div className="font-bold text-lg">{mood.name}</div>
                <div className="text-sm text-white/60 mt-1">{mood.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Context & Experience (only show if mood selected) */}
        {selectedMood && (
          <div className="mb-12 space-y-8">
            <div>
              <h2 className="text-xl font-bold mb-4">Who&apos;s watching?</h2>
              <div className="flex gap-3 flex-wrap">
                {viewingContexts.map(ctx => (
                  <button
                    key={ctx.id}
                    onClick={() => setViewingContext(ctx.id)}
                    className={`px-6 py-3 rounded-full font-medium transition-all ${
                      viewingContext === ctx.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {ctx.icon} {ctx.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4">What kind of experience?</h2>
              <div className="flex gap-3 flex-wrap">
                {experienceTypes.map(exp => (
                  <button
                    key={exp.id}
                    onClick={() => setExperienceType(exp.id)}
                    className={`px-6 py-3 rounded-full font-medium transition-all ${
                      experienceType === exp.id
                        ? 'bg-pink-600 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {exp.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {selectedMood && (
          <div>
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4 text-white/60">Finding perfect matches...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
                <p className="text-red-400">Error: {error}</p>
              </div>
            )}

            {!loading && !error && recommendations.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">
                  Your Perfect Matches ({recommendations.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {recommendations.map((movie, idx) => (
                    <button
                      key={movie.movie_id}
                      type="button"
                      onClick={() => {
                        if (sessionId) {
                          trackRecommendationClicked(sessionId, movie.movie_id);
                        }
                        navigate(`/movie/${movie.tmdb_id}`, {
                          state: { sessionId, movieId: movie.movie_id }
                        });
                      }}
                      className="bg-white/5 rounded-lg overflow-hidden hover:bg-white/10 hover:scale-105 transition-all cursor-pointer text-left w-full"
                    >
                      {movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                          alt={movie.title}
                          className="w-full aspect-[2/3] object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center">
                          <span className="text-4xl">🎬</span>
                        </div>
                      )}
                      <div className="p-3">
                        <div className="flex justify-between items-start mb-1">
                          <div className="text-xs text-purple-400 font-bold">
                            #{idx + 1}
                          </div>
                          <div className="text-xs font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                            {movie.match_percentage}%
                          </div>
                        </div>
                        <h3 className="font-medium text-sm line-clamp-2">{movie.title}</h3>
                          <MovieExplanation movie={movie} moodName={moods.find(m => m.id === selectedMood)?.name} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
