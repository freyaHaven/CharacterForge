import type { CharacterInventory } from '../../domain/equipment/types'
import {
  enrichPersistedInventoryEntries,
  mergeEnrichedInventoryByItemId,
  seedInventoryFromResolvedEntries,
  shouldSeedInventoryFromResolved,
} from '../../domain/equipment/seedInventory'
import { totalWeightLb } from '../../domain/equipment/materializeInventory'
import type { EquipmentItemDefinition } from '../../domain/equipment/types'
import {
  isEquipmentFullyResolved,
  type ResolvedEquipment,
} from '../character/resolveCharacterEquipment'

/**
 * Seed gameplay inventory from a completed starting-equipment resolution.
 * Returns null when seeding must not run (already seeded, incomplete, or no sources).
 */
export function trySeedInventoryFromResolvedEquipment(
  inventory: CharacterInventory,
  resolved: ResolvedEquipment,
): CharacterInventory | null {
  if (
    !shouldSeedInventoryFromResolved(inventory, {
      hasEquipmentSources: resolved.sources.length > 0,
      sourcesComplete: isEquipmentFullyResolved(resolved),
    })
  ) {
    return null
  }

  return seedInventoryFromResolvedEntries(
    resolved.entries,
    resolved.currency.goldPieces,
  )
}

/**
 * Overview / AC view backed by persisted inventory (never rebuilds from grants).
 */
export function buildPlayResolvedEquipmentView(
  inventory: CharacterInventory,
  catalogById: ReadonlyMap<string, EquipmentItemDefinition>,
  startingEquipmentSources: ResolvedEquipment['sources'],
): ResolvedEquipment {
  const entries = enrichPersistedInventoryEntries(inventory.entries, catalogById)
  const merged = mergeEnrichedInventoryByItemId(entries, catalogById)

  return {
    sources: startingEquipmentSources,
    entries,
    inventory: merged,
    mergedInventory: merged,
    currency: { goldPieces: inventory.currency.goldPieces },
    weightCarriedLb: totalWeightLb(entries),
  }
}
