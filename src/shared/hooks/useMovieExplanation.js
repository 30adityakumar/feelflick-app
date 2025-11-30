// src/shared/hooks/useMovieExplanation.js
import { useState, useEffect } from 'react';

export function useMovieExplanation(movie, moodName, matchPercentage) {
  const [explanation, setExplanation] = useState('Great match for your mood');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now, generate rule-based explanations
    // Later we'll add GPT via Supabase Edge Function
    const generateRuleBasedExplanation = () => {
    const parts = [];

    // Match quality
    if (matchPercentage >= 85) parts.push('Perfect match');
    else if (matchPercentage >= 70) parts.push('Great fit');
    else if (matchPercentage >= 60) parts.push('Good match');

    // Quality signals
    if (movie.vote_average >= 8.5) parts.push('exceptional ratings');
    else if (movie.vote_average >= 8.0) parts.push('highly rated');
    else if (movie.vote_average >= 7.5) parts.push('well-reviewed');

    // Mood specific
    parts.push(`for ${moodName.toLowerCase()} mood`);

    return parts.join(' • ');
    };

    setExplanation(generateRuleBasedExplanation());
    setLoading(false);
  }, [movie, moodName, matchPercentage]);

  return { explanation, loading };
}