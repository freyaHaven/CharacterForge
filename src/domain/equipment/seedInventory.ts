import type {
  CharacterInventory,
  CustomInventoryItemDefinition,
  EquipmentItemDefinition,
  InventoryEntry,
} from './types'
import {
  deriveItemNotes,
  deriveItemTags,
  isStorageContainer,
} from './inventory'
import { definitionFromCustomItem } from './customItems'
import type { MaterializedInventoryEntry } from './materializeInventory'
import {
  mergeInventoryQuantities,
  totalWeightLb,
} from './materializeInventory'

/**
 * True when inventory should be copied from the current starting-equipment
 * resolution. Never true once `seededFromStartingEquipment` is set.
 */
export function shouldSeedInventoryFromResolved(
  inventory: CharacterInventory,
  options: {
    hasEquipmentSources: boolean
    sourcesComplete: boolean
  },
): boolean {
  if (inventory.seededFromStartingEquipment) {
    return false
  }

  if (!options.hasEquipmentSources) {
    return false
  }

  return options.sourcesComplete
}

export function toPersistedInventoryEntries(
  entries: readonly MaterializedInventoryEntry[],
): InventoryEntry[] {
  return entries.map((entry) => ({
    instanceId: entry.instanceId,
    itemId: entry.itemId,
    quantity: entry.quantity,
    location: entry.location,
  }))
}

/**
 * One-time seed of gameplay inventory from resolved starting equipment.
 * Callers must gate with `shouldSeedInventoryFromResolved`.
 */
export function seedInventoryFromResolvedEntries(
  entries: readonly MaterializedInventoryEntry[],
  goldPieces: number,
): CharacterInventory {
  return {
    entries: toPersistedInventoryEntries(entries),
    currency: { goldPieces },
    seededFromStartingEquipment: true,
    customItems: {},
  }
}

export function enrichPersistedInventoryEntries(
  entries: readonly InventoryEntry[],
  catalogById: ReadonlyMap<string, EquipmentItemDefinition>,
  customItems: Readonly<Record<string, CustomInventoryItemDefinition>> = {},
): MaterializedInventoryEntry[] {
  return entries.map((entry) => {
    const custom = customItems[entry.itemId]
    const definition =
      catalogById.get(entry.itemId) ??
      (custom !== undefined ? definitionFromCustomItem(custom) : undefined)

    const snapshot = entry.catalogSnapshot
    const name =
      definition?.name ?? snapshot?.name ?? custom?.name ?? entry.itemId
    const category =
      definition?.category ?? snapshot?.category ?? custom?.category ?? 'gear'

    return {
      instanceId: entry.instanceId,
      itemId: entry.itemId,
      quantity: entry.quantity,
      location: entry.location,
      name,
      category,
      weightLb:
        definition?.weightLb !== undefined
          ? definition.weightLb
          : null,
      costGp:
        definition?.costGp !== undefined ? definition.costGp : null,
      notes:
        definition !== undefined
          ? deriveItemNotes(definition)
          : (custom?.notes ?? ''),
      tags: definition !== undefined ? deriveItemTags(definition) : [],
      isContainer: isStorageContainer(definition),
    }
  })
}

export function mergeEnrichedInventoryByItemId(
  entries: readonly MaterializedInventoryEntry[],
  catalogById: ReadonlyMap<string, EquipmentItemDefinition>,
): {
  itemId: string
  name: string
  quantity: number
  category: EquipmentItemDefinition['category']
}[] {
  const quantities = mergeInventoryQuantities(entries)

  return [...quantities.entries()].map(([itemId, quantity]) => {
    const definition = catalogById.get(itemId)
    return {
      itemId,
      name: definition?.name ?? itemId,
      quantity,
      category: definition?.category ?? 'gear',
    }
  })
}

export function totalPersistedInventoryWeightLb(
  entries: readonly InventoryEntry[],
  catalogById: ReadonlyMap<string, EquipmentItemDefinition>,
  customItems: Readonly<Record<string, CustomInventoryItemDefinition>> = {},
): number {
  return totalWeightLb(
    enrichPersistedInventoryEntries(entries, catalogById, customItems),
  )
}

export function ownedItemIdsFromInventoryEntries(
  entries: readonly InventoryEntry[],
): Set<string> {
  return new Set(entries.map((entry) => entry.itemId))
}
