import type {
  CharacterEquipment,
  CharacterInventory,
  EquipmentItemDefinition,
  EquipmentLoadout,
  InventoryEntry,
  InventoryLocation,
} from './types'
import { isStorageContainer } from './inventory'
import { reconcileEquipmentLoadout } from './equipmentLoadout'
import { ownedItemIdsFromInventoryEntries } from './seedInventory'

export type InventoryMutationErrorReason =
  | 'entry-not-found'
  | 'invalid-quantity'
  | 'insufficient-quantity'
  | 'incompatible-merge'
  | 'container-not-found'
  | 'not-a-container'
  | 'self-containment'
  | 'container-cycle'
  | 'negative-currency'
  | 'invalid-currency'

export type InventoryMutationResult =
  | { ok: true; equipment: CharacterEquipment }
  | { ok: false; reason: InventoryMutationErrorReason }

export type InventoryMutationContext = {
  definitionsById: ReadonlyMap<string, EquipmentItemDefinition>
  /**
   * Factory for new stack instance ids (split). Defaults to `play:{itemId}:{uuid}`.
   */
  createInstanceId?: (itemId: string) => string
}

/**
 * Zero-quantity policy: setting or adjusting an entry to quantity 0 removes it.
 * Negative and non-integer quantities are rejected.
 */
export const ZERO_QUANTITY_POLICY = 'remove' as const

/**
 * Currency policy: gold pieces must remain a finite number ≥ 0 (no debt).
 */
export const CURRENCY_ALLOWS_DEBT = false

function createDefaultPlayInstanceId(itemId: string): string {
  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  return `play:${itemId}:${suffix}`
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0
}

function isNonNegativeFinite(value: number): boolean {
  return Number.isFinite(value) && value >= 0
}

export function locationsEqual(
  left: InventoryLocation,
  right: InventoryLocation,
): boolean {
  if (left.kind === 'carried' && right.kind === 'carried') {
    return true
  }

  return (
    left.kind === 'container' &&
    right.kind === 'container' &&
    left.containerInstanceId === right.containerInstanceId
  )
}

/**
 * Stacks may merge only when they share catalogue `itemId` and the same
 * location. Containers never merge (contents would orphan). Display names are
 * ignored. Loadout is itemId-based, so equipped status is not a merge key.
 */
export function areInventoryStacksMergeCompatible(
  left: InventoryEntry,
  right: InventoryEntry,
  definitionsById: ReadonlyMap<string, EquipmentItemDefinition>,
): boolean {
  if (left.instanceId === right.instanceId) {
    return false
  }

  if (left.itemId !== right.itemId) {
    return false
  }

  if (!locationsEqual(left.location, right.location)) {
    return false
  }

  if (
    isStorageContainer(definitionsById.get(left.itemId)) ||
    isStorageContainer(definitionsById.get(right.itemId))
  ) {
    return false
  }

  return true
}

function findEntry(
  entries: readonly InventoryEntry[],
  instanceId: string,
): InventoryEntry | undefined {
  return entries.find((entry) => entry.instanceId === instanceId)
}

function replaceEntry(
  entries: readonly InventoryEntry[],
  instanceId: string,
  next: InventoryEntry,
): InventoryEntry[] {
  return entries.map((entry) =>
    entry.instanceId === instanceId ? next : entry,
  )
}

function removeEntryById(
  entries: readonly InventoryEntry[],
  instanceId: string,
): InventoryEntry[] {
  return entries.filter((entry) => entry.instanceId !== instanceId)
}

/**
 * When a container is removed, its contents are ejected to carried so ownership
 * is preserved. Nested containers keep their own contents until separately moved.
 */
function ejectContentsToCarried(
  entries: readonly InventoryEntry[],
  containerInstanceId: string,
): InventoryEntry[] {
  return entries.map((entry) => {
    if (
      entry.location.kind === 'container' &&
      entry.location.containerInstanceId === containerInstanceId
    ) {
      return { ...entry, location: { kind: 'carried' } }
    }
    return entry
  })
}

function isDescendantContainer(
  entries: readonly InventoryEntry[],
  ancestorInstanceId: string,
  candidateInstanceId: string,
): boolean {
  let current: string | null = candidateInstanceId
  const visited = new Set<string>()

  while (current !== null) {
    if (current === ancestorInstanceId) {
      return true
    }
    if (visited.has(current)) {
      return true
    }
    visited.add(current)

    const entry = findEntry(entries, current)
    if (entry === undefined || entry.location.kind === 'carried') {
      return false
    }
    current = entry.location.containerInstanceId
  }

  return false
}

function finalizeEquipment(
  equipment: CharacterEquipment,
  nextInventory: CharacterInventory,
  definitionsById: ReadonlyMap<string, EquipmentItemDefinition>,
): CharacterEquipment {
  const inventory: CharacterInventory = {
    entries: nextInventory.entries,
    currency: { goldPieces: nextInventory.currency.goldPieces },
    seededFromStartingEquipment:
      equipment.inventory.seededFromStartingEquipment,
  }

  const ownedItemIds = ownedItemIdsFromInventoryEntries(inventory.entries)
  const loadout: EquipmentLoadout = reconcileEquipmentLoadout(
    equipment.loadout,
    ownedItemIds,
    definitionsById,
    { inferEmptySlots: false },
  )

  return {
    selections: equipment.selections,
    inventory,
    loadout,
  }
}

function success(
  equipment: CharacterEquipment,
  nextInventory: CharacterInventory,
  definitionsById: ReadonlyMap<string, EquipmentItemDefinition>,
): InventoryMutationResult {
  return {
    ok: true,
    equipment: finalizeEquipment(equipment, nextInventory, definitionsById),
  }
}

/**
 * Set an entry's quantity. Quantity 0 removes the entry (and ejects contents
 * if it is a container). Rejects non-integers and negatives.
 */
export function setInventoryEntryQuantity(
  equipment: CharacterEquipment,
  instanceId: string,
  quantity: number,
  context: InventoryMutationContext,
): InventoryMutationResult {
  if (quantity === 0) {
    return removeInventoryEntry(equipment, instanceId, context)
  }

  if (!isPositiveInteger(quantity)) {
    return { ok: false, reason: 'invalid-quantity' }
  }

  const entry = findEntry(equipment.inventory.entries, instanceId)
  if (entry === undefined) {
    return { ok: false, reason: 'entry-not-found' }
  }

  if (entry.quantity === quantity) {
    return success(equipment, equipment.inventory, context.definitionsById)
  }

  return success(
    equipment,
    {
      ...equipment.inventory,
      entries: replaceEntry(equipment.inventory.entries, instanceId, {
        ...entry,
        quantity,
      }),
    },
    context.definitionsById,
  )
}

/**
 * Adjust quantity by a signed integer delta. Reaching 0 removes the entry.
 */
export function adjustInventoryEntryQuantity(
  equipment: CharacterEquipment,
  instanceId: string,
  delta: number,
  context: InventoryMutationContext,
): InventoryMutationResult {
  if (!Number.isInteger(delta) || delta === 0) {
    return { ok: false, reason: 'invalid-quantity' }
  }

  const entry = findEntry(equipment.inventory.entries, instanceId)
  if (entry === undefined) {
    return { ok: false, reason: 'entry-not-found' }
  }

  const nextQuantity = entry.quantity + delta
  if (nextQuantity < 0) {
    return { ok: false, reason: 'insufficient-quantity' }
  }

  return setInventoryEntryQuantity(equipment, instanceId, nextQuantity, context)
}

/**
 * Remove an entry. Container contents are ejected to carried first.
 */
export function removeInventoryEntry(
  equipment: CharacterEquipment,
  instanceId: string,
  context: InventoryMutationContext,
): InventoryMutationResult {
  const entry = findEntry(equipment.inventory.entries, instanceId)
  if (entry === undefined) {
    return { ok: false, reason: 'entry-not-found' }
  }

  let entries = equipment.inventory.entries
  if (isStorageContainer(context.definitionsById.get(entry.itemId))) {
    entries = ejectContentsToCarried(entries, instanceId)
  }

  return success(
    equipment,
    {
      ...equipment.inventory,
      entries: removeEntryById(entries, instanceId),
    },
    context.definitionsById,
  )
}

/**
 * Move an entry to carried or into a container. Rejects self, unknown,
 * non-container, and cyclic containment.
 */
export function moveInventoryEntry(
  equipment: CharacterEquipment,
  instanceId: string,
  location: InventoryLocation,
  context: InventoryMutationContext,
): InventoryMutationResult {
  const entry = findEntry(equipment.inventory.entries, instanceId)
  if (entry === undefined) {
    return { ok: false, reason: 'entry-not-found' }
  }

  if (location.kind === 'carried') {
    if (entry.location.kind === 'carried') {
      return success(equipment, equipment.inventory, context.definitionsById)
    }

    return success(
      equipment,
      {
        ...equipment.inventory,
        entries: replaceEntry(equipment.inventory.entries, instanceId, {
          ...entry,
          location: { kind: 'carried' },
        }),
      },
      context.definitionsById,
    )
  }

  const containerInstanceId = location.containerInstanceId

  if (containerInstanceId === instanceId) {
    return { ok: false, reason: 'self-containment' }
  }

  const container = findEntry(equipment.inventory.entries, containerInstanceId)
  if (container === undefined) {
    return { ok: false, reason: 'container-not-found' }
  }

  if (!isStorageContainer(context.definitionsById.get(container.itemId))) {
    return { ok: false, reason: 'not-a-container' }
  }

  if (
    isDescendantContainer(
      equipment.inventory.entries,
      instanceId,
      containerInstanceId,
    )
  ) {
    return { ok: false, reason: 'container-cycle' }
  }

  if (locationsEqual(entry.location, location)) {
    return success(equipment, equipment.inventory, context.definitionsById)
  }

  return success(
    equipment,
    {
      ...equipment.inventory,
      entries: replaceEntry(equipment.inventory.entries, instanceId, {
        ...entry,
        location: {
          kind: 'container',
          containerInstanceId,
        },
      }),
    },
    context.definitionsById,
  )
}

/**
 * Split `quantity` off an entry into a new instance at the same location.
 * The source keeps its instance id; the split stack gets a new id.
 */
export function splitInventoryStack(
  equipment: CharacterEquipment,
  instanceId: string,
  quantity: number,
  context: InventoryMutationContext,
): InventoryMutationResult {
  if (!isPositiveInteger(quantity)) {
    return { ok: false, reason: 'invalid-quantity' }
  }

  const entry = findEntry(equipment.inventory.entries, instanceId)
  if (entry === undefined) {
    return { ok: false, reason: 'entry-not-found' }
  }

  if (quantity >= entry.quantity) {
    return { ok: false, reason: 'insufficient-quantity' }
  }

  const createInstanceId =
    context.createInstanceId ?? createDefaultPlayInstanceId
  const newInstanceId = createInstanceId(entry.itemId)

  if (
    newInstanceId === entry.instanceId ||
    findEntry(equipment.inventory.entries, newInstanceId) !== undefined
  ) {
    return { ok: false, reason: 'invalid-quantity' }
  }

  const remaining: InventoryEntry = {
    ...entry,
    quantity: entry.quantity - quantity,
  }
  const split: InventoryEntry = {
    instanceId: newInstanceId,
    itemId: entry.itemId,
    quantity,
    location: entry.location,
  }

  return success(
    equipment,
    {
      ...equipment.inventory,
      entries: [
        ...replaceEntry(equipment.inventory.entries, instanceId, remaining),
        split,
      ],
    },
    context.definitionsById,
  )
}

/**
 * Merge `sourceInstanceId` into `targetInstanceId`. Source is removed; target
 * identity and location are preserved. Quantities are summed.
 */
export function mergeInventoryStacks(
  equipment: CharacterEquipment,
  targetInstanceId: string,
  sourceInstanceId: string,
  context: InventoryMutationContext,
): InventoryMutationResult {
  if (targetInstanceId === sourceInstanceId) {
    return { ok: false, reason: 'incompatible-merge' }
  }

  const target = findEntry(equipment.inventory.entries, targetInstanceId)
  const source = findEntry(equipment.inventory.entries, sourceInstanceId)

  if (target === undefined || source === undefined) {
    return { ok: false, reason: 'entry-not-found' }
  }

  if (
    !areInventoryStacksMergeCompatible(
      target,
      source,
      context.definitionsById,
    )
  ) {
    return { ok: false, reason: 'incompatible-merge' }
  }

  const merged: InventoryEntry = {
    ...target,
    quantity: target.quantity + source.quantity,
  }

  return success(
    equipment,
    {
      ...equipment.inventory,
      entries: removeEntryById(
        replaceEntry(equipment.inventory.entries, targetInstanceId, merged),
        sourceInstanceId,
      ),
    },
    context.definitionsById,
  )
}

/**
 * Replace currency gold pieces. Rejects non-finite and negative values.
 */
export function setInventoryCurrency(
  equipment: CharacterEquipment,
  goldPieces: number,
  context: InventoryMutationContext = { definitionsById: new Map() },
): InventoryMutationResult {
  if (!Number.isFinite(goldPieces)) {
    return { ok: false, reason: 'invalid-currency' }
  }

  if (goldPieces < 0) {
    return { ok: false, reason: 'negative-currency' }
  }

  if (equipment.inventory.currency.goldPieces === goldPieces) {
    return success(equipment, equipment.inventory, context.definitionsById)
  }

  return success(
    equipment,
    {
      ...equipment.inventory,
      currency: { goldPieces },
    },
    context.definitionsById,
  )
}

/**
 * Adjust currency by a signed delta. Rejects results below zero.
 */
export function adjustInventoryCurrency(
  equipment: CharacterEquipment,
  delta: number,
  context: InventoryMutationContext = { definitionsById: new Map() },
): InventoryMutationResult {
  if (!Number.isFinite(delta)) {
    return { ok: false, reason: 'invalid-currency' }
  }

  const next = equipment.inventory.currency.goldPieces + delta
  if (!isNonNegativeFinite(next)) {
    return { ok: false, reason: 'negative-currency' }
  }

  return setInventoryCurrency(equipment, next, context)
}
