import type {
  CharacterEquipment,
  CharacterInventory,
  CustomInventoryItemDefinition,
  EquipmentItemDefinition,
  EquipmentLoadout,
  InventoryEntry,
  InventoryLocation,
} from './types'
import { isStorageContainer } from './inventory'
import { reconcileEquipmentLoadout } from './equipmentLoadout'
import { ownedItemIdsFromInventoryEntries } from './seedInventory'
import {
  areCustomDefinitionsEquivalent,
  createCatalogSnapshot,
  createCustomItemId,
  definitionFromCustomItem,
  isCustomItemId,
  isValidCustomItemName,
  isValidOptionalNonNegativeFinite,
  mergeCustomDefinitionsIntoCatalog,
  pruneUnusedCustomItems,
} from './customItems'

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
  | 'invalid-name'
  | 'invalid-weight'
  | 'invalid-cost'
  | 'unknown-catalogue-item'

export type InventoryMutationResult =
  | { ok: true; equipment: CharacterEquipment }
  | { ok: false; reason: InventoryMutationErrorReason }

export type InventoryMutationContext = {
  definitionsById: ReadonlyMap<string, EquipmentItemDefinition>
  /**
   * Factory for new stack instance ids (split / add). Defaults to `play:{itemId}:{uuid}`.
   */
  createInstanceId?: (itemId: string) => string
}

export type InventoryStackMergeMode = 'always-new' | 'merge-if-compatible'

export type AddCatalogueInventoryItemInput = {
  itemId: string
  quantity: number
  location: InventoryLocation
  /**
   * Default `always-new` — never silently merge.
   * Use `merge-if-compatible` only when the UI explicitly offers stacking.
   */
  mergeMode?: InventoryStackMergeMode
}

export type AddCustomInventoryItemInput = {
  name: string
  quantity: number
  location: InventoryLocation
  notes?: string
  weightLb?: number | null
  costGp?: number | null
  category?: CustomInventoryItemDefinition['category']
  /**
   * Custom creation always allocates a new custom definition id, so stacks of
   * separately created customs never merge by name. `mergeMode` is reserved for
   * future “add more of this custom” flows and defaults to `always-new`.
   */
  mergeMode?: InventoryStackMergeMode
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
 * Stacks may merge only when they share `itemId` and the same location.
 * Containers never merge. Display names are ignored.
 *
 * Custom stacks merge only when they share the same custom definition id
 * (and therefore equivalent persisted custom data) — never by name alone.
 * Loadout is itemId-based, so equipped status is not a merge key.
 */
export function areInventoryStacksMergeCompatible(
  left: Pick<InventoryEntry, 'instanceId' | 'itemId' | 'location'>,
  right: Pick<InventoryEntry, 'instanceId' | 'itemId' | 'location'>,
  definitionsById: ReadonlyMap<string, EquipmentItemDefinition>,
  customItems: Readonly<Record<string, CustomInventoryItemDefinition>> = {},
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

  const leftCustom = customItems[left.itemId]
  const rightCustom = customItems[right.itemId]
  if (leftCustom !== undefined || rightCustom !== undefined) {
    if (!areCustomDefinitionsEquivalent(leftCustom, rightCustom)) {
      return false
    }
  }

  const leftDefinition =
    definitionsById.get(left.itemId) ??
    (leftCustom !== undefined ? definitionFromCustomItem(leftCustom) : undefined)
  const rightDefinition =
    definitionsById.get(right.itemId) ??
    (rightCustom !== undefined
      ? definitionFromCustomItem(rightCustom)
      : undefined)

  if (
    isStorageContainer(leftDefinition) ||
    isStorageContainer(rightDefinition)
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
  const customItems = pruneUnusedCustomItems(
    nextInventory.customItems ?? {},
    nextInventory.entries,
  )

  const inventory: CharacterInventory = {
    entries: nextInventory.entries,
    currency: { goldPieces: nextInventory.currency.goldPieces },
    seededFromStartingEquipment:
      equipment.inventory.seededFromStartingEquipment,
    customItems,
  }

  const definitions = mergeCustomDefinitionsIntoCatalog(
    definitionsById,
    customItems,
  )

  const ownedItemIds = ownedItemIdsFromInventoryEntries(inventory.entries)
  const loadout: EquipmentLoadout = reconcileEquipmentLoadout(
    equipment.loadout,
    ownedItemIds,
    definitions,
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

  const definitions = resolveDefinitionsForMutation(
    equipment,
    context.definitionsById,
  )

  let entries = equipment.inventory.entries
  if (isStorageContainer(definitions.get(entry.itemId))) {
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

  const definitions = resolveDefinitionsForMutation(
    equipment,
    context.definitionsById,
  )
  if (!isStorageContainer(definitions.get(container.itemId))) {
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
      equipment.inventory.customItems,
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

export function formatInventoryMutationError(
  reason: InventoryMutationErrorReason,
): string {
  switch (reason) {
    case 'entry-not-found':
      return 'That item is no longer in your inventory.'
    case 'invalid-quantity':
      return 'Enter a whole number quantity of 1 or more.'
    case 'insufficient-quantity':
      return 'There are not enough of that item for this action.'
    case 'incompatible-merge':
      return 'Those stacks cannot be merged.'
    case 'container-not-found':
      return 'That container is no longer in your inventory.'
    case 'not-a-container':
      return 'Items can only be stored in a container.'
    case 'self-containment':
      return 'A container cannot hold itself.'
    case 'container-cycle':
      return 'That move would nest a container inside itself.'
    case 'negative-currency':
      return 'Gold pieces cannot go below zero.'
    case 'invalid-currency':
      return 'Enter a valid gold amount of zero or more.'
    case 'invalid-name':
      return 'Enter a name for the custom item.'
    case 'invalid-weight':
      return 'Weight must be zero or a positive number when provided.'
    case 'invalid-cost':
      return 'Cost must be zero or a positive number when provided.'
    case 'unknown-catalogue-item':
      return 'That catalogue item is not available.'
    default: {
      const _exhaustive: never = reason
      return _exhaustive
    }
  }
}

function resolveDefinitionsForMutation(
  equipment: CharacterEquipment,
  definitionsById: ReadonlyMap<string, EquipmentItemDefinition>,
): Map<string, EquipmentItemDefinition> {
  return mergeCustomDefinitionsIntoCatalog(
    definitionsById,
    equipment.inventory.customItems ?? {},
  )
}

function validateDestination(
  equipment: CharacterEquipment,
  location: InventoryLocation,
  definitionsById: ReadonlyMap<string, EquipmentItemDefinition>,
): InventoryMutationResult | null {
  if (location.kind === 'carried') {
    return null
  }

  const definitions = resolveDefinitionsForMutation(equipment, definitionsById)
  const container = findEntry(
    equipment.inventory.entries,
    location.containerInstanceId,
  )
  if (container === undefined) {
    return { ok: false, reason: 'container-not-found' }
  }

  if (!isStorageContainer(definitions.get(container.itemId))) {
    return { ok: false, reason: 'not-a-container' }
  }

  return null
}

function findCompatibleMergeTarget(
  entries: readonly InventoryEntry[],
  candidate: Pick<InventoryEntry, 'itemId' | 'location'>,
  definitionsById: ReadonlyMap<string, EquipmentItemDefinition>,
  customItems: Readonly<Record<string, CustomInventoryItemDefinition>>,
): InventoryEntry | undefined {
  return entries.find((entry) =>
    areInventoryStacksMergeCompatible(
      entry,
      {
        instanceId: '__new__',
        itemId: candidate.itemId,
        location: candidate.location,
      },
      definitionsById,
      customItems,
    ),
  )
}

/**
 * Add a catalogue-backed item to gameplay inventory.
 * Does not touch selections or the seed marker.
 * Default merge mode is `always-new` (explicit opt-in to stack merge).
 */
export function addCatalogueInventoryItem(
  equipment: CharacterEquipment,
  input: AddCatalogueInventoryItemInput,
  context: InventoryMutationContext,
): InventoryMutationResult {
  if (!isPositiveInteger(input.quantity)) {
    return { ok: false, reason: 'invalid-quantity' }
  }

  const definition = context.definitionsById.get(input.itemId)
  if (definition === undefined || isCustomItemId(input.itemId)) {
    return { ok: false, reason: 'unknown-catalogue-item' }
  }

  const destinationError = validateDestination(
    equipment,
    input.location,
    context.definitionsById,
  )
  if (destinationError !== null) {
    return destinationError
  }

  const mergeMode = input.mergeMode ?? 'always-new'
  const customItems = equipment.inventory.customItems ?? {}
  const definitions = resolveDefinitionsForMutation(
    equipment,
    context.definitionsById,
  )

  if (mergeMode === 'merge-if-compatible') {
    const existing = findCompatibleMergeTarget(
      equipment.inventory.entries,
      { itemId: input.itemId, location: input.location },
      definitions,
      customItems,
    )
    if (existing !== undefined) {
      return setInventoryEntryQuantity(
        equipment,
        existing.instanceId,
        existing.quantity + input.quantity,
        context,
      )
    }
  }

  const createInstanceId =
    context.createInstanceId ?? createDefaultPlayInstanceId
  const entry: InventoryEntry = {
    instanceId: createInstanceId(input.itemId),
    itemId: input.itemId,
    quantity: input.quantity,
    location: input.location,
    catalogSnapshot: createCatalogSnapshot(definition),
  }

  return success(
    equipment,
    {
      ...equipment.inventory,
      customItems,
      entries: [...equipment.inventory.entries, entry],
    },
    context.definitionsById,
  )
}

/**
 * Create a custom inventory item definition and add a stack to gameplay inventory.
 * Does not touch selections or the seed marker.
 * Each call allocates a unique custom id — namesakes never stack together.
 */
export function addCustomInventoryItem(
  equipment: CharacterEquipment,
  input: AddCustomInventoryItemInput,
  context: InventoryMutationContext = { definitionsById: new Map() },
): InventoryMutationResult {
  const name = input.name.trim()
  if (!isValidCustomItemName(name)) {
    return { ok: false, reason: 'invalid-name' }
  }

  if (!isPositiveInteger(input.quantity)) {
    return { ok: false, reason: 'invalid-quantity' }
  }

  if (!isValidOptionalNonNegativeFinite(input.weightLb)) {
    return { ok: false, reason: 'invalid-weight' }
  }

  if (!isValidOptionalNonNegativeFinite(input.costGp)) {
    return { ok: false, reason: 'invalid-cost' }
  }

  const destinationError = validateDestination(
    equipment,
    input.location,
    context.definitionsById,
  )
  if (destinationError !== null) {
    return destinationError
  }

  const customId = createCustomItemId()
  const custom: CustomInventoryItemDefinition = {
    id: customId,
    name,
    ...(input.notes !== undefined && input.notes.trim().length > 0
      ? { notes: input.notes.trim() }
      : {}),
    ...(input.weightLb !== undefined &&
    input.weightLb !== null &&
    Number.isFinite(input.weightLb)
      ? { weightLb: input.weightLb }
      : {}),
    ...(input.costGp !== undefined &&
    input.costGp !== null &&
    Number.isFinite(input.costGp)
      ? { costGp: input.costGp }
      : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
  }

  const createInstanceId =
    context.createInstanceId ?? createDefaultPlayInstanceId
  const entry: InventoryEntry = {
    instanceId: createInstanceId(customId),
    itemId: customId,
    quantity: input.quantity,
    location: input.location,
  }

  const customItems = {
    ...(equipment.inventory.customItems ?? {}),
    [customId]: custom,
  }

  // Newly created customs always get a fresh id, so mergeMode cannot stack
  // with an existing entry of a different custom id.
  return success(
    equipment,
    {
      ...equipment.inventory,
      customItems,
      entries: [...equipment.inventory.entries, entry],
    },
    context.definitionsById,
  )
}
