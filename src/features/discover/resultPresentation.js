// src/features/discover/resultPresentation.js
// F3.4 — pure result-stage presentation helper extracted VERBATIM from Discover.jsx.
// moodFilter maps the primary mood id to poster filter/overlay/kenBurns/halo flags.

export function moodFilter(moodId) {
  if (moodId === 'tense') return { cardFilter:'saturate(0.88)', overlay:'repeating-linear-gradient(0deg, rgba(239,68,68,0.04) 0px, rgba(239,68,68,0.04) 1px, transparent 1px, transparent 3px)' };
  if (moodId === 'cozy')  return { overlay:'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)' };
  if (moodId === 'mythic')return { overlay:'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.08), transparent 30%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.06), transparent 25%)' };
  if (moodId === 'slow')  return { kenBurns:true };
  if (moodId === 'bittersweet') return { cardFilter:'sepia(0.15) saturate(0.95)' };
  if (moodId === 'cerebral')    return { cardFilter:'hue-rotate(-6deg) saturate(0.95)' };
  if (moodId === 'tender')      return { halo:true };
  return {};
}
