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
import { ROLLED_UNASSIGNED_LABEL } from '../../features/ability-scores/RolledAbilityInputs'
import { createSeededRandomSource } from '../../rules/rolled'

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

async function renderLoadedApp(randomSource = createSeededRandomSource(5)) {
  const user = userEvent.setup()
  const utils = render(<App randomSource={randomSource} />)

  await openCharacterEditor(user)
  saveMock.mockClear()
  await goToAbilityScoresStep(user, screen)

  return { user, ...utils }
}

async function switchToRolled(user: ReturnType<typeof userEvent.setup>) {
  await selectCreationMethod(user, screen, 'rolled')
}

async function rollPoolAndSkip(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /roll dice/i }))
  await user.click(screen.getByRole('button', { name: /skip all animations/i }))

  await waitFor(() => {
    expect(screen.getByText(/Dice Roll Groups/i)).toBeInTheDocument()
    expect(getAbilityFieldSelect(screen, 'Strength')).not.toBeDisabled()
  })
}

async function assignDefaultRolledPool(user: ReturnType<typeof userEvent.setup>) {
  const assignments = [
    ['Strength', 'rolled-0'],
    ['Dexterity', 'rolled-1'],
    ['Constitution', 'rolled-2'],
    ['Intelligence', 'rolled-3'],
    ['Wisdom', 'rolled-4'],
    ['Charisma', 'rolled-5'],
  ] as const

  for (const [ability, rollId] of assignments) {
    await user.selectOptions(getAbilityFieldSelect(screen, ability), rollId)
  }
}

describe('Rolled workflow in App', () => {
  beforeEach(() => {
    clearEditorSession()
    loadMock.mockReset()
    saveMock.mockReset()
    loadMock.mockResolvedValue(null)
    saveMock.mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('does not autosave until a rolled pool exists and all six results are assigned', async () => {
    const { user } = await renderLoadedApp()
    await switchToRolled(user)

    expect(
      screen.queryByRole('button', { name: /save draft/i }),
    ).not.toBeInTheDocument()
    expect(getAbilityFieldNumberInput(screen, 'Strength')).toBeInTheDocument()

    await rollPoolAndSkip(user)
    const callsAfterRoll = saveMock.mock.calls.length
    await new Promise((resolve) => {
      window.setTimeout(resolve, 400)
    })
    expect(saveMock.mock.calls.length).toBe(callsAfterRoll)

    await assignDefaultRolledPool(user)
    await waitFor(() => {
      expect(saveMock.mock.calls.length).toBeGreaterThan(callsAfterRoll)
    })
  })

  it('does not overwrite numeric scores when switching to rolled before completion', async () => {
    const { user } = await renderLoadedApp()

    expect(getAbilityFieldNumberInput(screen, 'Strength')).toHaveValue(10)

    await switchToRolled(user)
    await rollPoolAndSkip(user)
    await user.selectOptions(getAbilityFieldSelect(screen, 'Strength'), 'rolled-0')

    await selectCreationMethod(user, screen, 'standard-array')
    await selectCreationMethod(user, screen, 'manual')

    expect(getAbilityFieldNumberInput(screen, 'Strength')).toHaveValue(10)
    expect(getAbilityFieldNumberInput(screen, 'Dexterity')).toHaveValue(10)
  })

  it('shows generated results in the pool preview', async () => {
    const { user } = await renderLoadedApp()
    await switchToRolled(user)

    await rollPoolAndSkip(user)

    expect(screen.getByText('Dice Roll Groups')).toBeInTheDocument()
    const poolPreview = screen.getByText('Dice Roll Groups').closest('.dice-roll-groups')
    expect(poolPreview).toHaveTextContent('14')
    expect(poolPreview).toHaveTextContent('9')
  })

  it('saves numeric scores from a completed rolled assignment', async () => {
    const { user } = await renderLoadedApp()
    await switchToRolled(user)

    await rollPoolAndSkip(user)
    await assignDefaultRolledPool(user)

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          creationMethod: 'rolled',
          abilityScores: {
            strength: 14,
            dexterity: 12,
            constitution: 16,
            intelligence: 9,
            wisdom: 16,
            charisma: 9,
          },
        }),
      )
    })
  })

  it('clears assignments with the em dash option', async () => {
    const { user } = await renderLoadedApp()
    await switchToRolled(user)

    await rollPoolAndSkip(user)
    await user.selectOptions(getAbilityFieldSelect(screen, 'Strength'), 'rolled-0')
    await user.selectOptions(
      getAbilityFieldSelect(screen, 'Strength'),
      ROLLED_UNASSIGNED_LABEL,
    )

    expect(getAbilityFieldSelect(screen, 'Strength')).toHaveDisplayValue(
      ROLLED_UNASSIGNED_LABEL,
    )

    const callsBefore = saveMock.mock.calls.length
    await new Promise((resolve) => {
      window.setTimeout(resolve, 400)
    })
    expect(saveMock.mock.calls.length).toBe(callsBefore)
  })

  it('generates all six rolls before playback and can skip all animations', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { user } = await renderLoadedApp(createSeededRandomSource(11))

    await switchToRolled(user)
    await user.click(screen.getByRole('button', { name: /roll dice/i }))
    await user.click(screen.getByRole('button', { name: /skip all animations/i }))

    await waitFor(() => {
      expect(screen.getByText(/Dice Roll Groups/i)).toBeInTheDocument()
      expect(getAbilityFieldSelect(screen, 'Strength')).toBeInTheDocument()
    })
    vi.useRealTimers()
  })
})
