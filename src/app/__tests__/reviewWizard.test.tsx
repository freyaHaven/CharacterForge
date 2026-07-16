// @vitest-environment jsdom

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import type { Character } from '../../domain/types'
import { createDefaultCharacter } from '../../domain/character/defaults'
import { withSingleClassInstance } from '../../domain/character/characterClassSelection'
import { createTestFighterClassInstance } from '../../testing/classFixtures'
import {
  completeFighterSelection,
  getWizardStepButton,
  goToAbilityScoresStep,
  goToSpeciesStep,
  goToWizardStep,
} from '../../testing/wizardTestUtils'
import {
  clearEditorSession,
  clearRecentCharacters,
  openCharacterEditor,
  openStoredCharacterEditor,
  seedRecentCharacter,
} from '../../testing/characterEditorTestUtils'
import {
  COMPLETE_DWARF_SELECTION,
  selectStandardLanguages,
} from '../../testing/speciesSelectionTestUtils'

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

function createStoredCharacter(overrides: Partial<Character> = {}): Character {
  const fighterInstance = createTestFighterClassInstance()

  return createDefaultCharacter({
    id: 'char-1',
    name: 'Aldric',
    editionId: 'srd-2024',
    creationMethod: 'manual',
    species: { ...COMPLETE_DWARF_SELECTION },
    ...withSingleClassInstance(fighterInstance),
    ...overrides,
  })
}

async function renderApp(character: Character | null = null) {
  clearEditorSession()

  if (character !== null) {
    seedRecentCharacter(character.id)
    loadMock.mockResolvedValue(character)
  } else {
    loadMock.mockResolvedValue(null)
  }

  saveMock.mockResolvedValue(undefined)
  const user = userEvent.setup()
  render(<App />)

  if (character === null) {
    await openCharacterEditor(user)
    saveMock.mockClear()
  } else {
    await openStoredCharacterEditor(user, character)
  }

  return { user }
}

async function openReviewStep(user: ReturnType<typeof userEvent.setup>) {
  await goToWizardStep(user, screen, 'Overview')
}

async function completeRequiredSteps(
  user: ReturnType<typeof userEvent.setup>,
  {
    name = 'Aldric',
    species = 'Dwarf',
    useStandardArray = true,
  }: {
    name?: string
    species?: 'Dwarf' | 'Dragonborn'
    useStandardArray?: boolean
  } = {},
) {
  await goToWizardStep(user, screen, 'Basics')
  if (name.length > 0) {
    await user.clear(screen.getByRole('textbox', { name: /character name/i }))
    await user.type(screen.getByRole('textbox', { name: /character name/i }), name)
  }

  await goToSpeciesStep(user, screen)
  await waitFor(() => {
    expect(screen.queryByText(/loading species/i)).not.toBeInTheDocument()
  })
  await user.click(screen.getByRole('button', { name: species }))

  if (species === 'Dragonborn') {
    const ancestryTrigger = screen.getByRole('button', {
      name: /choose your draconic ancestor/i,
    })
    if (ancestryTrigger.getAttribute('aria-expanded') !== 'true') {
      await user.click(ancestryTrigger)
    }
    await user.click(screen.getByRole('radio', { name: /red \(fire\)/i }))
    await selectStandardLanguages(user, [/draconic/i, /common sign language/i])
  } else {
    await selectStandardLanguages(user)
  }

  if (useStandardArray) {
    await goToAbilityScoresStep(user, screen)
    await user.click(screen.getByRole('radio', { name: /^Standard Array/i }))
    await user.click(
      screen.getByRole('button', { name: /apply default standard array/i }),
    )
  }

  await completeFighterSelection(user, screen)
}

describe('Review wizard integration', () => {
  beforeEach(() => {
    clearEditorSession()
    clearRecentCharacters()
    loadMock.mockReset()
    saveMock.mockReset()
  })

  it('renders grouped character sheet sections for a loaded character', async () => {
    const { user } = await renderApp(createStoredCharacter())
    await openReviewStep(user)

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Features', level: 3 }),
      ).toBeInTheDocument()
      expect(screen.getByText('Defense')).toBeInTheDocument()
    })
    expect(
      screen.queryByRole('heading', { name: 'Basics', level: 3 }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Edition: D&D 5e 2024')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Aldric', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('Level 1')).toBeInTheDocument()
    expect(screen.queryByTestId('character-context-summary')).not.toBeInTheDocument()
    expect(screen.queryByText(/Primary abilities:/i)).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Ability Scores', level: 4 }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Statistics', level: 3 }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Features', level: 3 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Defense')).toBeInTheDocument()
    expect(screen.getByText('Weapon Mastery')).toBeInTheDocument()
  })

  it('navigates to the selected step from an edit action', async () => {
    const { user } = await renderApp(createStoredCharacter())
    await openReviewStep(user)

    await user.click(screen.getByRole('button', { name: 'Edit class' }))

    expect(getWizardStepButton(screen, 'Class')).toHaveAttribute(
      'aria-current',
      'step',
    )
  })

  it('blocks finish while required steps remain incomplete', async () => {
    const { user } = await renderApp(null)
    await openReviewStep(user)

    expect(screen.getByRole('button', { name: /finish character/i })).toBeDisabled()
    expect(
      screen.getByText(/complete these required steps before finishing/i),
    ).toBeInTheDocument()
  })

  it('blocks finish when deferred character decisions remain unresolved', async () => {
    const { user } = await renderApp(null)
    await completeRequiredSteps(user)
    await openReviewStep(user)

    await waitFor(() => {
      expect(getWizardStepButton(screen, 'Species')).toHaveAccessibleName(/complete/i)
    })
    expect(screen.getByRole('button', { name: /finish character/i })).toBeDisabled()
    expect(
      screen.getByText(/complete remaining character decisions before finishing/i),
    ).toBeInTheDocument()
  })

  it('does not finish while deferred character decisions remain unresolved', async () => {
    const { user } = await renderApp(null)
    await completeRequiredSteps(user)
    await openReviewStep(user)

    await user.click(screen.getByRole('button', { name: /finish character/i }))

    expect(saveMock).not.toHaveBeenCalled()
    expect(screen.queryByText('Character complete.')).not.toBeInTheDocument()
  })

  it('shows Dragonborn ancestry on the Species card', async () => {
    const { user } = await renderApp(
      createStoredCharacter({
        species: {
          speciesId: 'srd-2024:dragonborn',
          choices: { 'draconic-ancestry': 'red' },
        },
      }),
    )
    await openReviewStep(user)

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Species · Dragonborn', level: 4 }),
      ).toBeInTheDocument()
    })

    const speciesGroup = screen
      .getByRole('heading', { name: 'Species · Dragonborn', level: 4 })
      .closest('.character-sheet__feature-group') as HTMLElement
    expect(within(speciesGroup).getByText('Ancestry')).toBeInTheDocument()
    expect(within(speciesGroup).getByText('Red (Fire)')).toBeInTheDocument()
  })

  it('uses the computed warning state for incomplete species drafts', async () => {
    const { user } = await renderApp(null)
    await goToWizardStep(user, screen, 'Basics')
    await user.type(screen.getByRole('textbox', { name: /character name/i }), 'Aldric')
    await goToSpeciesStep(user, screen)
    await waitFor(() => {
      expect(screen.queryByText(/loading species/i)).not.toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: 'Dragonborn' }))
    await openReviewStep(user)

    expect(
      screen.getByText('Some sections still need attention before you can finish your character.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Background & Personality', level: 3 }),
    ).not.toBeInTheDocument()
  })

  it('autosaves without requiring finish character', async () => {
    const { user } = await renderApp(null)
    await completeRequiredSteps(user)

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalled()
    })
    expect(screen.queryByText('Character complete.')).not.toBeInTheDocument()
  })
})
