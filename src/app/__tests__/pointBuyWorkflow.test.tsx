// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import {
  getAbilityFieldNumberInput,
  selectCreationMethod,
} from '../../testing/abilityScoreTestUtils'
import { goToAbilityScoresStep } from '../../testing/wizardTestUtils'
import {
  clearEditorSession,
  clearRecentCharacters,
  openCharacterEditor,
  openStoredCharacterEditor,
  seedRecentCharacter,
} from '../../testing/characterEditorTestUtils'
import { createDefaultCharacter } from '../../domain/character/defaults'
import { MINIMUM_POINT_BUY_ASSIGNMENT } from '../../rules/point-buy'
import type { Character } from '../../domain/types'

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

async function renderLoadedApp() {
  const user = userEvent.setup()
  render(<App />)

  await openCharacterEditor(user)
  saveMock.mockClear()
  await goToAbilityScoresStep(user, screen)

  return { user }
}

async function switchToPointBuy(user: ReturnType<typeof userEvent.setup>) {
  await selectCreationMethod(user, screen, 'point-buy')
}

function expectAllPointBuyScoresAreEight() {
  for (const ability of [
    'strength',
    'dexterity',
    'constitution',
    'intelligence',
    'wisdom',
    'charisma',
  ] as const) {
    expect(
      screen.getByTestId(`ability-score-overview-${ability}`),
    ).toHaveTextContent('8')
  }
}

describe('Point Buy workflow in App', () => {
  beforeEach(() => {
    clearEditorSession()
    clearRecentCharacters()
    loadMock.mockReset()
    saveMock.mockReset()
    loadMock.mockResolvedValue(null)
    saveMock.mockResolvedValue(undefined)
  })

  it('initialises Point Buy at all 8s with a full 27-point budget', async () => {
    const { user } = await renderLoadedApp()
    await switchToPointBuy(user)

    expectAllPointBuyScoresAreEight()
    expect(screen.getByText(/points remaining/i)).toBeInTheDocument()
    expect(screen.getByText('27 / 27')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /start point buy/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /reset all to 8/i }),
    ).not.toBeInTheDocument()
  })

  it('resets to all 8s when switching from another method to Point Buy', async () => {
    const { user } = await renderLoadedApp()

    fireEvent.change(getAbilityFieldNumberInput(screen, 'Strength'), {
      target: { value: '14' },
    })
    await selectCreationMethod(user, screen, 'standard-array')
    await switchToPointBuy(user)

    expectAllPointBuyScoresAreEight()
    expect(screen.getByText('27 / 27')).toBeInTheDocument()
  })

  it('restores a saved valid Point Buy assignment when loading a character', async () => {
    const character: Character = createDefaultCharacter({
      id: 'char-pb',
      name: 'Point Buyer',
      creationMethod: 'point-buy',
      abilityScores: {
        strength: 15,
        dexterity: 14,
        constitution: 13,
        intelligence: 12,
        wisdom: 10,
        charisma: 8,
      },
    })
    seedRecentCharacter(character.id)
    loadMock.mockResolvedValue(character)

    const user = userEvent.setup()
    render(<App />)
    await openStoredCharacterEditor(user, character)
    await goToAbilityScoresStep(user, screen)

    expect(screen.getByLabelText(/strength score/i)).toHaveTextContent('15')
    expect(screen.getByLabelText(/dexterity score/i)).toHaveTextContent('14')
    expect(screen.getByText('0 / 27')).toBeInTheDocument()
  })

  it('syncs a valid draft into numeric character scores', async () => {
    const { user } = await renderLoadedApp()
    await switchToPointBuy(user)

    await user.click(screen.getByRole('button', { name: 'Increase Strength' }))
    await user.click(screen.getByRole('button', { name: 'Increase Strength' }))

    await selectCreationMethod(user, screen, 'manual')
    expect(getAbilityFieldNumberInput(screen, 'Strength')).toHaveValue(10)
  })

  it('syncs after a valid draft and allows manual view to reflect scores', async () => {
    const { user } = await renderLoadedApp()
    await switchToPointBuy(user)

    for (let click = 0; click < 7; click += 1) {
      await user.click(screen.getByRole('button', { name: 'Increase Strength' }))
    }

    await selectCreationMethod(user, screen, 'manual')
    expect(getAbilityFieldNumberInput(screen, 'Strength')).toHaveValue(15)
  })

  it('resets all draft scores to 8', async () => {
    const { user } = await renderLoadedApp()
    await switchToPointBuy(user)

    expect(
      screen.queryByRole('button', { name: /reset all to 8/i }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Increase Strength' }))
    await user.click(screen.getByRole('button', { name: /reset all to 8/i }))

    expect(screen.getByLabelText(/strength score/i)).toHaveTextContent('8')
    expect(screen.getByLabelText(/dexterity score/i)).toHaveTextContent('8')
    expect(
      screen.queryByRole('button', { name: /reset all to 8/i }),
    ).not.toBeInTheDocument()
  })

  it('allows saving with unspent points', async () => {
    const { user } = await renderLoadedApp()
    await switchToPointBuy(user)

    expect(screen.getByText('27 / 27')).toBeInTheDocument()

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          abilityScores: MINIMUM_POINT_BUY_ASSIGNMENT,
          creationMethod: 'point-buy',
        }),
      )
    })
  })

  it('shows budget, cost, and overview details while editing point buy', async () => {
    const { user } = await renderLoadedApp()
    await switchToPointBuy(user)

    for (const _ of Array.from({ length: 7 })) {
      await user.click(screen.getByRole('button', { name: 'Increase Strength' }))
    }

    expect(screen.getByLabelText(/strength score/i)).toHaveTextContent('15')
    expect(screen.getByText('9 pts')).toBeInTheDocument()
    expect(screen.getByText('18 / 27')).toBeInTheDocument()
    expect(screen.getByText('TOTAL 15')).toBeInTheDocument()
  })
})
