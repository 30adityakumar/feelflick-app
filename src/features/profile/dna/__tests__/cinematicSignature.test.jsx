import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CinematicSignature, { hasSignatureEvidence } from '../CinematicSignature'
import { deriveTopGenres } from '../../derive'

const mood = (name, weight, count = 4) => ({ name, weight, count, hex: '#000' })
const tone = (tag, w) => ({ tag, w })
const g = (genre) => ({ movies: { primary_genre: genre } })

const MOODS_3 = [mood('Bittersweet', 0.8), mood('Tense', 0.6), mood('Playful', 0.4)]
const MOODS_2 = [mood('Bittersweet', 0.8), mood('Tense', 0.6)]
const GENRES_ELIGIBLE = deriveTopGenres({ history: [...Array(5).fill(g('Drama')), ...Array(3).fill(g('Comedy'))] })
const GENRES_SINGLE = deriveTopGenres({ history: Array(6).fill(g('Drama')) })
const GENRES_THIN = deriveTopGenres({ history: [g('Drama'), g('Comedy')] })
const GENRES_SIX = deriveTopGenres({
  history: [...Array(6).fill(g('A')), ...Array(5).fill(g('B')), ...Array(4).fill(g('C')), ...Array(3).fill(g('D')), ...Array(2).fill(g('E')), ...Array(1).fill(g('F'))],
})
const TONES_4 = [tone('Restrained', 1), tone('Patient', 0.7), tone('Brooding', 0.4), tone('Dry', 0.2)]
const TONES_3 = [tone('Restrained', 1), tone('Patient', 0.7), tone('Brooding', 0.4)]
const TONES_12 = Array.from({ length: 12 }, (_, i) => tone(`Tone${i}`, 1 - i * 0.08))

describe('hasSignatureEvidence', () => {
  it('is false when all three facets are empty', () => {
    expect(hasSignatureEvidence({ moods: [], genres: null, motifs: [] })).toBe(false)
  })
  it('is true when only one facet has data', () => {
    expect(hasSignatureEvidence({ moods: MOODS_3, genres: null, motifs: [] })).toBe(true)
    expect(hasSignatureEvidence({ moods: [], genres: GENRES_ELIGIBLE, motifs: [] })).toBe(true)
    expect(hasSignatureEvidence({ moods: [], genres: null, motifs: TONES_4 })).toBe(true)
  })
})

describe('CinematicSignature — whole section', () => {
  it('renders nothing when all three facets are empty', () => {
    const { container } = render(<CinematicSignature moods={[]} genres={null} motifs={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders when only one facet has data; the other two show their own fallback', () => {
    render(<CinematicSignature moods={MOODS_3} genres={null} motifs={[]} />)
    expect(screen.getByRole('heading', { name: /what you lean into/i })).toBeInTheDocument()
    // mood: real radar (figure present)
    expect(screen.getByRole('figure')).toBeInTheDocument()
    // genre + tone: calibrating fallback text, not real charts
    expect(screen.getByText(/genre-tagged films needed/i)).toBeInTheDocument()
    expect(screen.getByText(/distinct tones/i)).toBeInTheDocument()
  })
})

describe('CinematicSignature — mood radar', () => {
  it('renders the real radar at >=3 moods: figure + accessible summary + rank words, no raw mood %', () => {
    const { container } = render(<CinematicSignature moods={MOODS_3} genres={null} motifs={[]} />)
    const figure = screen.getByRole('figure')
    expect(figure).toHaveAttribute('aria-describedby', 'ff-dna-radar-summary')
    expect(screen.getByText(/strongest mood signals are/i)).toBeInTheDocument()
    expect(screen.getByText(/strongest signal/i)).toBeInTheDocument()
    expect(screen.getAllByText(/strong signal/i).length).toBeGreaterThan(0)
    // no raw percentage anywhere for mood weight (e.g. "80%")
    expect(container.textContent).not.toMatch(/\b80%|\b60%|\b40%/)
  })

  it('shows the calibrating fallback below 3 moods, not the radar', () => {
    render(<CinematicSignature moods={MOODS_2} genres={null} motifs={[]} />)
    expect(screen.queryByRole('figure')).not.toBeInTheDocument()
    expect(screen.getByText(/moods needed/i)).toBeInTheDocument()
  })
})

describe('CinematicSignature — genre bars', () => {
  it('renders real ranked bars when eligible', () => {
    render(<CinematicSignature moods={[]} genres={GENRES_ELIGIBLE} motifs={[]} />)
    expect(screen.getByRole('img', { name: /top genres: drama 63%, comedy 38%/i })).toBeInTheDocument()
    expect(screen.getByText('Drama')).toBeInTheDocument()
    expect(screen.getByText('Comedy')).toBeInTheDocument()
  })

  it('shows the honest single-genre line when every genred film is the same genre', () => {
    render(<CinematicSignature moods={[]} genres={GENRES_SINGLE} motifs={[]} />)
    expect(screen.getByText(/every genre-tagged film.*watched has been drama/i)).toBeInTheDocument()
  })

  it('shows the calibrating fallback below the sample-size floor', () => {
    render(<CinematicSignature moods={[]} genres={GENRES_THIN} motifs={[]} />)
    expect(screen.getByText(/genre-tagged films needed/i)).toBeInTheDocument()
  })

  it('caps at GENRE_BARS_MAX (4) when more genres are eligible', () => {
    render(<CinematicSignature moods={[]} genres={GENRES_SIX} motifs={[]} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('D')).toBeInTheDocument()
    expect(screen.queryByText('E')).not.toBeInTheDocument()
    expect(screen.queryByText('F')).not.toBeInTheDocument()
  })
})

describe('CinematicSignature — tone ring', () => {
  it('renders the real ring at >=4 tags: aria-label sentence contains each tag + %, center shows the strongest tone', () => {
    render(<CinematicSignature moods={[]} genres={null} motifs={TONES_4} />)
    const ring = screen.getByRole('img', { name: /signature tones:/i })
    expect(ring).toHaveAccessibleName(/restrained 43%/i)
    expect(ring).toHaveAccessibleName(/dry 9%/i)
    expect(screen.getByText('Restrained', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByText('strongest tone')).toBeInTheDocument()
  })

  it('renders a legend row per shown tone, in rank order', () => {
    render(<CinematicSignature moods={[]} genres={null} motifs={TONES_4} />)
    const legend = document.querySelector('.ff-dna-tonering__legend')
    expect(legend.textContent.indexOf('Restrained')).toBeLessThan(legend.textContent.indexOf('Dry'))
  })

  it('bounds the ring to TONE_RING_MAX (6) when fed 12 motifs', () => {
    render(<CinematicSignature moods={[]} genres={null} motifs={TONES_12} />)
    expect(screen.getByText('Tone0', { selector: '.ff-dna-tonering__item span' })).toBeInTheDocument()
    expect(screen.getByText('Tone5', { selector: '.ff-dna-tonering__item span' })).toBeInTheDocument()
    expect(screen.queryByText('Tone6', { selector: '.ff-dna-tonering__item span' })).not.toBeInTheDocument()
    expect(screen.queryByText('Tone11', { selector: '.ff-dna-tonering__item span' })).not.toBeInTheDocument()
  })

  it('shows the calibrating fallback below 4 tags', () => {
    render(<CinematicSignature moods={[]} genres={null} motifs={TONES_3} />)
    expect(screen.queryByRole('img', { name: /signature tones:/i })).not.toBeInTheDocument()
    expect(screen.getByText(/distinct tones/i)).toBeInTheDocument()
  })
})

describe('CinematicSignature — voice switching', () => {
  it('uses first person with no subjectName, third person with one', () => {
    const { unmount } = render(<CinematicSignature moods={MOODS_2} genres={GENRES_THIN} motifs={TONES_3} />)
    expect(screen.getByText('Your cinematic signature')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /what you lean into/i })).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/\bthey\b|\btheir\b/)
    unmount()

    render(<CinematicSignature moods={MOODS_2} genres={GENRES_THIN} motifs={TONES_3} subjectName="Devarshi" />)
    expect(screen.getByText("Devarshi's cinematic signature")).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /what they lean into/i })).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/\byour\b|\byou\b|\byou've\b/i)
  })
})
