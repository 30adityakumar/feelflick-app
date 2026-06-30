// scripts/generate-film-portraits.js
// Generates LLM post-watch film portraits for every complete movie in the catalog
// (except Parasite, which has a hand-curated portrait) and upserts them into the
// film_portraits table via the Supabase REST API.
//
// Usage:
//   node --env-file=.env scripts/generate-film-portraits.js
//
// Requires in env: OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const https = require('https')
const { URL } = require('url')

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1) }

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1) }

const MODEL = 'gpt-4o-mini'
const BATCH_SIZE = 5
const BATCH_DELAY_MS = 1200
const PARASITE_TMDB_ID = 496243

// ── HTTP helper ──────────────────────────────────────────────────────────────

function request(options, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null
    const opts = { ...options }
    if (bodyStr) opts.headers = { ...opts.headers, 'Content-Length': Buffer.byteLength(bodyStr) }
    const req = https.request(opts, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null }) }
        catch (e) { reject(new Error(`JSON parse error: ${e.message}\nRaw: ${data.slice(0, 300)}`)) }
      })
    })
    req.on('error', reject)
    if (bodyStr) req.write(bodyStr)
    req.end()
  })
}

// ── Supabase REST helpers ────────────────────────────────────────────────────

const sbHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

const sbHost = new URL(SUPABASE_URL).hostname

async function sbSelect(table, select, filters = '') {
  const path = `/rest/v1/${table}?select=${encodeURIComponent(select)}${filters ? '&' + filters : ''}`
  const { status, body } = await request({ hostname: sbHost, path, method: 'GET', headers: sbHeaders })
  if (status >= 400) throw new Error(`Supabase SELECT ${table} failed (${status}): ${JSON.stringify(body)}`)
  return body
}

async function sbUpsert(table, row) {
  const { status, body } = await request({
    hostname: sbHost,
    path: `/rest/v1/${table}`,
    method: 'POST',
    headers: { ...sbHeaders, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
  }, row)
  if (status >= 400) throw new Error(`Supabase UPSERT ${table} failed (${status}): ${JSON.stringify(body)}`)
}

// ── Portrait JSON schema ─────────────────────────────────────────────────────

const SCHEMA_DESCRIPTION = `
Return ONLY a JSON object with this exact shape (no extra keys, no markdown):
{
  "heading": "A short, evocative title for this reading (max 12 words)",
  "intro": "One or two sentences: frame this as one reading of the film, not the only one. Mention that it contains spoilers and interpretation.",
  "narrative": {
    "heading": "A sentence describing the film's structural shape (max 15 words)",
    "movements": [
      { "label": "Movement I",   "title": "Short title", "body": "One sentence." },
      { "label": "Movement II",  "title": "Short title", "body": "One sentence." },
      { "label": "Movement III", "title": "Short title", "body": "One sentence." }
    ],
    "note": "One sentence connecting the movements to a unifying observation."
  },
  "interpretation": {
    "heading": "An evocative sentence that opens the reading (not a question)",
    "body": "Two to four sentences: the core thematic interpretation. Specific to this film. Interpretive, not plot summary."
  },
  "motifs": [
    { "n": "01", "title": "One or two words", "note": "Four to six words — what the motif does" },
    { "n": "02", "title": "One or two words", "note": "Four to six words" },
    { "n": "03", "title": "One or two words", "note": "Four to six words" },
    { "n": "04", "title": "One or two words", "note": "Four to six words" }
  ],
  "ending": {
    "heading": "Editorial interpretation",
    "body": "Two to four sentences about what the ending does — not what happens, but what it means. Tone: calm, precise, non-academic."
  }
}
`.trim()

const SYSTEM_PROMPT = `You are writing post-watch film portraits for FeelFlick, a personal movie discovery platform.

Your task: given a film's title, overview, and genres, produce a structured post-watch reading that helps a viewer who just finished the film sit with what they experienced.

Voice and constraints:
- Interpretive and specific to THIS film — not generic praise
- Frame it as "one reading, not the only one" — honest about subjectivity
- No awards, box office, critic percentages, or biographical claims about filmmakers
- No fabricated certainty — this is interpretation, not fact
- Calm, precise prose — not academic, not promotional
- Spoilers are expected and appropriate (this is shown only after watching)

Style reference — here is a strong example for Parasite (2019):
Heading: "A deeper reading."
Narrative heading: "The structure is a descent disguised as an ascent."
Movement I – The invitation: "Light-footed, observant, and almost playful as a plan begins to work."
Movement II – The ascent: "The comedy tightens. Every success creates a more fragile arrangement."
Movement III – The rupture: "The film changes temperature without abandoning anything it has built."
Narrative note: "Each apparent upward movement — employment, access, comfort, belonging — depends on someone remaining below."
Interpretation heading: "The tragedy is not that the families fail to understand one another."
Interpretation body: "They understand the hierarchy almost perfectly. The film's cruelty comes from showing how intelligence, affection, and effort operate inside a structure that still keeps people on different levels. Everyone improvises; the architecture remains."
Motif 01 – Levels: "Stairs, basements, hills"
Motif 02 – Smell: "Class made involuntary"
Motif 03 – Rain: "Relief above, disaster below"
Motif 04 – Frames: "Who is seen and contained"
Ending body: "The final plan is emotionally sincere and materially impossible. By letting the imagined future borrow the grammar of a real resolution, the film lets hope briefly feel real before returning to the basement. The cut does not mock the dream; it measures the distance between dreaming and escape."

${SCHEMA_DESCRIPTION}`

// ── OpenAI call ──────────────────────────────────────────────────────────────

function callOpenAI(title, overview, genres) {
  const genreStr = Array.isArray(genres)
    ? genres.map(g => (typeof g === 'object' ? g.name : g)).filter(Boolean).join(', ')
    : (genres || 'unknown')
  const userMessage = `Title: ${title}\nOverview: ${overview || '(no overview available)'}\nGenres: ${genreStr}`

  const body = {
    model: MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
    max_tokens: 1200,
  }

  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body)
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    }, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.error) return reject(new Error(json.error.message))
          const content = json.choices?.[0]?.message?.content
          if (!content) return reject(new Error('Empty response from OpenAI'))
          resolve(JSON.parse(content))
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}\nRaw: ${data.slice(0, 200)}`))
        }
      })
    })
    req.on('error', reject)
    req.write(bodyStr)
    req.end()
  })
}

// ── Validation ───────────────────────────────────────────────────────────────

function validatePortrait(p) {
  for (const k of ['heading', 'intro', 'narrative', 'interpretation', 'motifs', 'ending']) {
    if (!p[k]) return `missing "${k}"`
  }
  if (!Array.isArray(p.narrative?.movements) || p.narrative.movements.length < 2) return 'narrative.movements must have ≥2 items'
  if (!Array.isArray(p.motifs) || p.motifs.length < 2) return 'motifs must have ≥2 items'
  if (!p.interpretation?.heading || !p.interpretation?.body) return 'interpretation missing heading or body'
  if (!p.ending?.body) return 'ending missing body'
  return null
}

// ── Delay helper ─────────────────────────────────────────────────────────────

const delay = ms => new Promise(r => setTimeout(r, ms))

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎬 Film portrait generator\n')

  // 1. Which tmdb_ids already have portraits?
  const existing = await sbSelect('film_portraits', 'tmdb_id')
  const done = new Set((existing || []).map(r => r.tmdb_id))
  console.log(`Already generated: ${done.size}`)

  // 2. Fetch complete movies
  const movies = await sbSelect('movies', 'tmdb_id,title,overview,genres', 'status=eq.complete&order=tmdb_id')

  // 3. Filter: skip Parasite and already-generated
  const todo = (movies || []).filter(m => m.tmdb_id !== PARASITE_TMDB_ID && !done.has(m.tmdb_id))
  console.log(`To generate: ${todo.length} portraits\n`)

  if (todo.length === 0) { console.log('Nothing to do.'); return }

  let succeeded = 0
  let failed = 0

  // 4. Process in batches
  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    const batch = todo.slice(i, i + BATCH_SIZE)

    await Promise.all(batch.map(async (movie) => {
      const { tmdb_id, title, overview, genres } = movie
      process.stdout.write(`  [${tmdb_id}] ${title} … `)
      try {
        const portrait = await callOpenAI(title, overview, genres)
        const err = validatePortrait(portrait)
        if (err) { console.log(`⚠ invalid (${err}) — skipped`); failed++; return }
        await sbUpsert('film_portraits', { tmdb_id, portrait, model: MODEL })
        console.log('✓')
        succeeded++
      } catch (e) {
        console.log(`✗ ${e.message.slice(0, 120)}`)
        failed++
      }
    }))

    if (i + BATCH_SIZE < todo.length) await delay(BATCH_DELAY_MS)
  }

  console.log(`\nDone. ✓ ${succeeded} generated  ✗ ${failed} failed`)
}

main().catch(e => { console.error(e); process.exit(1) })
