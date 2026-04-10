import { next } from '@vercel/edge'

const BOT_PATTERNS = [
  'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot',
  'Slackbot', 'WhatsApp', 'TelegramBot', 'Discordbot',
  'googlebot', 'bingbot', 'Applebot', 'iMessage'
]

export const config = {
  matcher: ['/movie/:id'],
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || ''
  const isBot = BOT_PATTERNS.some(p =>
    ua.toLowerCase().includes(p.toLowerCase())
  )

  if (!isBot) return next()

  const url = new URL(request.url)
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
    const canonicalUrl = `https://app.feelflick.com/movie/${movieId}`

    const htmlRes = await fetch(new URL('/', request.url).toString())
    let html = await htmlRes.text()

    const metaBlock = `
    <title>${pageTitle}</title>
    <meta name="description" content="${escapeAttr(description)}" />
    <meta property="og:title" content="${escapeAttr(pageTitle)}" />
    <meta property="og:description" content="${escapeAttr(description)}" />
    <meta property="og:image" content="${escapeAttr(image)}" />
    <meta property="og:url" content="${escapeAttr(canonicalUrl)}" />
    <meta property="og:type" content="video.movie" />
    <meta name="twitter:title" content="${escapeAttr(pageTitle)}" />
    <meta name="twitter:description" content="${escapeAttr(description)}" />
    <meta name="twitter:image" content="${escapeAttr(image)}" />
    <meta name="twitter:url" content="${escapeAttr(canonicalUrl)}" />
    <link rel="canonical" href="${escapeAttr(canonicalUrl)}" />`

    html = html
      .replace(/<title>[^<]*<\/title>/, '')
      .replace(/<meta name="description"[^>]*>/i, '')
      .replace(/<meta property="og:title"[^>]*>/i, '')
      .replace(/<meta property="og:description"[^>]*>/i, '')
      .replace(/<meta property="og:image"[^>]*>/i, '')
      .replace(/<meta property="og:url"[^>]*>/i, '')
      .replace(/<meta property="og:type"[^>]*>/i, '')
      .replace(/<meta name="twitter:title"[^>]*>/i, '')
      .replace(/<meta name="twitter:description"[^>]*>/i, '')
      .replace(/<meta name="twitter:image"[^>]*>/i, '')
      .replace(/<meta name="twitter:url"[^>]*>/i, '')
      .replace(/<link rel="canonical"[^>]*>/i, '')
      .replace('</head>', `${metaBlock}\n</head>`)

    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  } catch {
    return next()
  }
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
