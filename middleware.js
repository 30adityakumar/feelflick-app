import { next } from '@vercel/edge'

const BOT_PATTERNS = [
  'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot',
  'Slackbot', 'WhatsApp', 'TelegramBot', 'Discordbot',
  'googlebot', 'bingbot', 'Applebot', 'iMessage'
]

export const config = {
  matcher: ['/movie/:id', '/lists/:id'],
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || ''
  const isBot = BOT_PATTERNS.some(p =>
    ua.toLowerCase().includes(p.toLowerCase())
  )

  if (!isBot) return next()

  const url = new URL(request.url)

  // Route to the appropriate handler
  if (url.pathname.startsWith('/movie/')) {
    return handleMovieBot(request, url)
  }
  if (url.pathname.startsWith('/lists/')) {
    return handleListBot(request, url)
  }

  return next()
}

// === SHARED HELPERS ===

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

async function injectMeta(request, { title, description, image, url, ogType }) {
  const htmlRes = await fetch(new URL('/', request.url).toString())
  let html = await htmlRes.text()

  const metaBlock = `
    <title>${title}</title>
    <meta name="description" content="${escapeAttr(description)}" />
    <meta property="og:title" content="${escapeAttr(title)}" />
    <meta property="og:description" content="${escapeAttr(description)}" />
    <meta property="og:image" content="${escapeAttr(image)}" />
    <meta property="og:url" content="${escapeAttr(url)}" />
    <meta property="og:type" content="${escapeAttr(ogType)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(title)}" />
    <meta name="twitter:description" content="${escapeAttr(description)}" />
    <meta name="twitter:image" content="${escapeAttr(image)}" />
    <meta name="twitter:url" content="${escapeAttr(url)}" />
    <link rel="canonical" href="${escapeAttr(url)}" />`

  html = html
    .replace(/<title>[^<]*<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/i, '')
    .replace(/<meta property="og:title"[^>]*>/i, '')
    .replace(/<meta property="og:description"[^>]*>/i, '')
    .replace(/<meta property="og:image"[^>]*>/i, '')
    .replace(/<meta property="og:url"[^>]*>/i, '')
    .replace(/<meta property="og:type"[^>]*>/i, '')
    .replace(/<meta name="twitter:card"[^>]*>/i, '')
    .replace(/<meta name="twitter:title"[^>]*>/i, '')
    .replace(/<meta name="twitter:description"[^>]*>/i, '')
    .replace(/<meta name="twitter:image"[^>]*>/i, '')
    .replace(/<meta name="twitter:url"[^>]*>/i, '')
    .replace(/<link rel="canonical"[^>]*>/i, '')
    .replace('</head>', `${metaBlock}\n</head>`)

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}

// === MOVIE HANDLER ===

async function handleMovieBot(request, url) {
  const movieId = url.pathname.split('/movie/')[1]
  if (!movieId) return next()

  try {
    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?language=en-US`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}`,
          accept: 'application/json',
        },
      }
    )

    if (!tmdbRes.ok) return next()
    const movie = await tmdbRes.json()

    const title = movie.title || 'FeelFlick'
    const year = movie.release_date
      ? new Date(movie.release_date).getFullYear()
      : null
    const pageTitle = `${title}${year ? ` (${year})` : ''} — FeelFlick`
    const description = movie.overview
      ? `${movie.overview.slice(0, 150).trim()}… Discover ${title} and more on FeelFlick.`
      : 'Discover movies based on your mood. Fast, private, and always free.'
    const image = movie.poster_path
      ? `https://image.tmdb.org/t/p/w1280${movie.poster_path}`
      : 'https://app.feelflick.com/og.jpg'

    return injectMeta(request, {
      title: pageTitle,
      description,
      image,
      url: `https://app.feelflick.com/movie/${movieId}`,
      ogType: 'video.movie',
    })
  } catch {
    return next()
  }
}

// === LIST HANDLER ===

async function handleListBot(request, url) {
  const listId = url.pathname.split('/lists/')[1]
  if (!listId) return next()

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return next()

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    Accept: 'application/json',
  }

  try {
    // Fetch list, first movie poster, and owner in parallel
    const [listRes, moviesRes] = await Promise.all([
      fetch(
        `${supabaseUrl}/rest/v1/lists?id=eq.${listId}&is_public=eq.true&select=title,description,user_id`,
        { headers }
      ),
      fetch(
        `${supabaseUrl}/rest/v1/list_movies?list_id=eq.${listId}&select=movie_id,movies(poster_path)&order=position.asc&limit=1`,
        { headers }
      ),
    ])

    if (!listRes.ok) return next()
    const lists = await listRes.json()
    if (!lists.length) return next()
    const list = lists[0]

    // Fetch owner name
    const ownerRes = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${list.user_id}&select=name`,
      { headers }
    )
    const owners = ownerRes.ok ? await ownerRes.json() : []
    const ownerName = owners[0]?.name || 'Someone'

    // Build poster image
    const moviesData = await moviesRes.json()
    const posterPath = moviesData?.[0]?.movies?.poster_path
    const image = posterPath
      ? `https://image.tmdb.org/t/p/w1280${posterPath}`
      : 'https://app.feelflick.com/og.jpg'

    const pageTitle = `${list.title} — a FeelFlick list by ${ownerName}`
    const description = list.description
      || `A curated film list by ${ownerName} on FeelFlick.`

    return injectMeta(request, {
      title: pageTitle,
      description,
      image,
      url: `https://app.feelflick.com/lists/${listId}`,
      ogType: 'website',
    })
  } catch {
    return next()
  }
}
