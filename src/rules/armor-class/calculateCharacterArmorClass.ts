import { getAbilityModifier } from '../../domain/abilities'
import type { AbilityId } from '../../domain/abilities/types'
import type { AbilityScores } from '../../domain/types'
import type {
  ArmorProperties,
  EquipmentItemDefinition,
  EquipmentLoadout,
  ShieldProperties,
} from '../../domain/equipment/types'
import { EMPTY_EQUIPMENT_LOADOUT } from '../../domain/equipment/types'
import type { ResolvedEquipment } from '../character/resolveCharacterEquipment'

export type ArmorClassResult = {
  total: number
  base: number
  dexterityBonus: number
  shieldBonus: number
  /** Passive bonuses (e.g. Defense Fighting Style) already gated by caller. */
  otherBonus: number
  armorItemId: string | null
  shieldItemId: string | null
}

const UNARMORED_BASE_ARMOR_CLASS = 10

function applyDexterityBonus(
  dexterityModifier: number,
  armor: ArmorProperties | null,
): number {
  if (armor === null) {
    return dexterityModifier
  }

  if (armor.maxDexterityBonus === null) {
    return dexterityModifier
  }

  return Math.min(dexterityModifier, armor.maxDexterityBonus)
}

function isOwned(
  itemId: string | null,
  resolvedEquipment: ResolvedEquipment,
): boolean {
  if (itemId === null) {
    return false
  }

  return resolvedEquipment.inventory.some((entry) => entry.itemId === itemId)
}

/**
 * Resolves worn armour and shield from the character loadout.
 * Only owned loadout items contribute; inventory ownership alone does not.
 */
export function selectEquippedArmorAndShield(
  loadout: EquipmentLoadout,
  resolvedEquipment: ResolvedEquipment,
  equipmentDefinitionsById: ReadonlyMap<string, EquipmentItemDefinition>,
): {
  armorItemId: string | null
  armor: ArmorProperties | null
  shieldItemId: string | null
  shield: ShieldProperties | null
} {
  let armorItemId: string | null = null
  let armor: ArmorProperties | null = null
  let shieldItemId: string | null = null
  let shield: ShieldProperties | null = null

  if (isOwned(loadout.armorItemId, resolvedEquipment)) {
    const definition = equipmentDefinitionsById.get(loadout.armorItemId!)
    if (
      definition !== undefined &&
      definition.category === 'armor' &&
      definition.armor !== undefined
    ) {
      armorItemId = definition.id
      armor = definition.armor
    }
  }

  if (isOwned(loadout.offHandItemId, resolvedEquipment)) {
    const definition = equipmentDefinitionsById.get(loadout.offHandItemId!)
    if (
      definition !== undefined &&
      definition.category === 'shield' &&
      definition.shield !== undefined
    ) {
      shieldItemId = definition.id
      shield = definition.shield
    }
  }

  return { armorItemId, armor, shieldItemId, shield }
}

function bestUnarmoredBase(
  abilityScores: AbilityScores,
  unarmoredDefenseOptions: readonly { abilities: readonly AbilityId[] }[],
): { base: number; dexterityBonus: number } {
  const dexterityModifier = getAbilityModifier(abilityScores.dexterity)
  let bestTotal = UNARMORED_BASE_ARMOR_CLASS + dexterityModifier
  let bestBase = UNARMORED_BASE_ARMOR_CLASS
  let bestDexterityBonus = dexterityModifier

  for (const option of unarmoredDefenseOptions) {
    if (option.abilities.length === 0) {
      continue
    }

    const sum = option.abilities.reduce(
      (total, ability) => total + getAbilityModifier(abilityScores[ability]),
      0,
    )
    const candidateTotal = UNARMORED_BASE_ARMOR_CLASS + sum
    if (candidateTotal > bestTotal) {
      bestTotal = candidateTotal
      bestBase = candidateTotal
      bestDexterityBonus = 0
    }
  }

  return { base: bestBase, dexterityBonus: bestDexterityBonus }
}

/**
 * Derives Armour Class from ability scores and the character's equipment loadout.
 *
 * - No armour: 10 + Dexterity modifier, or the best `unarmored-defense` formula
 * - Light: armour base + full Dexterity modifier
 * - Medium: armour base + Dexterity modifier (capped)
 * - Heavy: armour base only
 * - Shield: add shield bonus only when equipped in the off hand
 * - otherBonus: caller-supplied passive bonuses (e.g. Defense while wearing armour)
 */
export function calculateCharacterArmorClass(input: {
  abilityScores: AbilityScores
  resolvedEquipment: ResolvedEquipment
  loadout?: EquipmentLoadout
  equipmentDefinitionsById: ReadonlyMap<string, EquipmentItemDefinition>
  /** Pre-resolved passive AC bonuses (Defense, etc.). */
  otherBonus?: number
  /**
   * Unarmored Defense formulas from class effects (e.g. DEX+CHA).
   * Used only while no armour is worn; highest formula wins.
   */
  unarmoredDefenseOptions?: readonly { abilities: readonly AbilityId[] }[]
}): ArmorClassResult {
  const dexterityModifier = getAbilityModifier(input.abilityScores.dexterity)
  const equipped = selectEquippedArmorAndShield(
    input.loadout ?? EMPTY_EQUIPMENT_LOADOUT,
    input.resolvedEquipment,
    input.equipmentDefinitionsById,
  )

  let base: number
  let dexterityBonus: number

  if (equipped.armor === null) {
    const unarmored = bestUnarmoredBase(
      input.abilityScores,
      input.unarmoredDefenseOptions ?? [],
    )
    base = unarmored.base
    dexterityBonus = unarmored.dexterityBonus
  } else {
    base = equipped.armor.baseArmorClass
    dexterityBonus = applyDexterityBonus(dexterityModifier, equipped.armor)
  }

  const shieldBonus = equipped.shield?.armorClassBonus ?? 0
  const otherBonus = input.otherBonus ?? 0

  return {
    total: base + dexterityBonus + shieldBonus + otherBonus,
    base,
    dexterityBonus,
    shieldBonus,
    otherBonus,
    armorItemId: equipped.armorItemId,
    shieldItemId: equipped.shieldItemId,
  }
}
