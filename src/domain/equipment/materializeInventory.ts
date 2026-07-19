import type { Character } from '../types'
import type {
  EquipmentGrant,
  EquipmentItemDefinition,
  EquipmentSourceRef,
  InventoryLocation,
} from './types'
import {
  GOLD_PIECES_ITEM_ID,
  SELECTED_GAMING_SET_ITEM_ID,
} from './types'
import {
  createInventoryInstanceId,
  deriveItemNotes,
  deriveItemTags,
  isStorageContainer,
} from './inventory'

export type MaterializedInventoryEntry = {
  instanceId: string
  itemId: string
  name: string
  quantity: number
  category: EquipmentItemDefinition['category']
  location: InventoryLocation
  weightLb: number | null
  costGp: number | null
  notes: string
  tags: string[]
  isContainer: boolean
}

function resolveGamingSetItemId(
  character: Character,
  itemId: string,
): string {
  if (itemId !== SELECTED_GAMING_SET_ITEM_ID) {
    return itemId
  }

  const selected = character.background?.choices['gaming-set']
  if (typeof selected !== 'string' || selected.length === 0) {
    return SELECTED_GAMING_SET_ITEM_ID
  }

  return selected.startsWith('srd-2024:') ? selected : `srd-2024:${selected}`
}

/** Expand kit packs into contents; peel gold; discard pack lines. */
function flattenGrants(
  grants: readonly EquipmentGrant[],
  catalogById: Map<string, EquipmentItemDefinition>,
  character: Character,
): { items: EquipmentGrant[]; goldPieces: number } {
  const items: EquipmentGrant[] = []
  let goldPieces = 0

  const addGrant = (grant: EquipmentGrant) => {
    const resolvedId = resolveGamingSetItemId(character, grant.itemId)

    if (resolvedId === GOLD_PIECES_ITEM_ID) {
      goldPieces += grant.quantity
      return
    }

    const definition = catalogById.get(resolvedId)
    if (definition?.expandsTo !== undefined && definition.expandsTo.length > 0) {
      for (const nested of definition.expandsTo) {
        addGrant(nested)
      }
      return
    }

    items.push({ itemId: resolvedId, quantity: grant.quantity })
  }

  for (const grant of grants) {
    addGrant(grant)
  }

  return { items, goldPieces }
}

function pickPreferredContainer(
  containers: MaterializedInventoryEntry[],
  preferItemIds: readonly string[],
): MaterializedInventoryEntry | undefined {
  for (const preferredId of preferItemIds) {
    const match = containers.find((entry) => entry.itemId === preferredId)
    if (match !== undefined) {
      return match
    }
  }

  return containers[0]
}

function defaultLocationForCategory(
  category: EquipmentItemDefinition['category'],
  isContainer: boolean,
  containers: MaterializedInventoryEntry[],
): InventoryLocation {
  if (isContainer) {
    return { kind: 'carried' }
  }

  if (category === 'ammunition') {
    const ammoContainer = pickPreferredContainer(containers, [
      'srd-2024:quiver',
      'srd-2024:crossbow-bolt-case',
    ])
    if (ammoContainer !== undefined) {
      return {
        kind: 'container',
        containerInstanceId: ammoContainer.instanceId,
      }
    }
  }

  if (
    category === 'weapon' ||
    category === 'armor' ||
    category === 'shield'
  ) {
    return { kind: 'carried' }
  }

  const bag = pickPreferredContainer(containers, [
    'srd-2024:backpack',
    'srd-2024:pouch',
  ])
  if (bag !== undefined) {
    return { kind: 'container', containerInstanceId: bag.instanceId }
  }

  return { kind: 'carried' }
}

function defaultLocationForItem(
  definition: EquipmentItemDefinition | undefined,
  containers: MaterializedInventoryEntry[],
): InventoryLocation {
  return defaultLocationForCategory(
    definition?.category ?? 'gear',
    isStorageContainer(definition),
    containers,
  )
}

/**
 * Re-assign locations using the full container set (e.g. after merging
 * class + background grants so backpack/quiver from one source can hold
 * gear from another).
 */
export function assignDefaultLocations(
  entries: readonly MaterializedInventoryEntry[],
): MaterializedInventoryEntry[] {
  const containers = entries.filter((entry) => entry.isContainer)

  return entries.map((entry) => ({
    ...entry,
    location: defaultLocationForCategory(
      entry.category,
      entry.isContainer,
      containers,
    ),
  }))
}

/**
 * Materialize grants into instance-aware inventory entries with locations.
 * Same itemId in different containers stays as separate entries.
 */
export function materializeInventoryEntries(
  grants: readonly EquipmentGrant[],
  catalogById: Map<string, EquipmentItemDefinition>,
  character: Character,
  source: EquipmentSourceRef,
  ordinalStart = 0,
): { entries: MaterializedInventoryEntry[]; goldPieces: number; nextOrdinal: number } {
  const { items, goldPieces } = flattenGrants(grants, catalogById, character)
  const entries: MaterializedInventoryEntry[] = []
  const containers: MaterializedInventoryEntry[] = []
  let ordinal = ordinalStart

  for (const item of items) {
    const definition = catalogById.get(item.itemId)
    if (!isStorageContainer(definition)) {
      continue
    }

    const instanceId = createInventoryInstanceId(source, item.itemId, ordinal)
    ordinal += 1

    const entry: MaterializedInventoryEntry = {
      instanceId,
      itemId: item.itemId,
      name: definition?.name ?? item.itemId,
      quantity: item.quantity,
      category: definition?.category ?? 'gear',
      location: { kind: 'carried' },
      weightLb: definition?.weightLb ?? null,
      costGp: definition?.costGp ?? null,
      notes: deriveItemNotes(definition),
      tags: deriveItemTags(definition),
      isContainer: true,
    }

    containers.push(entry)
    entries.push(entry)
  }

  for (const item of items) {
    const definition = catalogById.get(item.itemId)
    if (isStorageContainer(definition)) {
      continue
    }

    const instanceId = createInventoryInstanceId(source, item.itemId, ordinal)
    ordinal += 1

    entries.push({
      instanceId,
      itemId: item.itemId,
      name: definition?.name ?? item.itemId,
      quantity: item.quantity,
      category: definition?.category ?? 'gear',
      location: defaultLocationForItem(definition, containers),
      weightLb: definition?.weightLb ?? null,
      costGp: definition?.costGp ?? null,
      notes: deriveItemNotes(definition),
      tags: deriveItemTags(definition),
      isContainer: false,
    })
  }

  return { entries, goldPieces, nextOrdinal: ordinal }
}

export function mergeInventoryQuantities(
  entries: readonly MaterializedInventoryEntry[],
): Map<string, number> {
  const quantities = new Map<string, number>()

  for (const entry of entries) {
    quantities.set(
      entry.itemId,
      (quantities.get(entry.itemId) ?? 0) + entry.quantity,
    )
  }

  return quantities
}

export function totalWeightLb(
  entries: readonly MaterializedInventoryEntry[],
): number {
  let total = 0

  for (const entry of entries) {
    if (entry.weightLb === null) {
      continue
    }
    total += entry.weightLb * entry.quantity
  }

  return Math.round(total * 10) / 10
}
