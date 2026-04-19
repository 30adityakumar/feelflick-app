import OpenAI from 'npm:openai@4'

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })

const rawOrigins = Deno.env.get('ALLOWED_ORIGINS') ?? 'https://feelflick.app'
const ALLOWED_ORIGINS = rawOrigins.split(',').map((s) => s.trim())

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

// Simple in-memory rate limiter: 10 requests/min per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isAllowed(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

const SYSTEM_PROMPT = `You are FeelFlick's emotional film curator.
You match movies to human emotions with precision and poetry.
Never be generic. Every explanation should feel personal and specific.
When scoring: 95-100 = transcendent match, 80-94 = strong match,
65-79 = good match, below 65 = passable but included.

CRITICAL OUTPUT ORDER — you must strictly follow this sequence:
Write the narration text first (1–2 sentences). Stream it token by token.
On a new line, write exactly: ---EXPLANATIONS---
Write the explanations JSON array. Output the complete array.
Do NOT interleave these two sections. The narration must finish before
the delimiter appears, and the JSON array must be complete and valid.`

const PARSE_SYSTEM_PROMPT = `You are FeelFlick's mood signal parser.
Extract numerical dial values from a user's freeform mood description.
Respond ONLY with valid JSON — no markdown, no explanation, no preamble.
All values must be integers in the range 1–5.`

interface MovieInput {
  tmdbId: number
  title: string
  vote_average: number
  mood_tags?: string[]
  tone_tags?: string[]
  fit_profile?: string
}

interface RequestBody {
  action?: 'parse'
  mood: string
  context: string
  experience: string
  intensity: number
  pacing: number
  timeOfDay: string
  movies: MovieInput[]
  top3Genres?: string[]
  freeText?: string
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') ?? ''
  const headers = corsHeaders(origin)

  if (req.method === 'OPTIONS') return new Response(null, { headers })
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers })
  }

  // Verify Supabase anon key
  const authHeader = req.headers.get('authorization')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!authHeader || authHeader !== `Bearer ${anonKey}`) {
    return new Response('Unauthorized', { status: 401, headers })
  }

  // Rate limit by client IP
  const ip = req.headers.get('x-forwarded-for') ?? 'anon'
  if (!isAllowed(ip)) {
    return new Response('Too Many Requests', { status: 429, headers })
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return new Response('Bad Request', { status: 400, headers })
  }

  // ── action: 'parse' — synchronous dial extraction ────────────────────────
  if (body.action === 'parse') {
    const moodName = body.mood ?? ''
    const freeText = body.freeText ?? ''

    if (!freeText.trim()) {
      return new Response(JSON.stringify(null), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }

    const userMessage = `The user selected the mood category: "${moodName}"
They described their feeling: "${freeText}"

Extract four dial values:
- intensity: 1 (gentle/soft/soothing) to 5 (heavy/intense/overwhelming). Default 3.
- pacing: 1 (slow/contemplative/quiet) to 5 (fast/action-packed/kinetic). Default 3.
- viewingContext: 1=Watching alone, 2=With partner, 3=Friend group, 4=Family, 5=Large group. Default 1.
- experienceType: 1=Discover something new, 2=Comfortable rewatch, 3=Nostalgia trip, 4=Learn something, 5=Be challenged. Default 1.

Respond ONLY with this JSON (no other text):
{"intensity":<1-5>,"pacing":<1-5>,"viewingContext":<1-5>,"experienceType":<1-5>}`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: PARSE_SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        stream: false,
        max_tokens: 60,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      })

      const raw = completion.choices[0]?.message?.content?.trim() ?? '{}'
      const parsed = JSON.parse(raw)

      return new Response(JSON.stringify(parsed), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    } catch {
      return new Response(JSON.stringify(null), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const { mood, context, experience, intensity, pacing, timeOfDay, movies, top3Genres } = body

  if (!mood || !Array.isArray(movies) || movies.length === 0) {
    return new Response('Bad Request: mood and movies are required', { status: 400, headers })
  }

  const movieList = movies
    .map((m, i) => {
      const tags = [
        m.mood_tags?.length ? `mood: ${m.mood_tags.slice(0, 5).join(', ')}` : '',
        m.tone_tags?.length ? `tone: ${m.tone_tags.slice(0, 3).join(', ')}` : '',
        m.fit_profile ? `type: ${m.fit_profile.replace(/_/g, ' ')}` : '',
      ].filter(Boolean).join(' | ')
      return `${i + 1}. "${m.title}" (rating: ${m.vote_average}/10, tmdbId: ${m.tmdbId})${tags ? ` — ${tags}` : ''}`
    })
    .join('\n')

  const genreHint = top3Genres?.length
    ? `\nUser's top genres: ${top3Genres.join(', ')}`
    : ''

  const userMessage = `Mood: ${mood}
Watching with: ${context}
Wants to: ${experience}
Intensity: ${intensity}/5 | Pacing: ${pacing}/5 | Time of day: ${timeOfDay}${genreHint}

Movies to evaluate:
${movieList}

First, write a 1-2 sentence loading narration (max 40 words, second-person, poetic, cinematic — do NOT mention any movie titles).
Then write exactly this on its own line: ---EXPLANATIONS---
Then write a JSON array, in the exact same order as the movies above:
[{"movieId":<tmdbId>,"explanation":"<12 words or fewer, must mention the mood by name>","score":<0-100>}]`

  let stream
  try {
    stream = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      stream: true,
      max_tokens: 600,
      temperature: 0.8,
    })
  } catch {
    return new Response('AI service unavailable', { status: 502, headers })
  }

  const encoder = new TextEncoder()
  const responseStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) controller.enqueue(encoder.encode(text))
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(responseStream, {
    headers: {
      ...headers,
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
})
