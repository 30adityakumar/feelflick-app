// src/features/discover/derive.js
// F3.2 — pure derivation helpers extracted VERBATIM from Discover.jsx (the
// trust-critical, side-effect-free core of /discover): the mood model + mappings,
// the honest "Because…" explanation, the Stage-3 diversity pass, and the Stage-2
// predicted defaults. NO React, NO Supabase, NO navigation/localStorage/analytics,
// NO FFAudio — every function is pure (same inputs → same output, no external
// mutation). That purity is exactly why this is the unit-test boundary protecting
// the F3 redesign. Behaviour + values are unchanged from the pre-extraction source.


// === Mood model + mappings ===

// Hints harmonized to noun-phrase voice — the other 6 already use this
// register; Tender ("For nights…") and Restless ("When you…") were the
// two outliers that read like a different writer. Now all 8 line up.
export const MOODS = [
  { id:'tender',     label:'Tender',      hex:'#F472B6', x:18, y:32, hint:'Nights that ache softly.' },
  { id:'tense',      label:'Tense',       hex:'#EF4444', x:78, y:24, hint:'Pulse up. Held breath.' },
  { id:'slow',       label:'Slow-burn',   hex:'#A78BFA', x:34, y:62, hint:'Long takes. Patient escalation.' },
  { id:'cerebral',   label:'Cerebral',    hex:'#7DD3FC', x:62, y:70, hint:'Big idea, quiet pace.' },
  { id:'cozy',       label:'Cozy',        hex:'#FBBF24', x:14, y:74, hint:'Low-stakes. Soft landing.' },
  { id:'bittersweet',label:'Bittersweet', hex:'#FB7185', x:48, y:18, hint:'Sad and beautiful in one breath.' },
  { id:'mythic',     label:'Mythic',      hex:'#0EA5E9', x:84, y:62, hint:'Epic. Otherworldly.' },
  { id:'restless',   label:'Restless',    hex:'#34D399', x:52, y:44, hint:'Can’t-sit-still energy.' },
];

// Onboarding Step 1 uses a 6-mood vocabulary
// (cozy/wired/tender/fun/tense/mythic — see src/features/onboarding/data.js).
// /discover uses an 8-axis vocabulary above (the constellation map). This
// bridge translates baseline-mood keys → Discover mood ids for the
// first-visit pre-selection in DiscoverBody. Four are direct (cozy,
// tender, tense, mythic); 'wired' ("cerebral, plot-y, reward focus") maps
// to the closest Discover hint ("big idea, quiet pace") = cerebral;
// 'fun' ("light, plot-driven, escapist") maps to restless (the energetic /
// can't-sit-still axis is the closest entertainment-first register).
export const ONBOARDING_TO_DISCOVER = {
  cozy:   'cozy',
  wired:  'cerebral',
  tender: 'tender',
  fun:    'restless',
  tense:  'tense',
  mythic: 'mythic',
};

const CONSTELLATION_NAMES = {
  'tender':'Soft Focus','tense':'Held Breath','slow':'The Long Take','cerebral':'The Question',
  'cozy':'Comfort Reel','bittersweet':'Pretty Hurt','mythic':'Big Sky','restless':"Won't Sit Still",
  'slow,tender':'The Quiet Ache','bittersweet,tender':'The Long Goodbye','cozy,tender':'Home Cinema',
  'restless,tense':'Live Wire','cerebral,tense':'Cold Logic','bittersweet,tense':'Wound Up',
  'cerebral,slow':'The Long Question','mythic,slow':'Slow Magic','restless,slow':'Patient Storm',
  'cerebral,mythic':'The Cathedral','bittersweet,cerebral':'Late Night Math','cerebral,restless':'Mind Adrift',
  'bittersweet,cozy':'Soft Endings','cozy,mythic':'Fireside Epic','bittersweet,mythic':'Old Light',
  'mythic,restless':'Quest Mode','bittersweet,restless':'Wired & Wistful',
  'slow,tense':'Coiled Spring','cozy,tense':'Strange Comfort','mythic,tense':'Dark Myth',
  'restless,tender':'The Almost','mythic,tender':'Quiet Wonder','cerebral,tender':'The Thinking Heart',
  'cozy,slow':'Slow Sunday','cozy,cerebral':'Cosy Puzzle','cozy,restless':'Sugar Static',
  'bittersweet,slow':'The Long Goodbye',
};
export const constellationName = (selected) => {
  if (selected.length === 0) return 'Your night';
  if (selected.length === 1) return CONSTELLATION_NAMES[selected[0]] || 'Your night';
  if (selected.length === 2) {
    const k = selected.slice().sort().join(',');
    return CONSTELLATION_NAMES[k] || selected.map(s => MOODS.find(m=>m.id===s)?.label).join(' × ');
  }
  const labels = selected.map(s => MOODS.find(m=>m.id===s)?.label);
  return `${labels[0]}, ${labels[1]} & ${labels[2]}`;
};

// === Honest "Because…" explanation ===

// ── "Because…" line — one-line italic proof above the title that names
// the strongest signal the engine fired for this user × film. Priority:
// (1) director affinity from the user's rated history, (2) the
// constellation the user named in Stage 1, (3) the strongest mood as
// final fallback. Returns null if no signal can be honestly claimed —
// caller hides the line entirely rather than printing filler. Single
// line, italic, brand-soft voice. The point of this line is to make
// "the engine knows you" visible without prose paragraphs.
// `isAlt` routes alternate cards to FILM-SPECIFIC signals first so the
// 3 cards on the spread don't all show the same constellation line.
// Top card uses director-affinity → constellation → mood (the user-
// connecting hierarchy). Alt cards prefer signals that DIFFER between
// films — director name + year, or mood/tone tag highlight — making
// each card carry its own personality. Director affinity still wins
// for ALT if it fires (rare but valuable signal).
export function buildBecauseLine({ film, profile, selected, isAlt = false }) {
  if (!film) return null;
  // Director affinity — strongest signal, works for both slots.
  const dirAffinity = profile?.affinities?.directors?.find(d =>
    d?.name && film?.dir && d.name.toLowerCase() === film.dir.toLowerCase()
  );
  if (dirAffinity) {
    return `Because ${film.dir} reads the room the way you do.`;
  }

  // ALT-only: prefer film-specific signals that vary per card.
  if (isAlt) {
    // Highlight the film's strongest mood/tone tag — varies per film,
    // gives each alt a distinct hook. Skip generic tags ("dark", "tense")
    // that sound dour; prefer evocative ones.
    const rawTags = [...(film._raw?.mood_tags || []), ...(film._raw?.tone_tags || [])]
    const evocative = rawTags.find(t => /heartwarming|whimsical|nostalgic|haunting|exhilarating|melancholic|playful|grandiose|poetic|intimate|gritty|dreamy|wistful|provocative|mysterious/i.test(t || ''))
    if (evocative) {
      const pretty = String(evocative).replace(/_/g, ' ').toLowerCase()
      // "A exhilarating" → "An exhilarating". Cover the common vowel cases.
      const article = /^[aeiou]/.test(pretty) ? 'An' : 'A'
      return `${article} ${pretty} take on your night.`
    }
    // Director name + year — concrete, varies between films
    if (film.dir && film.year) {
      return `${film.dir}'s ${film.year} register.`
    }
  }

  // Constellation fallback (for TOP and for ALT when no per-film signal fired).
  // Skip multi-mood × names ("Bittersweet × Tender") — they read awkwardly
  // mid-sentence. Strip leading "The " so "The Quiet Ache" doesn't render
  // as "For your the quiet ache night."
  const cName = constellationName(selected);
  if (cName && cName !== 'Your night' && !cName.includes('×') && selected.length <= 2) {
    const stripped = cName.replace(/^the\s+/i, '').toLowerCase();
    return `For your ${stripped} night.`;
  }
  const topMood = MOODS.find(m => m.id === selected[0]);
  if (topMood) {
    return `For your ${topMood.label.toLowerCase()} night.`;
  }
  return null;
}

// === Stage-3 diversity / ranking post-processing ===

// ── Diversity pass for the Stage 3 swiper.
// Re-orders the top 3 visible picks so they span 3 distinct primary_genres
// when the pool allows it. Films 4+ stay in pure rank order. Without this,
// a mood combo that strongly favors one genre produces a clustered top-3
// where the user's alternates feel like re-runs of the focused pick.
//
// Slot 1 enforces a HARD mood-fit floor (TOP_MOOD_FIT_FLOOR). The headline
// pick must hit at least this much mood-fit on the user's selected moods.
// Without it, a film with high taste affinity but poor mood match (e.g.,
// Chocolat at 15% mood when user asked cerebral+mythic) could be the
// headline despite not actually fitting what was asked.
//
// Slots 2 and 3 enforce a SOFTER floor (ALT_MOOD_FIT_FLOOR). They're
// framed as alternates so a slightly lower mood threshold is fine, but
// surfacing a 15% mood film as a "pick from these" alternative to
// cerebral+mythic still felt wrong in audit. The soft floor protects
// against that while still leaving room for genre diversity.
//
// Fallback chain for slots 2/3:
//   1. Highest-ranked, NEW genre, above alt floor (best case)
//   2. Highest-ranked above alt floor (any genre — sacrifice diversity for honesty)
//   3. Break — surface fewer alts rather than a bad-mood pick. UI handles
//      0-2 alts gracefully via the alternates row.
export const TOP_MOOD_FIT_FLOOR = 0.35
export const ALT_MOOD_FIT_FLOOR = 0.25
// Session penalty — films already shown in this /discover session get
// this many points deducted from their _rankScore before slotting. Soft
// demotion (not exclusion) so a strongly-mood-matched film can still win
// if no fresh alternative comes close, but in tight ranks fresh films
// float to the top. 30 is large enough to flip "broad-mood" films
// (Gladiator, Chocolat) off the top of every scenario while still
// allowing them to surface if genuinely the best match.
export const SESSION_SHOWN_PENALTY = 30
export function diversifyTop3(scored, sessionShownIds = new Set()) {
  if (!Array.isArray(scored) || scored.length < 1) return scored
  // Re-sort with session penalty: previously-shown films pay 30 pts.
  // The original _rankScore is preserved on the film; this just changes
  // sort order. Films past the displayed top 3 still benefit from the
  // penalty in the queue order so the next skip/watched advance also
  // surfaces fresh films.
  const reranked = scored.slice().sort((a, b) => {
    const aScore = (a._rankScore || 0) - (sessionShownIds.has(a.id) ? SESSION_SHOWN_PENALTY : 0)
    const bScore = (b._rankScore || 0) - (sessionShownIds.has(b.id) ? SESSION_SHOWN_PENALTY : 0)
    return bScore - aScore
  })
  const used = new Set()
  const remaining = reranked.slice()
  const top = []

  // First pick — highest-ranked film that meets the TOP mood-fit floor.
  // Falls back to overall highest-ranked if nothing meets the floor
  // (extreme cold-start: pool has zero mood-matching candidates).
  let firstIdx = remaining.findIndex(f => (f?.moodFitRaw ?? 0) >= TOP_MOOD_FIT_FLOOR)
  if (firstIdx === -1) firstIdx = 0
  const first = remaining.splice(firstIdx, 1)[0]
  if (first) {
    top.push(first)
    if (first.primary_genre) used.add(first.primary_genre)
  }

  // Picks 2 and 3 — apply ALT mood-fit floor with genre-diversity preference.
  for (let i = 0; i < 2 && remaining.length > 0; i++) {
    // 1. Try: new genre + above alt floor
    let idx = remaining.findIndex(f => f?.primary_genre && !used.has(f.primary_genre) && (f?.moodFitRaw ?? 0) >= ALT_MOOD_FIT_FLOOR)
    // 2. Fall back: above alt floor, any genre (sacrifice diversity over honesty)
    if (idx === -1) idx = remaining.findIndex(f => (f?.moodFitRaw ?? 0) >= ALT_MOOD_FIT_FLOOR)
    // 3. Last fallback: break — fewer alts is better than a bad-mood pick
    if (idx === -1) break
    const pick = remaining.splice(idx, 1)[0]
    top.push(pick)
    if (pick?.primary_genre) used.add(pick.primary_genre)
  }

  return [...top, ...remaining]
}

// === Stage-2 predicted defaults ===

// ── Stage 2 pre-selection — predict the user's likely intention / time /
// energy from signals we already have, so the page lands on smart
// defaults instead of the static `move / std / steady / alone` set. The
// user can always override; this just shifts the starting point so
// less-engaged users hit Continue faster, and engaged users see the page
// reflect what they actually tend to pick.
//
// Signals used:
//   • intention ← primary mood from Stage 1 (cerebral → think, cozy →
//     comfort, tense/restless → distract, tender/bittersweet → move,
//     mythic → surprise, slow → think). When mood is empty, defaults
//     to 'move' (broadest appeal).
//   • time ← profile.preferences.avgRuntime, mapped to the closest
//     TIME_OPTIONS band. Cold-start users have avgRuntime=120 (the
//     placeholder default), which lands at 'std' — same as the old
//     hardcoded default, so no regression.
//   • energy ← current hour. 22:00-04:00 → 'wiped' (winding down);
//     14:00-20:00 → 'wired' (active); else 'steady'. Time-of-day is
//     a privacy-cheap signal that meaningfully shifts the right answer.
//   • who ← 'alone' (default). Hard to infer honestly without explicit
//     session signal. Phase 2 will add learned override.
const INTENTION_FROM_MOOD = {
  cerebral: 'think',
  slow:     'think',
  cozy:     'comfort',
  tense:    'distract',
  restless: 'distract',
  tender:   'move',
  bittersweet: 'move',
  mythic:   'surprise',
}

// Mode-of-counts — returns the most-frequent key in a {key: count} JSONB
// object, or null when the object is empty/invalid. Used by the hybrid
// blend to read learned prefs from user_discover_preferences.
function modeOf(counts) {
  if (!counts || typeof counts !== 'object') return null
  const entries = Object.entries(counts)
  if (entries.length === 0) return null
  entries.sort((a, b) => b[1] - a[1])
  return entries[0][0]
}

// Trust threshold — how many commits the user needs before we prefer
// their learned mode over the heuristic. 3 is a small-enough sample to
// adapt quickly but large enough to avoid one-off swings.
const MIN_COMMITS_TO_TRUST = 3

export function predictDiscoverDefaults({ selected, profile, hourOfDay, learnedPrefs }) {
  // === Heuristic prediction (always computed) ===
  const primaryMood = selected?.[0]
  const heuristic = {
    intention: INTENTION_FROM_MOOD[primaryMood] || 'move',
    time: 'std',
    energy: 'steady',
    who: 'alone',
  }
  const avg = profile?.preferences?.avgRuntime
  if (Number.isFinite(avg)) {
    if (avg < 100)       heuristic.time = 'short'
    else if (avg <= 130) heuristic.time = 'std'
    else if (avg <= 160) heuristic.time = 'long'
    else                 heuristic.time = 'epic'
  }
  if (Number.isFinite(hourOfDay)) {
    if (hourOfDay >= 22 || hourOfDay < 4) heuristic.energy = 'wiped'
    else if (hourOfDay >= 14 && hourOfDay < 20) heuristic.energy = 'wired'
  }

  // === Hybrid blend with learned data ===
  // Only trust learned prefs after MIN_COMMITS_TO_TRUST. Below that, the
  // heuristic carries the prediction. Per-dimension fallback: if the
  // learned mode for a dimension is null (no signal yet for that field),
  // fall back to heuristic for THAT field — even if total_commits >= 3.
  if ((learnedPrefs?.total_commits || 0) >= MIN_COMMITS_TO_TRUST) {
    return {
      intention: modeOf(learnedPrefs.intention_counts) || heuristic.intention,
      time:      modeOf(learnedPrefs.time_counts)      || heuristic.time,
      energy:    modeOf(learnedPrefs.energy_counts)    || heuristic.energy,
      who:       modeOf(learnedPrefs.who_counts)       || heuristic.who,
    }
  }
  return heuristic
}
