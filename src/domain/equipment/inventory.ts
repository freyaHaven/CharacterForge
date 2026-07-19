import type {
  EquipmentItemDefinition,
  InventoryLocation,
} from './types'
import { equipmentSourceKey } from './sourceKey'
import type { EquipmentSourceRef } from './types'

export function isStorageContainer(
  definition: EquipmentItemDefinition | undefined,
): boolean {
  if (definition === undefined) {
    return false
  }

  if (definition.isContainer === true) {
    return true
  }

  // Kit packs expand away; they are not storage locations themselves.
  if (definition.expandsTo !== undefined && definition.expandsTo.length > 0) {
    return false
  }

  return definition.category === 'container'
}

export function deriveItemNotes(
  definition: EquipmentItemDefinition | undefined,
): string {
  if (definition === undefined) {
    return ''
  }

  if (definition.notes !== undefined && definition.notes.trim().length > 0) {
    return definition.notes
  }

  const parts: string[] = []

  if (definition.armor !== undefined) {
    const label =
      definition.armor.armorCategory.charAt(0).toUpperCase() +
      definition.armor.armorCategory.slice(1)
    parts.push(`${label} Armour`)
  }

  if (definition.shield !== undefined) {
    parts.push('Shield')
  }

  if (definition.handUsage === 'two-handed') {
    parts.push('Two-Handed')
  } else if (definition.handUsage === 'versatile') {
    parts.push('Versatile')
  }

  if (definition.category === 'ammunition') {
    parts.push('Ammunition')
  }

  if (definition.tags !== undefined) {
    for (const tag of definition.tags) {
      if (!parts.some((part) => part.toLowerCase() === tag.toLowerCase())) {
        parts.push(tag)
      }
    }
  }

  return parts.join(', ')
}

export function deriveItemTags(
  definition: EquipmentItemDefinition | undefined,
): string[] {
  if (definition === undefined) {
    return []
  }

  const tags = new Set<string>([
    definition.category,
    ...(definition.tags ?? []),
  ])

  if (definition.armor !== undefined) {
    tags.add(definition.armor.armorCategory)
    tags.add('armor')
  }

  if (definition.handUsage !== undefined) {
    tags.add(definition.handUsage)
  }

  if (isStorageContainer(definition)) {
    tags.add('container')
  }

  return [...tags]
}

export function createInventoryInstanceId(
  source: EquipmentSourceRef,
  itemId: string,
  ordinal: number,
): string {
  return `${equipmentSourceKey(source)}:${itemId}:${ordinal}`
}

export function formatLocationLabel(
  location: InventoryLocation,
  containerNameByInstanceId: ReadonlyMap<string, string>,
): string {
  if (location.kind === 'carried') {
    return 'Carried'
  }

  return (
    containerNameByInstanceId.get(location.containerInstanceId) ?? 'Container'
  )
}
