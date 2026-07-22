import { useId, useMemo } from 'react'
import type { AbilityScores } from '../../domain/types'
import type { EquipmentItemDefinition } from '../../domain/equipment/types'
import type { ResolvedInventoryEntry } from '../../rules/character/resolveCharacterEquipment'
import {
  calculateCarryingLoad,
  calculateInventoryWeightFromEnriched,
  formatCarryingLoadSummary,
} from '../../domain/equipment/inventoryWeight'

export type InventoryWeightSummaryProps = {
  entries: readonly ResolvedInventoryEntry[]
  abilityScores: AbilityScores
  definitionsById?: ReadonlyMap<string, EquipmentItemDefinition>
  /** Visual density for Overview vs full Inventory page. */
  compact?: boolean
}

export function InventoryWeightSummary({
  entries,
  abilityScores,
  definitionsById,
  compact = false,
}: InventoryWeightSummaryProps) {
  const labelId = useId()
  const statusId = useId()

  const { load, summary } = useMemo(() => {
    const nextBreakdown = calculateInventoryWeightFromEnriched(
      entries,
      definitionsById,
    )
    const nextLoad = calculateCarryingLoad(
      nextBreakdown,
      abilityScores.strength,
    )
    return {
      load: nextLoad,
      summary: formatCarryingLoadSummary(
        nextLoad,
        nextBreakdown.unknownEntryCount,
      ),
    }
  }, [abilityScores.strength, definitionsById, entries])

  const progressPercent = Math.round(summary.progressRatio * 100)
  const stateClass = [
    load.overloaded
      ? 'inventory-weight-summary--overloaded'
      : 'inventory-weight-summary--ok',
    load.incompleteTotal ? 'inventory-weight-summary--incomplete' : null,
  ]
    .filter((value): value is string => value !== null)
    .join(' ')

  const ariaValueText = [
    summary.primary,
    summary.statusLabel,
    summary.detail,
  ]
    .filter((part): part is string => part !== null && part.length > 0)
    .join('. ')

  return (
    <div
      className={
        compact
          ? `inventory-weight-summary inventory-weight-summary--compact ${stateClass}`
          : `inventory-weight-summary ${stateClass}`
      }
      data-weight-status={load.status}
    >
      <p id={labelId} className="inventory-weight-summary__primary">
        {summary.primary}
        {summary.detail !== null ? (
          <span className="inventory-weight-summary__detail">
            {' '}
            — {summary.detail}
          </span>
        ) : null}
      </p>

      <div
        className="inventory-weight-summary__track"
        role="progressbar"
        aria-labelledby={labelId}
        aria-describedby={statusId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(progressPercent, 100)}
        aria-valuetext={ariaValueText}
      >
        <div
          className="inventory-weight-summary__fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <p id={statusId} className="inventory-weight-summary__status">
        {summary.statusLabel}
        {load.overloaded ? (
          <span className="inventory-weight-summary__marker"> (overloaded)</span>
        ) : null}
        {load.incompleteTotal ? (
          <span className="inventory-weight-summary__marker">
            {' '}
            (incomplete total)
          </span>
        ) : null}
      </p>
    </div>
  )
}
