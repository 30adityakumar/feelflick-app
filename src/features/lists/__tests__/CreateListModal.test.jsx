import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// CreateListModal imports the supabase client for the submit path; the default-state tests below
// never submit, so a minimal stub keeps the module import side-effect-free.
vi.mock('@/shared/lib/supabase/client', () => ({ supabase: { from: () => ({}) } }))

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
