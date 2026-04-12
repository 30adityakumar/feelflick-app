import OpenAI from 'npm:openai@4'
import { createClient } from 'npm:@supabase/supabase-js@2'

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })

const rawOrigins = Deno.env.get('ALLOWED_ORIGINS') ?? 'https://feelflick.app'
const ALLOWED_ORIGINS = rawOrigins.split(',').map((s) => s.trim())

const FALLBACK_PROMPT = 'What stayed with you after the credits?'

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

// Rate limiter: 5 requests/min per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isAllowed(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

function pacingLabel(score: number | null): string {
  if (score == null) return 'measured'
  if (score < 40) return 'slow and meditative'
  if (score < 70) return 'measured'
  return 'fast-paced'
}

function intensityLabel(score: number | null): string {
  if (score == null) return 'moderate'
  if (score < 40) return 'gentle'
  if (score < 70) return 'moderate'
  return 'intense'
}

const SYSTEM_PROMPT = `You are FeelFlick's post-watch reflection writer.
Write a single reflection question for someone who just watched a film.
The question must be SPECIFIC to that film's themes, not generic.
Bad example: "What did you think?"
Good example: "Did the ending of The Truman Show feel like escape or resignation to you?"
Respond ONLY with the question — no preamble, no quotes, no explanation.
Maximum 20 words. Must end with a question mark.`

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') ?? ''
  const headers = corsHeaders(origin)

  if (req.method === 'OPTIONS') return new Response(null, { headers })
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers })
  }

  const authHeader = req.headers.get('authorization')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!authHeader || authHeader !== `Bearer ${anonKey}`) {
    return new Response('Unauthorized', { status: 401, headers })
  }

  const ip = req.headers.get('x-forwarded-for') ?? 'anon'
  if (!isAllowed(ip)) {
    return new Response('Too Many Requests', { status: 429, headers })
  }

  let tmdbId: number
  try {
    const body = await req.json()
    tmdbId = Number(body.tmdbId)
    if (!tmdbId || isNaN(tmdbId)) throw new Error('invalid tmdbId')
  } catch {
    return new Response(JSON.stringify({ prompt: FALLBACK_PROMPT }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  // Fetch movie from DB using anon key (public read via RLS)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  )

  try {
    const { data: movie } = await supabase
      .from('movies')
      .select('title, overview, genres, pacing_score, intensity_score, release_year')
      .eq('tmdb_id', tmdbId)
      .maybeSingle()

    if (!movie) {
      return new Response(JSON.stringify({ prompt: FALLBACK_PROMPT }), {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }

    const genreNames = Array.isArray(movie.genres) ? movie.genres.slice(0, 3).join(', ') : (movie.genres ?? '')
    const releaseYear = movie.release_year ?? ''

    const userMessage = `Movie: "${movie.title}" (${releaseYear})
Genres: ${genreNames}
Tone: ${pacingLabel(movie.pacing_score)} pacing, ${intensityLabel(movie.intensity_score)} intensity
Overview: "${String(movie.overview ?? '').slice(0, 120)}"

Write one specific reflection question about this film.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      stream: false,
      max_tokens: 40,
      temperature: 0.7,
    })

    const prompt = completion.choices[0]?.message?.content?.trim() ?? FALLBACK_PROMPT

    return new Response(JSON.stringify({ prompt }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ prompt: FALLBACK_PROMPT }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }
})
