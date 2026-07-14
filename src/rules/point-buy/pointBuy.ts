import type { AbilityScores } from '../../domain/types'

export const POINT_BUY_BUDGET = 27
export const POINT_BUY_MIN_SCORE = 8
export const POINT_BUY_MAX_SCORE = 15

export const POINT_BUY_ALLOWED_SCORES = [8, 9, 10, 11, 12, 13, 14, 15] as const

export type PointBuyScore = (typeof POINT_BUY_ALLOWED_SCORES)[number]

export const POINT_BUY_COSTS: Readonly<Record<PointBuyScore, number>> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
}

export const MINIMUM_POINT_BUY_ASSIGNMENT: AbilityScores = {
  strength: 8,
  dexterity: 8,
  constitution: 8,
  intelligence: 8,
  wisdom: 8,
  charisma: 8,
}

const ABILITY_KEYS: (keyof AbilityScores)[] = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
]

export type PointBuyIssue =
  | {
      code: 'score-out-of-range'
      ability: keyof AbilityScores
      value: number
    }
  | {
      code: 'over-budget'
      spent: number
      budget: number
    }

export type PointBuyValidationResult =
  | {
      valid: true
      spent: number
      remaining: number
    }
  | {
      valid: false
      issues: PointBuyIssue[]
      spent: number
      remaining: number
    }

function isPointBuyScore(value: number): value is PointBuyScore {
  return (POINT_BUY_ALLOWED_SCORES as readonly number[]).includes(value)
}

export function getPointBuyCost(score: number): number | null {
  if (!isPointBuyScore(score)) {
    return null
  }

  return POINT_BUY_COSTS[score]
}

export function getPointBuyAbilityCost(
  scores: AbilityScores,
  ability: keyof AbilityScores,
): number | null {
  return getPointBuyCost(scores[ability])
}

export function getPointBuyTotalCost(scores: AbilityScores): number {
  return ABILITY_KEYS.reduce((total, ability) => {
    const cost = getPointBuyCost(scores[ability])
    return total + (cost ?? 0)
  }, 0)
}

export function getPointBuyRemainingPoints(scores: AbilityScores): number {
  return POINT_BUY_BUDGET - getPointBuyTotalCost(scores)
}

function withAbilityScore(
  scores: AbilityScores,
  ability: keyof AbilityScores,
  value: number,
): AbilityScores {
  return {
    ...scores,
    [ability]: value,
  }
}

export function getLegalPointBuyScoresForAbility(
  scores: AbilityScores,
  ability: keyof AbilityScores,
): readonly PointBuyScore[] {
  return POINT_BUY_ALLOWED_SCORES.filter((candidateScore) => {
    const candidateScores = withAbilityScore(scores, ability, candidateScore)
    return getPointBuyTotalCost(candidateScores) <= POINT_BUY_BUDGET
  })
}

export function canDecreasePointBuyScore(
  scores: AbilityScores,
  ability: keyof AbilityScores,
): boolean {
  return scores[ability] > POINT_BUY_MIN_SCORE
}

export function canIncreasePointBuyScore(
  scores: AbilityScores,
  ability: keyof AbilityScores,
): boolean {
  const nextScore = scores[ability] + 1
  if (nextScore > POINT_BUY_MAX_SCORE) {
    return false
  }

  return getLegalPointBuyScoresForAbility(scores, ability).includes(
    nextScore as PointBuyScore,
  )
}

export function validatePointBuyAssignment(
  scores: AbilityScores,
): PointBuyValidationResult {
  const issues: PointBuyIssue[] = []
  const spent = getPointBuyTotalCost(scores)
  const remaining = POINT_BUY_BUDGET - spent

  for (const ability of ABILITY_KEYS) {
    const value = scores[ability]
    if (!isPointBuyScore(value)) {
      issues.push({ code: 'score-out-of-range', ability, value })
    }
  }

  if (spent > POINT_BUY_BUDGET) {
    issues.push({
      code: 'over-budget',
      spent,
      budget: POINT_BUY_BUDGET,
    })
  }

  if (issues.length > 0) {
    return { valid: false, issues, spent, remaining }
  }

  return { valid: true, spent, remaining }
}
