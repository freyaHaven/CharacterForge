import {
  formatAbilityModifierDisplay,
  formatAbilityScoreDisplay,
} from './abilityScoreDisplay'
import type { AbilityScoreBreakdownEntry } from './resolveAbilityScoreBreakdown'

export type AbilityScoreBreakdownProps = {
  entries: readonly AbilityScoreBreakdownEntry[]
}

function formatSignedBonus(amount: number): string {
  return amount >= 0 ? `+${amount}` : `${amount}`
}

function BreakdownField({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="ability-score-breakdown__field">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export function AbilityScoreBreakdown({ entries }: AbilityScoreBreakdownProps) {
  return (
    <section
      className="ability-score-breakdown"
      aria-labelledby="ability-score-breakdown-heading"
    >
      <h3 id="ability-score-breakdown-heading">Score Breakdown</h3>
      <div className="ability-score-breakdown__list">
        {entries.map((entry) => (
          <article
            key={entry.abilityKey}
            className="ability-score-breakdown__ability"
            data-testid={`ability-score-breakdown-${entry.abilityKey}`}
          >
            <h4 className="ability-score-breakdown__ability-title">
              {entry.label}
            </h4>
            <dl className="ability-score-breakdown__fields">
              <BreakdownField
                label="Total Score"
                value={formatAbilityScoreDisplay(entry.totalScore)}
              />
              <BreakdownField
                label="Modifier"
                value={formatAbilityModifierDisplay(entry.totalScore)}
              />
              <BreakdownField
                label="Base Score"
                value={formatAbilityScoreDisplay(entry.baseScore)}
              />
              <div className="ability-score-breakdown__field ability-score-breakdown__field--bonuses">
                <dt>Bonuses</dt>
                <dd>
                  {entry.bonuses.length === 0 ? (
                    <span className="ability-score-breakdown__empty">—</span>
                  ) : (
                    <ul className="ability-score-breakdown__bonus-list">
                      {entry.bonuses.map((bonus) => (
                        <li
                          key={`${bonus.sourceLabel}-${bonus.amount}`}
                        >
                          {formatSignedBonus(bonus.amount)} {bonus.sourceLabel}
                        </li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>
              {entry.setScore !== null ? (
                <BreakdownField
                  label="Set Score"
                  value={formatAbilityScoreDisplay(entry.setScore)}
                />
              ) : null}
              {entry.stackingBonus !== null ? (
                <BreakdownField
                  label="Stacking Bonus"
                  value={formatSignedBonus(entry.stackingBonus)}
                />
              ) : null}
              {entry.otherModifier !== null ? (
                <BreakdownField
                  label="Other Modifier"
                  value={formatSignedBonus(entry.otherModifier)}
                />
              ) : null}
              {entry.override !== null ? (
                <BreakdownField
                  label="Override"
                  value={formatAbilityScoreDisplay(entry.override)}
                />
              ) : null}
            </dl>
          </article>
        ))}
      </div>
    </section>
  )
}
