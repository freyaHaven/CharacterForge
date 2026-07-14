import type { PointBuyValidationResult } from '../../rules/point-buy'

const ABILITY_LABELS: Record<string, string> = {
  strength: 'Strength',
  dexterity: 'Dexterity',
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  wisdom: 'Wisdom',
  charisma: 'Charisma',
}

export function formatPointBuyValidation(
  result: PointBuyValidationResult,
): string[] {
  if (result.valid) {
    return []
  }

  return result.issues.map((issue) => {
    switch (issue.code) {
      case 'score-out-of-range':
        return `${ABILITY_LABELS[issue.ability]} must be between 8 and 15 for point buy; ${issue.value} is not allowed.`
      case 'over-budget':
        return `This assignment spends ${issue.spent} of ${issue.budget} points.`
    }
  })
}
