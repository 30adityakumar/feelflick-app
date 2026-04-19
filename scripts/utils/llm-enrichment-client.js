// scripts/utils/llm-enrichment-client.js
// OpenAI wrapper for LLM mood enrichment (step 07b).
// Separate from openai-client.js which handles embeddings only.

require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY in environment');
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// === CONTROLLED VOCABULARIES ===

const MOOD_VOCAB = [
  'exhilarating', 'tense', 'cozy', 'melancholic', 'uplifting',
  'whimsical', 'haunting', 'meditative', 'romantic', 'gritty',
  'heartwarming', 'suspenseful', 'nostalgic', 'empowering', 'bittersweet',
  'devastating', 'playful', 'contemplative', 'thrilling', 'serene',
  'unsettling', 'inspiring', 'dreamy', 'intense', 'tender',
  'dark', 'lighthearted', 'provocative', 'euphoric', 'somber',
  'mysterious', 'enigmatic', 'mind-bending',
];

const TONE_VOCAB = [
  'satirical', 'earnest', 'ironic', 'deadpan', 'poetic',
  'raw', 'polished', 'absurdist', 'sentimental', 'cynical',
  'whimsical', 'urgent', 'detached', 'intimate', 'grandiose',
  'minimalist', 'operatic', 'dry', 'warm', 'cold',
];

const FIT_PROFILES = [
  'crowd_pleaser', 'prestige_drama', 'arthouse', 'genre_popcorn',
  'festival_discovery', 'cult_classic', 'niche_world_cinema',
  'franchise_entry', 'comfort_watch', 'challenging_art',
];

// === JSON SCHEMA FOR STRUCTURED OUTPUT ===

const ENRICHMENT_JSON_SCHEMA = {
  name: 'mood_enrichment',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      mood_tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Pick 3-6 mood tags from the controlled vocabulary that best capture the viewing experience.',
      },
      tone_tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Pick 2-4 tone tags from the controlled vocabulary that describe the directorial/narrative tone.',
      },
      fit_profile: {
        type: 'string',
        description: 'Single classification of the film audience fit.',
      },
      pacing: {
        type: 'integer',
        description: 'How fast-paced the film feels. 0 = glacially slow, 100 = relentless.',
      },
      intensity: {
        type: 'integer',
        description: 'Emotional/visceral intensity. 0 = gentle, 100 = overwhelming.',
      },
      emotional_depth: {
        type: 'integer',
        description: 'How deeply the film explores emotions/themes. 0 = surface-level, 100 = profoundly moving.',
      },
      dialogue_density: {
        type: 'integer',
        description: 'How dialogue-driven the film is. 0 = mostly visual/silent, 100 = wall-to-wall dialogue.',
      },
      attention_demand: {
        type: 'integer',
        description: 'How much focused attention the film requires. 0 = casual background watch, 100 = miss-nothing complexity.',
      },
      confidence: {
        type: 'integer',
        description: 'Your confidence in this assessment. 0 = guessing, 100 = very familiar with this film.',
      },
    },
    required: [
      'mood_tags', 'tone_tags', 'fit_profile',
      'pacing', 'intensity', 'emotional_depth',
      'dialogue_density', 'attention_demand', 'confidence',
    ],
    additionalProperties: false,
  },
};

// === PROMPTS ===

function buildSystemPrompt() {
  return `You are a film analyst classifying movies for a mood-based recommendation engine.

Given a movie's metadata, produce a structured JSON assessment of its mood, tone, and viewing experience.

## Controlled vocabularies

**mood_tags** (pick 3-6):
${MOOD_VOCAB.join(', ')}

**tone_tags** (pick 2-4):
${TONE_VOCAB.join(', ')}

**fit_profile** (pick exactly 1):
${FIT_PROFILES.join(', ')}

## Dimension scales (0-100)
- **pacing**: 0 = glacially slow (Stalker, Jeanne Dielman) → 100 = relentless (Mad Max: Fury Road, Uncut Gems)
- **intensity**: 0 = gentle and soothing (My Neighbor Totoro) → 100 = overwhelming (Requiem for a Dream, Irreversible)
- **emotional_depth**: 0 = surface-level popcorn fun → 100 = profoundly moving (Schindler's List, Grave of the Fireflies)
- **dialogue_density**: 0 = mostly visual/silent (Wall-E first act, Baraka) → 100 = wall-to-wall dialogue (Before Sunrise, My Dinner with Andre)
- **attention_demand**: 0 = casual background watch (rom-com, feel-good) → 100 = miss-nothing complexity (Primer, Memento, Mulholland Drive)
- **confidence**: 0 = never heard of this film → 100 = know it intimately

## Anchor examples

**Mad Max: Fury Road (2015)**
mood_tags: ["exhilarating", "intense", "thrilling"]
tone_tags: ["urgent", "operatic", "raw"]
fit_profile: "crowd_pleaser"
pacing: 95, intensity: 90, emotional_depth: 35, dialogue_density: 15, attention_demand: 30, confidence: 95

**Paterson (2016)**
mood_tags: ["meditative", "serene", "tender", "contemplative"]
tone_tags: ["poetic", "minimalist", "warm"]
fit_profile: "arthouse"
pacing: 10, intensity: 8, emotional_depth: 72, dialogue_density: 55, attention_demand: 45, confidence: 90

**Parasite (2019)**
mood_tags: ["tense", "dark", "bittersweet", "unsettling"]
tone_tags: ["satirical", "polished", "ironic"]
fit_profile: "prestige_drama"
pacing: 60, intensity: 75, emotional_depth: 80, dialogue_density: 60, attention_demand: 70, confidence: 95

**My Neighbor Totoro (1988)**
mood_tags: ["cozy", "whimsical", "heartwarming", "serene"]
tone_tags: ["warm", "earnest", "poetic"]
fit_profile: "comfort_watch"
pacing: 20, intensity: 8, emotional_depth: 55, dialogue_density: 40, attention_demand: 15, confidence: 95

## Rules
- Only use tags from the controlled vocabularies. Do not invent new tags.
- Be honest about confidence. If you don't know the film well, say so (confidence < 40).
- Avoid anchoring everything to 50. Use the full 0-100 range. Most films should NOT cluster at 50.
- Consider the WHOLE film, not just the climax. A slow-burn thriller with a wild ending is still low-pacing overall.`;
}

function buildUserPrompt(movie) {
  const parts = [];

  // Title + year
  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : null;
  parts.push(year ? `${movie.title} (${year})` : movie.title);

  // Director
  if (movie.director_name) {
    parts.push(`Director: ${movie.director_name}`);
  }

  // Genres
  if (movie.primary_genre) {
    parts.push(`Primary genre: ${movie.primary_genre}`);
  }
  if (movie.genres) {
    const genreList = Array.isArray(movie.genres) ? movie.genres : [];
    if (genreList.length > 0) {
      parts.push(`Genres: ${genreList.join(', ')}`);
    }
  }

  // Runtime
  if (movie.runtime) {
    parts.push(`Runtime: ${movie.runtime} minutes`);
  }

  // Overview
  if (movie.overview) {
    parts.push(`Overview: ${movie.overview}`);
  }

  // Tagline
  if (movie.tagline && movie.tagline !== movie.overview) {
    parts.push(`Tagline: ${movie.tagline}`);
  }

  // Keywords (top 15)
  if (movie.keywords) {
    let kwList = Array.isArray(movie.keywords) ? movie.keywords : [];
    kwList = kwList.slice(0, 15).map(k =>
      typeof k === 'string' ? k : (k.name || '')
    ).filter(Boolean);
    if (kwList.length > 0) {
      parts.push(`Keywords: ${kwList.join(', ')}`);
    }
  }

  // Collection
  if (movie.collection_name) {
    parts.push(`Part of: ${movie.collection_name}`);
  }

  // Country
  if (movie.production_countries) {
    let countries = movie.production_countries;
    if (typeof countries === 'string') {
      try { countries = JSON.parse(countries); } catch { /* ignore */ }
    }
    if (Array.isArray(countries)) {
      const names = countries.map(c => c.name || c).filter(Boolean).slice(0, 3);
      if (names.length > 0) parts.push(`Country: ${names.join(', ')}`);
    }
  }

  // Original language
  if (movie.original_language) {
    parts.push(`Original language: ${movie.original_language}`);
  }

  return parts.join('\n');
}

// === RATE LIMITING ===

const RATE_LIMIT_DELAY_MS = 400;
let lastRequestTime = 0;

async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

// === STATS ===

let stats = {
  requestCount: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
};

function resetStats() {
  stats = { requestCount: 0, totalInputTokens: 0, totalOutputTokens: 0 };
}

function getStats() {
  // gpt-5.4-mini pricing: $0.75/1M input, $4.50/1M output
  const inputCost = (stats.totalInputTokens / 1_000_000) * 0.75;
  const outputCost = (stats.totalOutputTokens / 1_000_000) * 4.50;
  return {
    ...stats,
    totalCostUsd: inputCost + outputCost,
  };
}

// === REALTIME ENRICHMENT ===

/**
 * Enrich a single movie via OpenAI chat completion with structured output.
 * @param {object} movie - Movie object from Supabase
 * @param {string} model - OpenAI model name
 * @returns {object|null} Parsed enrichment or null on failure
 */
async function enrichMovieRealtime(movie, model) {
  await rateLimit();

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(movie);

  let retries = 0;
  const maxRetries = 3;

  while (retries <= maxRetries) {
    try {
      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: ENRICHMENT_JSON_SCHEMA,
        },
        temperature: 0.3,
      });

      stats.requestCount++;
      if (response.usage) {
        stats.totalInputTokens += response.usage.prompt_tokens || 0;
        stats.totalOutputTokens += response.usage.completion_tokens || 0;
      }

      const content = response.choices?.[0]?.message?.content;
      if (!content) return null;

      return JSON.parse(content);
    } catch (error) {
      if (error.status === 429 && retries < maxRetries) {
        retries++;
        const backoff = Math.pow(2, retries) * 1000;
        console.warn(`  ⚠ Rate limited, retrying in ${backoff / 1000}s (attempt ${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }
      throw error;
    }
  }

  return null;
}

// === BATCH API ===

/**
 * Submit a batch of movies for enrichment via OpenAI Batch API.
 * Creates a .jsonl file and uploads it.
 * @param {object[]} movies - Array of movie objects
 * @param {string} model - OpenAI model name
 * @returns {{ batchId: string, inputFileId: string, count: number }}
 */
async function submitBatch(movies, model) {
  const systemPrompt = buildSystemPrompt();
  const lines = [];

  for (const movie of movies) {
    const userPrompt = buildUserPrompt(movie);
    const request = {
      custom_id: `movie-${movie.id}`,
      method: 'POST',
      url: '/v1/chat/completions',
      body: {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: ENRICHMENT_JSON_SCHEMA,
        },
        temperature: 0.3,
      },
    };
    lines.push(JSON.stringify(request));
  }

  // Write .jsonl to temp file
  const tmpPath = path.join('/tmp', `feelflick-mood-batch-${Date.now()}.jsonl`);
  fs.writeFileSync(tmpPath, lines.join('\n'));

  // Upload file
  const file = await openai.files.create({
    file: fs.createReadStream(tmpPath),
    purpose: 'batch',
  });

  // Create batch
  const batch = await openai.batches.create({
    input_file_id: file.id,
    endpoint: '/v1/chat/completions',
    completion_window: '24h',
  });

  // Clean up temp file
  try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }

  return {
    batchId: batch.id,
    inputFileId: file.id,
    count: movies.length,
  };
}

/**
 * Get status of a batch job.
 * @param {string} batchId
 * @returns {object} Batch status object
 */
async function getBatchStatus(batchId) {
  return openai.batches.retrieve(batchId);
}

/**
 * Download and parse batch results.
 * @param {string} batchId
 * @returns {Map<number, object>} Map of movieId → parsed enrichment
 */
async function getBatchResults(batchId) {
  const batch = await openai.batches.retrieve(batchId);

  if (batch.status !== 'completed') {
    throw new Error(`Batch ${batchId} is not completed (status: ${batch.status})`);
  }

  if (!batch.output_file_id) {
    throw new Error(`Batch ${batchId} has no output file`);
  }

  const fileResponse = await openai.files.content(batch.output_file_id);
  const text = await fileResponse.text();

  const results = new Map();
  for (const line of text.split('\n').filter(Boolean)) {
    try {
      const row = JSON.parse(line);
      const movieId = parseInt(row.custom_id.replace('movie-', ''), 10);
      const content = row.response?.body?.choices?.[0]?.message?.content;
      if (content) {
        results.set(movieId, JSON.parse(content));
      }
    } catch {
      // Skip malformed lines
    }
  }

  return results;
}

module.exports = {
  enrichMovieRealtime,
  submitBatch,
  getBatchStatus,
  getBatchResults,
  buildUserPrompt,
  buildSystemPrompt,
  getStats,
  resetStats,
  MOOD_VOCAB,
  TONE_VOCAB,
  FIT_PROFILES,
};
