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

/**
 * Where an inventory entry is located.
 * Containers are referenced by instance id so two backpacks stay distinct.
 */
export type InventoryLocation =
  | { kind: 'carried' }
  | { kind: 'container'; containerInstanceId: string }

/**
 * One owned stack or item instance in the character's inventory.
 * Persisted as gameplay state once seeded from starting equipment (P3.1).
 */
export type InventoryEntry = {
  instanceId: string
  itemId: string
  quantity: number
  location: InventoryLocation
}

/**
 * Authoritative owned gear and purse for play.
 * Build-time starting-equipment answers stay in `CharacterEquipment.selections`.
 */
export type CharacterInventory = {
  entries: InventoryEntry[]
  currency: { goldPieces: number }
  /**
   * When true, inventory was seeded from starting equipment and must not be
   * overwritten by subsequent starting-equipment resolution.
   */
  seededFromStartingEquipment: boolean
}

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
 * Ownership comes from persisted `inventory` once seeded; until then from
 * resolved starting-equipment grants.
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

/**
 * Catalogue filter for `choose-items` entitlements.
 * Prefer `item-ids` for curated SRD “of your choice” lists.
 */
export type EquipmentFilter =
  | { kind: 'item-ids'; itemIds: string[] }
  | { kind: 'category'; categories: EquipmentItemCategory[] }
  | { kind: 'tags'; tags: string[] }

/**
 * One branch in a choose-option.
 * `items` options may nest further entitlements (activated only when selected).
 */
export type EquipmentOption =
  | {
      id: string
      label: string
      kind: 'items'
      items: EquipmentGrant[]
      /** Nested choices under this package / branch. */
      entitlements?: EquipmentEntitlement[]
      /** Optional short preview shown before selection. */
      summary?: string
    }
  | {
      id: string
      label: string
      kind: 'gold'
      goldPieces: number
      summary?: string
    }

/**
 * Content-driven starting-equipment choice node.
 * Trees nest via `choose-option` → option.entitlements.
 */
export type EquipmentEntitlement =
  | {
      type: 'grant'
      id: string
      label?: string
      items: EquipmentGrant[]
      required?: boolean
    }
  | {
      type: 'choose-option'
      id: string
      label: string
      options: EquipmentOption[]
      /** Defaults to true. */
      required?: boolean
    }
  | {
      type: 'choose-items'
      id: string
      label: string
      /** Exact pick count (min === max). Prefer min/max when unequal. */
      count?: number
      min?: number
      max?: number
      catalogueFilter: EquipmentFilter
      /** Defaults to true. */
      required?: boolean
      /** When false (default), each item id may be chosen at most once. */
      allowDuplicates?: boolean
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

/**
 * Player state for one choose-* entitlement node.
 *
 * `path` is the chain of parent option ids from the root (empty at root).
 * Example: Monk artisan tool under Package A → path `['package-a']`,
 * entitlementId `artisan-tools`.
 */
export type EquipmentSelection = {
  source: EquipmentSourceRef
  entitlementId: string
  /** Parent option ids from root; omit/`[]` for root entitlements. */
  path?: string[]
  optionId: string | null
  choices: EquipmentItemSelection[]
}

export type CharacterEquipment = {
  /** Build-time starting-equipment answers (immutable during play). */
  selections: EquipmentSelection[]
  /** Mutable owned gear — authoritative after seed. */
  inventory: CharacterInventory
  loadout: EquipmentLoadout
}

export type EquipmentItemDefinition = {
  id: string
  editionId: EditionId
  name: string
  category: EquipmentItemCategory
  source: ContentSource
  /**
   * When set on a kit/pack, owning this item expands into these grants.
   * The pack itself is not kept as an inventory line.
   */
  expandsTo?: EquipmentGrant[]
  /**
   * When true, this item can hold other entries (backpack, quiver, pouch).
   * Distinct from kit packs that use `expandsTo`.
   */
  isContainer?: boolean
  /** Weight of one unit in pounds. */
  weightLb?: number
  /** Market cost of one unit in gold pieces. */
  costGp?: number
  /** Searchable tags (e.g. heavy, two-handed, ammunition). */
  tags?: string[]
  /** Short display note when no richer note is derived. */
  notes?: string
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

export const EMPTY_CHARACTER_INVENTORY: CharacterInventory = {
  entries: [],
  currency: { goldPieces: 0 },
  seededFromStartingEquipment: false,
}

export const EMPTY_CHARACTER_EQUIPMENT: CharacterEquipment = {
  selections: [],
  inventory: EMPTY_CHARACTER_INVENTORY,
  loadout: EMPTY_EQUIPMENT_LOADOUT,
}
