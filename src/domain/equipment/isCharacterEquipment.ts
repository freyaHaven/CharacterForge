import type {
  CharacterEquipment,
  EquipmentItemSelection,
  EquipmentLoadout,
  EquipmentSelection,
  EquipmentSourceRef,
} from './types'

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
    candidate.choices.every(isEquipmentItemSelection)
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
    isEquipmentLoadout(candidate.loadout)
  )
}
