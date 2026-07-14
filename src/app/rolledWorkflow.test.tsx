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
import { ROLLED_UNASSIGNED_LABEL } from '../features/ability-scores/RolledAbilityInputs'
import { createSeededRandomSource } from '../rules/rolled'

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

async function renderLoadedApp(randomSource = createSeededRandomSource(5)) {
  const user = userEvent.setup()
  const utils = render(<App randomSource={randomSource} />)

  await waitFor(() => {
    expect(screen.queryByText(/loading character/i)).not.toBeInTheDocument()
  })

  return { user, ...utils }
}

async function switchToRolled(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(getCreationMethodSelect(screen), 'rolled')
}

async function useManualRolls(
  user: ReturnType<typeof userEvent.setup>,
  totals: number[],
) {
  for (const [index, total] of totals.entries()) {
    const input = screen.getByRole('spinbutton', { name: `Result ${index + 1}` })
    await user.clear(input)
    await user.type(input, String(total))
  }

  await user.click(screen.getByRole('button', { name: /use these rolls/i }))
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
    loadMock.mockReset()
    saveMock.mockReset()
    loadMock.mockResolvedValue(null)
    saveMock.mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('disables save until a rolled pool exists and all six results are assigned', async () => {
    const { user } = await renderLoadedApp()
    await switchToRolled(user)

    expect(screen.getByRole('button', { name: /save character/i })).toBeDisabled()

    await useManualRolls(user, [15, 14, 13, 12, 10, 8])
    expect(screen.getByRole('button', { name: /save character/i })).toBeDisabled()

    await assignDefaultRolledPool(user)
    expect(screen.getByRole('button', { name: /save character/i })).toBeEnabled()
  })

  it('does not overwrite numeric scores when switching to rolled before completion', async () => {
    const { user } = await renderLoadedApp()

    expect(getAbilityFieldNumberInput(screen, 'Strength')).toHaveValue(10)

    await switchToRolled(user)
    await useManualRolls(user, [15, 14, 13, 12, 10, 8])
    await user.selectOptions(getAbilityFieldSelect(screen, 'Strength'), 'rolled-0')

    await user.selectOptions(getCreationMethodSelect(screen), 'manual')

    expect(getAbilityFieldNumberInput(screen, 'Strength')).toHaveValue(10)
    expect(getAbilityFieldNumberInput(screen, 'Dexterity')).toHaveValue(10)
  })

  it('shows manual results clearly in the pool preview', async () => {
    const { user } = await renderLoadedApp()
    await switchToRolled(user)

    await useManualRolls(user, [15, 14, 13, 12, 10, 8])

    expect(screen.getByText('Rolled results')).toBeInTheDocument()
    const poolPreview = screen.getByText('Rolled results').closest('.rolled-pool-preview')
    expect(poolPreview).toHaveTextContent('Manual result: 15')
    expect(poolPreview).toHaveTextContent('Manual result: 8')
  })

  it('saves numeric scores from a completed rolled assignment', async () => {
    const { user } = await renderLoadedApp()
    await switchToRolled(user)

    await useManualRolls(user, [15, 14, 13, 12, 10, 8])
    await assignDefaultRolledPool(user)
    await user.click(screen.getByRole('button', { name: /save character/i }))

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledTimes(1)
    })

    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        creationMethod: 'rolled',
        abilityScores: {
          strength: 15,
          dexterity: 14,
          constitution: 13,
          intelligence: 12,
          wisdom: 10,
          charisma: 8,
        },
      }),
    )
  })

  it('clears assignments with the em dash option', async () => {
    const { user } = await renderLoadedApp()
    await switchToRolled(user)

    await useManualRolls(user, [15, 14, 13, 12, 10, 8])
    await user.selectOptions(getAbilityFieldSelect(screen, 'Strength'), 'rolled-0')
    await user.selectOptions(
      getAbilityFieldSelect(screen, 'Strength'),
      ROLLED_UNASSIGNED_LABEL,
    )

    expect(getAbilityFieldSelect(screen, 'Strength')).toHaveDisplayValue(
      ROLLED_UNASSIGNED_LABEL,
    )
    expect(screen.getByRole('button', { name: /save character/i })).toBeDisabled()
  })

  it('generates all six rolls before playback and can skip all animations', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { user } = await renderLoadedApp(createSeededRandomSource(11))

    await switchToRolled(user)
    await user.click(screen.getByRole('button', { name: /roll dice/i }))
    await user.click(screen.getByRole('button', { name: /skip all animations/i }))

    await waitFor(() => {
      expect(screen.getByText(/Rolled results/i)).toBeInTheDocument()
      expect(getAbilityFieldSelect(screen, 'Strength')).toBeInTheDocument()
    })
    vi.useRealTimers()
  })
})
