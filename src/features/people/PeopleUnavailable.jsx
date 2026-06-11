// B1.3 — honest fallback shown when the People surface is disabled via the VITE_ENABLE_PEOPLE
// kill-switch. It loads NO data (the data provider + every People RPC are never mounted) and
// exposes nothing private. Its own <h1> keeps the disabled page accessible.
export default function PeopleUnavailable() {
  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>People is taking a short break</h1>
      <p style={{ color: 'rgba(250,250,250,0.62)', fontSize: 15, lineHeight: 1.6 }}>
        Taste-match discovery is paused during beta. It&rsquo;ll be back soon &mdash; your follows and settings are safe.
      </p>
    </main>
  )
}
