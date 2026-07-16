import { SystemIcon } from '../../../../features/system/SystemIcon'
import type { ReviewStatItem } from './organizeReviewSheet'
import { ProficiencyStatIcon } from './ReviewCombatStatIcons'

export type CombatStatSummaryProps = {
  stats: ReviewStatItem[]
  title?: string
}

function combatSystemIconName(label: string): string | null {
  switch (label) {
    case 'Hit Points':
      return 'hit-points'
    case 'Armor Class':
      return 'armor'
    case 'Initiative':
      return 'initiative'
    case 'Speed':
      return 'speed'
    default:
      return null
  }
}

function CombatStatIcon({ label }: { label: string }) {
  const systemName = combatSystemIconName(label)
  if (systemName !== null) {
    return <SystemIcon name={systemName} size={50} />
  }

  if (label === 'Proficiency') {
    return <ProficiencyStatIcon />
  }

  return null
}

export function CombatStatSummary({
  stats,
  title = 'Combat',
}: CombatStatSummaryProps) {
  if (stats.length === 0) {
    return null
  }

  return (
    <section
      className="character-sheet__combat"
      aria-label="Combat summary"
    >
      <h3 className="character-sheet__region-title">{title}</h3>
      <dl className="character-sheet__combat-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="character-sheet__combat-stat">
            <span className="character-sheet__combat-icon" aria-hidden="true">
              <CombatStatIcon label={stat.label} />
            </span>
            <dt className="character-sheet__combat-label">{stat.label}</dt>
            <dd className="character-sheet__combat-value">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
