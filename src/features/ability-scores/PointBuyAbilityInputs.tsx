import { getAbilityModifier } from '../../domain/abilities'
import {
  canDecreasePointBuyScore,
  canIncreasePointBuyScore,
  getPointBuyAbilityCost,
} from '../../rules/point-buy'
import type { PointBuyDraftScores } from './pointBuyDraft'

const ABILITY_LABELS: { key: keyof PointBuyDraftScores; label: string }[] = [
  { key: 'strength', label: 'Strength' },
  { key: 'dexterity', label: 'Dexterity' },
  { key: 'constitution', label: 'Constitution' },
  { key: 'intelligence', label: 'Intelligence' },
  { key: 'wisdom', label: 'Wisdom' },
  { key: 'charisma', label: 'Charisma' },
]

type PointBuyAbilityInputsProps = {
  draft: PointBuyDraftScores
  onAdjustScore: (ability: keyof PointBuyDraftScores, delta: -1 | 1) => void
}

function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

export function PointBuyAbilityInputs({
  draft,
  onAdjustScore,
}: PointBuyAbilityInputsProps) {
  return (
    <div className="ability-grid">
      {ABILITY_LABELS.map(({ key, label }) => {
        const score = draft[key]
        const modifier = getAbilityModifier(score)
        const cost = getPointBuyAbilityCost(draft, key) ?? 0

        return (
          <div key={key} className="ability-field point-buy-field">
            <span>{label}</span>
            <div className="point-buy-controls">
              <button
                type="button"
                className="score-stepper"
                aria-label={`Decrease ${label}`}
                disabled={!canDecreasePointBuyScore(draft, key)}
                onClick={() => onAdjustScore(key, -1)}
              >
                −
              </button>
              <span className="point-buy-score" aria-label={`${label} score`}>
                {score}
              </span>
              <button
                type="button"
                className="score-stepper"
                aria-label={`Increase ${label}`}
                disabled={!canIncreasePointBuyScore(draft, key)}
                onClick={() => onAdjustScore(key, 1)}
              >
                +
              </button>
              <span className="modifier">{formatModifier(modifier)}</span>
              <span className="point-buy-cost">{cost} pts</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
