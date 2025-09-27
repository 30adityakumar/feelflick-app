// supabase/functions/check-user-by-email/index.ts
// Edge Function: check-user-by-email
// Returns { exists: boolean } without leaking any other info.

import { createClient } from "npm:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Optional env: ALLOWED_ORIGINS="https://app.feelflick.com,http://localhost:5173"
const ENV_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

const DEFAULT_ORIGINS = new Set([
  "https://app.feelflick.com",
  "http://localhost:5173",
])

function isAllowedOrigin(origin: string | null) {
  if (!origin) return false
  if (DEFAULT_ORIGINS.has(origin)) return true
  if (origin.endsWith(".pages.dev")) return true
  if (ENV_ORIGINS.includes(origin)) return true
  return false
}

function corsHeaders(origin: string | null) {
  const allow = isAllowedOrigin(origin)
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allow ? (origin as string) : "https://app.feelflick.com",
    Vary: "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
}

// tiny in-memory throttle
const BUCKET = new Map<string, number[]>()
const WINDOW_MS = 60_000
const LIMIT = 20

Deno.serve(async (req) => {
  const origin = req.headers.get("origin")

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  // Only POST
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
      return new Response(JSON.stringify({ exists: false }), {
        status: 200,
        headers: corsHeaders(origin),
      })
    }

    // admin lookup
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