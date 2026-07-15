import type { AbilityId } from '../abilities/types'
import type {
  AbilityScoreIncreaseSelection,
  BackgroundAbilityScoreBonuses,
  BackgroundDefinition,
} from './types'

export function computeAbilityScoreBonuses(
  definition: BackgroundDefinition,
  increase: AbilityScoreIncreaseSelection,
): BackgroundAbilityScoreBonuses {
  if (increase.mode === 'three-one') {
    return Object.fromEntries(
      definition.eligibleAbilityScores.map((abilityId) => [abilityId, 1]),
    ) as BackgroundAbilityScoreBonuses
  }

  return {
    [increase.plusTwo]: 2,
    [increase.plusOne]: 1,
  }
}

export function isEligibleAbilityScore(
  definition: BackgroundDefinition,
  abilityId: AbilityId,
): boolean {
  return definition.eligibleAbilityScores.includes(abilityId)
}
