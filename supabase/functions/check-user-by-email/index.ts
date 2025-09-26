// Deno - Supabase Edge Function
// Purpose: Return { exists: boolean } for a given email without leaking any other info.

import { createClient } from "jsr:@supabase/supabase-js@2"

// Environment (set as secrets in Supabase; never commit keys)
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

// Admin client (server-side only)
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Allow only your app origins (add preview domains as needed)
const ALLOWED_ORIGINS = new Set<string>([
  "https://app.feelflick.com",
  "http://localhost:5173",
])

function corsHeaders(origin: string | null) {
  const allowed = origin && (ALLOWED_ORIGINS.has(origin) || origin.endsWith(".pages.dev"))
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allowed ? origin : "https://app.feelflick.com",
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
}

// Very simple per-instance throttle
const BUCKET = new Map<string, number[]>()
const WINDOW_MS = 60_000
const LIMIT = 20

Deno.serve(async (req) => {
  const origin = req.headers.get("origin")
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ exists: false }), {
      status: 200,
      headers: corsHeaders(origin),
    })
  }

  try {
    // Throttle by IP
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for") ||
      "anon"
    const now = Date.now()
    const arr = BUCKET.get(ip) ?? []
    const recent = arr.filter((t) => now - t < WINDOW_MS)
    if (recent.length >= LIMIT) {
      return new Response(JSON.stringify({ exists: false }), {
        status: 200,
        headers: corsHeaders(origin),
      })
    }
    recent.push(now)
    BUCKET.set(ip, recent)

    // Parse + normalize
    const { email } = await req.json().catch(() => ({}))
    const e = (email || "").toString().trim().toLowerCase()

    // Quick format check (don’t error; just return false)
    if (!emailRegex.test(e)) {
      return new Response(JSON.stringify({ exists: false }), {
        status: 200,
        headers: corsHeaders(origin),
      })
    }

    // Admin lookup (don’t leak admin errors)
    const { data: { user }, error } = await admin.auth.admin.getUserByEmail(e)
    const exists = Boolean(user) && !Boolean(error)

    return new Response(JSON.stringify({ exists }), {
      status: 200,
      headers: corsHeaders(origin),
    })
  } catch {
    // Generic response on any failure
    return new Response(JSON.stringify({ exists: false }), {
      status: 200,
      headers: corsHeaders(origin),
    })
  }
})