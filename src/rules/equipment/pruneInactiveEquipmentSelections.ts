import type { Character } from '../../domain/types'
import type {
  EquipmentSelection,
  EquipmentSourceRef,
} from '../../domain/equipment/types'
import { equipmentSelectionPath } from '../../domain/equipment/equipmentChoiceTree'
import { equipmentSelectionKey, equipmentSourcesEqual } from '../../domain/equipment/sourceKey'

/**
 * Remove persisted selections whose source+entitlement+path is no longer active.
 */
export function pruneInactiveEquipmentSelections(
  character: Character,
  activeKeys: readonly string[],
): EquipmentSelection[] {
  const active = new Set(activeKeys)

  return character.equipment.selections.filter((selection) =>
    active.has(
      equipmentSelectionKey(
        selection.source,
        selection.entitlementId,
        selection.path,
      ),
    ),
  )
}

export function collectActiveEquipmentSelectionKeys(
  sources: readonly {
    source: EquipmentSourceRef
    entries: readonly { entitlementId: string; path?: readonly string[] }[]
  }[],
): string[] {
  return sources.flatMap((entry) =>
    entry.entries.map((node) =>
      equipmentSelectionKey(entry.source, node.entitlementId, node.path),
    ),
  )
}

/**
 * After changing a choose-option at `path`, drop selections for the same source
 * whose path sits under a sibling branch (or the previous option).
 */
export function pruneUnreachableEquipmentSelectionsForOptionChange(
  selections: readonly EquipmentSelection[],
  source: EquipmentSourceRef,
  path: readonly string[],
  selectedOptionId: string,
): EquipmentSelection[] {
  return selections.filter((selection) => {
    if (!equipmentSourcesEqual(selection.source, source)) {
      return true
    }

    const selectionPath = equipmentSelectionPath(selection)
    if (selectionPath.length <= path.length) {
      return true
    }

    if (!path.every((entry, index) => selectionPath[index] === entry)) {
      return true
    }

    const branchOptionId = selectionPath[path.length]
    return branchOptionId === selectedOptionId
  })
}

export function upsertEquipmentOptionSelection(
  selections: readonly EquipmentSelection[],
  source: EquipmentSourceRef,
  entitlementId: string,
  optionId: string,
  path: readonly string[] = [],
): EquipmentSelection[] {
  const pruned = pruneUnreachableEquipmentSelectionsForOptionChange(
    selections,
    source,
    path,
    optionId,
  )

  const next: EquipmentSelection = {
    source,
    entitlementId,
    path: [...path],
    optionId,
    choices: [],
  }

  const key = equipmentSelectionKey(source, entitlementId, path)
  const index = pruned.findIndex(
    (entry) =>
      equipmentSelectionKey(entry.source, entry.entitlementId, entry.path) ===
      key,
  )

  if (index === -1) {
    return [...pruned, next]
  }

  return pruned.map((entry, entryIndex) =>
    entryIndex === index ? next : entry,
  )
}

export function upsertEquipmentItemChoices(
  selections: readonly EquipmentSelection[],
  source: EquipmentSourceRef,
  entitlementId: string,
  choices: EquipmentSelection['choices'],
  path: readonly string[] = [],
): EquipmentSelection[] {
  const next: EquipmentSelection = {
    source,
    entitlementId,
    path: [...path],
    optionId: null,
    choices,
  }

  const key = equipmentSelectionKey(source, entitlementId, path)
  const index = selections.findIndex(
    (entry) =>
      equipmentSelectionKey(entry.source, entry.entitlementId, entry.path) ===
      key,
  )

  if (index === -1) {
    return [...selections, next]
  }

  return selections.map((entry, entryIndex) =>
    entryIndex === index ? next : entry,
  )
}
