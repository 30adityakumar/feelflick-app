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
65-79 = good match, below 65 = passable but included.`

interface MovieInput {
  tmdbId: number
  title: string
  vote_average: number
}

interface RequestBody {
  mood: string
  context: string
  experience: string
  intensity: number
  pacing: number
  timeOfDay: string
  movies: MovieInput[]
  moodId?: number
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

  const { mood, context, experience, intensity, pacing, timeOfDay, movies, moodId: _moodId } = body

  const movieList = movies
    .map((m, i) => `${i + 1}. "${m.title}" (rating: ${m.vote_average}/10, tmdbId: ${m.tmdbId})`)
    .join('\n')

  const userMessage = `Mood: ${mood}
Watching with: ${context}
Wants to: ${experience}
Intensity: ${intensity}/5 | Pacing: ${pacing}/5 | Time of day: ${timeOfDay}

Movies to evaluate:
${movieList}

First, write a 1-2 sentence loading narration (max 40 words, second-person, poetic, cinematic — do NOT mention any movie titles).
Then write exactly this on its own line: ---EXPLANATIONS---
Then write a JSON array, in the exact same order as the movies above:
[{"movieId":<tmdbId>,"explanation":"<12 words or fewer, must mention the mood by name>","score":<0-100>}]`

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    stream: true,
    max_tokens: 600,
    temperature: 0.8,
  })

  const encoder = new TextEncoder()
  const responseStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) controller.enqueue(encoder.encode(text))
      }
      controller.close()
    },
  })

  return new Response(responseStream, {
    headers: {
      ...headers,
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
})
