import { describe, expect, it } from 'vitest'
import {
  adjustPointBuyDraftScore,
  createMinimumPointBuyDraft,
  initializePointBuyDraftFromAbilityScores,
  resetPointBuyDraft,
} from './pointBuyDraft'
import { MINIMUM_POINT_BUY_ASSIGNMENT } from '../../rules/point-buy'
import type { AbilityScores } from '../../domain/types'

const validPointBuyAssignment: AbilityScores = {
  strength: 15,
  dexterity: 14,
  constitution: 13,
  intelligence: 12,
  wisdom: 10,
  charisma: 8,
}

describe('pointBuyDraft', () => {
  it('initialises from ability scores when they already form a valid point-buy assignment', () => {
    expect(
      initializePointBuyDraftFromAbilityScores(validPointBuyAssignment),
    ).toEqual(validPointBuyAssignment)
  })

  it('returns null when existing ability scores are not a legal point-buy assignment', () => {
    expect(
      initializePointBuyDraftFromAbilityScores({
        strength: 16,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      }),
    ).toBeNull()
  })

  it('creates a minimum draft of all 8s for Start Point Buy', () => {
    expect(createMinimumPointBuyDraft()).toEqual(MINIMUM_POINT_BUY_ASSIGNMENT)
  })

  it('resets the draft to all 8s', () => {
    expect(resetPointBuyDraft()).toEqual(MINIMUM_POINT_BUY_ASSIGNMENT)
  })

  it('adjusts one ability score in the draft', () => {
    const draft = createMinimumPointBuyDraft()

    expect(adjustPointBuyDraftScore(draft, 'strength', 1)).toEqual({
      ...MINIMUM_POINT_BUY_ASSIGNMENT,
      strength: 9,
    })
  })
})
