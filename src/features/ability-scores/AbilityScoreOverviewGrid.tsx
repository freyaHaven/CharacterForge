import type { ReactNode } from 'react'
import {
  formatAbilityScoreDisplay,
  type AbilityScoreKey,
  ABILITY_SCORE_ENTRIES,
} from './abilityScoreDisplay'
import { AbilityScoreCardGrid } from './AbilityScoreCardGrid'

export type AbilityScoreOverviewValue = {
  base: number | null
  total: number | null
  controls?: ReactNode
}

export type AbilityScoreOverviewGridProps = {
  scores: Record<AbilityScoreKey, AbilityScoreOverviewValue>
  ariaLabel?: string
}

function formatTotalDisplay(total: number | null): string {
  return total === null ? 'TOTAL --' : `TOTAL ${total}`
}

export function AbilityScoreOverviewGrid({
  scores,
  ariaLabel = 'Ability score summary',
}: AbilityScoreOverviewGridProps) {
  return (
    <AbilityScoreCardGrid ariaLabel={ariaLabel}>
      {ABILITY_SCORE_ENTRIES.map(({ key, abbreviation, label }) => {
        const entry = scores[key]
        const baseDisplay = formatAbilityScoreDisplay(entry.base)
        const totalDisplay = formatTotalDisplay(entry.total)

        return (
          <article
            key={key}
            className="ability-score-overview"
            data-ability={key}
            data-testid={`ability-score-overview-${key}`}
            role="listitem"
            aria-label={`${abbreviation} ${baseDisplay}, ${totalDisplay}`}
          >
            <span className="ability-score-overview__label">{abbreviation}</span>
            {entry.controls !== undefined ? (
              <div className="ability-score-overview__controls">
                {entry.controls}
              </div>
            ) : (
              <span
                className="ability-score-overview__base"
                aria-label={`${label} score`}
              >
                {baseDisplay}
              </span>
            )}
            <span className="ability-score-overview__total">{totalDisplay}</span>
          </article>
        )
      })}
    </AbilityScoreCardGrid>
  )
}
