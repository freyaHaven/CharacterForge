import {
  canDecreasePointBuyScore,
  canIncreasePointBuyScore,
  getPointBuyAbilityCost,
} from '../../rules/point-buy'
import type { AbilityScoreBonusMap } from './resolveAbilityScoreBreakdown'
import { buildAbilityScoreBreakdown } from './resolveAbilityScoreBreakdown'
import type { AbilityScoreKey } from './abilityScoreDisplay'
import type { AbilityScoreOverviewValue } from './AbilityScoreOverviewGrid'
import { AbilityScoreOverviewGrid } from './AbilityScoreOverviewGrid'
import type { PointBuyDraftScores } from './pointBuyDraft'

type PointBuyAbilityInputsProps = {
  draft: PointBuyDraftScores
  bonuses?: AbilityScoreBonusMap
  onAdjustScore: (ability: keyof PointBuyDraftScores, delta: -1 | 1) => void
}

export function PointBuyAbilityInputs({
  draft,
  bonuses,
  onAdjustScore,
}: PointBuyAbilityInputsProps) {
  const breakdown = buildAbilityScoreBreakdown({
    baseScores: draft,
    bonuses,
  })

  const scores = Object.fromEntries(
    breakdown.map((entry) => {
      const score = draft[entry.abilityKey]
      const cost = getPointBuyAbilityCost(draft, entry.abilityKey) ?? 0

      const value: AbilityScoreOverviewValue = {
        base: entry.baseScore,
        total: entry.totalScore,
        controls: (
          <div className="ability-score-overview__point-buy">
            <div className="ability-score-overview__point-buy-controls">
              <button
                type="button"
                className="score-stepper"
                aria-label={`Decrease ${entry.label}`}
                disabled={!canDecreasePointBuyScore(draft, entry.abilityKey)}
                onClick={() => onAdjustScore(entry.abilityKey, -1)}
              >
                −
              </button>
              <span
                className="ability-score-overview__base"
                aria-label={`${entry.label} score`}
              >
                {score}
              </span>
              <button
                type="button"
                className="score-stepper"
                aria-label={`Increase ${entry.label}`}
                disabled={!canIncreasePointBuyScore(draft, entry.abilityKey)}
                onClick={() => onAdjustScore(entry.abilityKey, 1)}
              >
                +
              </button>
            </div>
            <span className="ability-score-overview__cost">{cost} pts</span>
          </div>
        ),
      }

      return [entry.abilityKey, value]
    }),
  ) as Record<AbilityScoreKey, AbilityScoreOverviewValue>

  return <AbilityScoreOverviewGrid scores={scores} />
}
