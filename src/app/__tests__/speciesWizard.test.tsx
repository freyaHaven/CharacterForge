// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import type { Character } from '../../domain/types'
import { createDefaultCharacter } from '../../domain/character/defaults'
import {
  getWizardStepButton,
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
    species: null,
    background: null,
    ...overrides,
  })
}

async function waitForSpeciesLoaded() {
  await waitFor(() => {
    expect(screen.queryByText(/loading species/i)).not.toBeInTheDocument()
  })
}

async function openSpeciesStep(user: ReturnType<typeof userEvent.setup>) {
  await goToSpeciesStep(user, screen)
  await waitForSpeciesLoaded()
}

function getAncestryTrigger() {
  return screen.getByRole('button', {
    name: /choose your draconic ancestor/i,
  })
}

async function ensureAncestryExpanded(
  user: ReturnType<typeof userEvent.setup>,
) {
  const trigger = getAncestryTrigger()
  if (trigger.getAttribute('aria-expanded') !== 'true') {
    await user.click(trigger)
  }
}

async function selectAncestry(
  user: ReturnType<typeof userEvent.setup>,
  label: RegExp,
) {
  await ensureAncestryExpanded(user)
  await user.click(screen.getByRole('radio', { name: label }))
}

function expectAncestrySelected(label: RegExp) {
  expect(screen.getByRole('radio', { name: label })).toBeChecked()
}

async function renderEditor(
  character: Character | null = null,
  user = userEvent.setup(),
) {
  clearEditorSession()

  if (character !== null) {
    seedRecentCharacter(character.id)
    loadMock.mockResolvedValue(character)
  } else {
    loadMock.mockResolvedValue(null)
  }

  render(<App />)

  if (character === null) {
    await openCharacterEditor(user)
  } else {
    await openStoredCharacterEditor(user, character)
  }

  return user
}

describe('Species wizard integration', () => {
  beforeEach(() => {
    clearEditorSession()
    clearRecentCharacters()
    loadMock.mockReset()
    saveMock.mockReset()
    saveMock.mockResolvedValue(undefined)
  })

  it('does not render species UI outside the wizard', async () => {
    const user = await renderEditor()
    await openSpeciesStep(user)

    expect(screen.getAllByRole('heading', { name: 'Species' })).toHaveLength(1)
  })

  it('reports species as not started before interaction', async () => {
    await renderEditor()

    expect(getWizardStepButton(screen, 'Species')).toHaveAccessibleName(
      /not started/i,
    )
  })

  it('shows incomplete draft status for Dragonborn without ancestry', async () => {
    const user = await renderEditor()
    await openSpeciesStep(user)
    await user.click(screen.getByRole('button', { name: 'Dragonborn' }))

    await waitFor(() => {
      expect(getWizardStepButton(screen, 'Species')).toHaveAccessibleName(
        /needs attention/i,
      )
    })
  })

  it('shows complete status after selecting Dwarf and languages', async () => {
    const user = await renderEditor()
    await openSpeciesStep(user)
    await user.click(screen.getByRole('button', { name: 'Dwarf' }))
    await selectStandardLanguages(user)

    await waitFor(() => {
      expect(getWizardStepButton(screen, 'Species')).toHaveAccessibleName(
        /complete/i,
      )
    })
  })

  it('shows complete status for a loaded committed Dwarf selection', async () => {
    const user = await renderEditor(
      createStoredCharacter({
        species: { ...COMPLETE_DWARF_SELECTION },
      }),
    )
    await openSpeciesStep(user)

    await waitFor(() => {
      expect(getWizardStepButton(screen, 'Species')).toHaveAccessibleName(
        /complete/i,
      )
    })
  })

  it('preserves Dragonborn draft and ancestry when navigating away and back', async () => {
    const user = await renderEditor()
    await openSpeciesStep(user)
    await user.click(screen.getByRole('button', { name: 'Dragonborn' }))
    await selectAncestry(user, /red \(fire\)/i)
    await selectStandardLanguages(user, [/draconic/i, /common sign language/i])

    await goToWizardStep(user, screen, 'Basics')
    await openSpeciesStep(user)

    expect(
      screen.getByRole('button', { name: 'Dragonborn', pressed: true }),
    ).toBeInTheDocument()
    await ensureAncestryExpanded(user)
    expectAncestrySelected(/red \(fire\)/i)
    expect(document.querySelector('.species-picker__selection')).toHaveTextContent(
      /Selected:\s*Dragonborn/i,
    )
  })

  it('preserves an incomplete Dragonborn draft when navigating away and back', async () => {
    const user = await renderEditor()
    await openSpeciesStep(user)
    await user.click(screen.getByRole('button', { name: 'Dragonborn' }))

    await goToWizardStep(user, screen, 'Basics')
    await openSpeciesStep(user)

    expect(
      screen.getByRole('button', { name: 'Dragonborn', pressed: true }),
    ).toBeInTheDocument()
    expect(getAncestryTrigger()).toBeInTheDocument()
    expect(
      screen.getByText(/complete required choices to confirm/i),
    ).toBeInTheDocument()
  })

  it('loads saved species without marking the step as touched on a fresh render', async () => {
    await renderEditor(
      createStoredCharacter({
        species: { ...COMPLETE_DWARF_SELECTION },
      }),
    )

    await waitFor(() => {
      expect(getWizardStepButton(screen, 'Species')).toHaveAccessibleName(
        /complete/i,
      )
    })
  })
})
