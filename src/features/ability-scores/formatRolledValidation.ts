import type { RolledAssignmentIssue } from '../../rules/rolled'
import type { AbilityScores } from '../../domain/types'

export function formatRolledValidation(
  validation: { valid: false; issues: RolledAssignmentIssue[] },
): string[] {
  return validation.issues.map((issue) => {
    switch (issue.code) {
      case 'unassigned-ability':
        return `Assign a rolled result to ${formatAbilityLabel(issue.ability)}.`
      case 'unknown-roll-id':
        return `${formatAbilityLabel(issue.ability)} references an unknown rolled result.`
      case 'duplicate-roll-id':
        return `The same rolled result is assigned to ${issue.abilities
          .map(formatAbilityLabel)
          .join(' and ')}.`
      case 'pool-size-mismatch':
        return `Expected ${issue.expected} rolled results, but found ${issue.actual}.`
      default:
        return 'Complete the rolled assignment.'
    }
  })
}

function formatAbilityLabel(ability: keyof AbilityScores): string {
  switch (ability) {
    case 'strength':
      return 'Strength'
    case 'dexterity':
      return 'Dexterity'
    case 'constitution':
      return 'Constitution'
    case 'intelligence':
      return 'Intelligence'
    case 'wisdom':
      return 'Wisdom'
    case 'charisma':
      return 'Charisma'
    default:
      return ability
  }
}
