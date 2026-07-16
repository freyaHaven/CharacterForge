import type { ReactNode } from 'react'
import {
  formatAbilityModifierDisplay,
  formatAbilityScoreDisplay,
  type AbilityScoreKey,
} from './abilityScoreDisplay'
import { AbilityStatIcon } from './AbilityUiIcons'

export type AbilityScoreCardProps = {
  abilityKey: AbilityScoreKey
  abbreviation: string
  scoreLabel: string
  score: number | null
  variant: 'readonly' | 'interactive'
  controls?: ReactNode
  detail?: ReactNode
}

export function AbilityScoreCard({
  abilityKey,
  abbreviation,
  scoreLabel,
  score,
  variant,
  controls,
  detail,
}: AbilityScoreCardProps) {
  const modifierDisplay = formatAbilityModifierDisplay(score)
  const scoreDisplay = formatAbilityScoreDisplay(score)

  return (
    <article
      className={`ability-score-card ability-score-card--${variant}`}
      data-ability={abilityKey}
      data-testid={`ability-score-card-${abilityKey}`}
      role="listitem"
      aria-label={`${abbreviation} ${scoreDisplay}, modifier ${modifierDisplay}`}
    >
      <span className="ability-score-card__label">{abbreviation}</span>
      <span className="ability-score-card__icon" aria-hidden="true">
        <AbilityStatIcon abilityKey={abilityKey} />
      </span>
      <span
        className="ability-score-card__score"
        aria-label={variant === 'interactive' ? `${scoreLabel} score` : undefined}
      >
        {scoreDisplay}
      </span>
      <span className="ability-score-card__modifier">{modifierDisplay}</span>
      {controls !== undefined ? (
        <div className="ability-score-card__controls">{controls}</div>
      ) : null}
      {detail !== undefined ? (
        <div className="ability-score-card__detail">{detail}</div>
      ) : null}
    </article>
  )
}
