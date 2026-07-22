// @vitest-environment jsdom

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { createDefaultCharacter } from '../../domain/character/defaults'
import { EMPTY_EQUIPMENT_LOADOUT } from '../../domain/equipment/types'
import type { Character } from '../../domain/types'
import {
  getWizardStepButton,
  goToWizardStep,
} from '../../testing/wizardTestUtils'
import {
  clearEditorSession,
  clearRecentCharacters,
  openStoredCharacterEditor,
  seedRecentCharacter,
} from '../../testing/characterEditorTestUtils'
import { withSingleClassInstance } from '../../domain/character/characterClassSelection'
import { createTestFighterClassInstance } from '../../testing/classFixtures'
import { createLocalStorageCharacterRepository } from '../../adapters/localStorageCharacterRepository'
import { COMPLETE_DWARF_SELECTION } from '../../testing/speciesSelectionTestUtils'
import {
  PACKAGE_OPTION_ID,
  STARTING_EQUIPMENT_ENTITLEMENT_ID,
} from '../../domain/equipment/startingEquipmentHelpers'

const { loadMock, saveMock } = vi.hoisted(() => ({
  loadMock: vi.fn(),
  saveMock: vi.fn(),
}))

vi.mock('../../adapters/localStorageCharacterRepository', () => ({
  createLocalStorageCharacterRepository: () => ({
    load: loadMock,
    save: saveMock,
    remove: vi.fn(),
  }),
}))

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.get(key) ?? null
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}

function createStoredCharacter(overrides: Partial<Character> = {}): Character {
  const fighterInstance = createTestFighterClassInstance()

  return createDefaultCharacter({
    id: 'char-1',
    name: 'Aldric',
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
    ...withSingleClassInstance(fighterInstance),
    background: null,
    equipment: {
      selections: [
        {
          source: {
            kind: 'class-instance',
            instanceId: fighterInstance.instanceId,
          },
          entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
          optionId: 'package-a',
          choices: [],
        },
      ],
      loadout: EMPTY_EQUIPMENT_LOADOUT,
    },
    ...overrides,
  })
}

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

async function renderLoadedApp(character = createStoredCharacter()) {
  clearEditorSession()
  seedRecentCharacter(character.id)
  loadMock.mockResolvedValue(character)
  const user = userEvent.setup()
  render(
    <StrictMode>
      <App />
    </StrictMode>,
  )

  await openStoredCharacterEditor(user, character)

  return { user, character }
}

async function openBackgroundStep(user: ReturnType<typeof userEvent.setup>) {
  await goToWizardStep(user, screen, 'Background')
  await waitFor(() => {
    expect(screen.queryByText(/loading backgrounds/i)).not.toBeInTheDocument()
  })
}

async function completeSoldierSelection(
  user: ReturnType<typeof userEvent.setup>,
) {
  await user.click(screen.getByRole('button', { name: 'Soldier' }))
  await user.click(screen.getByLabelText('+2 / +1'))
  await user.selectOptions(screen.getByLabelText('+2 Ability'), 'strength')
  await user.selectOptions(screen.getByLabelText('+1 Ability'), 'constitution')
  await user.click(screen.getByLabelText('Dice Set'))
}

function expectSelectedBackground(name: string) {
  const selection = document.querySelector('.background-picker__selection')

  expect(selection).not.toBeNull()
  expect(selection).toHaveTextContent(new RegExp(`Selected:\\s*${name}`, 'i'))
}

describe('Background workflow', () => {
  beforeEach(() => {
    clearEditorSession()
    clearRecentCharacters()
    loadMock.mockReset()
    saveMock.mockReset()
  })

  it('shows the empty-state placeholder before a background is selected', async () => {
    const { user } = await renderLoadedApp()
    await openBackgroundStep(user)

    expect(
      screen.getByText(/select a background to preview its benefits and choices/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('list', { name: /choose a background/i })).toBeInTheDocument()
    expect(getWizardStepButton(screen, 'Background')).toHaveAccessibleName(
      /not started/i,
    )
  })

  it('marks the step in progress with validation guidance for an incomplete Soldier draft', async () => {
    const { user } = await renderLoadedApp()
    await openBackgroundStep(user)

    await user.click(screen.getByRole('button', { name: 'Soldier' }))

    expect(document.querySelector('.background-picker__selection')).toHaveTextContent(
      /selecting:\s*soldier/i,
    )
    expect(
      document.querySelector('.validation-message')?.textContent,
    ).toMatch(/choose how to increase your background ability scores/i)
    expect(getWizardStepButton(screen, 'Background')).toHaveAccessibleName(
      /in progress/i,
    )
  })

  it('completes a Soldier background end to end', async () => {
    const { user } = await renderLoadedApp()
    await openBackgroundStep(user)
    await completeSoldierSelection(user)

    await waitFor(() => {
      expectSelectedBackground('Soldier')
    })

    expect(screen.getByText(/Strength \+2/i)).toBeInTheDocument()
    expect(screen.getByText(/Constitution \+1/i)).toBeInTheDocument()
    expect(screen.getByText(/Equipment Package \(A\)/i, { selector: 'dd' })).toBeInTheDocument()
    expect(
      screen.queryByText(/Choose starting equipment/i),
    ).not.toBeInTheDocument()
    expect(getWizardStepButton(screen, 'Background')).toHaveAccessibleName(
      /complete/i,
    )
  })

  it('updates derived bonuses when switching from +2/+1 to +1/+1/+1', async () => {
    const { user } = await renderLoadedApp()
    await openBackgroundStep(user)

    await user.click(screen.getByRole('button', { name: 'Soldier' }))
    await user.click(screen.getByLabelText('+2 / +1'))
    await user.selectOptions(screen.getByLabelText('+2 Ability'), 'strength')
    await user.selectOptions(screen.getByLabelText('+1 Ability'), 'constitution')
    await user.click(screen.getByLabelText('Dice Set'))

    expect(screen.getByText(/Strength \+2/i)).toBeInTheDocument()

    await user.click(screen.getByLabelText('+1 / +1 / +1'))

    await waitFor(() => {
      expect(screen.getByText(/Strength \+1/i)).toBeInTheDocument()
      expect(screen.getByText(/Dexterity \+1/i)).toBeInTheDocument()
      expect(screen.getByText(/Constitution \+1/i)).toBeInTheDocument()
    })
    expect(screen.queryByText(/Strength \+2/i)).not.toBeInTheDocument()
  })

  it('resets choices when switching between backgrounds', async () => {
    const { user } = await renderLoadedApp()
    await openBackgroundStep(user)
    await completeSoldierSelection(user)

    await user.click(screen.getByRole('button', { name: 'Acolyte' }))

    expect(document.querySelector('.background-picker__selection')).toHaveTextContent(
      /selecting:\s*acolyte/i,
    )
    expect(screen.queryByLabelText('Dice Set')).not.toBeInTheDocument()
    expect(
      screen.getByText(/magic initiate \(cleric\)/i),
    ).toBeInTheDocument()
  })

  it('persists a committed background after save and reload', async () => {
    let storedCharacter = createStoredCharacter()
    loadMock.mockImplementation(async () => storedCharacter)
    saveMock.mockImplementation(async (character: Character) => {
      storedCharacter = character
    })

    const { user } = await renderLoadedApp()
    await openBackgroundStep(user)
    await completeSoldierSelection(user)

    await waitFor(() => {
      expectSelectedBackground('Soldier')
    })

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          background: createCompleteSoldierBackground(),
        }),
      )
    })

    expect(saveMock.mock.calls.at(-1)?.[0].background).not.toHaveProperty(
      'abilityScoreBonuses',
    )
  })

  it('shows the committed background on the review step', async () => {
    const { user } = await renderLoadedApp(
      createStoredCharacter({
        background: createCompleteSoldierBackground(),
      }),
    )

    await goToWizardStep(user, screen, 'Overview')

    const backgroundGroup = screen
      .getByRole('heading', { name: 'Background · Soldier', level: 4 })
      .closest('.character-sheet__feature-group') as HTMLElement
    expect(within(backgroundGroup).getByText(/Ability Scores/i)).toBeInTheDocument()
    expect(within(backgroundGroup).getByText(/Strength \+2/i)).toBeInTheDocument()
    expect(within(backgroundGroup).getByText('Athletics, Intimidation')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Feats · Savage Attacker · Soldier',
        level: 4,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/roll the weapon’s damage dice twice/i),
    ).toBeInTheDocument()
  })

  it('prompts to clear background when changing edition', async () => {
    const fighterInstance = createTestFighterClassInstance()
    const { user } = await renderLoadedApp(
      createStoredCharacter({
        ...withSingleClassInstance(fighterInstance),
        background: createCompleteSoldierBackground(),
        equipment: {
          selections: [
            {
              source: {
                kind: 'class-instance',
                instanceId: fighterInstance.instanceId,
              },
              entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
              optionId: 'package-a',
              choices: [],
            },
            {
              source: {
                kind: 'background',
                backgroundId: 'srd-2024:soldier',
              },
              entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
              path: [],
              optionId: PACKAGE_OPTION_ID,
              choices: [],
            },
            {
              source: {
                kind: 'background',
                backgroundId: 'srd-2024:soldier',
              },
              entitlementId: 'gaming-set',
              path: [PACKAGE_OPTION_ID],
              optionId: null,
              choices: [{ itemId: 'srd-2024:dice-set', quantity: 1 }],
            },
          ],
          loadout: EMPTY_EQUIPMENT_LOADOUT,
        },
      }),
    )

    await goToWizardStep(user, screen, 'Basics')
    await user.selectOptions(
      screen.getByRole('combobox', { name: /rules edition/i }),
      'srd-2014',
    )

    expect(
      screen.getByRole('alertdialog', { name: /change rules edition/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/species, class and background selections/i),
    ).toBeInTheDocument()
  })

  it('clears background after confirming an edition change', async () => {
    const fighterInstance = createTestFighterClassInstance()
    const { user } = await renderLoadedApp(
      createStoredCharacter({
        ...withSingleClassInstance(fighterInstance),
        background: createCompleteSoldierBackground(),
        equipment: {
          selections: [
            {
              source: {
                kind: 'class-instance',
                instanceId: fighterInstance.instanceId,
              },
              entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
              optionId: 'package-a',
              choices: [],
            },
            {
              source: {
                kind: 'background',
                backgroundId: 'srd-2024:soldier',
              },
              entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
              path: [],
              optionId: PACKAGE_OPTION_ID,
              choices: [],
            },
            {
              source: {
                kind: 'background',
                backgroundId: 'srd-2024:soldier',
              },
              entitlementId: 'gaming-set',
              path: [PACKAGE_OPTION_ID],
              optionId: null,
              choices: [{ itemId: 'srd-2024:dice-set', quantity: 1 }],
            },
          ],
          loadout: EMPTY_EQUIPMENT_LOADOUT,
        },
      }),
    )

    await goToWizardStep(user, screen, 'Basics')
    await user.selectOptions(
      screen.getByRole('combobox', { name: /rules edition/i }),
      'srd-2014',
    )
    await user.click(screen.getByRole('button', { name: /^continue$/i }))

    await openBackgroundStep(user)

    expect(
      screen.getByText(/no bundled backgrounds are available for this rules edition/i),
    ).toBeInTheDocument()
    expect(document.querySelector('.background-picker__selection')).toBeNull()
  })
})

describe('Background persistence via localStorage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reloads a saved background from storage without derived bonus fields', async () => {
    const repository = createLocalStorageCharacterRepository()
    const character = createStoredCharacter({
      background: createCompleteSoldierBackground(),
    })

    await repository.save(character)
    const loaded = await repository.load(character.id)

    expect(loaded?.background).toEqual(createCompleteSoldierBackground())
    expect(loaded?.background).not.toHaveProperty('abilityScoreBonuses')
  })
})
