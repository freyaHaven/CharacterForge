import type { EquipmentGrant } from '../../../../domain/equipment/types'
import { SELECTED_GAMING_SET_ITEM_ID } from '../../../../domain/equipment/types'
import { gold, item } from '../../../../domain/equipment/grants'

const id = (slug: string) => `srd-2024:${slug}`

export const FIGHTER_PACKAGE_A: EquipmentGrant[] = [
  item(id('chain-mail')),
  item(id('greatsword')),
  item(id('flail')),
  item(id('javelin'), 8),
  item(id('dungeoneers-pack')),
  gold(4),
]

export const FIGHTER_PACKAGE_B: EquipmentGrant[] = [
  item(id('studded-leather-armor')),
  item(id('scimitar')),
  item(id('shortsword')),
  item(id('longbow')),
  item(id('arrows'), 20),
  item(id('quiver')),
  item(id('dungeoneers-pack')),
  gold(11),
]

export const BARBARIAN_PACKAGE_A: EquipmentGrant[] = [
  item(id('greataxe')),
  item(id('handaxe'), 4),
  item(id('explorers-pack')),
  gold(15),
]

export const CLERIC_PACKAGE_A: EquipmentGrant[] = [
  item(id('chain-shirt')),
  item(id('shield')),
  item(id('mace')),
  item(id('holy-symbol')),
  item(id('priests-pack')),
  gold(7),
]

export const MONK_PACKAGE_A: EquipmentGrant[] = [
  item(id('spear')),
  item(id('dagger'), 5),
  item(id('artisans-tools')),
  item(id('explorers-pack')),
  gold(11),
]

export const PALADIN_PACKAGE_A: EquipmentGrant[] = [
  item(id('chain-mail')),
  item(id('shield')),
  item(id('longsword')),
  item(id('javelin'), 6),
  item(id('holy-symbol')),
  item(id('priests-pack')),
  gold(9),
]

export const RANGER_PACKAGE_A: EquipmentGrant[] = [
  item(id('studded-leather-armor')),
  item(id('scimitar')),
  item(id('shortsword')),
  item(id('longbow')),
  item(id('arrows'), 20),
  item(id('quiver')),
  item(id('druidic-focus-mistletoe')),
  item(id('explorers-pack')),
  gold(7),
]

export const ROGUE_PACKAGE_A: EquipmentGrant[] = [
  item(id('leather-armor')),
  item(id('dagger'), 2),
  item(id('shortsword')),
  item(id('shortbow')),
  item(id('arrows'), 20),
  item(id('quiver')),
  item(id('thieves-tools')),
  item(id('burglars-pack')),
  gold(8),
]

export const ACOLYTE_PACKAGE: EquipmentGrant[] = [
  item(id('calligraphers-supplies')),
  item(id('book-prayers')),
  item(id('holy-symbol')),
  item(id('parchment'), 10),
  item(id('robe')),
  gold(8),
]

export const CRIMINAL_PACKAGE: EquipmentGrant[] = [
  item(id('dagger'), 2),
  item(id('thieves-tools')),
  item(id('crowbar')),
  item(id('pouch'), 2),
  item(id('travelers-clothes')),
  gold(16),
]

export const SAGE_PACKAGE: EquipmentGrant[] = [
  item(id('quarterstaff')),
  item(id('calligraphers-supplies')),
  item(id('book-history')),
  item(id('parchment'), 8),
  item(id('robe')),
  gold(8),
]

export const SOLDIER_PACKAGE: EquipmentGrant[] = [
  item(id('spear')),
  item(id('shortbow')),
  item(id('arrows'), 20),
  item(SELECTED_GAMING_SET_ITEM_ID),
  item(id('healers-kit')),
  item(id('quiver')),
  item(id('travelers-clothes')),
  gold(14),
]
