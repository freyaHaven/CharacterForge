// @vitest-environment jsdom

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import type { Character } from '../../domain/types'
import { createDefaultCharacter } from '../../domain/character/defaults'
import { withSingleClassInstance } from '../../domain/character/characterClassSelection'
import { serializeCharacterFile } from '../../adapters/characterFile'
import { CURRENT_SCHEMA_VERSION } from '../../adapters/storage/storedCharacter'
import {
  activateEditorSession,
  clearEditorSession,
  openCharacterEditor,
  waitForAppReady,
} from '../../testing/characterEditorTestUtils'
import { createTestFighterClassInstance } from '../../testing/classFixtures'
import {
  RECENT_CHARACTERS_STORAGE_KEY,
  recentCharactersStore,
} from '../session/recentCharacters'
import {
  PACKAGE_OPTION_ID,
  STARTING_EQUIPMENT_ENTITLEMENT_ID,
} from '../../domain/equipment/startingEquipmentHelpers'
import { EMPTY_EQUIPMENT_LOADOUT } from '../../domain/equipment/types'
import { COMPLETE_DWARF_SELECTION } from '../../testing/speciesSelectionTestUtils'

const { loadMock, saveMock, removeMock } = vi.hoisted(() => ({
  loadMock: vi.fn(),
  saveMock: vi.fn(),
  removeMock: vi.fn(),
}))

vi.mock('../../adapters/localStorageCharacterRepository', () => ({
  createLocalStorageCharacterRepository: () => ({
    load: loadMock,
    save: saveMock,
    remove: removeMock,
  }),
}))

function createCompleteSoldierBackground(): NonNullable<Character['background']> {
  return {
    backgroundId: 'srd-2024:soldier',
    abilityScoreIncrease: {
      mode: 'two-and-one',
      plusTwo: 'strength',
      plusOne: 'constitution',
    },
    choices: {
      'gaming-set': 'dice-set',
    },
  }
}

function createCompleteStartingEquipment(
  classInstanceId: string,
  backgroundId: string,
  classOptionId = 'package-a',
): Character['equipment'] {
  return {
    selections: [
      {
        source: { kind: 'class-instance', instanceId: classInstanceId },
        entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
        optionId: classOptionId,
        choices: [],
      },
      {
        source: { kind: 'background', backgroundId },
        entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
        optionId: PACKAGE_OPTION_ID,
        choices: [],
      },
    ],
    loadout: EMPTY_EQUIPMENT_LOADOUT,
  }
}

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
    species: { ...COMPLETE_DWARF_SELECTION },
    background: null,
    ...overrides,
  })
}

function createCompleteImportedCharacter(
  overrides: Partial<Character> = {},
): Character {
  const fighter = createTestFighterClassInstance()

  return createStoredCharacter({
    id: 'char-complete-import',
    name: 'Complete Import',
    ...withSingleClassInstance(fighter),
    background: createCompleteSoldierBackground(),
    equipment: createCompleteStartingEquipment(
      fighter.instanceId,
      'srd-2024:soldier',
    ),
    ...overrides,
  })
}

function expectCurrentWizardStep(stepLabel: string) {
  expect(
    screen.getByRole('button', {
      name: new RegExp(`^${stepLabel}, .*current step`, 'i'),
    }),
  ).toBeInTheDocument()
}

async function importCharacterFile(
  user: ReturnType<typeof userEvent.setup>,
  character: Character,
  fileName = 'hero.cforge',
) {
  await user.click(screen.getByRole('button', { name: /import character/i }))
  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement
  const file = new File([serializeCharacterFile(character)], fileName, {
    type: 'application/json',
  })
  await user.upload(input, file)
}

async function continueRecentCharacter(
  user: ReturnType<typeof userEvent.setup>,
  namePattern: RegExp,
) {
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: /^continue$/i })).toBeInTheDocument()
  })

  await user.click(
    screen.getByRole('button', {
      name: (accessibleName) =>
        namePattern.test(accessibleName) &&
        !/^delete character/i.test(accessibleName),
    }),
  )
}

describe('App entry flow', () => {
  beforeEach(() => {
    clearEditorSession()
    recentCharactersStore.clear()
    localStorage.removeItem(RECENT_CHARACTERS_STORAGE_KEY)
    loadMock.mockReset()
    saveMock.mockReset()
    removeMock.mockReset()
    saveMock.mockResolvedValue(undefined)
    removeMock.mockResolvedValue(undefined)
    loadMock.mockResolvedValue(null)
  })

  it('shows the home page on a fresh open', async () => {
    render(<App />)
    await waitForAppReady()

    expect(
      screen.getByRole('button', { name: /create new character/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('navigation', { name: /character creation steps/i }),
    ).not.toBeInTheDocument()
  })

  it('shows home even when an editor session flag is still set', async () => {
    const character = createStoredCharacter()
    activateEditorSession(character.id)
    loadMock.mockResolvedValue(character)

    render(<App />)
    await waitForAppReady()

    expect(
      screen.getByRole('button', { name: /create new character/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('navigation', { name: /character creation steps/i }),
    ).not.toBeInTheDocument()
  })

  it('enters the wizard after Create New Character on Basics', async () => {
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
    expectCurrentWizardStep('Basics')
  })

  it('continues a complete saved character onto Overview', async () => {
    const user = userEvent.setup()
    const character = createCompleteImportedCharacter({
      id: 'char-1',
      name: 'Elara',
    })
    recentCharactersStore.touch(character.id, Date.now())
    loadMock.mockImplementation(async (id: string) =>
      id === character.id ? character : null,
    )

    render(<App />)
    await waitForAppReady()
    await continueRecentCharacter(user, /elara • dwarf/i)

    await waitFor(() => {
      expect(
        screen.getByRole('navigation', { name: /character creation steps/i }),
      ).toBeInTheDocument()
    })

    expect(loadMock).toHaveBeenCalledWith('char-1')
    expectCurrentWizardStep('Overview')
  })

  it('continues an incomplete saved character onto its first incomplete step', async () => {
    const user = userEvent.setup()
    const character = createStoredCharacter()
    recentCharactersStore.touch(character.id, Date.now())
    loadMock.mockImplementation(async (id: string) =>
      id === character.id ? character : null,
    )

    render(<App />)
    await waitForAppReady()
    await continueRecentCharacter(user, /elara • dwarf/i)

    await waitFor(() => {
      expect(
        screen.getByRole('navigation', { name: /character creation steps/i }),
      ).toBeInTheDocument()
    })

    expect(loadMock).toHaveBeenCalledWith('char-1')
    expectCurrentWizardStep('Class')

    const brand = document.querySelector('.app-brand')
    expect(brand).not.toBeNull()
    expect(
      within(brand as HTMLElement).getByRole('button', {
        name: /import character/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(brand as HTMLElement).getByRole('button', {
        name: /export character/i,
      }),
    ).toBeInTheDocument()
  })

  it('continues a saved character to an earlier incomplete step, not a later complete one', async () => {
    const user = userEvent.setup()
    const character = createCompleteImportedCharacter({
      id: 'char-1',
      name: '',
    })
    recentCharactersStore.touch(character.id, Date.now())
    loadMock.mockImplementation(async (id: string) =>
      id === character.id ? character : null,
    )

    render(<App />)
    await waitForAppReady()
    await continueRecentCharacter(user, /unnamed • dwarf/i)

    await waitFor(() => {
      expect(
        screen.getByRole('navigation', { name: /character creation steps/i }),
      ).toBeInTheDocument()
    })

    expectCurrentWizardStep('Basics')
  })

  it('imports a valid .cforge file into the editor', async () => {
    const user = userEvent.setup()
    const character = createStoredCharacter({ name: 'Imported Hero' })

    render(<App />)
    await waitForAppReady()

    await importCharacterFile(user, character)

    await waitFor(() => {
      expect(
        screen.getByRole('navigation', { name: /character creation steps/i }),
      ).toBeInTheDocument()
    })

    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Imported Hero' }),
    )
    // Name is set but Class is empty — land on the first incomplete step.
    expectCurrentWizardStep('Class')
  })

  it('imports a fully completed character onto Overview', async () => {
    const user = userEvent.setup()
    const character = createCompleteImportedCharacter()

    render(<App />)
    await waitForAppReady()

    await importCharacterFile(user, character)

    await waitFor(() => {
      expect(
        screen.getByRole('navigation', { name: /character creation steps/i }),
      ).toBeInTheDocument()
    })

    expectCurrentWizardStep('Overview')
  })

  it('imports a character missing Basics onto Basics', async () => {
    const user = userEvent.setup()
    const character = createCompleteImportedCharacter({ name: '' })

    render(<App />)
    await waitForAppReady()

    await importCharacterFile(user, character)

    await waitFor(() => {
      expect(
        screen.getByRole('navigation', { name: /character creation steps/i }),
      ).toBeInTheDocument()
    })

    expectCurrentWizardStep('Basics')
  })

  it('adds an imported character to the recent list', async () => {
    const user = userEvent.setup()
    const character = createStoredCharacter({
      id: 'char-imported',
      name: 'Imported Hero',
    })

    loadMock.mockImplementation(async (id: string) =>
      id === character.id ? character : null,
    )

    render(<App />)
    await waitForAppReady()

    await importCharacterFile(user, character)

    await waitFor(() => {
      expect(
        screen.getByRole('navigation', { name: /character creation steps/i }),
      ).toBeInTheDocument()
    })

    expect(recentCharactersStore.list().map((entry) => entry.id)).toContain(
      'char-imported',
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
    recentCharactersStore.touch(character.id, Date.now())
    loadMock.mockImplementation(async (id: string) =>
      id === character.id ? character : null,
    )

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
    await continueRecentCharacter(user, /export me • dwarf/i)

    await waitFor(() => {
      expect(
        screen.getByRole('navigation', { name: /character creation steps/i }),
      ).toBeInTheDocument()
    })

    await user.click(
      screen.getByRole('button', { name: /export character/i }),
    )

    expect(createObjectURL).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()

    clickSpy.mockRestore()
    vi.unstubAllGlobals()
  })

  it('keeps the editor open without a Home control', async () => {
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

    expect(
      screen.queryByRole('button', { name: /return to home/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /import character/i }),
    ).toBeInTheDocument()
  })

  it('imports a character from the editor actions', async () => {
    const user = userEvent.setup()
    const character = createStoredCharacter({ name: 'Editor Import' })
    recentCharactersStore.touch(character.id, Date.now())
    loadMock.mockImplementation(async (id: string) =>
      id === character.id ? character : null,
    )

    const file = new File(
      [serializeCharacterFile(createStoredCharacter({ name: 'Swapped In' }))],
      'swap.cforge',
      { type: 'application/json' },
    )

    render(<App />)
    await waitForAppReady()
    await continueRecentCharacter(user, /editor import • dwarf/i)

    await waitFor(() => {
      expect(
        screen.getByRole('navigation', { name: /character creation steps/i }),
      ).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /import character/i }))
    const input = document.querySelector(
      '.wizard-editor-actions input[type="file"]',
    ) as HTMLInputElement
    await user.upload(input, file)

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Swapped In' }),
      )
    })
  })

  it('deletes a recent character after confirmation', async () => {
    const user = userEvent.setup()
    const character = createStoredCharacter({ name: 'Delete Me' })
    const other = createStoredCharacter({
      id: 'char-2',
      name: 'Keep Me',
    })
    recentCharactersStore.touch(other.id, Date.now() - 1000)
    recentCharactersStore.touch(character.id, Date.now())
    loadMock.mockImplementation(async (id: string) => {
      if (id === character.id) {
        return character
      }
      if (id === other.id) {
        return other
      }
      return null
    })

    render(<App />)
    await waitForAppReady()

    await waitFor(() => {
      expect(screen.getByText('Delete Me • Dwarf')).toBeInTheDocument()
    })

    await user.click(
      screen.getByRole('button', { name: /delete character delete me/i }),
    )
    await user.click(
      screen.getByRole('button', { name: /^delete character$/i }),
    )

    await waitFor(() => {
      expect(removeMock).toHaveBeenCalledWith(character.id)
    })
    expect(screen.queryByText('Delete Me • Dwarf')).not.toBeInTheDocument()
    expect(screen.getByText('Keep Me • Dwarf')).toBeInTheDocument()
    expect(recentCharactersStore.list().map((entry) => entry.id)).toEqual([
      'char-2',
    ])
  })

  it('still uses local storage only after entering the editor from the home page', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openCharacterEditor(user)

    await user.click(screen.getByRole('button', { name: /^next$/i }))

    expect(loadMock).not.toHaveBeenCalled()
  })
})
