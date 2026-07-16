// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import type { Character } from '../../domain/types'
import { createDefaultCharacter } from '../../domain/character/defaults'
import {
  getAbilityFieldNumberInput,
  getCreationMethodRadio,
  selectCreationMethod,
} from '../../testing/abilityScoreTestUtils'
import {
  getWizardStepButton,
  goToAbilityScoresStep,
  goToWizardStep,
} from '../../testing/wizardTestUtils'
import {
  activateEditorSession,
  clearEditorSession,
  openCharacterEditor,
  waitForAppReady,
} from '../../testing/characterEditorTestUtils'
import { DEFAULT_STANDARD_ARRAY_ASSIGNMENT } from '../../rules/standard-array/standardArray'
import { MINIMUM_POINT_BUY_ASSIGNMENT } from '../../rules/point-buy'

const { loadMock, saveMock } = vi.hoisted(() => ({
  loadMock: vi.fn(),
  saveMock: vi.fn(),
}))

vi.mock('../../adapters/localStorageCharacterRepository', () => ({
  createLocalStorageCharacterRepository: () => ({
    load: loadMock,
    save: saveMock,
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

async function renderApp(character: Character | null = null) {
  clearEditorSession()

  if (character !== null) {
    activateEditorSession(character.id)
    loadMock.mockResolvedValue(character)
  } else {
    loadMock.mockResolvedValue(null)
  }

  saveMock.mockResolvedValue(undefined)
  const user = userEvent.setup()
  render(<App />)

  await waitForAppReady()

  if (character === null) {
    await openCharacterEditor(user)
    saveMock.mockClear()
  }

  return { user }
}

describe('Ability Scores wizard integration', () => {
  beforeEach(() => {
    clearEditorSession()
    loadMock.mockReset()
    saveMock.mockReset()
  })

  it('does not render ability scores UI outside the wizard', async () => {
    const { user } = await renderApp()
    await goToAbilityScoresStep(user, screen)

    expect(
      screen.getAllByRole('radio', { name: /^Manual/i }),
    ).toHaveLength(1)
  })

  it('renders all four creation methods inside the wizard step', async () => {
    const { user } = await renderApp()
    await goToAbilityScoresStep(user, screen)

    expect(getCreationMethodRadio(screen, 'manual')).toBeChecked()
    expect(getAbilityFieldNumberInput(screen, 'Strength')).toBeInTheDocument()

    await selectCreationMethod(user, screen, 'standard-array')
    expect(
      screen.getByRole('button', { name: /apply default standard array/i }),
    ).toBeInTheDocument()

    await selectCreationMethod(user, screen, 'point-buy')
    expect(screen.getByText(/points spent:/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Increase Strength' })).toBeInTheDocument()

    await selectCreationMethod(user, screen, 'rolled')
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeInTheDocument()

    await selectCreationMethod(user, screen, 'manual')
    expect(getAbilityFieldNumberInput(screen, 'Strength')).toBeInTheDocument()
  })

  it('reports ability scores as not started before interaction on a fresh character', async () => {
    const { user } = await renderApp()

    expect(getWizardStepButton(screen, 'Abilities')).toHaveAccessibleName(
      /not started/i,
    )

    await goToAbilityScoresStep(user, screen)
    await selectCreationMethod(user, screen, 'standard-array')

    expect(getWizardStepButton(screen, 'Abilities')).toHaveAccessibleName(
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

    expect(getWizardStepButton(screen, 'Abilities')).toHaveAccessibleName(
      /not started/i,
    )
  })

  it('shows complete status for a valid touched ability scores step', async () => {
    const { user } = await renderApp()
    await goToAbilityScoresStep(user, screen)

    await selectCreationMethod(user, screen, 'standard-array')
    await user.click(
      screen.getByRole('button', { name: /apply default standard array/i }),
    )

    expect(getWizardStepButton(screen, 'Abilities')).toHaveAccessibleName(
      /complete/i,
    )
  })

  it('preserves in-progress standard array drafts when navigating away and back', async () => {
    const { user } = await renderApp()
    await goToAbilityScoresStep(user, screen)
    await selectCreationMethod(user, screen, 'standard-array')
    await user.click(
      screen.getByRole('button', { name: /apply default standard array/i }),
    )

    await goToWizardStep(user, screen, 'Basics')
    await goToAbilityScoresStep(user, screen)

    expect(
      screen.getByRole('button', { name: /export character/i }),
    ).toBeInTheDocument()
    expect(getWizardStepButton(screen, 'Abilities')).toHaveAccessibleName(
      /complete/i,
    )
  })

  it('saves the current valid numeric scores from the wizard step', async () => {
    const { user } = await renderApp()
    await goToAbilityScoresStep(user, screen)
    await selectCreationMethod(user, screen, 'standard-array')
    await user.click(
      screen.getByRole('button', { name: /apply default standard array/i }),
    )

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
