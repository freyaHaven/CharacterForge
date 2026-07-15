import { describe, expect, it } from 'vitest'
import { soldierSrd2024 } from '../../data/backgrounds/srd-2024/soldier'
import { computeAbilityScoreBonuses } from '../../domain/background/computeAbilityScoreBonuses'
import {
  draftToBackgroundSelection,
  tryCommitBackgroundDraft,
} from '../../features/background/backgroundSelectionDraft'
import { validateBackgroundSelection } from './backgroundRules'

describe('validateBackgroundSelection', () => {
  it('accepts a complete Soldier selection', () => {
    const selection = {
      backgroundId: soldierSrd2024.id,
      abilityScoreIncrease: {
        mode: 'two-and-one' as const,
        plusTwo: 'strength' as const,
        plusOne: 'constitution' as const,
      },
      choices: {
        'gaming-set': 'dice-set',
        'starting-equipment': 'equipment-package',
      },
    }

    expect(
      validateBackgroundSelection(selection, 'srd-2024', soldierSrd2024).ok,
    ).toBe(true)
  })

  it('rejects ability score increases outside eligible abilities', () => {
    const selection = {
      backgroundId: soldierSrd2024.id,
      abilityScoreIncrease: {
        mode: 'two-and-one' as const,
        plusTwo: 'intelligence' as const,
        plusOne: 'wisdom' as const,
      },
      choices: {
        'gaming-set': 'dice-set',
        'starting-equipment': 'gold-alternative',
      },
    }

    const result = validateBackgroundSelection(
      selection,
      'srd-2024',
      soldierSrd2024,
    )

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues).toContainEqual({
        code: 'invalid-ability-score-increase',
      })
    }
  })

  it('requires all Soldier choices before commit', () => {
    const draft = {
      backgroundId: soldierSrd2024.id,
      abilityScoreIncrease: { mode: 'three-one' as const },
      choices: {},
    }

    const { committed } = tryCommitBackgroundDraft(
      draft,
      'srd-2024',
      soldierSrd2024,
    )

    expect(committed).toBeNull()
  })
})

describe('computeAbilityScoreBonuses', () => {
  it('computes +1 for each eligible ability in three-one mode', () => {
    expect(
      computeAbilityScoreBonuses(soldierSrd2024, { mode: 'three-one' }),
    ).toEqual({
      strength: 1,
      dexterity: 1,
      constitution: 1,
    })
  })
})
