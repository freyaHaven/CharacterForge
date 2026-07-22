import type {
  CharacterInventory,
  EquipmentItemDefinition,
  InventoryEntry,
} from './types'
import {
  deriveItemNotes,
  deriveItemTags,
  isStorageContainer,
} from './inventory'
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
  }
}

export function enrichPersistedInventoryEntries(
  entries: readonly InventoryEntry[],
  catalogById: ReadonlyMap<string, EquipmentItemDefinition>,
): MaterializedInventoryEntry[] {
  return entries.map((entry) => {
    const definition = catalogById.get(entry.itemId)

    return {
      instanceId: entry.instanceId,
      itemId: entry.itemId,
      quantity: entry.quantity,
      location: entry.location,
      name: definition?.name ?? entry.itemId,
      category: definition?.category ?? 'gear',
      weightLb: definition?.weightLb ?? null,
      costGp: definition?.costGp ?? null,
      notes: deriveItemNotes(definition),
      tags: deriveItemTags(definition),
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
): number {
  return totalWeightLb(enrichPersistedInventoryEntries(entries, catalogById))
}

export function ownedItemIdsFromInventoryEntries(
  entries: readonly InventoryEntry[],
): Set<string> {
  return new Set(entries.map((entry) => entry.itemId))
}
