// B1.4 — calm, honest fallback shown to a signed-in user who is not (yet) in the private beta, or
// when membership couldn't be confirmed. No raw backend error, no private data, no redirect loop.
export default function BetaAccessRequired({ errored = false }) {
  return (
    <main style={{ maxWidth: 620, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Private beta access required</h1>
      <p style={{ color: 'rgba(250,250,250,0.62)', fontSize: 15, lineHeight: 1.6 }}>
        {errored
          ? 'We couldn’t confirm your beta access just now. Please try again in a moment.'
          : 'FeelFlick is in a small private beta. Your account isn’t on the invite list yet — if you were invited, check back soon, or reach out to the team at hello@feelflick.com.'}
      </p>
    </main>
  )
}
