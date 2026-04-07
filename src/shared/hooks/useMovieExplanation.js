import { useMemo } from 'react'

export function useMovieExplanation(movie, moodName, matchPercentage) {
  const explanation = useMemo(() => {
    const parts = []

    if (matchPercentage >= 85) parts.push('Perfect match')
    else if (matchPercentage >= 70) parts.push('Great fit')
    else if (matchPercentage >= 60) parts.push('Good match')

    if (movie?.vote_average >= 8.5) parts.push('exceptional ratings')
    else if (movie?.vote_average >= 8.0) parts.push('highly rated')
    else if (movie?.vote_average >= 7.5) parts.push('well-reviewed')

    if (moodName) {
      parts.push(`for ${moodName.toLowerCase()} mood`)
    }

    return parts.join(' • ') || 'Great match for your mood'
  }, [matchPercentage, moodName, movie?.vote_average])

  return { explanation, loading: false }
}
