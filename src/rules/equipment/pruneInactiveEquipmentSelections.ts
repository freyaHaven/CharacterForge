import type { Character } from '../../domain/types'
import type {
  EquipmentSelection,
  EquipmentSourceRef,
} from '../../domain/equipment/types'
import { equipmentSelectionKey } from '../../domain/equipment/sourceKey'

/**
 * Remove persisted selections whose source+entitlement is no longer active.
 */
export function pruneInactiveEquipmentSelections(
  character: Character,
  activeKeys: readonly string[],
): EquipmentSelection[] {
  const active = new Set(activeKeys)

  return character.equipment.selections.filter((selection) =>
    active.has(
      equipmentSelectionKey(selection.source, selection.entitlementId),
    ),
  )
}

export function collectActiveEquipmentSelectionKeys(
  sources: readonly {
    source: EquipmentSourceRef
    entitlementIds: readonly string[]
  }[],
): string[] {
  return sources.flatMap((entry) =>
    entry.entitlementIds.map((entitlementId) =>
      equipmentSelectionKey(entry.source, entitlementId),
    ),
  )
}
