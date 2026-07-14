import type { AbilityScores } from '../../domain/types'
import {
  STANDARD_ARRAY,
  validateStandardArrayAssignment,
} from '../../rules/standard-array/standardArray'

const ABILITY_KEYS: (keyof AbilityScores)[] = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
]

/**
 * UI-only draft for standard-array assignment.
 * Nullable slots represent "unassigned" while the player moves values.
 * Never persisted — `Character.abilityScores` stays numeric.
 */
export type StandardArrayDraftScores = {
  strength: number | null
  dexterity: number | null
  constitution: number | null
  intelligence: number | null
  wisdom: number | null
  charisma: number | null
}

export type StandardArrayDraftIssue =
  | { code: 'unassigned-ability'; ability: keyof AbilityScores }
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
      value: (typeof STANDARD_ARRAY)[number]
    }

export type StandardArrayDraftValidationResult =
  | { valid: true }
  | { valid: false; issues: StandardArrayDraftIssue[] }

export function createEmptyStandardArrayDraft(): StandardArrayDraftScores {
  return {
    strength: null,
    dexterity: null,
    constitution: null,
    intelligence: null,
    wisdom: null,
    charisma: null,
  }
}

export function abilityScoresToStandardArrayDraft(
  scores: AbilityScores,
): StandardArrayDraftScores {
  const valueCounts = new Map<number, number>()

  for (const ability of ABILITY_KEYS) {
    const value = scores[ability]
    valueCounts.set(value, (valueCounts.get(value) ?? 0) + 1)
  }

  return {
    strength: toDraftValue(scores.strength, valueCounts),
    dexterity: toDraftValue(scores.dexterity, valueCounts),
    constitution: toDraftValue(scores.constitution, valueCounts),
    intelligence: toDraftValue(scores.intelligence, valueCounts),
    wisdom: toDraftValue(scores.wisdom, valueCounts),
    charisma: toDraftValue(scores.charisma, valueCounts),
  }
}

function toDraftValue(
  value: number,
  valueCounts: Map<number, number>,
): number | null {
  const isStandardValue = (STANDARD_ARRAY as readonly number[]).includes(value)
  const isUnique = valueCounts.get(value) === 1

  return isStandardValue && isUnique ? value : null
}

export function standardArrayDraftToAbilityScores(
  draft: StandardArrayDraftScores,
): AbilityScores {
  return {
    strength: draft.strength!,
    dexterity: draft.dexterity!,
    constitution: draft.constitution!,
    intelligence: draft.intelligence!,
    wisdom: draft.wisdom!,
    charisma: draft.charisma!,
  }
}

export function isStandardArrayDraftComplete(
  draft: StandardArrayDraftScores,
): boolean {
  return ABILITY_KEYS.every((ability) => draft[ability] !== null)
}

export function validateStandardArrayDraft(
  draft: StandardArrayDraftScores,
): StandardArrayDraftValidationResult {
  const issues: StandardArrayDraftIssue[] = []

  for (const ability of ABILITY_KEYS) {
    if (draft[ability] === null) {
      issues.push({ code: 'unassigned-ability', ability })
    }
  }

  if (!isStandardArrayDraftComplete(draft)) {
    return { valid: false, issues }
  }

  const assignmentValidation = validateStandardArrayAssignment(
    standardArrayDraftToAbilityScores(draft),
  )

  if (!assignmentValidation.valid) {
    return {
      valid: false,
      issues: [...issues, ...assignmentValidation.issues],
    }
  }

  if (issues.length > 0) {
    return { valid: false, issues }
  }

  return { valid: true }
}

export function defaultStandardArrayDraft(): StandardArrayDraftScores {
  return {
    strength: 15,
    dexterity: 14,
    constitution: 13,
    intelligence: 12,
    wisdom: 10,
    charisma: 8,
  }
}
