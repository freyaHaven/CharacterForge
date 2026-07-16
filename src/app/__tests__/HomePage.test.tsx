// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HomePage } from '../HomePage'

const recentCharacter = {
  id: 'char-1',
  name: 'Freya',
  speciesName: 'Dwarf',
  classes: [{ className: 'Barbarian', level: 3 }],
  updatedAt: Date.now() - 2 * 60 * 60 * 1000,
}

describe('HomePage', () => {
  it('renders the primary create and import actions', () => {
    render(
      <HomePage
        onCreateNew={() => {}}
        onImportFile={() => {}}
        onContinue={() => {}}
        onDelete={() => {}}
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
        onDelete={() => {}}
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
        onDelete={() => {}}
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
        onDelete={() => {}}
        recentCharacters={[recentCharacter]}
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

  it('opens a confirmation dialog from the delete icon and confirms deletion', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    const onContinue = vi.fn()

    render(
      <HomePage
        onCreateNew={() => {}}
        onImportFile={() => {}}
        onContinue={onContinue}
        onDelete={onDelete}
        recentCharacters={[recentCharacter]}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: /delete character freya/i }),
    )

    const dialog = screen.getByRole('alertdialog', {
      name: /delete character\?/i,
    })
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveTextContent('Freya • Dwarf')
    expect(dialog).toHaveTextContent('Barbarian 3')
    expect(dialog).toHaveTextContent(/cannot be undone/i)

    await user.click(
      screen.getByRole('button', { name: /^delete character$/i }),
    )

    expect(onDelete).toHaveBeenCalledWith('char-1')
    expect(onContinue).not.toHaveBeenCalled()
  })

  it('cancels deletion without calling onDelete', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()

    render(
      <HomePage
        onCreateNew={() => {}}
        onImportFile={() => {}}
        onContinue={() => {}}
        onDelete={onDelete}
        recentCharacters={[recentCharacter]}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: /delete character freya/i }),
    )
    await user.click(screen.getByRole('button', { name: /^cancel$/i }))

    expect(onDelete).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('alertdialog', { name: /delete character\?/i }),
    ).not.toBeInTheDocument()
  })

  it('hides the Continue section when there are no recent characters', () => {
    render(
      <HomePage
        onCreateNew={() => {}}
        onImportFile={() => {}}
        onContinue={() => {}}
        onDelete={() => {}}
        recentCharacters={[]}
      />,
    )

    expect(
      screen.queryByRole('heading', { name: /^continue$/i }),
    ).not.toBeInTheDocument()
  })
})
