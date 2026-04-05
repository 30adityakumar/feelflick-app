// src/app/pages/TestRecommendations.jsx
import { useState } from 'react';
import { useRecommendations } from '@/shared/hooks/useRecommendations';

export default function TestRecommendations() {
  const [moodId, setMoodId] = useState(1);
  
  const { recommendations, loading, error } = useRecommendations(moodId);

  const moods = [
    { id: 1, name: 'Cozy ☕' },
    { id: 2, name: 'Adventurous 🗺️' },
    { id: 3, name: 'Heartbroken 💔' },
    { id: 4, name: 'Curious 🔍' },
    { id: 5, name: 'Nostalgic 🎞️' },
    { id: 6, name: 'Energized ⚡' },
    { id: 7, name: 'Anxious 😰' },
    { id: 8, name: 'Romantic 💕' },
    { id: 9, name: 'Inspired ✨' },
    { id: 10, name: 'Silly 🤪' },
    { id: 11, name: 'Dark 🌑' },
    { id: 12, name: 'Overwhelmed 😵' }
    ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🎬 Recommendation Engine Test</h1>

        {/* Mood Selector */}
        <div className="mb-8">
          <p className="block text-sm font-medium mb-2">Select Mood:</p>
          <div className="flex gap-4 flex-wrap">
            {moods.map(mood => (
              <button
                key={mood.id}
                onClick={() => setMoodId(mood.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  moodId === mood.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {mood.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-white/60">Loading recommendations...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {!loading && !error && recommendations.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">
              Top {recommendations.length} Recommendations
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {recommendations.map((movie, idx) => (
                <button
                  key={movie.movie_id}
                  type="button"
                  onClick={() => { window.location.href = `/movie/${movie.tmdb_id}` }}
                  className="bg-white/5 rounded-lg overflow-hidden hover:bg-white/10 transition-all cursor-pointer text-left w-full"
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
                    <div className="text-xs text-purple-400 font-bold mb-1">
                      #{idx + 1} • Score: {Math.round(movie.final_score)}
                    </div>
                    <h3 className="font-medium text-sm line-clamp-2">{movie.title}</h3>
                    <div className="text-xs text-white/50 mt-1">
                      ⭐ {movie.vote_average?.toFixed(1)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && recommendations.length === 0 && (
          <div className="text-center py-12 text-white/60">
            No recommendations found.
          </div>
        )}
      </div>
    </div>
  );
}
