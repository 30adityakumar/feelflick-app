import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Configurable Supabase mock — the default-state tests don't submit; the F9.3 reliability tests do.
const sb = vi.hoisted(() => ({ insertError: null, insertCalls: 0 }))
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    from: () => ({
      insert: () => { sb.insertCalls++; return { select: () => ({ single: async () => ({ data: { id: 'new-list' }, error: sb.insertError }) }) } },
      update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: { id: 'l1' }, error: null }) }) }) }),
    }),
  },
}))

import CreateListModal from '../CreateListModal'

const noop = () => {}

describe('CreateListModal — F9.2 default-private', () => {
  it('a NEW list defaults to private (public toggle unchecked)', () => {
    render(<CreateListModal onClose={noop} onSave={noop} userId="u1" />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('keeps the public-exposure copy clear and explicit', () => {
    render(<CreateListModal onClose={noop} onSave={noop} userId="u1" />)
    expect(screen.getByText('Public — anyone can see this list')).toBeInTheDocument()
  })

  it('the user can still explicitly make a list public', () => {
    render(<CreateListModal onClose={noop} onSave={noop} userId="u1" />)
    const toggle = screen.getByRole('checkbox')
    fireEvent.click(toggle)
    expect(toggle).toBeChecked()
  })

  it('editing an existing PUBLIC list preserves its public state', () => {
    render(<CreateListModal onClose={noop} onSave={noop} userId="u1"
      existingList={{ id: 'l1', title: 'Shared picks', is_public: true }} />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('editing an existing PRIVATE list preserves its private state', () => {
    render(<CreateListModal onClose={noop} onSave={noop} userId="u1"
      existingList={{ id: 'l2', title: 'Private picks', is_public: false }} />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })
})

describe('CreateListModal — F9.3 create reliability', () => {
  beforeEach(() => { sb.insertError = null; sb.insertCalls = 0 })

  const fillTitle = () => fireEvent.change(screen.getByPlaceholderText(/Comfort Movies/i), { target: { value: 'My list' } })
  const submitBtn = () => screen.getByRole('button', { name: /create list/i })

  it('double-submit inserts only ONCE (pending guard disables the button)', async () => {
    render(<CreateListModal onClose={noop} onSave={noop} userId="u1" />)
    fillTitle()
    const btn = submitBtn()
    fireEvent.click(btn)            // first submit → saving=true disables the button
    fireEvent.click(btn)            // second click hits the disabled button → no-op
    expect(btn).toBeDisabled()
    await waitFor(() => expect(sb.insertCalls).toBe(1))
  })

  it('on failure: shows a safe error, preserves the input, never raw backend text', async () => {
    sb.insertError = { code: '500', message: 'duplicate key value violates unique constraint "pg_lists_pkey"' }
    render(<CreateListModal onClose={noop} onSave={noop} userId="u1" />)
    fillTitle()
    fireEvent.click(submitBtn())
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toMatch(/Could not create your list/i)
    expect(alert.textContent).not.toMatch(/pg_lists_pkey|unique constraint/i)
    expect(screen.getByDisplayValue('My list')).toBeInTheDocument() // input preserved for retry
  })

  it('Cancel is type="button" (cannot accidentally submit the form)', () => {
    render(<CreateListModal onClose={noop} onSave={noop} userId="u1" />)
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('type', 'button')
  })
})
