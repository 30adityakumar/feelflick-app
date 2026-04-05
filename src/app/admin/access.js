export function normalizeAdminEmails(rawEmails = '') {
  return rawEmails
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function resolveAdminAccess(session, adminEmails) {
  if (!session) return 'anon'

  if (!Array.isArray(adminEmails) || adminEmails.length === 0) {
    return 'unconfigured'
  }

  const email = session.user?.email?.toLowerCase() || ''
  if (!email) return 'forbidden'

  return adminEmails.includes(email) ? 'ok' : 'forbidden'
}

