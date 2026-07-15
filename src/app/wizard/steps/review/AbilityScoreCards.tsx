import type { AbilityScores } from '../../../../domain/types'
import { AbilityScoreSummaryGrid } from '../../../../features/ability-scores/AbilityScoreSummaryGrid'

export type AbilityScoreCardsProps = {
  abilityScores: AbilityScores
}

/** Read-only ability score grid for the character sheet review step. */
export function AbilityScoreCards({ abilityScores }: AbilityScoreCardsProps) {
  return <AbilityScoreSummaryGrid abilityScores={abilityScores} />
}
