import { describe, expect, it, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAIMoodContext } from '../useAIMoodContext'

vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')

afterEach(() => {
  vi.restoreAllMocks()
})

/** Creates a ReadableStream that emits the given string in chunks */
function makeStream(text, chunkSize = text.length) {
  const encoder = new TextEncoder()
  const chunks = []
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(encoder.encode(text.slice(i, i + chunkSize)))
  }
  let idx = 0
  return new ReadableStream({
    pull(controller) {
      if (idx < chunks.length) {
        controller.enqueue(chunks[idx++])
      } else {
        controller.close()
      }
    },
  })
}

const MOVIES = [{ tmdbId: 550, title: 'Fight Club', vote_average: 8.8 }]

const BASE_PARAMS = {
  mood: 'Dark',
  context: 'Solo',
  experience: 'Escape',
  intensity: 4,
  pacing: 4,
  timeOfDay: 'night',
  movies: MOVIES,
  enabled: true,
}

describe('useAIMoodContext', () => {
  it('parses narration and explanations from a complete stream', async () => {
    const fullText =
      'Night calls.\n' +
      '---EXPLANATIONS---\n' +
      '[{"movieId":550,"explanation":"raw dark energy","score":92}]'

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(makeStream(fullText), { status: 200 })
    )

    const { result } = renderHook(() => useAIMoodContext(BASE_PARAMS))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.narration).toBe('Night calls.')
    expect(result.current.narrationDone).toBe(true)
    expect(result.current.explanations.get(550)).toMatchObject({ score: 92 })
    expect(result.current.rerankedOrder).toBeNull()
  })

  it('parses rerankedOrder when RERANKED section is present', async () => {
    const fullText =
      'Night calls.\n' +
      '---EXPLANATIONS---\n' +
      '[{"movieId":550,"explanation":"raw dark energy","score":92}]\n' +
      '---RERANKED---\n' +
      '[550]'

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(makeStream(fullText), { status: 200 })
    )

    const { result } = renderHook(() => useAIMoodContext(BASE_PARAMS))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.rerankedOrder).toEqual([550])
    expect(result.current.explanations.get(550)?.score).toBe(92)
  })

  it('handles split RERANKED delimiter across chunks', async () => {
    const part1 =
      'Night calls.\n---EXPLANATIONS---\n[{"movieId":550,"explanation":"dark","score":90}]\n---RERAN'
    const part2 = 'KED---\n[550,680]'

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(makeStream(part1 + part2, part1.length), { status: 200 })
    )

    const { result } = renderHook(() => useAIMoodContext(BASE_PARAMS))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.rerankedOrder).toEqual([550, 680])
  })

  it('backward compat: no RERANKED section → rerankedOrder is null', async () => {
    const fullText =
      'Night calls.\n' +
      '---EXPLANATIONS---\n' +
      '[{"movieId":550,"explanation":"dark energy","score":85}]'

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(makeStream(fullText), { status: 200 })
    )

    const { result } = renderHook(() => useAIMoodContext(BASE_PARAMS))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.rerankedOrder).toBeNull()
    expect(result.current.explanations.get(550)?.score).toBe(85)
  })

  it('does not fetch when enabled=false', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    renderHook(() => useAIMoodContext({ ...BASE_PARAMS, enabled: false }))
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('sets error on non-200 response (does not throw)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Service Unavailable', { status: 503 })
    )

    const { result } = renderHook(() => useAIMoodContext(BASE_PARAMS))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeTruthy()
    expect(result.current.narration).toBe('')
  })
})
