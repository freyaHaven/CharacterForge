import { describe, expect, it } from 'vitest'
import { soldierSrd2024 } from '../../data/backgrounds/srd-2024/soldier'
import { computeAbilityScoreBonuses } from '../../domain/background/computeAbilityScoreBonuses'
import {
  draftToBackgroundSelection,
  tryCommitBackgroundDraft,
  validateBackgroundDraft,
} from './backgroundSelectionDraft'

describe('backgroundSelectionDraft', () => {
  it('does not persist derived ability score bonuses on commit', () => {
    const draft = {
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

    const { committed } = tryCommitBackgroundDraft(
      draft,
      'srd-2024',
      soldierSrd2024,
    )

    expect(committed).not.toBeNull()
    expect(committed).not.toHaveProperty('abilityScoreBonuses')
  })

  it('reports missing ability score increases before other draft choices', () => {
    const draft = {
      backgroundId: soldierSrd2024.id,
      abilityScoreIncrease: null,
      choices: {},
    }

    const validation = validateBackgroundDraft(
      draft,
      'srd-2024',
      soldierSrd2024,
    )

    expect(validation.ok).toBe(false)
    if (!validation.ok) {
      expect(validation.issues).toContainEqual({
        code: 'missing-ability-score-increase',
      })
    }
  })

  it('derives fresh bonuses when the ability score increase changes', () => {
    const sharedChoices = {
      'gaming-set': 'dice-set',
      'starting-equipment': 'equipment-package',
    }

    const twoAndOneDraft = {
      backgroundId: soldierSrd2024.id,
      abilityScoreIncrease: {
        mode: 'two-and-one' as const,
        plusTwo: 'strength' as const,
        plusOne: 'constitution' as const,
      },
      choices: sharedChoices,
    }

    const threeOneDraft = {
      ...twoAndOneDraft,
      abilityScoreIncrease: { mode: 'three-one' as const },
    }

    const twoAndOneSelection = draftToBackgroundSelection(twoAndOneDraft)
    const threeOneSelection = draftToBackgroundSelection(threeOneDraft)

    const twoAndOneBonuses = computeAbilityScoreBonuses(
      soldierSrd2024,
      twoAndOneSelection.abilityScoreIncrease,
    )
    const threeOneBonuses = computeAbilityScoreBonuses(
      soldierSrd2024,
      threeOneSelection.abilityScoreIncrease,
    )

    expect(twoAndOneBonuses).toEqual({ strength: 2, constitution: 1 })
    expect(threeOneBonuses).toEqual({
      strength: 1,
      dexterity: 1,
      constitution: 1,
    })

    const stalePersistedShape = {
      ...threeOneSelection,
      abilityScoreBonuses: twoAndOneBonuses,
    }

    expect(
      computeAbilityScoreBonuses(
        soldierSrd2024,
        stalePersistedShape.abilityScoreIncrease,
      ),
    ).toEqual(threeOneBonuses)
    expect(
      computeAbilityScoreBonuses(
        soldierSrd2024,
        stalePersistedShape.abilityScoreIncrease,
      ),
    ).not.toEqual(stalePersistedShape.abilityScoreBonuses)
  })
})
