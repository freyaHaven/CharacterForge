import type { StandardArrayDraftValidationResult } from './standardArrayDraft'

const ABILITY_LABELS: Record<string, string> = {
  strength: 'Strength',
  dexterity: 'Dexterity',
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  wisdom: 'Wisdom',
  charisma: 'Charisma',
}

export function formatStandardArrayValidation(
  result: StandardArrayDraftValidationResult,
): string[] {
  if (result.valid) {
    return []
  }

  return result.issues.map((issue) => {
    switch (issue.code) {
      case 'unassigned-ability':
        return `${ABILITY_LABELS[issue.ability]} is unassigned.`
      case 'duplicate-value':
        return `${issue.value} is assigned to more than one ability (${issue.abilities
          .map((ability) => ABILITY_LABELS[ability])
          .join(', ')}).`
      case 'invalid-value':
        return `${ABILITY_LABELS[issue.ability]} must use a standard-array value; ${issue.value} is not allowed.`
      case 'missing-value':
        return `${issue.value} must be assigned to exactly one ability.`
    }
  })
}
