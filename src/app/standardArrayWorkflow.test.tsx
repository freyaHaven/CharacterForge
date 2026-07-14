// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import {
  getAbilityFieldNumberInput,
  getAbilityFieldSelect,
  getCreationMethodSelect,
} from '../test/abilityScoreTestUtils'
import { goToAbilityScoresStep } from '../test/wizardTestUtils'
import { STANDARD_ARRAY_UNASSIGNED_LABEL } from '../features/ability-scores/StandardArrayAbilityInputs'
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

async function renderLoadedApp() {
  const user = userEvent.setup()
  render(<App />)

  await waitFor(() => {
    expect(screen.queryByText(/loading character/i)).not.toBeInTheDocument()
  })

  await goToAbilityScoresStep(user, screen)

  return { user }
}

async function switchToStandardArray(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(getCreationMethodSelect(screen), 'standard-array')
}

describe('Standard Array workflow in App', () => {
  beforeEach(() => {
    loadMock.mockReset()
    saveMock.mockReset()
    loadMock.mockResolvedValue(null)
    saveMock.mockResolvedValue(undefined)
  })

  it('disables save while the standard array draft is incomplete', async () => {
    const { user } = await renderLoadedApp()
    await switchToStandardArray(user)

    expect(screen.getByRole('button', { name: /save draft/i })).toBeDisabled()
    expect(
      screen.getByText(/complete the standard array assignment before saving/i),
    ).toBeInTheDocument()
  })

  it('enables save when all six values are assigned exactly once', async () => {
    const { user } = await renderLoadedApp()
    await switchToStandardArray(user)

    await user.click(
      screen.getByRole('button', { name: /apply default standard array/i }),
    )

    expect(screen.getByRole('button', { name: /save draft/i })).toBeEnabled()
  })

  it('does not overwrite numeric scores when switching from manual to standard array', async () => {
    const { user } = await renderLoadedApp()

    expect(getAbilityFieldNumberInput(screen, 'Strength')).toHaveValue(10)

    await switchToStandardArray(user)

    expect(getAbilityFieldSelect(screen, 'Strength')).toHaveDisplayValue(
      STANDARD_ARRAY_UNASSIGNED_LABEL,
    )
    await user.selectOptions(getCreationMethodSelect(screen), 'manual')
    expect(getAbilityFieldNumberInput(screen, 'Strength')).toHaveValue(10)
  })

  it('leaves previous numeric scores unchanged after partial draft edits and switching back to manual', async () => {
    const { user } = await renderLoadedApp()
    await switchToStandardArray(user)

    await user.selectOptions(getAbilityFieldSelect(screen, 'Strength'), '15')

    await user.selectOptions(getCreationMethodSelect(screen), 'manual')

    expect(getAbilityFieldNumberInput(screen, 'Strength')).toHaveValue(10)
    expect(getAbilityFieldNumberInput(screen, 'Dexterity')).toHaveValue(10)
  })

  it('saves numeric scores from a completed standard array assignment', async () => {
    const { user } = await renderLoadedApp()
    await switchToStandardArray(user)

    await user.click(
      screen.getByRole('button', { name: /apply default standard array/i }),
    )
    await user.click(screen.getByRole('button', { name: /save draft/i }))

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledTimes(1)
    })

    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        abilityScores: DEFAULT_STANDARD_ARRAY_ASSIGNMENT,
        creationMethod: 'standard-array',
      }),
    )
    expect(screen.getByText(/character saved/i)).toBeInTheDocument()
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

  it('keeps save disabled after clearing a completed assignment', async () => {
    const { user } = await renderLoadedApp()
    await switchToStandardArray(user)

    await user.click(
      screen.getByRole('button', { name: /apply default standard array/i }),
    )
    expect(screen.getByRole('button', { name: /save draft/i })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: /clear assignments/i }))

    expect(screen.getByRole('button', { name: /save draft/i })).toBeDisabled()
    expect(screen.getByText(/remaining scores:/i)).toHaveTextContent(
      '15, 14, 13, 12, 10, 8',
    )
  })

  it('does not change manual numeric scores when clearing an incomplete draft', async () => {
    const { user } = await renderLoadedApp()
    await switchToStandardArray(user)

    await user.click(screen.getByRole('button', { name: /clear assignments/i }))
    await user.selectOptions(getCreationMethodSelect(screen), 'manual')

    expect(getAbilityFieldNumberInput(screen, 'Strength')).toHaveValue(10)
  })
})
