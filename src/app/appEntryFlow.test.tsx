// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { Character } from '../domain/types'
import { createDefaultCharacter } from '../domain/character/defaults'
import { serializeCharacterFile } from '../adapters/characterFile'
import { CURRENT_SCHEMA_VERSION } from '../adapters/storage/storedCharacter'
import {
  activateEditorSession,
  clearEditorSession,
  openCharacterEditor,
  waitForAppReady,
} from '../test/characterEditorTestUtils'

const { loadMock, saveMock } = vi.hoisted(() => ({
  loadMock: vi.fn(),
  saveMock: vi.fn(),
}))

vi.mock('../adapters/localStorageCharacterRepository', () => ({
  createLocalStorageCharacterRepository: () => ({
    load: loadMock,
    save: saveMock,
  }),
}))

function createStoredCharacter(overrides: Partial<Character> = {}): Character {
  return createDefaultCharacter({
    id: 'char-1',
    name: 'Elara',
    editionId: 'srd-2024',
    creationMethod: 'manual',
    abilityScores: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    species: { speciesId: 'srd-2024:dwarf', choices: {} },
    background: null,
    ...overrides,
  })
}

describe('App entry flow', () => {
  beforeEach(() => {
    clearEditorSession()
    loadMock.mockReset()
    saveMock.mockReset()
    saveMock.mockResolvedValue(undefined)
    loadMock.mockResolvedValue(null)
  })

  it('shows the landing page on a fresh open', async () => {
    render(<App />)
    await waitForAppReady()

    expect(
      screen.getByRole('button', { name: /create new character/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('navigation', { name: /character creation steps/i }),
    ).not.toBeInTheDocument()
  })

  it('enters the wizard after Create New Character', async () => {
    const user = userEvent.setup()
    render(<App />)
    await waitForAppReady()

    await user.click(
      screen.getByRole('button', { name: /create new character/i }),
    )

    await waitFor(() => {
      expect(
        screen.getByRole('navigation', { name: /character creation steps/i }),
      ).toBeInTheDocument()
    })

    expect(saveMock).toHaveBeenCalled()
  })

  it('restores an active editor session from local storage without showing the landing page', async () => {
    const character = createStoredCharacter()
    activateEditorSession(character.id)
    loadMock.mockResolvedValue(character)

    render(<App />)
    await waitForAppReady()

    expect(
      screen.queryByRole('button', { name: /create new character/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: /character creation steps/i }),
    ).toBeInTheDocument()
    expect(loadMock).toHaveBeenCalledWith('char-1')
  })

  it('imports a valid .cforge file into the editor', async () => {
    const user = userEvent.setup()
    const character = createStoredCharacter({ name: 'Imported Hero' })
    const file = new File([serializeCharacterFile(character)], 'hero.cforge', {
      type: 'application/json',
    })

    render(<App />)
    await waitForAppReady()

    await user.click(screen.getByRole('button', { name: /import character/i }))
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    await user.upload(input, file)

    await waitFor(() => {
      expect(
        screen.getByRole('navigation', { name: /character creation steps/i }),
      ).toBeInTheDocument()
    })

    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Imported Hero' }),
    )
  })

  it('shows a friendly error for invalid JSON imports', async () => {
    const user = userEvent.setup()
    const file = new File(['{not-json'], 'broken.cforge', {
      type: 'application/json',
    })

    render(<App />)
    await waitForAppReady()

    await user.click(screen.getByRole('button', { name: /import character/i }))
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    await user.upload(input, file)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /could not be read/i,
    )
  })

  it('shows a friendly error for unsupported schema versions', async () => {
    const user = userEvent.setup()
    const file = new File(
      [
        JSON.stringify({
          schemaVersion: CURRENT_SCHEMA_VERSION + 1,
          character: createStoredCharacter(),
        }),
      ],
      'future.cforge',
      { type: 'application/json' },
    )

    render(<App />)
    await waitForAppReady()

    await user.click(screen.getByRole('button', { name: /import character/i }))
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    await user.upload(input, file)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /newer version/i,
    )
  })

  it('exports the current character as a downloadable .cforge file', async () => {
    const user = userEvent.setup()
    const character = createStoredCharacter({ name: 'Export Me' })
    activateEditorSession(character.id)
    loadMock.mockResolvedValue(character)

    const createObjectURL = vi.fn(() => 'blob:character')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    })

    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})

    render(<App />)
    await waitForAppReady()

    await user.click(
      screen.getByRole('button', { name: /export character/i }),
    )

    expect(createObjectURL).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()

    clickSpy.mockRestore()
    vi.unstubAllGlobals()
  })

  it('returns to the landing page from Home', async () => {
    const user = userEvent.setup()
    render(<App />)
    await waitForAppReady()

    await user.click(
      screen.getByRole('button', { name: /create new character/i }),
    )

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /return to home/i }),
      ).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /return to home/i }))

    expect(
      screen.getByRole('button', { name: /create new character/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('navigation', { name: /character creation steps/i }),
    ).not.toBeInTheDocument()
  })

  it('still uses local storage only after entering the editor from the landing page', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openCharacterEditor(user)

    await user.click(screen.getByRole('button', { name: /^next$/i }))

    expect(loadMock).not.toHaveBeenCalled()
  })
})
