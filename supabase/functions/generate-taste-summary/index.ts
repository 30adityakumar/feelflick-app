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

// Simple in-memory rate limiter: 5 requests/min per IP
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

const FALLBACK_SUMMARY = ''

const SYSTEM_PROMPT = `You write one-line taste summaries for a cinema app called FeelFlick.

Your job is to describe a person's film taste in a way that feels specific, observant, and lightly witty.

You will be given a list of films this person actually watched — this is your PRIMARY signal. Use your knowledge of those specific films to understand their taste: the themes they return to, the directors they gravitate toward, the emotional register they prefer, the kind of stories that seem to speak to them.

The genre percentages, directors, and moods are supporting context only — treat them as secondary confirmation, not the foundation of your line.

Write like a smart, culturally literate friend who has seen their watch history and instantly gets their taste. The humor should be dry, subtle, and tasteful — more knowing than punchline-driven.

Rules:
- Write in second person
- Exactly one sentence
- Maximum 18 words
- Reference specific films or directors from their history when it sharpens the line
- Prioritize what the actual films reveal over what the genre tags say
- Prioritize specificity over cleverness
- Sound human, concise, and emotionally intelligent
- Be witty only when it feels natural
- Avoid generic praise like "great taste" or "unique taste"
- Avoid clichés like "epic journeys," "rollercoaster," "masterpieces," or "cinematic universe"
- Avoid metaphors
- Avoid sounding promotional, cheesy, or AI-generated
- Avoid obvious jokes, internet slang, or forced humor
- Do not list data back mechanically
- Do not use quotation marks
- No emoji
- End without a period if it flows better

Examples of good outputs:
- You like your films emotionally complicated, visually precise, and preferably directed by someone with trust issues
- You lean toward longing, restraint, and directors who think subtle devastation is a valid personality
- You like warmth, melancholy, and just enough whimsy to avoid admitting how sad your taste really is
- You want your films sharp, controlled, and a little unwell, which explains the Fincher and Villeneuve overlap`

interface RequestBody {
  genres: Array<{ name: string; pct: number }>
  directors: Array<{ name: string; count: number }>
  moods: Array<{ name: string; sessions: number }>
  totalWatched: number
  avgRating: number
  ratingLabel: string
  watchedFilms: string[]
  taggedTasteSignature?: {
    topMoodTags?: Array<{ tag: string; count: number }>
    topToneTags?: Array<{ tag: string; count: number }>
    topFitProfiles?: Array<{ profile: string; count: number }>
  }
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
    return new Response(JSON.stringify({ summary: FALLBACK_SUMMARY }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    // Bad JSON — return fallback, not 400
    return new Response(JSON.stringify({ summary: FALLBACK_SUMMARY }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  const { genres = [], directors = [], moods = [], totalWatched = 0, avgRating = 0, ratingLabel = '', watchedFilms = [], taggedTasteSignature } = body

  // Not enough data to generate anything meaningful
  if (!genres.length) {
    return new Response(JSON.stringify({ summary: FALLBACK_SUMMARY }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  const g1 = genres[0]?.name ?? '?', p1 = genres[0]?.pct ?? 0
  const g2 = genres[1]?.name ?? '?', p2 = genres[1]?.pct ?? 0
  const g3 = genres[2]?.name ?? '?', p3 = genres[2]?.pct ?? 0
  const d1 = directors[0]?.name ?? 'none', d2 = directors[1]?.name ?? 'none', d3 = directors[2]?.name ?? 'none'
  const m1 = moods[0]?.name ?? 'varied', m2 = moods[1]?.name ?? 'varied'

  const filmList = watchedFilms.slice(0, 20).join(', ')

  const moodTagLine = taggedTasteSignature?.topMoodTags?.length
    ? `Mood signature: ${taggedTasteSignature.topMoodTags.slice(0, 6).map(t => t.tag).join(', ')}`
    : ''
  const toneTagLine = taggedTasteSignature?.topToneTags?.length
    ? `Tone signature: ${taggedTasteSignature.topToneTags.slice(0, 4).map(t => t.tag).join(', ')}`
    : ''
  const fitLine = taggedTasteSignature?.topFitProfiles?.length
    ? `Prefers: ${taggedTasteSignature.topFitProfiles.slice(0, 3).map(t => t.profile.replace(/_/g, ' ')).join(' + ')}`
    : ''
  const signatureBlock = [moodTagLine, toneTagLine, fitLine].filter(Boolean).join('\n')

  const userMessage = filmList
    ? `Here is this person's watch history (most recent first):
${filmList}
${signatureBlock ? `\nTaste signature (aggregated across their watches):\n${signatureBlock}\n` : ''}
Supporting context (use lightly):
- Top genres: ${g1} (${p1}%), ${g2} (${p2}%), ${g3} (${p3}%)
- Top directors: ${d1}, ${d2}, ${d3}
- Top moods: ${m1}, ${m2}

Look at the actual films they watched and their mood signature. What cinematic identity emerges — what themes they return to, what emotional register they prefer, what kind of stories speak to them?

Write one sharp line that captures this person's cinematic identity. Root it in the films and their mood patterns.`
    : `Top genres: ${g1} (${p1}%), ${g2} (${p2}%), ${g3} (${p3}%).
Top directors: ${d1}, ${d2}, ${d3}.
Top moods: ${m1}, ${m2}.

Write one sharp line that captures this person's taste.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      stream: false,
      max_tokens: 50,
      temperature: 0.8,
    })

    const summary = completion.choices[0]?.message?.content?.trim() ?? FALLBACK_SUMMARY

    return new Response(JSON.stringify({ summary }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[generate-taste-summary] OpenAI error:', err)
    // Return 200 with fallback — never break the profile page
    return new Response(JSON.stringify({ summary: FALLBACK_SUMMARY }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }
})
