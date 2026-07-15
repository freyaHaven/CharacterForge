import type { ReactNode } from 'react'

export type AbilityScoreCardGridProps = {
  children: ReactNode
  ariaLabel?: string
}

export function AbilityScoreCardGrid({
  children,
  ariaLabel = 'Ability scores',
}: AbilityScoreCardGridProps) {
  return (
    <div className="ability-score-card-grid" role="list" aria-label={ariaLabel}>
      {children}
    </div>
  )
}
