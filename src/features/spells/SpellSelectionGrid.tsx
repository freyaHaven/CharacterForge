import { useId, useState } from 'react'
import { ChoiceChevronIcon } from '../choices/ChoiceChevronIcon'
import type { SpellDefinition } from '../../domain/spell/types'
import type { SpellSelectionEligibility } from '../../rules/spell/spellSelectionEligibility'
import type { SpellLevelCountRow } from './entitlementCountDisplay'
import {
  formatLevelCountValue,
  formatSpellLevelAccordionSummary,
} from './entitlementCountDisplay'
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
  /** When true, unchecked selectable cards are disabled (global pick limit). */
  atSelectionLimit?: boolean
  onToggleSpell: (spellId: string) => void
}

type SpellCardListProps = {
  idPrefix: string
  listLabel: string
  spells: SpellDefinition[]
  selectedSpellIds: ReadonlySet<string>
  invalidSpellIds?: ReadonlySet<string>
  eligibilityBySpellId?: ReadonlyMap<string, SpellSelectionEligibility>
  atSelectionLimit: boolean
  /**
   * When set, unselected spells at this level are blocked once a genuine
   * per-group capacity is full (`limitScope === 'group'`).
   */
  levelAtCapacity?: boolean
  onToggleSpell: (spellId: string) => void
}

function SpellCardList({
  idPrefix,
  listLabel,
  spells,
  selectedSpellIds,
  invalidSpellIds,
  eligibilityBySpellId,
  atSelectionLimit,
  levelAtCapacity = false,
  onToggleSpell,
}: SpellCardListProps) {
  return (
    <div
      className="spell-selection-grid__cards"
      role="list"
      aria-label={listLabel}
    >
      {spells.map((spell) => {
        const selected = selectedSpellIds.has(spell.id)
        const invalid = invalidSpellIds?.has(spell.id) ?? false
        const eligibility = eligibilityBySpellId?.get(spell.id) ?? null
        const eligibilityBlocked =
          eligibility?.recommendation === 'blocked' && !selected
        const capacityBlocked = levelAtCapacity && !selected
        const limitBlocked = atSelectionLimit && !selected
        const disabled = eligibilityBlocked || capacityBlocked || limitBlocked

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
                if (disabled) {
                  return
                }
                onToggleSpell(spell.id)
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

type SpellLevelAccordionProps = {
  idPrefix: string
  row: SpellLevelCountRow
  spells: SpellDefinition[]
  selectedSpellIds: ReadonlySet<string>
  invalidSpellIds?: ReadonlySet<string>
  eligibilityBySpellId?: ReadonlyMap<string, SpellSelectionEligibility>
  atSelectionLimit: boolean
  onToggleSpell: (spellId: string) => void
}

function SpellLevelAccordion({
  idPrefix,
  row,
  spells,
  selectedSpellIds,
  invalidSpellIds,
  eligibilityBySpellId,
  atSelectionLimit,
  onToggleSpell,
}: SpellLevelAccordionProps) {
  const reactId = useId()
  const headerId = `${idPrefix}-level-${row.level}-header-${reactId}`
  const panelId = `${idPrefix}-level-${row.level}-panel-${reactId}`
  const [expanded, setExpanded] = useState(() =>
    spells.some((spell) => selectedSpellIds.has(spell.id)),
  )
  const countValue = formatLevelCountValue(row)
  const levelAtCapacity =
    row.limitScope === 'group' &&
    row.capacity !== null &&
    row.selected >= row.capacity

  const selectedHere = spells.filter((spell) => selectedSpellIds.has(spell.id))
  const unselectedEligible = spells.filter((spell) => {
    if (selectedSpellIds.has(spell.id)) {
      return false
    }
    const eligibility = eligibilityBySpellId?.get(spell.id)
    return eligibility?.recommendation !== 'blocked'
  })
  const summaryText = formatSpellLevelAccordionSummary({
    label: row.label,
    selectedNames: selectedHere.map((spell) => spell.name),
    eligibleCount: unselectedEligible.length,
  })

  return (
    <div
      className={
        expanded
          ? 'spell-level-accordion spell-level-accordion--expanded'
          : 'spell-level-accordion'
      }
    >
      <div className="spell-level-accordion__summary">
        <span className="spell-level-accordion__label">{row.label}</span>
        {countValue !== null ? (
          <span className="spell-level-accordion__count">{countValue}</span>
        ) : null}
      </div>

      <button
        type="button"
        id={headerId}
        className="spell-level-accordion__trigger"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => {
          setExpanded((current) => !current)
        }}
      >
        <span>{expanded ? `Hide ${row.label} spells` : summaryText}</span>
        <span className="spell-level-accordion__chevron" aria-hidden="true">
          <ChoiceChevronIcon />
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        hidden={!expanded}
        className="spell-level-accordion__panel"
      >
        {spells.length === 0 ? (
          <p className="spell-level-accordion__empty">
            No additional spells available
          </p>
        ) : (
          <SpellCardList
            idPrefix={`${idPrefix}-l${row.level}`}
            listLabel={`${row.label} spells`}
            spells={spells}
            selectedSpellIds={selectedSpellIds}
            invalidSpellIds={invalidSpellIds}
            eligibilityBySpellId={eligibilityBySpellId}
            atSelectionLimit={atSelectionLimit}
            levelAtCapacity={levelAtCapacity}
            onToggleSpell={onToggleSpell}
          />
        )}
      </div>
    </div>
  )
}

/**
 * Responsive catalogue of spell selection cards.
 * Multi-level entitlements use per-level accordions; single-level stays a flat grid.
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
  const spellsByLevel = new Map<number, SpellDefinition[]>()
  for (const spell of selectableSpells) {
    const bucket = spellsByLevel.get(spell.level) ?? []
    bucket.push(spell)
    spellsByLevel.set(spell.level, bucket)
  }

  const useLevelAccordions = levelRows.length > 0

  return (
    <section
      className="spell-selection-grid"
      aria-labelledby={`${idPrefix}-heading`}
    >
      <h4 id={`${idPrefix}-heading`} className="spell-selection-grid__title">
        {title}{' '}
        <span className="spell-selection-grid__count">{countLabel}</span>
      </h4>

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

      {useLevelAccordions ? (
        <div className="spell-selection-grid__levels">
          {levelRows.map((row) => (
            <SpellLevelAccordion
              key={row.level}
              idPrefix={idPrefix}
              row={row}
              spells={spellsByLevel.get(row.level) ?? []}
              selectedSpellIds={selectedSpellIds}
              invalidSpellIds={invalidSpellIds}
              eligibilityBySpellId={eligibilityBySpellId}
              atSelectionLimit={atSelectionLimit}
              onToggleSpell={onToggleSpell}
            />
          ))}
        </div>
      ) : (
        <SpellCardList
          idPrefix={idPrefix}
          listLabel={title}
          spells={selectableSpells}
          selectedSpellIds={selectedSpellIds}
          invalidSpellIds={invalidSpellIds}
          eligibilityBySpellId={eligibilityBySpellId}
          atSelectionLimit={atSelectionLimit}
          onToggleSpell={onToggleSpell}
        />
      )}
    </section>
  )
}
