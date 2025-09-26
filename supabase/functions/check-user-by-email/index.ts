// supabase/functions/check-user-by-email/index.ts
import { createClient } from "npm:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Add any preview domains you use
const ALLOWED_ORIGINS = new Set<string>([
  "https://app.feelflick.com",
  "http://localhost:5173",
])
function corsHeaders(origin: string | null) {
  const allow =
    !!origin &&
    (ALLOWED_ORIGINS.has(origin) || origin.endsWith(".pages.dev"))
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allow ? origin : "https://app.feelflick.com",
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  }
}

// tiny per-instance throttle
const BUCKET = new Map<string, number[]>()
const WINDOW_MS = 60_000
const LIMIT = 20

Deno.serve(async (req) => {
  const origin = req.headers.get("origin")

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  // Only POST is supported
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ exists: false }), {
      status: 200,
      headers: corsHeaders(origin),
    })
  }

  try {
    // throttle by IP
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for") ||
      "anon"
    const now = Date.now()
    const recent = (BUCKET.get(ip) || []).filter((t) => now - t < WINDOW_MS)
    if (recent.length >= LIMIT) {
      return new Response(JSON.stringify({ exists: false }), {
        status: 200,
        headers: corsHeaders(origin),
      })
    }
    recent.push(now)
    BUCKET.set(ip, recent)

    // parse + normalize
    const { email } = await req.json().catch(() => ({}))
    const e = (email || "").toString().trim().toLowerCase()

    if (!emailRegex.test(e)) {
      // invalid format → just say false (don’t leak)
      return new Response(JSON.stringify({ exists: false }), {
        status: 200,
        headers: corsHeaders(origin),
      })
    }

    // admin lookup (suppress detailed errors)
    const { data: { user }, error } = await admin.auth.admin.getUserByEmail(e)
    const exists = !!user && !error

    return new Response(JSON.stringify({ exists }), {
      status: 200,
      headers: corsHeaders(origin),
    })
  } catch {
    return new Response(JSON.stringify({ exists: false }), {
      status: 200,
      headers: corsHeaders(origin),
    })
  }
})