// supabase/functions/generate-movie-overlay/index.ts
//
// Auto-generates the editorial overlay (FF Take + critic-style pull quotes +
// daypart_fit) for any film. Lets /movie/:id show the marquee editorial
// moments — TheTake, CriticQuotes, "Best watched · X" — for any film instead
// of just the one Parasite row that's hand-curated today.
//
// Pattern mirrors generate-taste-summary: anon-key auth, CORS allowlist,
// 5-req/min IP rate limit, graceful 200-with-empty on every failure path so
// the movie page never breaks on regen errors.
//
// Writes the result directly to movies_editorial_overlay via service_role so
// the next /movie/:id load reads from cache instead of hitting OpenAI again.

import OpenAI from 'npm:openai@4'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, anonClient, hashIp, guardPublic } from '../_shared/llmGuard.ts'

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Durable GLOBAL daily budget kill-switch (the real cost cap for this bulk/backfill service).
// Per-caller limits are intentionally DISABLED (cooldown 0, cap -1) so a legitimate bulk backfill
// from one source isn't throttled; the global budget bounds total daily spend. NOTE: this remains
// anon-key gated — converting it to a dedicated service secret is a recommended follow-up.
const FN_NAME = 'generate-movie-overlay'
const GLOBAL_BUDGET = Number(Deno.env.get('LLM_GLOBAL_DAILY_BUDGET') ?? '5000')

const EMPTY = { ff_take: null, critic_quotes: null, daypart_fit: null }

const SYSTEM_PROMPT = `You write for FeelFlick. Voice: smart friend with great taste. Not a critic, not marketing.

For ONE film, produce three pieces of copy:

1. ff_take — a short hook that makes someone curious to watch.
   { byline, body, meta }
   - body: 2-3 short sentences. ≤60 words. Plain English. Concrete.
     OPEN with a specific, interesting thing about the film — a stat, a craft
     choice, a paradox, a thing that surprised the friend who saw it. Then one
     beat about what it actually feels like to watch. NEVER summarise plot.
     NEVER pitch — if it's boring, say so honestly.
   - byline: 2-4 words. ROTATE — do not default to the same byline every
     time. Pick from this rotation based on the film's tone:
       sober/dramatic → "Worth knowing", "One thing", "The note"
       playful/light  → "The hook", "Quick read", "Heads up"
       reflective     → "The take", "What stays", "The angle"
     Never "The FeelFlick Take".
   - meta: one quiet line. Examples: "est. read · 20 sec", "for your taste".

   GOOD: "Three hours of voiceover that never lets you breathe. Scorsese
   hands you a kid and walks him into the mob — and you keep watching long
   after he stops being someone to root for."

   GOOD: "The dialogue is famously bad on paper. On screen it lands because
   everyone is committing the same crime at the same intensity. Worth it for
   the bowling alley scene alone."

   GOOD: "Bong shoots the staircase like it's a character. The film's reveal
   is in the architecture before it's in the dialogue."

   BAD: "A visceral, kinetic chronicle of class tension whose register shifts
   with masterful immediacy."  ← critic-cosplay, banned.

2. critic_quotes — exactly 2 short pull quotes, friend-voice not critic-voice.
   [{ quote, author, outlet }, { quote, author, outlet }]
   - Each quote ≤18 words. Specific. Observational. A reaction, not a review.
   - GOOD: "I watched it twice in one week and still don't know what to do
     with the ending."
   - GOOD: "The kind of film you text someone about at 1am."
   - BAD: "A masterful tour de force of cinematic immersion." ← banned shape.
   - author: invent a persona that signals the role. Use natural English
     phrasing — no hyphenated fragments. Good: "A patient viewer", "Someone
     who rewatches", "A first-time viewer", "The 1am text", "A friend with
     taste", "After one watch", "A weekend viewer". No real critic names.
     BAD: "First-time-through", "Late-night-watcher" (sound like glitches).
   - outlet: brand-evocative. "FF Notebook", "The Reading Room",
     "The Patient Index", "Group chat".

3. daypart_fit — when's it best?
   2-4 words. Lowercase. Examples: "sunday afternoon", "late-night solo",
   "weeknight wind-down", "saturday with friends", "rainy sunday".

BANNED WORDS — never use, even in synonym form:
  chronicle, texture, register, undercurrents, immediacy, kinetic, visceral,
  masterful, tour de force, masterpiece, rollercoaster, epic journey,
  cinematic universe, immersive, captivating, breathtaking, riveting,
  haunting, sweeping, unflinching, lyrical, meditative, profound.

OTHER RULES:
- Short sentences. Plain words. The kind of thing a friend would actually say.
- Specifics over adjectives. "Three hours" beats "long". "The bowling alley
  scene" beats "memorable scenes".
- No emoji. No exclamation marks. No marketing voice.
- If the signals are thin, write less. Two honest sentences beats four padded.
- Present tense.

Output strictly as JSON:
{
  "ff_take": { "byline": "...", "body": "...", "meta": "..." },
  "critic_quotes": [
    { "quote": "...", "author": "...", "outlet": "..." },
    { "quote": "...", "author": "...", "outlet": "..." }
  ],
  "daypart_fit": "..."
}`

interface RequestBody {
  movieId?: number       // internal movies.id — used to upsert the result
  title?: string
  director?: string
  year?: number
  runtimeMinutes?: number
  genres?: string[]
  moodTags?: string[]
  toneTags?: string[]
  fitProfile?: string
  overview?: string
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') ?? ''
  const headers = corsHeaders(origin)

  if (req.method === 'OPTIONS') return new Response(null, { headers })
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers })
  }

  // Anon key gate — same as generate-taste-summary.
  const authHeader = req.headers.get('authorization')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!authHeader || authHeader !== `Bearer ${anonKey}`) {
    return new Response('Unauthorized', { status: 401, headers })
  }

  // Durable GLOBAL budget kill-switch (per-caller limits disabled for the bulk backfill — cooldown 0,
  // cap -1). The gate RPC is granted to anon/authenticated, so use an anon-key client (not the
  // service-role one). Denials degrade to EMPTY.
  const overlayGateClient = anonClient()
  if (overlayGateClient) {
    const overlayCallerKey = 'ip:' + hashIp(req.headers.get('x-forwarded-for') ?? 'anon')
    const overlayGate = await guardPublic(overlayGateClient, { functionName: FN_NAME, callerKey: overlayCallerKey, cooldownSecs: 0, dailyCap: -1, globalCap: GLOBAL_BUDGET })
    if (!overlayGate.allowed) {
      return new Response(JSON.stringify(EMPTY), { headers: { ...headers, 'Content-Type': 'application/json' } })
    }
  }

  let body: RequestBody
  try { body = await req.json() } catch {
    return new Response(JSON.stringify(EMPTY), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  const {
    movieId, title, director, year, runtimeMinutes,
    genres = [], moodTags = [], toneTags = [], fitProfile, overview,
  } = body

  if (!title) {
    return new Response(JSON.stringify(EMPTY), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  const userMessage = `Film: ${title}${year ? ` (${year})` : ''}${director ? `, directed by ${director}` : ''}
Genres: ${genres.length ? genres.join(', ') : '—'}
Mood signature: ${moodTags.length ? moodTags.slice(0, 6).join(', ') : '—'}
Tone signature: ${toneTags.length ? toneTags.slice(0, 4).join(', ') : '—'}
Fit profile: ${fitProfile || '—'}
Runtime: ${runtimeMinutes ? `${runtimeMinutes} min` : '—'}
Synopsis: ${overview || '—'}

Return the JSON now.`

  let result = EMPTY
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userMessage },
      ],
      stream: false,
      max_tokens: 600,
      temperature: 0.85,
      response_format: { type: 'json_object' },
    })
    const raw = completion.choices[0]?.message?.content?.trim() ?? ''
    try {
      const parsed = JSON.parse(raw)
      result = {
        ff_take: (parsed?.ff_take && typeof parsed.ff_take === 'object') ? parsed.ff_take : null,
        critic_quotes: Array.isArray(parsed?.critic_quotes) ? parsed.critic_quotes : null,
        daypart_fit: typeof parsed?.daypart_fit === 'string' ? parsed.daypart_fit.trim() : null,
      }
    } catch {
      // Model returned non-JSON despite response_format — fall back to empty.
      result = EMPTY
    }
  } catch (err) {
    console.error('[generate-movie-overlay] OpenAI error:', err)
    return new Response(JSON.stringify(EMPTY), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  // Cache to movies_editorial_overlay so the next page load reads from DB
  // instead of regenerating. Caller (the /movie/:id page) only fires this
  // request when no overlay row exists yet, so we INSERT, but use upsert so
  // a race between two simultaneous opens is safe.
  if (movieId && (result.ff_take || result.critic_quotes || result.daypart_fit)) {
    try {
      await supabase.from('movies_editorial_overlay').upsert({
        movie_id: movieId,
        ff_take: result.ff_take,
        critic_quotes: result.critic_quotes,
        daypart_fit: result.daypart_fit,
      }, { onConflict: 'movie_id' })
    } catch (err) {
      console.warn('[generate-movie-overlay] DB upsert failed:', err)
      // Don't fail the response — caller will still get the generated payload.
    }
  }

  return new Response(JSON.stringify(result), {
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
})
