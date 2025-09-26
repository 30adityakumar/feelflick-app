// supabase/functions/check-user-by-email/index.ts
// Deno Deploy / Supabase Edge Function
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// naive in-memory throttle (per instance)
const BUCKET = new Map<string, { ts: number[] }>()
const WINDOW_MS = 60_000
const LIMIT = 20

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'anon'
    const now = Date.now()
    const bucket = BUCKET.get(ip) ?? { ts: [] }
    bucket.ts = bucket.ts.filter(t => now - t < WINDOW_MS)
    if (bucket.ts.length >= LIMIT) {
      return new Response(JSON.stringify({ error: 'Try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    bucket.ts.push(now); BUCKET.set(ip, bucket)

    const { email } = await req.json().catch(() => ({}))
    const e = (email || '').toString().trim().toLowerCase()
    if (!emailRegex.test(e)) {
      return new Response(JSON.stringify({ exists: false }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    const { data: { user }, error } = await admin.auth.admin.getUserByEmail(e)
    if (error && error.message && !/user not found/i.test(error.message)) {
      // generic error (don’t leak)
      return new Response(JSON.stringify({ exists: false }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ exists: Boolean(user) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    // generic response; do not leak details
    return new Response(JSON.stringify({ exists: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})