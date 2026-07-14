// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { Character } from '../domain/types'
import {
  getAbilityFieldNumberInput,
  getCreationMethodSelect,
} from '../test/abilityScoreTestUtils'
import {
  getWizardStepButton,
  goToAbilityScoresStep,
  goToWizardStep,
} from '../test/wizardTestUtils'
import { DEFAULT_STANDARD_ARRAY_ASSIGNMENT } from '../rules/standard-array/standardArray'
import { MINIMUM_POINT_BUY_ASSIGNMENT } from '../rules/point-buy'

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
    species: null,
    class: null,
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

describe('Ability Scores wizard integration', () => {
  beforeEach(() => {
    loadMock.mockReset()
    saveMock.mockReset()
  })

  it('does not render ability scores UI outside the wizard', async () => {
    const { user } = await renderApp()
    await goToAbilityScoresStep(user, screen)

    expect(
      screen.getAllByRole('combobox', { name: /ability score method/i }),
    ).toHaveLength(1)
  })

  it('renders all four creation methods inside the wizard step', async () => {
    const { user } = await renderApp()
    await goToAbilityScoresStep(user, screen)

    expect(getCreationMethodSelect(screen)).toBeInTheDocument()
    expect(getAbilityFieldNumberInput(screen, 'Strength')).toBeInTheDocument()

    await user.selectOptions(getCreationMethodSelect(screen), 'standard-array')
    expect(
      screen.getByRole('button', { name: /apply default standard array/i }),
    ).toBeInTheDocument()

    await user.selectOptions(getCreationMethodSelect(screen), 'point-buy')
    expect(screen.getByText(/points spent:/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Increase Strength' })).toBeInTheDocument()

    await user.selectOptions(getCreationMethodSelect(screen), 'rolled')
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeInTheDocument()

    await user.selectOptions(getCreationMethodSelect(screen), 'manual')
    expect(getAbilityFieldNumberInput(screen, 'Strength')).toBeInTheDocument()
  })

  it('reports ability scores as not started before interaction on a fresh character', async () => {
    const { user } = await renderApp()

    expect(getWizardStepButton(screen, 'Ability Scores')).toHaveAccessibleName(
      /not started/i,
    )

    await goToAbilityScoresStep(user, screen)
    await user.selectOptions(getCreationMethodSelect(screen), 'standard-array')

    expect(getWizardStepButton(screen, 'Ability Scores')).toHaveAccessibleName(
      /needs attention/i,
    )
  })

  it('does not mark ability scores as touched when loading saved scores', async () => {
    await renderApp(
      createStoredCharacter({
        creationMethod: 'point-buy',
        abilityScores: MINIMUM_POINT_BUY_ASSIGNMENT,
      }),
    )

    expect(getWizardStepButton(screen, 'Ability Scores')).toHaveAccessibleName(
      /not started/i,
    )
  })

  it('shows complete status for a valid touched ability scores step', async () => {
    const { user } = await renderApp()
    await goToAbilityScoresStep(user, screen)

    await user.selectOptions(getCreationMethodSelect(screen), 'standard-array')
    await user.click(
      screen.getByRole('button', { name: /apply default standard array/i }),
    )

    expect(getWizardStepButton(screen, 'Ability Scores')).toHaveAccessibleName(
      /complete/i,
    )
  })

  it('preserves in-progress standard array drafts when navigating away and back', async () => {
    const { user } = await renderApp()
    await goToAbilityScoresStep(user, screen)
    await user.selectOptions(getCreationMethodSelect(screen), 'standard-array')
    await user.click(
      screen.getByRole('button', { name: /apply default standard array/i }),
    )

    await goToWizardStep(user, screen, 'Basics')
    await goToAbilityScoresStep(user, screen)

    expect(
      screen.getByRole('button', { name: /save draft/i }),
    ).toBeEnabled()
    expect(getWizardStepButton(screen, 'Ability Scores')).toHaveAccessibleName(
      /complete/i,
    )
  })

  it('saves the current valid numeric scores from the wizard step', async () => {
    const { user } = await renderApp()
    await goToAbilityScoresStep(user, screen)
    await user.selectOptions(getCreationMethodSelect(screen), 'standard-array')
    await user.click(
      screen.getByRole('button', { name: /apply default standard array/i }),
    )
    await user.click(screen.getByRole('button', { name: /save draft/i }))

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          creationMethod: 'standard-array',
          abilityScores: DEFAULT_STANDARD_ARRAY_ASSIGNMENT,
        }),
      )
    })
  })
})
