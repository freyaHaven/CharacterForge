import type { AbilityScores } from '../../domain/types'
import type { AbilityScoreBonusMap } from './resolveAbilityScoreBreakdown'
import { buildAbilityScoreBreakdown } from './resolveAbilityScoreBreakdown'
import type { AbilityScoreKey } from './abilityScoreDisplay'
import type { AbilityScoreOverviewValue } from './AbilityScoreOverviewGrid'
import { AbilityScoreOverviewGrid } from './AbilityScoreOverviewGrid'

type ManualAbilityInputsProps = {
  abilityScores: AbilityScores
  bonuses?: AbilityScoreBonusMap
  onAbilityScoreChange: (ability: keyof AbilityScores, value: number) => void
}

export function ManualAbilityInputs({
  abilityScores,
  bonuses,
  onAbilityScoreChange,
}: ManualAbilityInputsProps) {
  const breakdown = buildAbilityScoreBreakdown({
    baseScores: abilityScores,
    bonuses,
  })

  const scores = Object.fromEntries(
    breakdown.map((entry) => {
      const value: AbilityScoreOverviewValue = {
        base: entry.baseScore,
        total: entry.totalScore,
        controls: (
          <input
            type="number"
            min={1}
            max={30}
            aria-label={`${entry.label} score`}
            value={abilityScores[entry.abilityKey]}
            onChange={(event) => {
              const nextValue = Number.parseInt(event.target.value, 10)
              onAbilityScoreChange(
                entry.abilityKey,
                Number.isNaN(nextValue) ? 10 : nextValue,
              )
            }}
          />
        ),
      }

      return [entry.abilityKey, value]
    }),
  ) as Record<AbilityScoreKey, AbilityScoreOverviewValue>

  return <AbilityScoreOverviewGrid scores={scores} />
}
