import type {
  EquipmentHandUsage,
  EquipmentItemDefinition,
  EquipmentLoadout,
} from '../types'

const EMPTY_LOADOUT: EquipmentLoadout = {
  armorItemId: null,
  mainHandItemId: null,
  offHandItemId: null,
  mainHandGrip: null,
}

export type OwnedItemIds = ReadonlySet<string>

export type EquipUnequipDetail = {
  slot: 'armor' | 'mainHand' | 'offHand'
  itemId: string
  itemName: string
}

export type EquipPreview = {
  /** True when confirming would change any occupied conflicting slot. */
  hasConflict: boolean
  /** Player-facing explanation, e.g. why a shield would be removed. */
  message: string | null
  nextLoadout: EquipmentLoadout
  unequipped: EquipUnequipDetail[]
}

function definitionName(
  itemId: string,
  definitions: ReadonlyMap<string, EquipmentItemDefinition>,
): string {
  return definitions.get(itemId)?.name ?? itemId
}

export function isTwoHandedGrip(
  loadout: EquipmentLoadout,
  definitions: ReadonlyMap<string, EquipmentItemDefinition>,
): boolean {
  if (loadout.mainHandItemId === null) {
    return false
  }

  const main = definitions.get(loadout.mainHandItemId)
  if (main === undefined) {
    return false
  }

  if (main.handUsage === 'two-handed') {
    return true
  }

  return (
    main.handUsage === 'versatile' && loadout.mainHandGrip === 'two-handed'
  )
}

export function getEffectiveHandUsage(
  definition: EquipmentItemDefinition,
  grip: EquipmentLoadout['mainHandGrip'],
): EquipmentHandUsage | null {
  if (definition.category === 'shield') {
    return 'one-handed'
  }

  if (definition.handUsage === undefined) {
    return null
  }

  if (definition.handUsage === 'versatile') {
    return grip === 'two-handed' ? 'two-handed' : 'one-handed'
  }

  return definition.handUsage
}

/**
 * Drops loadout references to items the character no longer owns and clears
 * illegal hand combinations.
 */
export function pruneEquipmentLoadout(
  loadout: EquipmentLoadout,
  ownedItemIds: OwnedItemIds,
  definitions: ReadonlyMap<string, EquipmentItemDefinition>,
): EquipmentLoadout {
  const current = loadout ?? EMPTY_LOADOUT
  let next: EquipmentLoadout = {
    armorItemId:
      current.armorItemId !== null && ownedItemIds.has(current.armorItemId)
        ? current.armorItemId
        : null,
    mainHandItemId:
      current.mainHandItemId !== null && ownedItemIds.has(current.mainHandItemId)
        ? current.mainHandItemId
        : null,
    offHandItemId:
      current.offHandItemId !== null && ownedItemIds.has(current.offHandItemId)
        ? current.offHandItemId
        : null,
    mainHandGrip: current.mainHandGrip,
  }

  if (next.mainHandItemId === null) {
    next = { ...next, mainHandGrip: null }
  } else {
    const main = definitions.get(next.mainHandItemId)
    if (main?.handUsage !== 'versatile') {
      next = { ...next, mainHandGrip: null }
    } else if (next.mainHandGrip === null) {
      next = { ...next, mainHandGrip: 'one-handed' }
    }
  }

  if (isTwoHandedGrip(next, definitions)) {
    next = { ...next, offHandItemId: null }
  }

  return next
}

/**
 * Infers a sensible default loadout from owned inventory when slots are empty.
 * Prefers first armour, a shield in the off hand when compatible, and a
 * sensible main-hand weapon.
 */
export function inferDefaultEquipmentLoadout(
  ownedItemIds: OwnedItemIds,
  definitions: ReadonlyMap<string, EquipmentItemDefinition>,
  current: EquipmentLoadout = EMPTY_LOADOUT,
): EquipmentLoadout {
  let next = pruneEquipmentLoadout(current, ownedItemIds, definitions)

  const ownedDefinitions = [...ownedItemIds]
    .map((itemId) => definitions.get(itemId))
    .filter((entry): entry is EquipmentItemDefinition => entry !== undefined)

  if (next.armorItemId === null) {
    const armor = ownedDefinitions.find(
      (entry) => entry.category === 'armor' && entry.armor !== undefined,
    )
    if (armor !== undefined) {
      next = { ...next, armorItemId: armor.id }
    }
  }

  if (next.mainHandItemId === null) {
    const preferredWeapon =
      ownedDefinitions.find(
        (entry) =>
          entry.category === 'weapon' && entry.handUsage === 'two-handed',
      ) ??
      ownedDefinitions.find(
        (entry) =>
          entry.category === 'weapon' && entry.handUsage !== undefined,
      )

    if (preferredWeapon !== undefined) {
      const preview = previewEquipItem(next, preferredWeapon.id, definitions, {
        preferredVersatileGrip:
          preferredWeapon.handUsage === 'versatile' ? 'one-handed' : undefined,
      })
      next = preview.nextLoadout
    }
  }

  if (next.offHandItemId === null && !isTwoHandedGrip(next, definitions)) {
    const shield = ownedDefinitions.find(
      (entry) => entry.category === 'shield' && entry.shield !== undefined,
    )
    if (shield !== undefined) {
      const preview = previewEquipItem(next, shield.id, definitions)
      next = preview.nextLoadout
    }
  }

  return pruneEquipmentLoadout(next, ownedItemIds, definitions)
}

/**
 * After inventory changes: prune invalid slots, and fill empty slots from newly
 * owned gear when `inferEmptySlots` is true.
 */
export function reconcileEquipmentLoadout(
  loadout: EquipmentLoadout,
  ownedItemIds: OwnedItemIds,
  definitions: ReadonlyMap<string, EquipmentItemDefinition>,
  options?: { inferEmptySlots?: boolean },
): EquipmentLoadout {
  const pruned = pruneEquipmentLoadout(loadout, ownedItemIds, definitions)

  if (options?.inferEmptySlots !== true) {
    return pruned
  }

  return inferDefaultEquipmentLoadout(ownedItemIds, definitions, pruned)
}

export function previewEquipItem(
  loadout: EquipmentLoadout,
  itemId: string,
  definitions: ReadonlyMap<string, EquipmentItemDefinition>,
  options?: {
    preferredVersatileGrip?: 'one-handed' | 'two-handed'
  },
): EquipPreview {
  const definition = definitions.get(itemId)
  if (definition === undefined) {
    return {
      hasConflict: false,
      message: null,
      nextLoadout: loadout,
      unequipped: [],
    }
  }

  const unequipped: EquipUnequipDetail[] = []
  let next = { ...loadout }

  const recordUnequip = (
    slot: EquipUnequipDetail['slot'],
    unequippedItemId: string | null,
  ) => {
    if (unequippedItemId === null || unequippedItemId === itemId) {
      return
    }
    unequipped.push({
      slot,
      itemId: unequippedItemId,
      itemName: definitionName(unequippedItemId, definitions),
    })
  }

  if (definition.category === 'armor' && definition.armor !== undefined) {
    recordUnequip('armor', next.armorItemId)
    next = { ...next, armorItemId: itemId }
  } else if (definition.category === 'shield' && definition.shield !== undefined) {
    if (isTwoHandedGrip(next, definitions)) {
      recordUnequip('mainHand', next.mainHandItemId)
      next = {
        ...next,
        mainHandItemId: null,
        mainHandGrip: null,
      }
    }
    recordUnequip('offHand', next.offHandItemId)
    next = { ...next, offHandItemId: itemId }
  } else if (
    definition.category === 'weapon' &&
    definition.handUsage !== undefined
  ) {
    const grip =
      definition.handUsage === 'versatile'
        ? (options?.preferredVersatileGrip ??
          (next.offHandItemId !== null ? 'one-handed' : 'two-handed'))
        : null
    const effective = getEffectiveHandUsage(definition, grip)

    recordUnequip('mainHand', next.mainHandItemId)

    if (effective === 'two-handed') {
      recordUnequip('offHand', next.offHandItemId)
      next = {
        ...next,
        mainHandItemId: itemId,
        offHandItemId: null,
        mainHandGrip: definition.handUsage === 'versatile' ? 'two-handed' : null,
      }
    } else {
      next = {
        ...next,
        mainHandItemId: itemId,
        mainHandGrip: definition.handUsage === 'versatile' ? 'one-handed' : null,
      }
    }
  }

  const itemName = definition.name
  let message: string | null = null
  if (unequipped.length > 0) {
    const reasons = unequipped.map((entry) => entry.itemName)
    if (
      definition.handUsage === 'two-handed' ||
      (definition.handUsage === 'versatile' &&
        next.mainHandGrip === 'two-handed')
    ) {
      message = `Equipping ${itemName} will unequip ${reasons.join(' and ')} because ${itemName} requires both hands.`
    } else if (definition.category === 'shield') {
      message = `Equipping ${itemName} will unequip ${reasons.join(' and ')}.`
    } else {
      message = `Equipping ${itemName} will unequip ${reasons.join(' and ')}.`
    }
  }

  return {
    hasConflict: unequipped.length > 0,
    message,
    nextLoadout: next,
    unequipped,
  }
}

export function previewUnequipItem(
  loadout: EquipmentLoadout,
  itemId: string,
): EquipmentLoadout {
  let next = { ...loadout }

  if (next.armorItemId === itemId) {
    next = { ...next, armorItemId: null }
  }
  if (next.mainHandItemId === itemId) {
    next = { ...next, mainHandItemId: null, mainHandGrip: null }
  }
  if (next.offHandItemId === itemId) {
    next = { ...next, offHandItemId: null }
  }

  return next
}

export function isItemEquipped(
  loadout: EquipmentLoadout,
  itemId: string,
): boolean {
  return (
    loadout.armorItemId === itemId ||
    loadout.mainHandItemId === itemId ||
    loadout.offHandItemId === itemId
  )
}

export function formatOffHandSlotLabel(
  loadout: EquipmentLoadout,
  definitions: ReadonlyMap<string, EquipmentItemDefinition>,
): string {
  if (isTwoHandedGrip(loadout, definitions)) {
    const weaponName =
      loadout.mainHandItemId === null
        ? 'two-handed weapon'
        : definitionName(loadout.mainHandItemId, definitions)
    return `Occupied by ${weaponName}`
  }

  if (loadout.offHandItemId === null) {
    return '—'
  }

  return definitionName(loadout.offHandItemId, definitions)
}

/**
 * Change grip for a versatile main-hand weapon. Switching to two-handed may
 * unequip the off hand (shield or weapon).
 */
export function previewSetVersatileGrip(
  loadout: EquipmentLoadout,
  grip: 'one-handed' | 'two-handed',
  definitions: ReadonlyMap<string, EquipmentItemDefinition>,
): EquipPreview {
  if (loadout.mainHandItemId === null) {
    return {
      hasConflict: false,
      message: null,
      nextLoadout: loadout,
      unequipped: [],
    }
  }

  const main = definitions.get(loadout.mainHandItemId)
  if (main?.handUsage !== 'versatile') {
    return {
      hasConflict: false,
      message: null,
      nextLoadout: loadout,
      unequipped: [],
    }
  }

  return previewEquipItem(loadout, loadout.mainHandItemId, definitions, {
    preferredVersatileGrip: grip,
  })
}
