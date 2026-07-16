import { describe, expect, it } from 'vitest'
import {
  canDecreasePointBuyScore,
  canIncreasePointBuyScore,
  getLegalPointBuyScoresForAbility,
  getPointBuyCost,
  getPointBuyRemainingPoints,
  getPointBuyTotalCost,
  MINIMUM_POINT_BUY_ASSIGNMENT,
  POINT_BUY_BUDGET,
  validatePointBuyAssignment,
} from '../pointBuy'
import type { AbilityScores } from '../../../domain/types'

const balancedTwentySevenPointAssignment: AbilityScores = {
  strength: 15,
  dexterity: 14,
  constitution: 13,
  intelligence: 12,
  wisdom: 10,
  charisma: 8,
}

describe('getPointBuyCost', () => {
  it.each([
    [8, 0],
    [9, 1],
    [10, 2],
    [11, 3],
    [12, 4],
    [13, 5],
    [14, 7],
    [15, 9],
  ])('returns the official cost for score %i', (score, cost) => {
    expect(getPointBuyCost(score)).toBe(cost)
  })

  it('returns null for scores outside the point-buy range', () => {
    expect(getPointBuyCost(7)).toBeNull()
    expect(getPointBuyCost(16)).toBeNull()
  })
})

describe('point-buy totals', () => {
  it('calculates total cost and remaining budget', () => {
    expect(getPointBuyTotalCost(MINIMUM_POINT_BUY_ASSIGNMENT)).toBe(0)
    expect(getPointBuyRemainingPoints(MINIMUM_POINT_BUY_ASSIGNMENT)).toBe(
      POINT_BUY_BUDGET,
    )
    expect(getPointBuyTotalCost(balancedTwentySevenPointAssignment)).toBe(27)
    expect(getPointBuyRemainingPoints(balancedTwentySevenPointAssignment)).toBe(
      0,
    )
  })
})

describe('validatePointBuyAssignment', () => {
  it('accepts a legal assignment that spends the full budget', () => {
    expect(validatePointBuyAssignment(balancedTwentySevenPointAssignment)).toEqual(
      {
        valid: true,
        spent: 27,
        remaining: 0,
      },
    )
  })

  it('accepts a legal assignment with unspent points', () => {
    const scores: AbilityScores = {
      ...MINIMUM_POINT_BUY_ASSIGNMENT,
      strength: 10,
    }

    expect(validatePointBuyAssignment(scores)).toEqual({
      valid: true,
      spent: 2,
      remaining: 25,
    })
  })

  it('rejects scores outside the point-buy range', () => {
    const scores: AbilityScores = {
      ...MINIMUM_POINT_BUY_ASSIGNMENT,
      strength: 16,
    }

    const result = validatePointBuyAssignment(scores)

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.issues).toContainEqual({
        code: 'score-out-of-range',
        ability: 'strength',
        value: 16,
      })
    }
  })

  it('rejects assignments that exceed the budget', () => {
    const scores: AbilityScores = {
      strength: 15,
      dexterity: 15,
      constitution: 15,
      intelligence: 15,
      wisdom: 15,
      charisma: 15,
    }

    const result = validatePointBuyAssignment(scores)

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.issues).toContainEqual({
        code: 'over-budget',
        spent: 54,
        budget: POINT_BUY_BUDGET,
      })
    }
  })

  it('does not emit an issue for unspent points', () => {
    const result = validatePointBuyAssignment(MINIMUM_POINT_BUY_ASSIGNMENT)

    expect(result).toEqual({
      valid: true,
      spent: 0,
      remaining: 27,
    })
  })
})

describe('point-buy affordances', () => {
  it('lists legal scores for an ability within the remaining budget', () => {
    const scores: AbilityScores = {
      strength: 15,
      dexterity: 15,
      constitution: 14,
      intelligence: 8,
      wisdom: 8,
      charisma: 8,
    }

    expect(getLegalPointBuyScoresForAbility(scores, 'intelligence')).toEqual([
      8, 9, 10,
    ])
  })

  it('disables decrease at the minimum score', () => {
    expect(
      canDecreasePointBuyScore(MINIMUM_POINT_BUY_ASSIGNMENT, 'strength'),
    ).toBe(false)
    expect(
      canDecreasePointBuyScore(
        { ...MINIMUM_POINT_BUY_ASSIGNMENT, strength: 9 },
        'strength',
      ),
    ).toBe(true)
  })

  it('disables increase at the maximum score or when the next score is unaffordable', () => {
    expect(
      canIncreasePointBuyScore(
        { ...MINIMUM_POINT_BUY_ASSIGNMENT, strength: 15 },
        'strength',
      ),
    ).toBe(false)

    expect(
      canIncreasePointBuyScore(balancedTwentySevenPointAssignment, 'wisdom'),
    ).toBe(false)

    expect(
      canIncreasePointBuyScore(
        { ...MINIMUM_POINT_BUY_ASSIGNMENT, strength: 12 },
        'charisma',
      ),
    ).toBe(true)
  })
})
