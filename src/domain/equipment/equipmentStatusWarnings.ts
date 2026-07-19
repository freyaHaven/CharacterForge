import type {
  EquipmentItemDefinition,
  EquipmentLoadout,
} from './types'

export type EquipmentStatusWarning = {
  id: 'no-armour' | 'no-weapon'
  title: string
  detail: string
}

function ownedUniqueNames(
  ownedItemIds: readonly string[],
  definitionsById: ReadonlyMap<string, EquipmentItemDefinition>,
  predicate: (definition: EquipmentItemDefinition) => boolean,
): string[] {
  const names: string[] = []
  const seen = new Set<string>()

  for (const itemId of ownedItemIds) {
    if (seen.has(itemId)) {
      continue
    }
    seen.add(itemId)

    const definition = definitionsById.get(itemId)
    if (definition === undefined || !predicate(definition)) {
      continue
    }

    names.push(definition.name)
  }

  return names.sort((a, b) => a.localeCompare(b))
}

function indefiniteArticle(name: string): string {
  const first = name.trim().charAt(0).toLowerCase()
  return 'aeiou'.includes(first) ? 'an' : 'a'
}

function formatOwnedPhrase(
  names: readonly string[],
  withArticle: boolean,
): string {
  const labelled = names.map((name) =>
    withArticle ? `${indefiniteArticle(name)} ${name}` : name,
  )

  if (labelled.length === 1) {
    return labelled[0]!
  }

  if (labelled.length === 2) {
    return `${labelled[0]} and ${labelled[1]}`
  }

  const head = labelled.slice(0, -1).join(', ')
  return `${head}, and ${labelled.at(-1)}`
}

function formatArmourDetail(names: readonly string[]): string {
  return `You own ${formatOwnedPhrase(names, false)}, but none is currently equipped.`
}

function formatWeaponDetail(names: readonly string[]): string {
  const owned = formatOwnedPhrase(names, true)
  if (names.length === 2) {
    return `You own ${owned}, but neither is equipped.`
  }

  return `You own ${owned}, but none is currently equipped.`
}

function isWearableArmour(definition: EquipmentItemDefinition): boolean {
  return definition.category === 'armor'
}

function isEquippableWeapon(definition: EquipmentItemDefinition): boolean {
  return definition.category === 'weapon' && definition.handUsage !== undefined
}

function hasWeaponEquipped(
  loadout: EquipmentLoadout,
  definitionsById: ReadonlyMap<string, EquipmentItemDefinition>,
): boolean {
  for (const itemId of [loadout.mainHandItemId, loadout.offHandItemId]) {
    if (itemId === null) {
      continue
    }

    const definition = definitionsById.get(itemId)
    if (definition !== undefined && isEquippableWeapon(definition)) {
      return true
    }
  }

  return false
}

/**
 * Soft loadout hints for Overview: only when the character owns relevant
 * gear but has none of that category equipped. Shields are never warned.
 */
export function deriveEquipmentStatusWarnings(
  ownedItemIds: readonly string[],
  loadout: EquipmentLoadout,
  definitionsById: ReadonlyMap<string, EquipmentItemDefinition>,
): EquipmentStatusWarning[] {
  const warnings: EquipmentStatusWarning[] = []

  const ownedArmour = ownedUniqueNames(
    ownedItemIds,
    definitionsById,
    isWearableArmour,
  )
  if (ownedArmour.length > 0 && loadout.armorItemId === null) {
    warnings.push({
      id: 'no-armour',
      title: 'No armour equipped',
      detail: formatArmourDetail(ownedArmour),
    })
  }

  const ownedWeapons = ownedUniqueNames(
    ownedItemIds,
    definitionsById,
    isEquippableWeapon,
  )
  if (
    ownedWeapons.length > 0 &&
    !hasWeaponEquipped(loadout, definitionsById)
  ) {
    warnings.push({
      id: 'no-weapon',
      title: 'No weapon equipped',
      detail: formatWeaponDetail(ownedWeapons),
    })
  }

  return warnings
}
