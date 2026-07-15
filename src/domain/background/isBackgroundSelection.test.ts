import { describe, expect, it } from 'vitest'
import { isBackgroundSelection } from './isBackgroundSelection'

describe('isBackgroundSelection', () => {
  it('accepts a selection with only canonical player choices', () => {
    expect(
      isBackgroundSelection({
        backgroundId: 'srd-2024:soldier',
        abilityScoreIncrease: {
          mode: 'two-and-one',
          plusTwo: 'strength',
          plusOne: 'constitution',
        },
        choices: {
          'gaming-set': 'dice-set',
          'starting-equipment': 'equipment-package',
        },
      }),
    ).toBe(true)
  })

  it('does not require persisted ability score bonuses', () => {
    expect(
      isBackgroundSelection({
        backgroundId: 'srd-2024:soldier',
        abilityScoreIncrease: { mode: 'three-one' },
        choices: {},
        abilityScoreBonuses: { strength: 99 },
      }),
    ).toBe(true)
  })
})
