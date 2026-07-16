// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PointBuyAbilityInputs } from '../PointBuyAbilityInputs'
import { createMinimumPointBuyDraft } from '../pointBuyDraft'
import { MINIMUM_POINT_BUY_ASSIGNMENT } from '../../../rules/point-buy'
import type { AbilityScores } from '../../../domain/types'

const balancedTwentySevenPointAssignment: AbilityScores = {
  strength: 15,
  dexterity: 14,
  constitution: 13,
  intelligence: 12,
  wisdom: 10,
  charisma: 8,
}

describe('PointBuyAbilityInputs', () => {
  it('disables decrease at score 8', () => {
    render(
      <PointBuyAbilityInputs
        draft={createMinimumPointBuyDraft()}
        onAdjustScore={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Decrease Strength' })).toBeDisabled()
  })

  it('disables increase at score 15', () => {
    render(
      <PointBuyAbilityInputs
        draft={{ ...MINIMUM_POINT_BUY_ASSIGNMENT, strength: 15 }}
        onAdjustScore={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Increase Strength' })).toBeDisabled()
  })

  it('disables increase when the next score would exceed the budget', () => {
    render(
      <PointBuyAbilityInputs
        draft={balancedTwentySevenPointAssignment}
        onAdjustScore={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Increase Wisdom' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Increase Charisma' })).toBeDisabled()
  })

  it('calls onAdjustScore when increasing an ability', async () => {
    const user = userEvent.setup()
    const onAdjustScore = vi.fn()

    render(
      <PointBuyAbilityInputs
        draft={createMinimumPointBuyDraft()}
        onAdjustScore={onAdjustScore}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Increase Strength' }))
    expect(onAdjustScore).toHaveBeenCalledWith('strength', 1)
  })

  it('calls onAdjustScore when decreasing an ability', async () => {
    const user = userEvent.setup()
    const onAdjustScore = vi.fn()

    render(
      <PointBuyAbilityInputs
        draft={{ ...MINIMUM_POINT_BUY_ASSIGNMENT, dexterity: 9 }}
        onAdjustScore={onAdjustScore}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Decrease Dexterity' }))
    expect(onAdjustScore).toHaveBeenCalledWith('dexterity', -1)
  })
})
