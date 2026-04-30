// src/features/landing-v2/data.js
// TMDB poster catalog + mood definitions for v2 landing.
// All paths are real TMDB image paths used elsewhere in the app.

const P = (path, title, year, tag) => ({ path, title, year, tag })

// Real TMDB poster paths.
export const POSTERS = {
  interstellar: P('/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg', 'Interstellar',                  2014, 'Curious'),
  arrival:      P('/pEzNVQfdzYDzVK0XqxERIw2x2se.jpg', 'Arrival',                       2016, 'Reflective'),
  eeaao:        P('/u68AjlvlutfEIcpmbYpKcdi09ut.jpg', 'Everything Everywhere',         2022, 'Inventive'),
  synecdoche:   P('/mE24wUCfjK8AoBBjaMjho7Rczr7.jpg', 'Get Out',                       2017, 'Tense'),
  hereditary:   P('/hjlZSXM86wJrfCv5VKfR5DI2VeU.jpg', 'Hereditary',                    2018, 'Unsettling'),
  knivesout:    P('/pThyQovXQrw2m0s9x82twj48Jq4.jpg', 'Knives Out',                    2019, 'Clever'),
  inbruges:     P('/vz3Vd6nfq9YZrVvyYx5RHFaYKV3.jpg', 'In Bruges',                     2008, 'Witty'),
  amelie:       P('/nSxDa3M9aMvGVLoItzWTepQ5h5d.jpg', 'Amélie',                        2001, 'Whimsical'),
  paddington:   P('/1OJ9vkD5xPt3skC6KguyXAgagRZ.jpg', 'Paddington 2',                  2017, 'Feel-good'),
  parasite:     P('/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', 'Parasite',                      2019, 'Sharp'),
  there:        P('/fa0RDkAlCec0STeMNAhPaF89q6U.jpg', 'There Will Be Blood',           2007, 'Mastery'),
  spirited:     P('/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', 'Spirited Away',                 2001, 'Soulful'),
  pansl:        P('/z7xXihu5wHuSMWymq5VAulPVuvg.jpg', "Pan's Labyrinth",               2006, 'Mythic'),
  coco:         P('/6Ryitt95xrO8KXuqRGm1fUuNwqF.jpg', 'Coco',                          2017, 'Nostalgic'),
  ladybird:     P('/gl66K7zRdtNYGrxyS2YDUP5ASZd.jpg', 'Lady Bird',                     2017, 'Coming-of-age'),
  her:          P('/eCOtqtfvn7mxGl6nfmq4b1exJRc.jpg', 'Her',                           2013, 'Intimate'),
  inthemood:    P('/iYypPT4bhqXfq1b6EnmxvRt6b2Y.jpg', 'In the Mood for Love',          2000, 'Longing'),
  budapest:     P('/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg', 'Grand Budapest Hotel',          2014, 'Editorial'),
  lobster:      P('/7Y9ILV1unpW9mLpGcqyGQU72LUy.jpg', 'The Lobster',                   2015, 'Offbeat'),
  madmax:       P('/hA2ple9q4qnwxp3hKVNhroipsir.jpg', 'Mad Max: Fury Road',            2015, 'Kinetic'),
  drive:        P('/602vevIURmpDfzbnv5Ubi6wIkQm.jpg', 'Drive',                         2011, 'Intense'),
  inception:    P('/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg', 'Inception',                     2010, 'Cerebral'),
  martian:      P('/fASz8A0yFE3QB6LgGoOfwvFSseV.jpg', 'The Martian',                   2015, 'Inventive'),
  lalaland:     P('/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg', 'La La Land',                    2016, 'Nostalgic'),
}

// Each mood: a label, a glow color, an emoji, and 3 picks with match %.
export const MOODS = [
  {
    id: 'nostalgic', label: 'Nostalgic', color: '#DEB887', emoji: '🌅',
    desc: 'Films that take you back',
    films: [POSTERS.amelie, POSTERS.lalaland, POSTERS.spirited],
    matches: [96, 93, 91],
  },
  {
    id: 'tense', label: 'Tense', color: '#6C7BB3', emoji: '⚡',
    desc: 'Edge-of-your-seat gripping',
    films: [POSTERS.parasite, POSTERS.synecdoche, POSTERS.hereditary],
    matches: [97, 94, 92],
  },
  {
    id: 'euphoric', label: 'Euphoric', color: '#FFD93D', emoji: '✨',
    desc: 'Pure joy and wonder',
    films: [POSTERS.eeaao, POSTERS.lalaland, POSTERS.coco],
    matches: [97, 94, 91],
  },
  {
    id: 'curious', label: 'Curious', color: '#4ECDC4', emoji: '🔭',
    desc: 'Mind-expanding, thought-provoking',
    films: [POSTERS.interstellar, POSTERS.pansl, POSTERS.eeaao],
    matches: [95, 92, 88],
  },
  {
    id: 'cozy', label: 'Cozy', color: '#A8C686', emoji: '🫖',
    desc: 'Warm, low-stakes comfort',
    films: [POSTERS.paddington, POSTERS.amelie, POSTERS.coco],
    matches: [95, 91, 89],
  },
  {
    id: 'melancholy', label: 'Melancholy', color: '#9B8EC4', emoji: '🌙',
    desc: 'Quiet, longing, beautiful',
    films: [POSTERS.her, POSTERS.inthemood, POSTERS.ladybird],
    matches: [96, 92, 89],
  },
]

// Want options for the madlib hero — descriptors that pair with each feeling.
export const WANTS_BY_MOOD = {
  nostalgic:  ['warm and slow', 'gentle', 'a little sad'],
  tense:      ['gripping', 'twisty', 'unrelenting'],
  euphoric:   ['joyful', 'inventive', 'electric'],
  curious:    ['mind-bending', 'cerebral', 'unexpected'],
  cozy:       ['low-stakes', 'sweet', 'comforting'],
  melancholy: ['quiet', 'beautifully sad', 'haunting'],
}

// Tone variants used by hero + final CTA copy
export const TONE_COPY = {
  confident: {
    h1a: 'Tell us how you feel.',
    h1b: "We'll find the film.",
    sub: 'One sentence. One pick. No scrolling. Try it below — no account needed.',
    eyebrow: 'A new way to choose',
    finalH: 'Stop scrolling.\nStart watching.',
    finalSub: 'Free forever. No ads. No credit card. Just better picks.',
  },
  cinematic: {
    h1a: 'Some nights need',
    h1b: 'a particular film.',
    sub: "Tell us the night you're having. We'll find the film that meets it.",
    eyebrow: 'For people who care which one',
    finalH: 'Tonight deserves\nbetter than autoplay.',
    finalSub: "Free, always. No ads. No algorithm-bait. Just the right film for the night you're in.",
  },
  warm: {
    h1a: 'How are you,',
    h1b: 'really?',
    sub: "No homework, no quiz. Just tell us the vibe and we'll find something that fits.",
    eyebrow: 'Made for tonight',
    finalH: 'Spend tonight watching,\nnot searching.',
    finalSub: 'Free forever. No ads. No tracking. Your taste, your night.',
  },
}
