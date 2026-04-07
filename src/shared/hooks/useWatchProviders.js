import { useQuery } from '@tanstack/react-query'
import { getMovieWatchProviders } from '@/shared/api/tmdb'

const DAY_MS = 24 * 60 * 60 * 1000

export function useWatchProviders(movieId, enabled = false) {
  return useQuery({
    queryKey: ['watch-providers', movieId],
    enabled: Boolean(movieId && enabled),
    staleTime: DAY_MS,
    gcTime: DAY_MS,
    queryFn: () => getMovieWatchProviders(movieId),
  })
}
