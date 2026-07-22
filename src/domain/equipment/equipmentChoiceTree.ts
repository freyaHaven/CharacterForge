import type {
  EquipmentEntitlement,
  EquipmentFilter,
  EquipmentItemDefinition,
  EquipmentOption,
  EquipmentSelection,
  EquipmentSourceRef,
  StartingEquipmentDefinition,
} from './types'
import { equipmentSelectionKey } from './sourceKey'

export function equipmentSelectionPath(
  selection: Pick<EquipmentSelection, 'path'>,
): string[] {
  return selection.path ?? []
}

export function pathsEqual(
  left: readonly string[] | undefined,
  right: readonly string[] | undefined,
): boolean {
  const a = left ?? []
  const b = right ?? []
  if (a.length !== b.length) {
    return false
  }
  return a.every((entry, index) => entry === b[index])
}

export function findEquipmentSelection(
  selections: readonly EquipmentSelection[],
  source: EquipmentSourceRef,
  entitlementId: string,
  path: readonly string[] = [],
): EquipmentSelection | null {
  return (
    selections.find(
      (entry) =>
        equipmentSelectionKey(entry.source, entry.entitlementId, entry.path) ===
        equipmentSelectionKey(source, entitlementId, path),
    ) ?? null
  )
}

export function chooseItemsBounds(entitlement: Extract<
  EquipmentEntitlement,
  { type: 'choose-items' }
>): { min: number; max: number } {
  if (entitlement.min !== undefined || entitlement.max !== undefined) {
    const min = entitlement.min ?? entitlement.max ?? entitlement.count ?? 1
    const max = entitlement.max ?? entitlement.min ?? entitlement.count ?? min
    return { min, max }
  }

  const count = entitlement.count ?? 1
  return { min: count, max: count }
}

export function isEquipmentEntitlementRequired(
  entitlement: EquipmentEntitlement,
): boolean {
  if (entitlement.type === 'grant') {
    return entitlement.required !== false
  }
  return entitlement.required !== false
}

export function itemMatchesEquipmentFilter(
  item: EquipmentItemDefinition,
  filter: EquipmentFilter,
): boolean {
  switch (filter.kind) {
    case 'item-ids':
      return filter.itemIds.includes(item.id)
    case 'category':
      return filter.categories.includes(item.category)
    case 'tags':
      return filter.tags.every((tag) => item.tags?.includes(tag) === true)
  }
}

export function isEquipmentEntitlementComplete(
  entitlement: EquipmentEntitlement,
  selection: EquipmentSelection | null,
  catalogById?: ReadonlyMap<string, EquipmentItemDefinition>,
): boolean {
  if (entitlement.type === 'grant') {
    return true
  }

  if (!isEquipmentEntitlementRequired(entitlement)) {
    return true
  }

  if (entitlement.type === 'choose-option') {
    if (selection?.optionId == null) {
      return false
    }
    return entitlement.options.some((option) => option.id === selection.optionId)
  }

  const chosen = selection?.choices ?? []
  const { min, max } = chooseItemsBounds(entitlement)
  if (chosen.length < min || chosen.length > max) {
    return false
  }

  if (entitlement.allowDuplicates !== true) {
    const ids = chosen.map((entry) => entry.itemId)
    if (new Set(ids).size !== ids.length) {
      return false
    }
  }

  if (catalogById !== undefined) {
    for (const entry of chosen) {
      const item = catalogById.get(entry.itemId)
      if (
        item === undefined ||
        !itemMatchesEquipmentFilter(item, entitlement.catalogueFilter) ||
        entry.quantity < 1
      ) {
        return false
      }
    }
  }

  return chosen.every((entry) => entry.quantity >= 1)
}

export type ActiveEquipmentNode = {
  entitlement: EquipmentEntitlement
  path: string[]
  selection: EquipmentSelection | null
  isComplete: boolean
}

/**
 * Walk only active branches: root entitlements, then nested entitlements under
 * the selected items option (gold branches have no children).
 */
export function collectActiveEquipmentNodes(
  definition: StartingEquipmentDefinition,
  source: EquipmentSourceRef,
  selections: readonly EquipmentSelection[],
  catalogById?: ReadonlyMap<string, EquipmentItemDefinition>,
): ActiveEquipmentNode[] {
  const nodes: ActiveEquipmentNode[] = []

  function visit(entitlements: readonly EquipmentEntitlement[], path: string[]) {
    for (const entitlement of entitlements) {
      const selection = findEquipmentSelection(
        selections,
        source,
        entitlement.id,
        path,
      )
      nodes.push({
        entitlement,
        path: [...path],
        selection,
        isComplete: isEquipmentEntitlementComplete(
          entitlement,
          selection,
          catalogById,
        ),
      })

      if (entitlement.type !== 'choose-option' || selection?.optionId == null) {
        continue
      }

      const option = entitlement.options.find(
        (entry) => entry.id === selection.optionId,
      )
      if (
        option === undefined ||
        option.kind !== 'items' ||
        option.entitlements === undefined ||
        option.entitlements.length === 0
      ) {
        continue
      }

      visit(option.entitlements, [...path, option.id])
    }
  }

  visit(definition.entitlements, [])
  return nodes
}

export function collectActiveEquipmentSelectionKeysForDefinition(
  definition: StartingEquipmentDefinition,
  source: EquipmentSourceRef,
  selections: readonly EquipmentSelection[],
): string[] {
  return collectActiveEquipmentNodes(definition, source, selections).map(
    (node) => equipmentSelectionKey(source, node.entitlement.id, node.path),
  )
}

export function formatEquipmentOptionPreview(
  option: EquipmentOption,
  itemNameById?: ReadonlyMap<string, string>,
): string {
  if (option.summary !== undefined && option.summary.length > 0) {
    return option.summary
  }

  if (option.kind === 'gold') {
    return `${option.goldPieces} GP`
  }

  return option.items
    .map((grant) => {
      const name = itemNameById?.get(grant.itemId) ?? grant.itemId
      return grant.quantity > 1 ? `${name} ×${grant.quantity}` : name
    })
    .join(', ')
}
