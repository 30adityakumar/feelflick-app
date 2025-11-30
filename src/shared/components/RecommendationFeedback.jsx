// src/shared/components/RecommendationFeedback.jsx
import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { useRecommendationTracking } from '@/shared/hooks/useRecommendationTracking';

export default function RecommendationFeedback({ movieId, sessionId }) {
  const [visible, setVisible] = useState(true);
  const [rated, setRated] = useState(false);
  const { trackRating } = useRecommendationTracking();

  // Only show if we have both movieId and sessionId (came from recommendation)
  useEffect(() => {
    if (!movieId || !sessionId) {
      setVisible(false);
    }
  }, [movieId, sessionId]);

  if (!visible || rated) return null;

  const handleRating = async (rating) => {
    await trackRating(sessionId, movieId, rating);
    setRated(true);
    setTimeout(() => setVisible(false), 2000);
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
      <div className="bg-gradient-to-r from-purple-900/95 to-pink-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4">
        <span className="text-white font-medium">Was this a good match?</span>
        
        <div className="flex gap-2">
          <button
            onClick={() => handleRating(1)}
            className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/40 text-green-400 transition-all hover:scale-110"
            aria-label="Good match"
          >
            <ThumbsUp className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => handleRating(-1)}
            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-all hover:scale-110"
            aria-label="Bad match"
          >
            <ThumbsDown className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={() => setVisible(false)}
          className="p-1 text-white/50 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}