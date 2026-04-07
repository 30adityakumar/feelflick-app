import { memo } from 'react'
import { tmdbImg } from '@/shared/api/tmdb'
import { useWatchProviders } from '@/shared/hooks/useWatchProviders'

function ProviderSkeleton({ variant = 'icon' }) {
  if (variant === 'pill') {
    return (
      <div
        className="inline-flex h-8 w-8 items-center justify-center rounded-full"
        style={{
          background: 'linear-gradient(180deg, rgba(38, 24, 56, 0.82) 0%, rgba(14, 10, 21, 0.96) 100%)',
          border: '1px solid rgba(248, 250, 252, 0.26)',
        }}
        aria-hidden="true"
      >
        <div className="skeleton h-5 w-5 rounded-[var(--radius-sm)]" />
      </div>
    )
  }

  return (
    <div className="flex items-center" aria-hidden="true">
      <div className="skeleton h-7 w-7 rounded-[var(--radius-sm)]" />
    </div>
  )
}

export const WatchProviders = memo(function WatchProviders({
  movieId,
  enabled = false,
  variant = 'icon',
}) {
  const { data, isLoading, isFetching, isError } = useWatchProviders(movieId, enabled)

  if (!enabled || !movieId) return null
  if (isLoading || isFetching) return <ProviderSkeleton variant={variant} />

  const provider = data?.providers?.[0] || null

  if (isError || !provider) return null

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <img
          src={tmdbImg(provider.logoPath, 'w45')}
          alt={provider.name}
          title={provider.name}
          aria-label={provider.name}
          className="h-7 w-7 rounded-[var(--radius-sm)] object-cover ring-1 ring-white/10"
          loading="lazy"
        />
        <div className="min-w-0">
          <div className="text-[0.62rem] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
            Where to watch
          </div>
          <div className="truncate text-[0.72rem] text-[var(--color-text-muted)]">
            {provider.name}
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'pill') {
    return (
      <div
        className="inline-flex h-8 w-8 items-center justify-center rounded-full"
        style={{
          background: 'linear-gradient(180deg, rgba(38, 24, 56, 0.82) 0%, rgba(14, 10, 21, 0.96) 100%)',
          border: '1px solid rgba(248, 250, 252, 0.26)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          backdropFilter: 'var(--blur-md)',
        }}
        title={provider.name}
        aria-label={`Watch on ${provider.name}`}
      >
        <img
          src={tmdbImg(provider.logoPath, 'w45')}
          alt={provider.name}
          className="h-5 w-5 rounded-[var(--radius-sm)] object-cover"
          loading="lazy"
        />
      </div>
    )
  }

  return (
    <img
      src={tmdbImg(provider.logoPath, 'w45')}
      alt={provider.name}
      title={provider.name}
      aria-label={provider.name}
      className="h-7 w-7 rounded-[var(--radius-sm)] object-cover ring-1 ring-white/10"
      loading="lazy"
    />
  )
})
