import {
  canDecreasePointBuyScore,
  canIncreasePointBuyScore,
  getPointBuyAbilityCost,
} from '../../rules/point-buy'
import { ABILITY_SCORE_ENTRIES } from './abilityScoreDisplay'
import { AbilityScoreCard } from './AbilityScoreCard'
import { AbilityScoreCardGrid } from './AbilityScoreCardGrid'
import type { PointBuyDraftScores } from './pointBuyDraft'

type PointBuyAbilityInputsProps = {
  draft: PointBuyDraftScores
  onAdjustScore: (ability: keyof PointBuyDraftScores, delta: -1 | 1) => void
}

export function PointBuyAbilityInputs({
  draft,
  onAdjustScore,
}: PointBuyAbilityInputsProps) {
  return (
    <AbilityScoreCardGrid>
      {ABILITY_SCORE_ENTRIES.map(({ key, abbreviation, label }) => {
        const score = draft[key]
        const cost = getPointBuyAbilityCost(draft, key) ?? 0

        return (
          <AbilityScoreCard
            key={key}
            abilityKey={key}
            abbreviation={abbreviation}
            scoreLabel={label}
            score={score}
            variant="interactive"
            controls={
              <div className="ability-score-card__point-buy-controls">
                <button
                  type="button"
                  className="score-stepper"
                  aria-label={`Decrease ${label}`}
                  disabled={!canDecreasePointBuyScore(draft, key)}
                  onClick={() => onAdjustScore(key, -1)}
                >
                  −
                </button>
                <button
                  type="button"
                  className="score-stepper"
                  aria-label={`Increase ${label}`}
                  disabled={!canIncreasePointBuyScore(draft, key)}
                  onClick={() => onAdjustScore(key, 1)}
                >
                  +
                </button>
              </div>
            }
            detail={`${cost} pts`}
          />
        )
      })}
    </AbilityScoreCardGrid>
  )
}
