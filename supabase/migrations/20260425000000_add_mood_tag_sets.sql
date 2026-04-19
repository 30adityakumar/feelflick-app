-- Create discover_moods table with tag-based mood matching columns.
-- These power the rewritten scoreMoodAffinity in recommendations.js (v2.5+).
-- Mood IDs match the existing discover_mood_genre_weights.mood_id values.

CREATE TABLE IF NOT EXISTS discover_moods (
  id integer PRIMARY KEY,
  name text NOT NULL,
  preferred_tags text[] DEFAULT '{}',
  avoided_tags text[] DEFAULT '{}',
  preferred_tones text[] DEFAULT '{}'
);

-- Seed the 12 discover moods with tag sets curated against our MOOD_VOCAB + TONE_VOCAB.
INSERT INTO discover_moods (id, name, preferred_tags, avoided_tags, preferred_tones) VALUES
  (1, 'Cozy', ARRAY['cozy','heartwarming','tender','warm','lighthearted','nostalgic'], ARRAY['devastating','haunting','unsettling','gritty','bleak'], ARRAY['warm','earnest','intimate','sentimental']),
  (2, 'Adventurous', ARRAY['exhilarating','thrilling','intense','adventurous'], ARRAY['meditative','contemplative','somber'], ARRAY['urgent','grandiose']),
  (3, 'Futuristic', ARRAY['mind-bending','dreamy','mysterious','enigmatic'], ARRAY['cozy','heartwarming','sentimental'], ARRAY['grandiose','polished','cold']),
  (4, 'Thoughtful', ARRAY['contemplative','meditative','bittersweet','melancholic','thoughtful','introspective'], ARRAY['playful','whimsical','silly'], ARRAY['poetic','intimate','earnest']),
  (5, 'Whimsical', ARRAY['whimsical','playful','dreamy','lighthearted'], ARRAY['gritty','haunting','devastating'], ARRAY['whimsical','warm','absurdist']),
  (6, 'Enlightened', ARRAY['inspiring','uplifting','empowering','contemplative'], ARRAY['cynical','nihilistic'], ARRAY['earnest','poetic','intimate']),
  (7, 'Musical', ARRAY['exhilarating','uplifting','playful','euphoric','nostalgic'], ARRAY['haunting','devastating','unsettling'], ARRAY['warm','earnest','grandiose']),
  (8, 'Romantic', ARRAY['tender','romantic','bittersweet','sensual','heartwarming'], ARRAY['gritty','violent','devastating'], ARRAY['intimate','warm','sentimental','poetic']),
  (9, 'Suspenseful', ARRAY['tense','suspenseful','unsettling','mysterious','foreboding'], ARRAY['cozy','heartwarming','whimsical'], ARRAY['urgent','cold','detached']),
  (10, 'Silly', ARRAY['playful','whimsical','silly','lighthearted','absurdist'], ARRAY['devastating','haunting','somber'], ARRAY['absurdist','whimsical','ironic','deadpan']),
  (11, 'Dark & Intense', ARRAY['dark','haunting','unsettling','gritty','devastating','disturbing'], ARRAY['cozy','uplifting','whimsical'], ARRAY['cold','cynical','urgent']),
  (12, 'Nostalgic', ARRAY['nostalgic','bittersweet','wistful','tender','melancholic'], ARRAY['gritty','mind-bending'], ARRAY['sentimental','warm','poetic'])
ON CONFLICT (id) DO UPDATE SET
  preferred_tags = EXCLUDED.preferred_tags,
  avoided_tags = EXCLUDED.avoided_tags,
  preferred_tones = EXCLUDED.preferred_tones;
