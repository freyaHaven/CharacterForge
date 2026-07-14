// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { Character } from '../domain/types'
import {
  getWizardStepButton,
  goToAbilityScoresStep,
  goToSpeciesStep,
  goToWizardStep,
} from '../test/wizardTestUtils'
import { DEFAULT_STANDARD_ARRAY_ASSIGNMENT } from '../rules/standard-array/standardArray'

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
  return {
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
    species: { speciesId: 'srd-2024:dwarf', choices: {} },
    ...overrides,
  }
}

async function renderApp(character: Character | null = null) {
  loadMock.mockResolvedValue(character)
  saveMock.mockResolvedValue(undefined)
  const user = userEvent.setup()
  render(<App />)

  await waitFor(() => {
    expect(screen.queryByText(/loading character/i)).not.toBeInTheDocument()
  })

  return { user }
}

async function openReviewStep(user: ReturnType<typeof userEvent.setup>) {
  await goToWizardStep(user, screen, 'Review')
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
    await user.selectOptions(
      screen.getByRole('combobox', { name: /choose your draconic ancestor/i }),
      'red',
    )
  }

  if (useStandardArray) {
    await goToAbilityScoresStep(user, screen)
    await user.selectOptions(
      screen.getByRole('combobox', { name: /ability score method/i }),
      'standard-array',
    )
    await user.click(
      screen.getByRole('button', { name: /apply default standard array/i }),
    )
  }
}

describe('Review wizard integration', () => {
  beforeEach(() => {
    loadMock.mockReset()
    saveMock.mockReset()
  })

  it('renders all six review summaries for a loaded character', async () => {
    const { user } = await renderApp(createStoredCharacter())
    await openReviewStep(user)

    expect(screen.getByRole('heading', { name: 'Basics', level: 3 })).toBeInTheDocument()
    expect(screen.getByText('Name: Aldric')).toBeInTheDocument()
    expect(screen.getByText('Edition: D&D 5e 2024')).toBeInTheDocument()
    expect(screen.getByText('Species: Dwarf')).toBeInTheDocument()
    expect(screen.getByText('Method: Manual')).toBeInTheDocument()
    expect(screen.getAllByText('Coming soon')).toHaveLength(3)
  })

  it('navigates to the selected step from an edit action', async () => {
    const { user } = await renderApp(createStoredCharacter())
    await openReviewStep(user)

    await user.click(screen.getByRole('button', { name: 'Edit Species' }))

    expect(getWizardStepButton(screen, 'Species')).toHaveAttribute(
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

  it('allows finish when required steps are complete and optional steps are not', async () => {
    const { user } = await renderApp(null)
    await completeRequiredSteps(user)
    await openReviewStep(user)

    await waitFor(() => {
      expect(getWizardStepButton(screen, 'Species')).toHaveAccessibleName(/complete/i)
    })
    expect(screen.getByRole('button', { name: /finish character/i })).toBeEnabled()
  })

  it('finishes through the existing save path and shows a success message', async () => {
    const { user } = await renderApp(null)
    await completeRequiredSteps(user)
    await openReviewStep(user)

    await user.click(screen.getByRole('button', { name: /finish character/i }))

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Aldric',
          species: { speciesId: 'srd-2024:dwarf', choices: {} },
          creationMethod: 'standard-array',
          abilityScores: DEFAULT_STANDARD_ARRAY_ASSIGNMENT,
        }),
      )
    })
    expect(screen.getByText('Character complete.')).toBeInTheDocument()
  })

  it('shows Dragonborn ancestry in the species summary', async () => {
    const { user } = await renderApp(
      createStoredCharacter({
        species: {
          speciesId: 'srd-2024:dragonborn',
          choices: { 'draconic-ancestry': 'red' },
        },
      }),
    )
    await openReviewStep(user)

    expect(screen.getByText('Species: Dragonborn')).toBeInTheDocument()
    expect(screen.getByText('Ancestry: Red (Fire)')).toBeInTheDocument()
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

    expect(screen.getByText('Choice incomplete')).toBeInTheDocument()
    expect(
      screen.getByText('Needs attention', { selector: '.review-summary-card__warning' }),
    ).toBeInTheDocument()
  })

  it('keeps save draft separate from finish character', async () => {
    const { user } = await renderApp(null)
    await completeRequiredSteps(user)

    await user.click(screen.getByRole('button', { name: /save draft/i }))

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalled()
    })
    expect(screen.getByText(/character saved/i)).toBeInTheDocument()
    expect(screen.queryByText('Character complete.')).not.toBeInTheDocument()
  })
})
