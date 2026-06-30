// src/shared/services/data/tagBaseRates.js
//
// GENERATED DATA — catalog base rates (prevalence) for mood / tone / fit tags.
// Each value is the percentage of valid, poster-bearing films that carry the tag.
//
// Used by tagDistinctiveness.js to compute inverse-document-frequency (IDF) so the
// Cinematic-DNA strip + facet rows surface a user's DISTINCTIVE taste signals rather
// than catalog-common ones (e.g. tone "earnest" is on 53.7% of the catalog — true of
// most films, so it tells the user little). Re-ranking by count × IDF demotes such
// near-universal tags and promotes characterful ones (grandiose, poetic, melancholic).
//
// Stable over time (tone/mood/genre distributions shift slowly), so this is committed
// as a constant rather than queried at runtime. Regenerate when the catalog grows
// materially via (read-only, against the live project):
//
//   WITH valid AS (SELECT mood_tags, tone_tags, fit_profile FROM movies
//                  WHERE is_valid AND poster_path IS NOT NULL),
//        tot AS (SELECT count(*)::numeric n FROM valid)
//   SELECT 'mood' kind, t tag, round(100.0*count(*)/(SELECT n FROM tot),1) pct
//     FROM valid, unnest(mood_tags) t GROUP BY t
//   UNION ALL SELECT 'tone', t, round(100.0*count(*)/(SELECT n FROM tot),1)
//     FROM valid, unnest(tone_tags) t GROUP BY t
//   UNION ALL SELECT 'fit', fit_profile, round(100.0*count(*)/(SELECT n FROM tot),1)
//     FROM valid WHERE fit_profile IS NOT NULL GROUP BY fit_profile;
//
// Last generated: 2026-06-28 (catalog ~14.3k valid films, project orbhbwtgdfqhehuuxfmg).

export const TAG_BASE_RATE = {
  mood: {
    tense: 44.7, dark: 29.0, suspenseful: 27.3, bittersweet: 26.1, intense: 24.5,
    playful: 21.3, heartwarming: 19.8, mysterious: 19.4, thrilling: 19.0, unsettling: 17.8,
    uplifting: 16.1, lighthearted: 14.9, melancholic: 14.9, whimsical: 14.3, exhilarating: 13.7,
    haunting: 13.2, nostalgic: 12.9, tender: 12.8, romantic: 11.3, gritty: 10.1,
    somber: 9.7, contemplative: 9.1, provocative: 8.1, inspiring: 7.3, cozy: 5.3,
    devastating: 3.6, meditative: 3.3, empowering: 3.2, dreamy: 2.8, 'mind-bending': 1.2,
    serene: 0.9, enigmatic: 0.6, euphoric: 0.3,
  },
  tone: {
    earnest: 53.7, urgent: 29.2, warm: 28.9, raw: 27.0, cold: 17.8,
    sentimental: 15.4, polished: 14.1, poetic: 12.5, intimate: 11.0, whimsical: 9.2,
    grandiose: 6.9, absurdist: 5.5, cynical: 5.1, satirical: 5.0, dry: 2.3,
    ironic: 2.2, detached: 1.5, minimalist: 1.2, operatic: 0.9, deadpan: 0.7,
  },
  fit: {
    genre_popcorn: 26.3, prestige_drama: 17.6, comfort_watch: 10.1, crowd_pleaser: 7.5,
    festival_discovery: 6.2, arthouse: 3.8, challenging_art: 3.1, franchise_entry: 1.8,
    cult_classic: 1.7, niche_world_cinema: 1.2,
  },
}

// A tag absent from the map (new/rare) is treated as moderately common so it neither
// dominates nor is buried purely for being unseen.
export const DEFAULT_BASE_RATE_PCT = 20
