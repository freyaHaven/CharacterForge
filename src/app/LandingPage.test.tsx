// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LandingPage } from './LandingPage'

describe('LandingPage', () => {
  it('renders the primary create and import actions', () => {
    render(
      <LandingPage onCreateNew={() => {}} onImportFile={() => {}} />,
    )

    expect(
      screen.getByRole('heading', { name: /welcome to character forge/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /create new character/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /import character/i }),
    ).toBeInTheDocument()
  })

  it('starts a new character when Create New Character is clicked', async () => {
    const user = userEvent.setup()
    const onCreateNew = vi.fn()

    render(<LandingPage onCreateNew={onCreateNew} onImportFile={() => {}} />)

    await user.click(
      screen.getByRole('button', { name: /create new character/i }),
    )

    expect(onCreateNew).toHaveBeenCalledTimes(1)
  })

  it('shows import errors when provided', () => {
    render(
      <LandingPage
        importError="This file could not be read."
        onCreateNew={() => {}}
        onImportFile={() => {}}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This file could not be read.',
    )
  })
})
