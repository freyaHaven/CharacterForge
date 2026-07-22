import type {
  CharacterEquipment,
  CharacterInventory,
  CustomInventoryItemDefinition,
  EquipmentItemSelection,
  EquipmentLoadout,
  EquipmentSelection,
  EquipmentSourceRef,
  InventoryCatalogSnapshot,
  InventoryEntry,
  InventoryLocation,
} from './types'
import {
  isCustomItemId,
  isEquipmentItemCategory,
  isValidCustomItemName,
  isValidOptionalNonNegativeFinite,
} from './customItems'

function isEquipmentSourceRef(value: unknown): value is EquipmentSourceRef {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  switch (candidate.kind) {
    case 'class-instance':
      return typeof candidate.instanceId === 'string'
    case 'background':
      return typeof candidate.backgroundId === 'string'
    case 'species':
      return (
        typeof candidate.speciesId === 'string' &&
        (candidate.traitId === undefined || typeof candidate.traitId === 'string')
      )
    case 'feat':
      return (
        typeof candidate.featId === 'string' &&
        (candidate.slot === undefined || typeof candidate.slot === 'string')
      )
    default:
      return false
  }
}

function isEquipmentItemSelection(
  value: unknown,
): value is EquipmentItemSelection {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.itemId === 'string' &&
    typeof candidate.quantity === 'number' &&
    Number.isFinite(candidate.quantity) &&
    candidate.quantity > 0
  )
}

function isEquipmentSelection(value: unknown): value is EquipmentSelection {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    isEquipmentSourceRef(candidate.source) &&
    typeof candidate.entitlementId === 'string' &&
    (candidate.optionId === null || typeof candidate.optionId === 'string') &&
    Array.isArray(candidate.choices) &&
    candidate.choices.every(isEquipmentItemSelection) &&
    (candidate.path === undefined ||
      (Array.isArray(candidate.path) &&
        candidate.path.every((entry) => typeof entry === 'string')))
  )
}

function isNullableItemId(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

export function isEquipmentLoadout(value: unknown): value is EquipmentLoadout {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    isNullableItemId(candidate.armorItemId) &&
    isNullableItemId(candidate.mainHandItemId) &&
    isNullableItemId(candidate.offHandItemId) &&
    (candidate.mainHandGrip === null ||
      candidate.mainHandGrip === 'one-handed' ||
      candidate.mainHandGrip === 'two-handed')
  )
}

function isInventoryLocation(value: unknown): value is InventoryLocation {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  if (candidate.kind === 'carried') {
    return true
  }

  return (
    candidate.kind === 'container' &&
    typeof candidate.containerInstanceId === 'string'
  )
}

function isInventoryCatalogSnapshot(
  value: unknown,
): value is InventoryCatalogSnapshot {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>
  if (typeof candidate.name !== 'string' || !isValidCustomItemName(candidate.name)) {
    return false
  }

  return (
    candidate.category === undefined || isEquipmentItemCategory(candidate.category)
  )
}

export function isCustomInventoryItemDefinition(
  value: unknown,
): value is CustomInventoryItemDefinition {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  if (typeof candidate.id !== 'string' || !isCustomItemId(candidate.id)) {
    return false
  }

  if (typeof candidate.name !== 'string' || !isValidCustomItemName(candidate.name)) {
    return false
  }

  if (
    candidate.notes !== undefined &&
    typeof candidate.notes !== 'string'
  ) {
    return false
  }

  if (!isValidOptionalNonNegativeFinite(candidate.weightLb as number | undefined)) {
    return false
  }

  if (!isValidOptionalNonNegativeFinite(candidate.costGp as number | undefined)) {
    return false
  }

  return (
    candidate.category === undefined || isEquipmentItemCategory(candidate.category)
  )
}

export function isInventoryEntry(value: unknown): value is InventoryEntry {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  if (
    typeof candidate.instanceId !== 'string' ||
    typeof candidate.itemId !== 'string' ||
    typeof candidate.quantity !== 'number' ||
    !Number.isFinite(candidate.quantity) ||
    candidate.quantity <= 0 ||
    !isInventoryLocation(candidate.location)
  ) {
    return false
  }

  if (
    candidate.catalogSnapshot !== undefined &&
    !isInventoryCatalogSnapshot(candidate.catalogSnapshot)
  ) {
    return false
  }

  return true
}

export function isCharacterInventory(
  value: unknown,
): value is CharacterInventory {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>
  const currency = candidate.currency

  if (typeof currency !== 'object' || currency === null) {
    return false
  }

  const goldPieces = (currency as Record<string, unknown>).goldPieces

  if (
    !Array.isArray(candidate.entries) ||
    !candidate.entries.every(isInventoryEntry) ||
    typeof goldPieces !== 'number' ||
    !Number.isFinite(goldPieces) ||
    goldPieces < 0 ||
    (candidate.seededFromStartingEquipment !== true &&
      candidate.seededFromStartingEquipment !== false)
  ) {
    return false
  }

  if (
    typeof candidate.customItems !== 'object' ||
    candidate.customItems === null ||
    Array.isArray(candidate.customItems)
  ) {
    return false
  }

  return Object.entries(candidate.customItems as Record<string, unknown>).every(
    ([id, definition]) =>
      isCustomInventoryItemDefinition(definition) &&
      (definition as CustomInventoryItemDefinition).id === id,
  )
}

export function isCharacterEquipment(
  value: unknown,
): value is CharacterEquipment {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    Array.isArray(candidate.selections) &&
    candidate.selections.every(isEquipmentSelection) &&
    isCharacterInventory(candidate.inventory) &&
    isEquipmentLoadout(candidate.loadout)
  )
}
