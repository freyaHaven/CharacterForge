// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import {
  getAbilityFieldNumberInput,
  getAbilityFieldSelect,
  selectCreationMethod,
} from '../../testing/abilityScoreTestUtils'
import { goToAbilityScoresStep } from '../../testing/wizardTestUtils'
import {
  clearEditorSession,
  openCharacterEditor,
} from '../../testing/characterEditorTestUtils'
import { STANDARD_ARRAY_UNASSIGNED_LABEL } from '../../features/ability-scores/StandardArrayAbilityInputs'
import { DEFAULT_STANDARD_ARRAY_ASSIGNMENT } from '../../rules/standard-array/standardArray'

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

async function switchToStandardArray(user: ReturnType<typeof userEvent.setup>) {
  await selectCreationMethod(user, screen, 'standard-array')
}

async function expectNoAutosaveAfter(ms = 400) {
  const callsBefore = saveMock.mock.calls.length
  await new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
  expect(saveMock.mock.calls.length).toBe(callsBefore)
}

describe('Standard Array workflow in App', () => {
  beforeEach(() => {
    clearEditorSession()
    loadMock.mockReset()
    saveMock.mockReset()
    loadMock.mockResolvedValue(null)
    saveMock.mockResolvedValue(undefined)
  })

  it('does not autosave while the standard array draft is incomplete', async () => {
    const { user } = await renderLoadedApp()
    await switchToStandardArray(user)

    expect(
      screen.queryByRole('button', { name: /save draft/i }),
    ).not.toBeInTheDocument()
    await expectNoAutosaveAfter()
  })

  it('autosaves when all six values are assigned exactly once', async () => {
    const { user } = await renderLoadedApp()
    await switchToStandardArray(user)

    await user.click(
      screen.getByRole('button', { name: /apply default standard array/i }),
    )

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          abilityScores: DEFAULT_STANDARD_ARRAY_ASSIGNMENT,
          creationMethod: 'standard-array',
        }),
      )
    })
  })

  it('does not overwrite numeric scores when switching from manual to standard array', async () => {
    const { user } = await renderLoadedApp()

    expect(getAbilityFieldNumberInput(screen, 'Strength')).toHaveValue(10)

    await switchToStandardArray(user)

    expect(getAbilityFieldSelect(screen, 'Strength')).toHaveDisplayValue(
      STANDARD_ARRAY_UNASSIGNED_LABEL,
    )
    await selectCreationMethod(user, screen, 'manual')
    expect(getAbilityFieldNumberInput(screen, 'Strength')).toHaveValue(10)
  })

  it('leaves previous numeric scores unchanged after partial draft edits and switching back to manual', async () => {
    const { user } = await renderLoadedApp()
    await switchToStandardArray(user)

    await user.selectOptions(getAbilityFieldSelect(screen, 'Strength'), '15')

    await selectCreationMethod(user, screen, 'manual')

    expect(getAbilityFieldNumberInput(screen, 'Strength')).toHaveValue(10)
    expect(getAbilityFieldNumberInput(screen, 'Dexterity')).toHaveValue(10)
  })

  it('saves numeric scores from a completed standard array assignment', async () => {
    const { user } = await renderLoadedApp()
    await switchToStandardArray(user)

    await user.click(
      screen.getByRole('button', { name: /apply default standard array/i }),
    )

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          abilityScores: DEFAULT_STANDARD_ARRAY_ASSIGNMENT,
          creationMethod: 'standard-array',
        }),
      )
    })
  })

  it('clears every draft ability to null', async () => {
    const { user } = await renderLoadedApp()
    await switchToStandardArray(user)

    await user.click(
      screen.getByRole('button', { name: /apply default standard array/i }),
    )
    await user.click(screen.getByRole('button', { name: /clear assignments/i }))

    for (const ability of [
      'Strength',
      'Dexterity',
      'Constitution',
      'Intelligence',
      'Wisdom',
      'Charisma',
    ] as const) {
      expect(getAbilityFieldSelect(screen, ability)).toHaveDisplayValue(
        STANDARD_ARRAY_UNASSIGNED_LABEL,
      )
    }
  })

  it('stops autosaving after clearing a completed assignment', async () => {
    const { user } = await renderLoadedApp()
    await switchToStandardArray(user)

    await user.click(
      screen.getByRole('button', { name: /apply default standard array/i }),
    )
    await waitFor(() => {
      expect(saveMock).toHaveBeenCalled()
    })

    await user.click(screen.getByRole('button', { name: /clear assignments/i }))
    saveMock.mockClear()
    await expectNoAutosaveAfter()

    expect(getAbilityFieldSelect(screen, 'Strength')).toHaveDisplayValue('—')
    expect(screen.queryByText(/remaining scores:/i)).not.toBeInTheDocument()
  })

  it('does not change manual numeric scores when clearing an incomplete draft', async () => {
    const { user } = await renderLoadedApp()
    await switchToStandardArray(user)

    await user.selectOptions(getAbilityFieldSelect(screen, 'Strength'), '15')
    await user.click(screen.getByRole('button', { name: /clear assignments/i }))
    await selectCreationMethod(user, screen, 'manual')

    expect(getAbilityFieldNumberInput(screen, 'Strength')).toHaveValue(10)
  })
})
