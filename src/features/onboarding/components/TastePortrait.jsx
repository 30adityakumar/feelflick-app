import { GENRES, MOODS } from '../data'

function joinLabels(labels) {
  if (labels.length === 0) return ''
  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')}, and ${labels.at(-1)}`
}

function buildPortrait({ moods, genres, films, ratings }) {
  const moodLabels = (moods || [])
    .map(key => MOODS.find(mood => mood.key === key)?.label)
    .filter(Boolean)
  const genreLabels = (genres || [])
    .map(id => GENRES.find(genre => genre.id === id)?.name)
    .filter(Boolean)
  const filmTitles = (films || []).map(film => film.title).filter(Boolean)
  const ratedCount = Object.keys(ratings || {}).length

  if (filmTitles.length > 0) {
    return {
      title: <>Your taste has <em>anchors.</em></>,
      copy: 'Specific films give FeelFlick stronger evidence than categories alone. Your quick verdicts tell us which anchors deserve more weight.',
      note: `Your anchors currently include ${joinLabels(filmTitles.slice(0, 3))}${filmTitles.length > 3 ? ', and more' : ''}.`,
    }
  }

  if (genreLabels.length > 0) {
    return {
      title: <>A direction is <em>forming.</em></>,
      copy: 'Genres tell us where to begin, not where your taste ends. The films you choose next will make this more specific.',
      note: `We will reach first toward ${joinLabels(genreLabels.slice(0, 3))}.`,
    }
  }

  if (moodLabels.length > 0) {
    return {
      title: <>Your emotional range is <em>appearing.</em></>,
      copy: 'Mood is one layer of taste, not a personality type. Next we add familiar territories and real films.',
      note: `You return to ${joinLabels(moodLabels.map(label => label.toLowerCase()))} films.`,
    }
  }

  if (ratedCount > 0) {
    return {
      title: <>Your first profile is <em>taking shape.</em></>,
      copy: 'Those verdicts will help FeelFlick weight your anchors without pretending a few answers define you.',
      note: `${ratedCount} anchor${ratedCount === 1 ? '' : 's'} rated so far.`,
    }
  }

  return {
    title: <>Your taste is still <em>quiet.</em></>,
    copy: 'A few honest choices are enough to give FeelFlick a direction. You can correct everything later.',
    note: 'Start with instinct. We listen for useful signals, not a fixed type.',
  }
}

export default function TastePortrait({ moods, genres, films, ratings, compact = false }) {
  const moodSignals = (moods || [])
    .map(key => MOODS.find(mood => mood.key === key))
    .filter(Boolean)
    .map(mood => ({ label: mood.label, kind: 'Mood', rgb: mood.rgb }))
  const genreSignals = (genres || [])
    .map(id => GENRES.find(genre => genre.id === id))
    .filter(Boolean)
    .slice(0, 4)
    .map(genre => ({ label: genre.name, kind: 'Genre', rgb: '201, 139, 146' }))
  const filmSignals = (films || [])
    .slice(0, 3)
    .map(film => ({ label: film.title, kind: 'Anchor', rgb: '214, 176, 108' }))
  const signals = [...moodSignals, ...genreSignals, ...filmSignals]
  const ratedCount = Object.keys(ratings || {}).length
  const signalCount = (moods?.length || 0) + (genres?.length || 0) + (films?.length || 0) + ratedCount
  const portrait = buildPortrait({ moods, genres, films, ratings })

  if (compact) {
    return (
      <div className="ob-mobile-insight" aria-live="polite">
        <span>So far</span>
        <p>{portrait.note}</p>
      </div>
    )
  }

  return (
    <aside className="ob-taste-portrait" aria-label="Your first taste signals">
      <div className="ob-portrait-meta">
        <span>First signals, not conclusions</span>
        <strong>{signalCount} signal{signalCount === 1 ? '' : 's'}</strong>
      </div>

      <h2>{portrait.title}</h2>
      <p className="ob-portrait-copy">{portrait.copy}</p>

      <div className="ob-portrait-signals" aria-live="polite">
        {signals.length > 0 ? signals.map(signal => (
          <div key={`${signal.kind}-${signal.label}`} className="ob-portrait-signal">
            <i style={{ '--signal-rgb': signal.rgb }} aria-hidden="true" />
            <strong>{signal.label}</strong>
            <span>{signal.kind}</span>
          </div>
        )) : (
          <div className="ob-portrait-signal">
            <i style={{ '--signal-rgb': '126, 126, 126' }} aria-hidden="true" />
            <strong>Waiting for your first choice</strong>
            <span>Open</span>
          </div>
        )}
      </div>

      <p className="ob-portrait-note">{portrait.note}</p>
    </aside>
  )
}
