import { beforeAll, describe, expect, it } from 'vitest'
import { createBundledBackgroundCatalog } from '../../../adapters/bundledBackgroundCatalog'
import type { BackgroundDefinition } from '../../../domain/background/types'
import { computeAbilityScoreBonuses } from '../../../domain/background/computeAbilityScoreBonuses'
import {
  draftToBackgroundSelection,
  tryCommitBackgroundDraft,
  validateBackgroundDraft,
} from '../backgroundSelectionDraft'

describe('backgroundSelectionDraft', () => {
  let soldier: BackgroundDefinition

  beforeAll(async () => {
    const definition = await createBundledBackgroundCatalog().getBackground(
      'srd-2024:soldier',
    )
    expect(definition).not.toBeNull()
    soldier = definition!
  })

  it('does not persist derived ability score bonuses on commit', () => {
    const draft = {
      backgroundId: soldier.id,
      abilityScoreIncrease: {
        mode: 'two-and-one' as const,
        plusTwo: 'strength' as const,
        plusOne: 'constitution' as const,
      },
      choices: {
        'gaming-set': 'dice-set',
      },
    }

    const { committed } = tryCommitBackgroundDraft(draft, 'srd-2024', soldier)

    expect(committed).not.toBeNull()
    expect(committed).not.toHaveProperty('abilityScoreBonuses')
  })

  it('reports missing ability score increases before other draft choices', () => {
    const draft = {
      backgroundId: soldier.id,
      abilityScoreIncrease: null,
      choices: {},
    }

    const validation = validateBackgroundDraft(draft, 'srd-2024', soldier)

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
    }

    const twoAndOneDraft = {
      backgroundId: soldier.id,
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
      soldier,
      twoAndOneSelection.abilityScoreIncrease,
    )
    const threeOneBonuses = computeAbilityScoreBonuses(
      soldier,
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
        soldier,
        stalePersistedShape.abilityScoreIncrease,
      ),
    ).toEqual(threeOneBonuses)
    expect(
      computeAbilityScoreBonuses(
        soldier,
        stalePersistedShape.abilityScoreIncrease,
      ),
    ).not.toEqual(stalePersistedShape.abilityScoreBonuses)
  })
})
