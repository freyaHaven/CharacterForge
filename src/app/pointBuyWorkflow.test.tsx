// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import {
  getAbilityFieldNumberInput,
  selectCreationMethod,
} from '../test/abilityScoreTestUtils'
import { goToAbilityScoresStep } from '../test/wizardTestUtils'
import {
  clearEditorSession,
  openCharacterEditor,
} from '../test/characterEditorTestUtils'
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

async function makeInvalidPointBuyScores() {
  fireEvent.change(getAbilityFieldNumberInput(screen, 'Strength'), {
    target: { value: '16' },
  })
}

describe('Point Buy workflow in App', () => {
  beforeEach(() => {
    clearEditorSession()
    loadMock.mockReset()
    saveMock.mockReset()
    loadMock.mockResolvedValue(null)
    saveMock.mockResolvedValue(undefined)
  })

  it('does not overwrite invalid existing scores when switching to point buy', async () => {
    const { user } = await renderLoadedApp()
    await makeInvalidPointBuyScores()
    await switchToPointBuy(user)

    expect(screen.getByRole('button', { name: /start point buy/i })).toBeInTheDocument()
    await selectCreationMethod(user, screen, 'manual')
    expect(getAbilityFieldNumberInput(screen, 'Strength')).toHaveValue(16)
  })

  it('starts point buy from all 8s', async () => {
    const { user } = await renderLoadedApp()
    await makeInvalidPointBuyScores()
    await switchToPointBuy(user)

    await user.click(screen.getByRole('button', { name: /start point buy/i }))

    expect(screen.getByLabelText(/strength score/i)).toHaveTextContent('8')
    expect(screen.getByText(/points spent: 0 \/ 27/i)).toBeInTheDocument()
    expect(screen.getByText(/remaining: 27/i)).toBeInTheDocument()
  })

  it('initialises the draft from scores that are already a valid point-buy assignment', async () => {
    const { user } = await renderLoadedApp()
    await switchToPointBuy(user)

    expect(screen.queryByRole('button', { name: /start point buy/i })).not.toBeInTheDocument()
    expect(screen.getByLabelText(/strength score/i)).toHaveTextContent('10')
    expect(screen.getByText(/points spent: 12 \/ 27/i)).toBeInTheDocument()
  })

  it('syncs a valid draft into numeric character scores', async () => {
    const { user } = await renderLoadedApp()
    await makeInvalidPointBuyScores()
    await switchToPointBuy(user)
    await user.click(screen.getByRole('button', { name: /start point buy/i }))

    await user.click(screen.getByRole('button', { name: 'Increase Strength' }))
    await user.click(screen.getByRole('button', { name: 'Increase Strength' }))

    await selectCreationMethod(user, screen, 'manual')
    expect(getAbilityFieldNumberInput(screen, 'Strength')).toHaveValue(10)
  })

  it('syncs after a valid draft and allows manual view to reflect scores', async () => {
    const { user } = await renderLoadedApp()
    await makeInvalidPointBuyScores()
    await switchToPointBuy(user)
    await user.click(screen.getByRole('button', { name: /start point buy/i }))

    for (let click = 0; click < 7; click += 1) {
      await user.click(screen.getByRole('button', { name: 'Increase Strength' }))
    }

    await selectCreationMethod(user, screen, 'manual')
    expect(getAbilityFieldNumberInput(screen, 'Strength')).toHaveValue(15)
  })

  it('resets all draft scores to 8', async () => {
    const { user } = await renderLoadedApp()
    await makeInvalidPointBuyScores()
    await switchToPointBuy(user)
    await user.click(screen.getByRole('button', { name: /start point buy/i }))

    await user.click(screen.getByRole('button', { name: 'Increase Strength' }))
    await user.click(screen.getByRole('button', { name: /reset all to 8/i }))

    expect(screen.getByLabelText(/strength score/i)).toHaveTextContent('8')
    expect(screen.getByLabelText(/dexterity score/i)).toHaveTextContent('8')
  })

  it('allows saving with unspent points', async () => {
    const { user } = await renderLoadedApp()
    await makeInvalidPointBuyScores()
    await switchToPointBuy(user)
    await user.click(screen.getByRole('button', { name: /start point buy/i }))

    expect(screen.getByText(/remaining:\s*27/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          abilityScores: MINIMUM_POINT_BUY_ASSIGNMENT,
          creationMethod: 'point-buy',
        }),
      )
    })
  })

  it('shows budget, cost, and modifier details while editing point buy', async () => {
    const { user } = await renderLoadedApp()
    await makeInvalidPointBuyScores()
    await switchToPointBuy(user)
    await user.click(screen.getByRole('button', { name: /start point buy/i }))

    for (const _ of Array.from({ length: 7 })) {
      await user.click(screen.getByRole('button', { name: 'Increase Strength' }))
    }

    expect(screen.getByLabelText(/strength score/i)).toHaveTextContent('15')
    expect(screen.getByText('+2')).toBeInTheDocument()
    expect(screen.getByText('9 pts')).toBeInTheDocument()
    expect(screen.getByText(/points spent: 9 \/ 27/i)).toBeInTheDocument()
    expect(screen.getByText(/remaining: 18/i)).toBeInTheDocument()
  })
})
