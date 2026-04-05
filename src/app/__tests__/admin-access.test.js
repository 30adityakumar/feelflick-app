import { describe, expect, it } from 'vitest'
import { normalizeAdminEmails, resolveAdminAccess } from '../admin/access'

describe('admin access helpers', () => {
  it('normalizes admin email list', () => {
    expect(normalizeAdminEmails(' Admin@Example.com ,other@example.com, , ')).toEqual([
      'admin@example.com',
      'other@example.com',
    ])
  })

  it('returns anon when there is no session', () => {
    expect(resolveAdminAccess(null, ['admin@example.com'])).toBe('anon')
  })

  it('fails closed when admin allowlist is empty', () => {
    const session = { user: { email: 'admin@example.com' } }
    expect(resolveAdminAccess(session, [])).toBe('unconfigured')
  })

  it('returns ok for allowlisted admin email', () => {
    const session = { user: { email: 'admin@example.com' } }
    expect(resolveAdminAccess(session, ['admin@example.com'])).toBe('ok')
  })

  it('returns forbidden for non-allowlisted email', () => {
    const session = { user: { email: 'user@example.com' } }
    expect(resolveAdminAccess(session, ['admin@example.com'])).toBe('forbidden')
  })
})

