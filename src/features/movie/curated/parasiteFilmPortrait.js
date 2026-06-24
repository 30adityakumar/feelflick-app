// src/features/movie/curated/parasiteFilmPortrait.js
// Parasite-ONLY curated post-watch Film Portrait content (TMDB id 496243).
//
// This module is imported ONLY by ParasitePostWatchPortrait, which is itself
// lazy-loaded and rendered only after: signed in + persisted Watched + mv.id === 496243.
// So this spoiler text is NOT part of the pre-watch render path or bundle.
//
// Provenance: editorial interpretation, framed as ONE FeelFlick reading — never a
// definitive truth. Contains NO awards metrics, NO critic/audience percentages, NO
// DNA before/after, NO recommendation-impact claims, NO new historical claims beyond
// the existing curated Parasite material. Do NOT broaden any of this to other films.

export const PARASITE_TMDB_ID = 496243

export const PARASITE_PORTRAIT = {
  shieldLabel: 'Spoilers ahead',
  unlockedLabel: 'Curated Film Portrait',
  eyebrow: 'After watching',
  heading: 'A deeper reading.',
  intro: 'This chapter contains spoilers, interpretation, motifs and reflection. It is one reading of the film, not the only one.',

  narrative: {
    eyebrow: 'Narrative shape',
    heading: 'The structure is a descent disguised as an ascent.',
    movements: [
      { label: 'Movement I', title: 'The invitation', body: 'Light-footed, observant, and almost playful as a plan begins to work.' },
      { label: 'Movement II', title: 'The ascent', body: 'The comedy tightens. Every success creates a more fragile arrangement.' },
      { label: 'Movement III', title: 'The rupture', body: 'The film changes temperature without abandoning anything it has built.' },
    ],
    note: 'Each apparent upward movement — employment, access, comfort, belonging — depends on someone remaining below.',
  },

  interpretation: {
    eyebrow: 'A FeelFlick reading',
    heading: 'The tragedy is not that the families fail to understand one another.',
    body: 'They understand the hierarchy almost perfectly. The film’s cruelty comes from showing how intelligence, affection, and effort operate inside a structure that still keeps people on different levels. Everyone improvises; the architecture remains.',
  },

  // Non-interactive editorial cards (NOT saved preferences, no selection/tracking).
  motifs: [
    { n: '01', title: 'Levels', note: 'Stairs, basements, hills' },
    { n: '02', title: 'Smell', note: 'Class made involuntary' },
    { n: '03', title: 'Rain', note: 'Relief above, disaster below' },
    { n: '04', title: 'Frames', note: 'Who is seen and contained' },
  ],

  ending: {
    eyebrow: 'Ending reflection',
    heading: 'Editorial interpretation',
    body: 'The final plan is emotionally sincere and materially impossible. By letting the imagined future borrow the grammar of a real resolution, the film lets hope briefly feel real before returning to the basement. The cut does not mock the dream; it measures the distance between dreaming and escape.',
  },
}
