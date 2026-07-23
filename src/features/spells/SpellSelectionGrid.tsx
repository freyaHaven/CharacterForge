import {
  ThresholdCollapseList,
  formatThresholdCollapseTitle,
} from '../choices/ThresholdCollapseList'
import type { SpellDefinition } from '../../domain/spell/types'
import type { SpellSelectionEligibility } from '../../rules/spell/spellSelectionEligibility'
import type { SpellLevelCountRow } from './entitlementCountDisplay'
import {
  formatSpellLevelSectionLabel,
} from './entitlementCountDisplay'
import { SpellSelectionCard } from './SpellSelectionCard'
import {
  formatSelectionProgress,
  formatSpellSectionTitle,
  resolveSpellSectionDefaultExpanded,
  spellLevelSectionHasContent,
} from './spellSectionCollapse'

export type SpellSelectionProgress = {
  selected: number
  limit: number
}

export type SpellSelectionGridProps = {
  /** Stable id prefix for checkbox inputs. */
  idPrefix: string
  title: string
  countLabel: string
  /**
   * Entitlement selection progress for accordion headers and default open
   * state. Prefer this over parsing {@link countLabel}.
   */
  selectionProgress?: SpellSelectionProgress
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
  /**
   * When false (default), unselected redundant / already-known spells are
   * omitted from the catalogue. Selected redundant spells stay visible so
   * they can be cleared.
   */
  showRedundant?: boolean
  /** Label for the granted-spell list / accordion (defaults to Always Prepared Spells). */
  grantedListLabel?: string
  /**
   * When true, omit the entitlement h4 — the parent source section already
   * provides the heading (Spells page source → level hierarchy).
   */
  nestedUnderSource?: boolean
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

/**
 * Unselected spells that are already covered elsewhere (discouraged or
 * forbidden duplicates). These are the "redundant choices" partition.
 */
export function isRedundantUnselected(
  spellId: string,
  selectedSpellIds: ReadonlySet<string>,
  eligibilityBySpellId?: ReadonlyMap<string, SpellSelectionEligibility>,
): boolean {
  if (selectedSpellIds.has(spellId)) {
    return false
  }
  const recommendation = eligibilityBySpellId?.get(spellId)?.recommendation
  return recommendation === 'discouraged' || recommendation === 'blocked'
}

/**
 * Split the selectable catalogue into the primary recommended list and the
 * optional redundant subset (preserving original order in each partition).
 */
export function partitionSelectableSpells(
  spells: SpellDefinition[],
  selectedSpellIds: ReadonlySet<string>,
  eligibilityBySpellId: ReadonlyMap<string, SpellSelectionEligibility> | undefined,
): { recommended: SpellDefinition[]; redundant: SpellDefinition[] } {
  const recommended: SpellDefinition[] = []
  const redundant: SpellDefinition[] = []
  for (const spell of spells) {
    if (isRedundantUnselected(spell.id, selectedSpellIds, eligibilityBySpellId)) {
      redundant.push(spell)
    } else {
      recommended.push(spell)
    }
  }
  return { recommended, redundant }
}

function filterCatalogueSpells(
  spells: SpellDefinition[],
  selectedSpellIds: ReadonlySet<string>,
  eligibilityBySpellId: ReadonlyMap<string, SpellSelectionEligibility> | undefined,
  showRedundant: boolean,
): SpellDefinition[] {
  if (showRedundant) {
    return spells
  }
  return spells.filter(
    (spell) =>
      !isRedundantUnselected(spell.id, selectedSpellIds, eligibilityBySpellId),
  )
}

function groupSpellsByLevel(
  spells: SpellDefinition[],
): Map<number, SpellDefinition[]> {
  const spellsByLevel = new Map<number, SpellDefinition[]>()
  for (const spell of spells) {
    const bucket = spellsByLevel.get(spell.level) ?? []
    bucket.push(spell)
    spellsByLevel.set(spell.level, bucket)
  }
  return spellsByLevel
}

function sectionHasInvalidSpell(
  spells: SpellDefinition[],
  invalidSpellIds: ReadonlySet<string> | undefined,
): boolean {
  if (invalidSpellIds === undefined || invalidSpellIds.size === 0) {
    return false
  }
  return spells.some((spell) => invalidSpellIds.has(spell.id))
}

function formatLevelSectionProgress(row: SpellLevelCountRow): string {
  if (row.limitScope === 'group' && row.capacity !== null) {
    return formatSelectionProgress(row.selected, row.capacity)
  }
  return row.selected === 1 ? '1 selected' : `${row.selected} selected`
}

type SelectableSpellSectionProps = {
  id: string
  label: string
  progress: string
  spells: SpellDefinition[]
  selectedCount: number
  capacity: number | null
  hasValidationError: boolean
  selectedSpellIds: ReadonlySet<string>
  invalidSpellIds?: ReadonlySet<string>
  eligibilityBySpellId?: ReadonlyMap<string, SpellSelectionEligibility>
  atSelectionLimit: boolean
  levelAtCapacity?: boolean
  onToggleSpell: (spellId: string) => void
}

/**
 * Threshold-based selectable catalogue section (flat entitlement or one level).
 */
function SelectableSpellSection({
  id,
  label,
  progress,
  spells,
  selectedCount,
  capacity,
  hasValidationError,
  selectedSpellIds,
  invalidSpellIds,
  eligibilityBySpellId,
  atSelectionLimit,
  levelAtCapacity = false,
  onToggleSpell,
}: SelectableSpellSectionProps) {
  const list = (
    <SpellCardList
      idPrefix={id}
      listLabel={label}
      spells={spells}
      selectedSpellIds={selectedSpellIds}
      invalidSpellIds={invalidSpellIds}
      eligibilityBySpellId={eligibilityBySpellId}
      atSelectionLimit={atSelectionLimit}
      levelAtCapacity={levelAtCapacity}
      onToggleSpell={onToggleSpell}
    />
  )

  return (
    <ThresholdCollapseList
      id={id}
      title={formatSpellSectionTitle(label, progress)}
      itemCount={spells.length}
      defaultExpanded={resolveSpellSectionDefaultExpanded({
        kind: 'selectable',
        itemCount: spells.length,
        selectedCount,
        capacity,
        hasValidationError,
      })}
    >
      {list}
    </ThresholdCollapseList>
  )
}

/**
 * Responsive catalogue of spell selection cards.
 *
 * Selectable groups / spell-level lists use the shared threshold accordion
 * policy. Redundant unselected spells are filtered from the catalogue unless
 * {@link showRedundant} is true, in which case they remain inside the same
 * section (not a separate accordion).
 */
export function SpellSelectionGrid({
  idPrefix,
  title,
  countLabel,
  selectionProgress,
  levelRows = [],
  selectableSpells,
  grantedSpells = [],
  selectedSpellIds,
  invalidSpellIds,
  eligibilityBySpellId,
  atSelectionLimit = false,
  showRedundant = false,
  grantedListLabel = 'Always Prepared Spells',
  nestedUnderSource = false,
  onToggleSpell,
}: SpellSelectionGridProps) {
  const { redundant } = partitionSelectableSpells(
    selectableSpells,
    selectedSpellIds,
    eligibilityBySpellId,
  )

  const visibleSpells = filterCatalogueSpells(
    selectableSpells,
    selectedSpellIds,
    eligibilityBySpellId,
    showRedundant,
  )

  const visibleByLevel = groupSpellsByLevel(visibleSpells)
  const grantedByLevel = groupSpellsByLevel(grantedSpells)
  const useLevelSections = levelRows.length > 0

  const entitlementSelected = selectionProgress?.selected
  const entitlementLimit = selectionProgress?.limit ?? null
  const entitlementProgressLabel =
    entitlementSelected !== undefined && entitlementLimit !== null
      ? formatSelectionProgress(entitlementSelected, entitlementLimit)
      : countLabel.replace(/\s*\(.*\)$/, '')

  const grantedList = (
    <div
      className="spell-selection-grid__cards spell-selection-grid__cards--granted"
      role="list"
      aria-label={grantedListLabel}
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
  )

  const showEntitlementHeading = nestedUnderSource
    ? useLevelSections
    : useLevelSections || visibleSpells.length <= 3

  const visibleLevelRows = useLevelSections
    ? levelRows.filter((row) => {
        const selectableAtLevel = visibleByLevel.get(row.level) ?? []
        const grantedAtLevel = grantedByLevel.get(row.level) ?? []
        return spellLevelSectionHasContent({
          selectableCount: selectableAtLevel.length,
          grantedCount: grantedAtLevel.length,
          selectedCount: row.selected,
        })
      })
    : []

  return (
    <section
      className="spell-selection-grid"
      aria-labelledby={
        showEntitlementHeading ? `${idPrefix}-heading` : undefined
      }
      aria-label={
        showEntitlementHeading
          ? undefined
          : `${title} ${entitlementProgressLabel}`
      }
    >
      {showEntitlementHeading ? (
        <h4 id={`${idPrefix}-heading`} className="spell-selection-grid__title">
          {title}{' '}
          <span className="spell-selection-grid__count">{countLabel}</span>
        </h4>
      ) : null}

      {grantedSpells.length > 0 ? (
        <ThresholdCollapseList
          id={`${idPrefix}-granted`}
          title={formatThresholdCollapseTitle(
            grantedListLabel,
            grantedSpells.length,
          )}
          itemCount={grantedSpells.length}
          defaultExpanded={resolveSpellSectionDefaultExpanded({
            kind: 'granted',
            itemCount: grantedSpells.length,
          })}
        >
          {grantedList}
        </ThresholdCollapseList>
      ) : null}

      {useLevelSections ? (
        <div className="spell-selection-grid__levels">
          {visibleLevelRows.map((row) => {
            const spells = visibleByLevel.get(row.level) ?? []
            const label = formatSpellLevelSectionLabel(row.level)
            const levelCapacity =
              row.limitScope === 'group' ? row.capacity : entitlementLimit
            const levelSelected =
              row.limitScope === 'group'
                ? row.selected
                : (entitlementSelected ?? row.selected)
            const levelAtCapacity =
              row.limitScope === 'group' &&
              row.capacity !== null &&
              row.selected >= row.capacity

            return (
              <SelectableSpellSection
                key={row.level}
                id={`${idPrefix}-l${row.level}`}
                label={label}
                progress={formatLevelSectionProgress(row)}
                spells={spells}
                selectedCount={levelSelected}
                capacity={levelCapacity}
                hasValidationError={sectionHasInvalidSpell(
                  spells,
                  invalidSpellIds,
                )}
                selectedSpellIds={selectedSpellIds}
                invalidSpellIds={invalidSpellIds}
                eligibilityBySpellId={eligibilityBySpellId}
                atSelectionLimit={atSelectionLimit}
                levelAtCapacity={levelAtCapacity}
                onToggleSpell={onToggleSpell}
              />
            )
          })}
        </div>
      ) : selectableSpells.length > 0 ? (
        <SelectableSpellSection
          id={idPrefix}
          label={title}
          progress={entitlementProgressLabel}
          spells={visibleSpells}
          selectedCount={entitlementSelected ?? selectedSpellIds.size}
          capacity={entitlementLimit}
          hasValidationError={sectionHasInvalidSpell(
            visibleSpells,
            invalidSpellIds,
          )}
          selectedSpellIds={selectedSpellIds}
          invalidSpellIds={invalidSpellIds}
          eligibilityBySpellId={eligibilityBySpellId}
          atSelectionLimit={atSelectionLimit}
          onToggleSpell={onToggleSpell}
        />
      ) : null}

      {!showRedundant && redundant.length > 0 ? (
        <p className="spell-selection-grid__redundant-hint" role="status">
          {redundant.length} redundant{' '}
          {redundant.length === 1 ? 'choice' : 'choices'} hidden — enable “Show
          redundant choices” to browse them.
        </p>
      ) : null}
    </section>
  )
}
