import { describe, expect, it, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'

import { useWatchProviders } from './useWatchProviders'

const mockGetMovieWatchProviders = vi.fn()

vi.mock('@/shared/api/tmdb', () => ({
  getMovieWatchProviders: (...args) => mockGetMovieWatchProviders(...args),
}))

function Probe({ movieId, enabled }) {
  const { data, isLoading } = useWatchProviders(movieId, enabled)

  return (
    <div>
      {enabled ? (isLoading ? 'loading' : `${data?.providers?.length ?? 0}`) : 'idle'}
    </div>
  )
}

function renderWithClient(ui) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={client}>
      {ui}
    </QueryClientProvider>
  )
}

describe('useWatchProviders', () => {
  beforeEach(() => {
    mockGetMovieWatchProviders.mockReset()
    mockGetMovieWatchProviders.mockResolvedValue({
      regionCode: 'CA',
      link: '',
      providers: [{ id: 1, name: 'Netflix', logoPath: '/netflix.png', type: 'flatrate' }],
    })
  })

  it('does not fetch until enabled', async () => {
    const { rerender } = renderWithClient(<Probe movieId={999} enabled={false} />)

    expect(screen.getByText('idle')).toBeInTheDocument()
    expect(mockGetMovieWatchProviders).not.toHaveBeenCalled()

    rerender(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <Probe movieId={999} enabled={true} />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(mockGetMovieWatchProviders).toHaveBeenCalledWith(999)
    })
  })
})
