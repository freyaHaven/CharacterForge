import type { AbilityScores } from '../../domain/types'

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const

export type StandardArrayValue = (typeof STANDARD_ARRAY)[number]

export const DEFAULT_STANDARD_ARRAY_ASSIGNMENT: AbilityScores = {
  strength: 15,
  dexterity: 14,
  constitution: 13,
  intelligence: 12,
  wisdom: 10,
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

export type StandardArrayIssue =
  | {
      code: 'duplicate-value'
      value: number
      abilities: (keyof AbilityScores)[]
    }
  | {
      code: 'invalid-value'
      value: number
      ability: keyof AbilityScores
    }
  | {
      code: 'missing-value'
      value: StandardArrayValue
    }

export type StandardArrayValidationResult =
  | { valid: true }
  | { valid: false; issues: StandardArrayIssue[] }

function isStandardArrayValue(value: number): value is StandardArrayValue {
  return (STANDARD_ARRAY as readonly number[]).includes(value)
}

export function validateStandardArrayAssignment(
  scores: AbilityScores,
): StandardArrayValidationResult {
  const issues: StandardArrayIssue[] = []
  const valueToAbilities = new Map<number, (keyof AbilityScores)[]>()

  for (const ability of ABILITY_KEYS) {
    const value = scores[ability]

    if (!isStandardArrayValue(value)) {
      issues.push({ code: 'invalid-value', value, ability })
    }

    const abilities = valueToAbilities.get(value) ?? []
    valueToAbilities.set(value, [...abilities, ability])
  }

  for (const [value, abilities] of valueToAbilities) {
    if (abilities.length > 1 && isStandardArrayValue(value)) {
      issues.push({ code: 'duplicate-value', value, abilities })
    }
  }

  for (const requiredValue of STANDARD_ARRAY) {
    if (!valueToAbilities.has(requiredValue)) {
      issues.push({ code: 'missing-value', value: requiredValue })
    }
  }

  if (issues.length === 0) {
    return { valid: true }
  }

  return { valid: false, issues }
}
