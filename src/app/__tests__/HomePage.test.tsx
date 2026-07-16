// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HomePage } from '../HomePage'

describe('HomePage', () => {
  it('renders the primary create and import actions', () => {
    render(
      <HomePage
        onCreateNew={() => {}}
        onImportFile={() => {}}
        onContinue={() => {}}
      />,
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

    render(
      <HomePage
        onCreateNew={onCreateNew}
        onImportFile={() => {}}
        onContinue={() => {}}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: /create new character/i }),
    )

    expect(onCreateNew).toHaveBeenCalledTimes(1)
  })

  it('shows import errors when provided', () => {
    render(
      <HomePage
        importError="This file could not be read."
        onCreateNew={() => {}}
        onImportFile={() => {}}
        onContinue={() => {}}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This file could not be read.',
    )
  })

  it('renders recent character cards and continues on click', async () => {
    const user = userEvent.setup()
    const onContinue = vi.fn()

    render(
      <HomePage
        onCreateNew={() => {}}
        onImportFile={() => {}}
        onContinue={onContinue}
        recentCharacters={[
          {
            id: 'char-1',
            name: 'Freya',
            speciesName: 'Dwarf',
            classes: [{ className: 'Barbarian', level: 3 }],
            updatedAt: Date.now() - 2 * 60 * 60 * 1000,
          },
        ]}
      />,
    )

    expect(
      screen.getByRole('heading', { name: /^continue$/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Freya • Dwarf')).toBeInTheDocument()
    expect(screen.getByText('Barbarian 3')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /freya • dwarf/i }))

    expect(onContinue).toHaveBeenCalledWith('char-1')
  })

  it('hides the Continue section when there are no recent characters', () => {
    render(
      <HomePage
        onCreateNew={() => {}}
        onImportFile={() => {}}
        onContinue={() => {}}
        recentCharacters={[]}
      />,
    )

    expect(
      screen.queryByRole('heading', { name: /^continue$/i }),
    ).not.toBeInTheDocument()
  })
})
