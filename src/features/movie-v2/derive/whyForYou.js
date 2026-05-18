// src/features/movie-v2/derive/whyForYou.js
// Pure derivation: build 4 "Why this fits you" reason cards.
//
// Card priority (top 4 win):
//   1. Mood overlap        — needs user fingerprint × film mood_tags × overlap
//   2. Fit profile match   — needs user fingerprint × film fit_profile
//   3. Director affinity   — needs film director (count optional, personalized if >0)
//   4. Film mood profile   — film's top mood_tags (descriptive, no user dep)
//   5. Film fit profile    — film's fit_profile (descriptive, no user dep)
//   6. Runtime band        — film's runtime (always renders if > 0)
//
// Personalized cards (1, 2, director-with-count) bubble above their descriptive
// counterparts (4, 5, director-as-intro). Section never fabricates.

const FIT_PROFILE_LABELS = {
  crowd_pleaser: 'Crowd-pleaser',
  prestige_drama: 'Prestige drama',
  arthouse: 'Arthouse',
  genre_popcorn: 'Genre popcorn',
  festival_discovery: 'Festival discovery',
  cult_classic: 'Cult classic',
  niche_world_cinema: 'World cinema',
  franchise_entry: 'Franchise entry',
  comfort_watch: 'Comfort watch',
  challenging_art: 'Challenging art',
}

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

const labelFor = (key) => FIT_PROFILE_LABELS[key] || capitalize((key || '').replace(/_/g, ' '))

function runtimeBand(runtime) {
  if (!runtime) return null
  if (runtime < 90)  return { band: 'tight',   label: 'a tight watch',          detail: 'Done before bedtime.' }
  if (runtime <= 150) return { band: 'feature', label: 'standard feature length', detail: 'Fits the standard weeknight sit.' }
  return                      { band: 'epic',    label: 'an epic sit',             detail: 'Save it for a weekend afternoon.' }
}

/**
 * @param {object} args
 * @param {object} args.mv               - mapped movie object (id, director, runtime)
 * @param {object} args.filmDbRow        - subset of movies row { mood_tags, tone_tags, fit_profile }
 * @param {object|null} args.fingerprint - { topMoodTags, topToneTags, topFitProfiles, total } or null
 * @param {number} args.directorCount    - count of films by this director in user_history
 * @returns {Array<{ id, icon, title, detail, moodKey? }>}
 */
export function deriveWhyReasons({ mv, filmDbRow, fingerprint, directorCount }) {
  if (!mv) return []

  const candidates = []

  // 1. Mood overlap (personalized)
  if (fingerprint?.topMoodTags?.length && filmDbRow?.mood_tags?.length) {
    const userMoodKeys = fingerprint.topMoodTags.map(t => t.key)
    const overlap = filmDbRow.mood_tags.filter(t => userMoodKeys.includes(t)).slice(0, 3)
    if (overlap.length > 0) {
      candidates.push({
        id: 'mood-overlap',
        icon: 'mood',
        priority: 1,
        title: overlap.map(capitalize).join(' · '),
        detail: `Matches ${overlap.length} of your top moods · drawn from ${fingerprint.total} watched films.`,
        moodKey: overlap[0],
      })
    }
  }

  // 4. Film mood profile (descriptive fallback — always renders when film has moods)
  if (filmDbRow?.mood_tags?.length) {
    const tags = filmDbRow.mood_tags.slice(0, 3).map(capitalize).join(' · ')
    candidates.push({
      id: 'mood-film',
      icon: 'mood',
      priority: 4,
      title: tags,
      detail: `This film's mood signature${filmDbRow.tone_tags?.length ? ` · tones ${filmDbRow.tone_tags.slice(0, 2).map(capitalize).join(', ')}` : ''}.`,
      moodKey: filmDbRow.mood_tags[0],
    })
  }

  // 2. Fit profile match (personalized)
  if (fingerprint?.topFitProfiles?.length && filmDbRow?.fit_profile) {
    const topFit = fingerprint.topFitProfiles[0]
    if (topFit?.key === filmDbRow.fit_profile) {
      const share = Math.round((topFit.share || 0) * 100)
      candidates.push({
        id: 'fit-match',
        icon: 'dna',
        priority: 2,
        title: `${labelFor(filmDbRow.fit_profile)} — your most-watched`,
        detail: `${share}% of your library lives in this profile.`,
      })
    }
  }

  // 5. Film fit profile (descriptive fallback)
  if (filmDbRow?.fit_profile) {
    candidates.push({
      id: 'fit-film',
      icon: 'dna',
      priority: 5,
      title: labelFor(filmDbRow.fit_profile),
      detail: `How the FeelFlick engine reads this film's audience fit.`,
    })
  }

  // 3. Director (personalized count when available; otherwise a clean intro)
  if (mv.director && mv.director !== '—') {
    if (directorCount > 0) {
      candidates.push({
        id: 'director',
        icon: 'director',
        priority: 3,
        title: `Director: ${mv.director}`,
        detail: `${directorCount} film${directorCount === 1 ? '' : 's'} of theirs already in your library.`,
      })
    } else {
      candidates.push({
        id: 'director',
        icon: 'director',
        priority: 5.5,
        title: `Director: ${mv.director}`,
        detail: 'Directed by them.',
      })
    }
  }

  // 6. Runtime (descriptive, always renders when runtime > 0)
  const band = runtimeBand(mv.runtime)
  if (band) {
    const hours = Math.floor(mv.runtime / 60)
    const mins = mv.runtime % 60
    const display = hours > 0 ? `${hours}h ${mins ? `${mins}m` : ''}`.trim() : `${mins}m`
    candidates.push({
      id: 'time',
      icon: 'time',
      priority: 6,
      title: `${display} · ${band.label}`,
      detail: band.detail,
    })
  }

  // De-duplicate: prefer the higher-priority card per "slot" (mood, fit).
  // mood-overlap (1) wins over mood-film (4); fit-match (2) over fit-film (5).
  const seenSlots = new Set()
  const sorted = candidates.sort((a, b) => a.priority - b.priority)
  const picked = []
  for (const c of sorted) {
    const slot = c.id.startsWith('mood-') ? 'mood' : c.id.startsWith('fit-') ? 'fit' : c.id
    if (seenSlots.has(slot)) continue
    seenSlots.add(slot)
    picked.push(c)
    if (picked.length >= 4) break
  }
  return picked
}

/**
 * Headline + rationale beside the cards. Adapts to user state.
 */
export function deriveWhyHeader({ fingerprint, signedIn }) {
  if (!signedIn) {
    return {
      eyebrow: 'Editorial fingerprint',
      headline: `How this film reads.`,
      rationale: `Mood, fit, and shape from the FeelFlick taste engine. Sign in to see how it lines up with your library.`,
    }
  }
  if (!fingerprint) {
    return {
      eyebrow: 'Editorial fingerprint',
      headline: `How this film reads.`,
      rationale: `Rate 5+ films to unlock personalized matching — for now, this is the film's standalone profile.`,
    }
  }
  return {
    eyebrow: 'Why this fits you',
    headline: `Signals from your last ${fingerprint.total} films.`,
    rationale: `Mood overlap, director history, and your preferred film shape — distilled from what you've actually watched.`,
  }
}
