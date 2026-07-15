import type { AbilityScores } from '../../domain/types'
import { ABILITY_SCORE_ENTRIES } from './abilityScoreDisplay'
import { AbilityScoreCard } from './AbilityScoreCard'
import { AbilityScoreCardGrid } from './AbilityScoreCardGrid'

export type AbilityScoreSummaryGridProps = {
  abilityScores: AbilityScores
}

export function AbilityScoreSummaryGrid({
  abilityScores,
}: AbilityScoreSummaryGridProps) {
  return (
    <AbilityScoreCardGrid>
      {ABILITY_SCORE_ENTRIES.map(({ key, abbreviation, label }) => (
        <AbilityScoreCard
          key={key}
          abilityKey={key}
          abbreviation={abbreviation}
          scoreLabel={label}
          score={abilityScores[key]}
          variant="readonly"
        />
      ))}
    </AbilityScoreCardGrid>
  )
}
