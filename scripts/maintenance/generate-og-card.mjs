// Generates the branded 1200×630 social share card → public/og.jpg
//
// WHY: og:image (index.html) + the middleware fallback both point at /og.jpg.
// That asset was never in the repo, so it served the SPA HTML shell (content-type
// text/html) — every non-movie share showed a broken preview. This renders a real
// JPEG on-brand with the editorial language so the card is reproducible + version-
// controlled, not a magic binary uploaded out-of-band.
//
// Run from repo root (uses the root @playwright/test):  node scripts/maintenance/generate-og-card.mjs
import { chromium } from '@playwright/test'
import { resolve } from 'node:path'

const OUT = resolve(process.cwd(), 'public/og.jpg')
const W = 1200
const H = 630

// On-brand card: dark base (#06060a), purple→pink glow blobs, Outfit display with
// an italic gradient accent fragment, the approved hero + "right film, right now" copy.
const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Outfit:wght@200;300;400;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px}
  body{background:#06060a;position:relative;overflow:hidden;font-family:'Outfit','Inter',sans-serif;color:#fff;-webkit-font-smoothing:antialiased}
  .glow1{position:absolute;top:-200px;left:-140px;width:600px;height:600px;border-radius:50%;
    background:radial-gradient(closest-side,rgba(147,51,234,0.50),rgba(147,51,234,0) 70%);filter:blur(30px)}
  .glow2{position:absolute;bottom:-220px;right:-120px;width:640px;height:640px;border-radius:50%;
    background:radial-gradient(closest-side,rgba(236,72,153,0.42),rgba(236,72,153,0) 70%);filter:blur(30px)}
  .grain{position:absolute;inset:0;background:radial-gradient(120%_90%_at_50%_0%,rgba(255,255,255,0.05),rgba(255,255,255,0) 60%)}
  .wrap{position:relative;z-index:2;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 92px}
  .eyebrow{display:inline-flex;align-items:center;gap:16px;font-weight:700;font-size:19px;
    letter-spacing:0.30em;text-transform:uppercase;color:#c084fc;margin-bottom:34px}
  .eyebrow .rule{height:2px;width:44px;background:#c084fc;opacity:0.75;border-radius:2px}
  h1{font-weight:300;font-size:108px;line-height:0.92;letter-spacing:-0.05em}
  h1 em{font-style:italic;font-weight:400;
    background:linear-gradient(135deg,#a855f7 0%,#ec4899 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .sub{margin-top:34px;font-family:'Inter';font-weight:400;font-size:31px;line-height:1.35;
    letter-spacing:-0.01em;color:rgba(255,255,255,0.66);max-width:880px}
  .bar{position:absolute;left:0;bottom:0;height:9px;width:100%;
    background:linear-gradient(90deg,#9333ea 0%,#ec4899 100%)}
</style></head>
<body>
  <div class="glow1"></div><div class="glow2"></div><div class="grain"></div>
  <div class="wrap">
    <div class="eyebrow"><span class="rule"></span>FeelFlick</div>
    <h1>Films that know <em>you.</em></h1>
    <div class="sub">The right film. Right now. One pick for how you feel tonight — tuned to your mood and everything you've ever loved on screen.</div>
  </div>
  <div class="bar"></div>
</body></html>`

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 })
  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(150) // let webfont paint settle
  await page.screenshot({ path: OUT, type: 'jpeg', quality: 92 })
  console.log('✓ wrote', OUT)
} finally {
  await browser.close()
}
