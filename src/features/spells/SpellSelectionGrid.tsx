import type { SpellDefinition } from '../../domain/spell/types'
import type { SpellSelectionEligibility } from '../../rules/spell/spellSelectionEligibility'
import type { SpellLevelCountRow } from './entitlementCountDisplay'
import { formatLevelCountValue } from './entitlementCountDisplay'
import { SpellSelectionCard } from './SpellSelectionCard'

export type SpellSelectionGridProps = {
  /** Stable id prefix for checkbox inputs. */
  idPrefix: string
  title: string
  countLabel: string
  /** Per-level counts when more than one spell level is available. */
  levelRows?: SpellLevelCountRow[]
  selectableSpells: SpellDefinition[]
  grantedSpells?: SpellDefinition[]
  selectedSpellIds: ReadonlySet<string>
  invalidSpellIds?: ReadonlySet<string>
  /** Eligibility metadata keyed by spell id. */
  eligibilityBySpellId?: ReadonlyMap<string, SpellSelectionEligibility>
  /** When true, unchecked selectable cards are disabled (at selection limit). */
  atSelectionLimit?: boolean
  onToggleSpell: (spellId: string) => void
}

/**
 * Responsive catalogue grid of spell selection cards.
 */
export function SpellSelectionGrid({
  idPrefix,
  title,
  countLabel,
  levelRows = [],
  selectableSpells,
  grantedSpells = [],
  selectedSpellIds,
  invalidSpellIds,
  eligibilityBySpellId,
  atSelectionLimit = false,
  onToggleSpell,
}: SpellSelectionGridProps) {
  return (
    <section
      className="spell-selection-grid"
      aria-labelledby={`${idPrefix}-heading`}
    >
      <h4 id={`${idPrefix}-heading`} className="spell-selection-grid__title">
        {title}{' '}
        <span className="spell-selection-grid__count">{countLabel}</span>
      </h4>

      {levelRows.length > 0 ? (
        <table className="spell-selection-grid__levels">
          <caption className="visually-hidden">
            {title} by spell level
          </caption>
          <tbody>
            {levelRows.map((row) => (
              <tr key={row.level}>
                <th scope="row">{row.label}</th>
                <td>{formatLevelCountValue(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {grantedSpells.length > 0 ? (
        <div
          className="spell-selection-grid__cards spell-selection-grid__cards--granted"
          role="list"
          aria-label="Always prepared spells"
        >
          {grantedSpells.map((spell) => (
            <div key={spell.id} role="listitem">
              <SpellSelectionCard
                spell={spell}
                inputId={`${idPrefix}-granted-${spell.id}`}
                selected
                granted
              />
            </div>
          ))}
        </div>
      ) : null}

      <div
        className="spell-selection-grid__cards"
        role="list"
        aria-label={title}
      >
        {selectableSpells.map((spell) => {
          const selected = selectedSpellIds.has(spell.id)
          const invalid = invalidSpellIds?.has(spell.id) ?? false
          const eligibility = eligibilityBySpellId?.get(spell.id) ?? null
          const blocked =
            eligibility?.recommendation === 'blocked' && !selected
          const disabled =
            blocked || (atSelectionLimit && !selected)

          return (
            <div key={spell.id} role="listitem">
              <SpellSelectionCard
                spell={spell}
                inputId={`${idPrefix}-${spell.id}`}
                selected={selected}
                disabled={disabled}
                invalid={invalid}
                eligibility={eligibility}
                onToggle={() => {
                  if (blocked) {
                    return
                  }
                  onToggleSpell(spell.id)
                }}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
