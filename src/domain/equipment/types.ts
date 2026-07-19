import type { ContentSource } from '../content/types'
import type { EditionId } from '../edition'

/**
 * Discriminated source identity. Include unused kinds now so later content
 * (species traits, feats) does not force a persistence/union migration.
 *
 * Future: a `feature` kind (subclass features, Magic Initiate-style grants,
 * tool-granting features) is likely once those start awarding gear.
 */
export type EquipmentSourceRef =
  | { kind: 'class-instance'; instanceId: string }
  | { kind: 'background'; backgroundId: string }
  | { kind: 'species'; speciesId: string; traitId?: string }
  | { kind: 'feat'; featId: string; slot?: string }

export type EquipmentSourceKindLabel =
  | 'Class'
  | 'Background'
  | 'Species'
  | 'Feat'

export type EquipmentItemCategory =
  | 'weapon'
  | 'armor'
  | 'shield'
  | 'ammunition'
  | 'tool'
  | 'gear'
  | 'container'
  | 'currency'

/** How a weapon or shield occupies the character's hands. */
export type EquipmentHandUsage = 'one-handed' | 'two-handed' | 'versatile'

/** Light / medium / heavy armour worn for Armour Class. */
export type ArmorCategory = 'light' | 'medium' | 'heavy'

export type ArmorProperties = {
  armorCategory: ArmorCategory
  baseArmorClass: number
  /**
   * Maximum Dexterity modifier applied to AC.
   * `null` means unrestricted (typical light armour).
   * `0` means no Dexterity bonus (typical heavy armour).
   */
  maxDexterityBonus: number | null
}

export type ShieldProperties = {
  armorClassBonus: number
}

/**
 * What the character is currently wearing / wielding.
 * Inventory ownership still comes from `selections` → resolved grants.
 */
export type EquipmentLoadout = {
  armorItemId: string | null
  mainHandItemId: string | null
  offHandItemId: string | null
  /**
   * Grip for a versatile main-hand weapon.
   * Ignored when the main-hand item is not versatile.
   */
  mainHandGrip: 'one-handed' | 'two-handed' | null
}

export type EquipmentGrant = {
  itemId: string
  quantity: number
}

export type EquipmentOption =
  | { id: string; label: string; kind: 'items'; items: EquipmentGrant[] }
  | { id: string; label: string; kind: 'gold'; goldPieces: number }

export type EquipmentFilter =
  | { kind: 'item-ids'; itemIds: string[] }
  | { kind: 'category'; categories: EquipmentItemCategory[] }

export type EquipmentEntitlement =
  | {
      type: 'grant'
      id: string
      label?: string
      items: EquipmentGrant[]
    }
  | {
      type: 'choose-option'
      id: string
      label: string
      options: EquipmentOption[]
    }
  | {
      type: 'choose-items'
      id: string
      label: string
      count: number
      catalogueFilter: EquipmentFilter
    }

export type StartingEquipmentCompleteness = 'complete' | 'simplified'

export type StartingEquipmentDefinition = {
  completeness: StartingEquipmentCompleteness
  entitlements: EquipmentEntitlement[]
}

export type EquipmentItemSelection = {
  itemId: string
  quantity: number
}

/** Player state for one choose-* entitlement. Grants need no selection. */
export type EquipmentSelection = {
  source: EquipmentSourceRef
  entitlementId: string
  optionId: string | null
  choices: EquipmentItemSelection[]
}

export type CharacterEquipment = {
  selections: EquipmentSelection[]
  loadout: EquipmentLoadout
}

export type EquipmentItemDefinition = {
  id: string
  editionId: EditionId
  name: string
  category: EquipmentItemCategory
  source: ContentSource
  /** When set, owning this item expands into these grants in derived inventory. */
  expandsTo?: EquipmentGrant[]
  /** Present on armour items used for Armour Class. */
  armor?: ArmorProperties
  /** Present on shield items used for Armour Class. */
  shield?: ShieldProperties
  /** Present on weapons (and sometimes tools) that occupy hand slots. */
  handUsage?: EquipmentHandUsage
}

/** Stable currency item id used inside packages; peeled into currency on resolve. */
export const GOLD_PIECES_ITEM_ID = 'srd-2024:gold-pieces'

/**
 * Sentinel for Soldier (and similar) packages that grant the background's
 * chosen gaming set. Resolver replaces with the selected tool item id.
 */
export const SELECTED_GAMING_SET_ITEM_ID = 'srd-2024:selected-gaming-set'

export const EMPTY_EQUIPMENT_LOADOUT: EquipmentLoadout = {
  armorItemId: null,
  mainHandItemId: null,
  offHandItemId: null,
  mainHandGrip: null,
}

export const EMPTY_CHARACTER_EQUIPMENT: CharacterEquipment = {
  selections: [],
  loadout: EMPTY_EQUIPMENT_LOADOUT,
}
