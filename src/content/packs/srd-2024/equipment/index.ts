import type { EquipmentItemDefinition } from '../../../../domain/equipment/types'
import { GOLD_PIECES_ITEM_ID } from '../../../../domain/equipment/types'
import { SRD_2024_SOURCE } from '../source'

function def(
  partial: Omit<EquipmentItemDefinition, 'editionId' | 'source'>,
): EquipmentItemDefinition {
  return {
    ...partial,
    editionId: 'srd-2024',
    source: SRD_2024_SOURCE,
  }
}

const id = (slug: string) => `srd-2024:${slug}`

/** Items referenced by SRD 2024 starting equipment packages. */
export const SRD_2024_EQUIPMENT: EquipmentItemDefinition[] = [
  def({
    id: GOLD_PIECES_ITEM_ID,
    name: 'Gold Pieces',
    category: 'currency',
  }),

  // Weapons
  def({
    id: id('greatsword'),
    name: 'Greatsword',
    category: 'weapon',
    handUsage: 'two-handed',
  }),
  def({
    id: id('flail'),
    name: 'Flail',
    category: 'weapon',
    handUsage: 'one-handed',
  }),
  def({
    id: id('javelin'),
    name: 'Javelin',
    category: 'weapon',
    handUsage: 'one-handed',
  }),
  def({
    id: id('scimitar'),
    name: 'Scimitar',
    category: 'weapon',
    handUsage: 'one-handed',
  }),
  def({
    id: id('shortsword'),
    name: 'Shortsword',
    category: 'weapon',
    handUsage: 'one-handed',
  }),
  def({
    id: id('longbow'),
    name: 'Longbow',
    category: 'weapon',
    handUsage: 'two-handed',
  }),
  def({
    id: id('greataxe'),
    name: 'Greataxe',
    category: 'weapon',
    handUsage: 'two-handed',
  }),
  def({
    id: id('handaxe'),
    name: 'Handaxe',
    category: 'weapon',
    handUsage: 'one-handed',
  }),
  def({
    id: id('mace'),
    name: 'Mace',
    category: 'weapon',
    handUsage: 'one-handed',
  }),
  def({
    id: id('spear'),
    name: 'Spear',
    category: 'weapon',
    handUsage: 'versatile',
  }),
  def({
    id: id('dagger'),
    name: 'Dagger',
    category: 'weapon',
    handUsage: 'one-handed',
  }),
  def({
    id: id('longsword'),
    name: 'Longsword',
    category: 'weapon',
    handUsage: 'versatile',
  }),
  def({
    id: id('shortbow'),
    name: 'Shortbow',
    category: 'weapon',
    handUsage: 'two-handed',
  }),
  def({
    id: id('quarterstaff'),
    name: 'Quarterstaff',
    category: 'weapon',
    handUsage: 'versatile',
  }),

  // Armor / shield (SRD 2024 armour class values)
  def({
    id: id('chain-mail'),
    name: 'Chain Mail',
    category: 'armor',
    armor: {
      armorCategory: 'heavy',
      baseArmorClass: 16,
      maxDexterityBonus: 0,
    },
  }),
  def({
    id: id('studded-leather-armor'),
    name: 'Studded Leather Armor',
    category: 'armor',
    armor: {
      armorCategory: 'light',
      baseArmorClass: 12,
      maxDexterityBonus: null,
    },
  }),
  def({
    id: id('leather-armor'),
    name: 'Leather Armor',
    category: 'armor',
    armor: {
      armorCategory: 'light',
      baseArmorClass: 11,
      maxDexterityBonus: null,
    },
  }),
  def({
    id: id('chain-shirt'),
    name: 'Chain Shirt',
    category: 'armor',
    armor: {
      armorCategory: 'medium',
      baseArmorClass: 13,
      maxDexterityBonus: 2,
    },
  }),
  def({
    id: id('shield'),
    name: 'Shield',
    category: 'shield',
    shield: { armorClassBonus: 2 },
  }),

  // Ammunition / containers
  def({ id: id('arrows'), name: 'Arrows', category: 'ammunition' }),
  def({ id: id('quiver'), name: 'Quiver', category: 'gear' }),

  // Tools
  def({
    id: id('calligraphers-supplies'),
    name: "Calligrapher's Supplies",
    category: 'tool',
  }),
  def({ id: id('thieves-tools'), name: "Thieves' Tools", category: 'tool' }),
  def({ id: id('healers-kit'), name: "Healer's Kit", category: 'tool' }),
  def({ id: id('holy-symbol'), name: 'Holy Symbol', category: 'tool' }),
  def({
    id: id('druidic-focus-mistletoe'),
    name: 'Druidic Focus (sprig of mistletoe)',
    category: 'tool',
  }),
  def({
    id: id('artisans-tools'),
    name: "Artisan's Tools",
    category: 'tool',
  }),
  def({
    id: id('dice-set'),
    name: 'Dice Set',
    category: 'tool',
  }),
  def({
    id: id('dragonchess-set'),
    name: 'Dragonchess Set',
    category: 'tool',
  }),
  def({
    id: id('playing-card-set'),
    name: 'Playing Card Set',
    category: 'tool',
  }),
  def({
    id: id('three-dragon-ante-set'),
    name: 'Three-Dragon Ante Set',
    category: 'tool',
  }),

  // Gear
  def({ id: id('backpack'), name: 'Backpack', category: 'gear' }),
  def({ id: id('bedroll'), name: 'Bedroll', category: 'gear' }),
  def({ id: id('blanket'), name: 'Blanket', category: 'gear' }),
  def({ id: id('rope'), name: 'Rope', category: 'gear' }),
  def({ id: id('tinderbox'), name: 'Tinderbox', category: 'gear' }),
  def({ id: id('torch'), name: 'Torch', category: 'gear' }),
  def({ id: id('rations'), name: 'Rations', category: 'gear' }),
  def({ id: id('waterskin'), name: 'Waterskin', category: 'gear' }),
  def({ id: id('oil'), name: 'Oil', category: 'gear' }),
  def({ id: id('crowbar'), name: 'Crowbar', category: 'gear' }),
  def({ id: id('caltrops'), name: 'Caltrops', category: 'gear' }),
  def({ id: id('ball-bearings'), name: 'Ball Bearings', category: 'gear' }),
  def({ id: id('bell'), name: 'Bell', category: 'gear' }),
  def({ id: id('candle'), name: 'Candle', category: 'gear' }),
  def({ id: id('hooded-lantern'), name: 'Hooded Lantern', category: 'gear' }),
  def({ id: id('lamp'), name: 'Lamp', category: 'gear' }),
  def({ id: id('holy-water'), name: 'Holy Water', category: 'gear' }),
  def({ id: id('pouch'), name: 'Pouch', category: 'gear' }),
  def({
    id: id('travelers-clothes'),
    name: "Traveler's Clothes",
    category: 'gear',
  }),
  def({ id: id('robe'), name: 'Robe', category: 'gear' }),
  def({ id: id('book-prayers'), name: 'Book (prayers)', category: 'gear' }),
  def({ id: id('book-history'), name: 'Book (history)', category: 'gear' }),
  def({ id: id('parchment'), name: 'Parchment', category: 'gear' }),
  def({
    id: id('selected-gaming-set'),
    name: 'Gaming Set',
    category: 'tool',
  }),

  // Packs (expand into contents)
  def({
    id: id('dungeoneers-pack'),
    name: "Dungeoneer's Pack",
    category: 'container',
    expandsTo: [
      { itemId: id('backpack'), quantity: 1 },
      { itemId: id('caltrops'), quantity: 1 },
      { itemId: id('crowbar'), quantity: 1 },
      { itemId: id('oil'), quantity: 2 },
      { itemId: id('rations'), quantity: 10 },
      { itemId: id('rope'), quantity: 1 },
      { itemId: id('tinderbox'), quantity: 1 },
      { itemId: id('torch'), quantity: 10 },
      { itemId: id('waterskin'), quantity: 1 },
    ],
  }),
  def({
    id: id('explorers-pack'),
    name: "Explorer's Pack",
    category: 'container',
    expandsTo: [
      { itemId: id('backpack'), quantity: 1 },
      { itemId: id('bedroll'), quantity: 1 },
      { itemId: id('oil'), quantity: 2 },
      { itemId: id('rations'), quantity: 10 },
      { itemId: id('rope'), quantity: 1 },
      { itemId: id('tinderbox'), quantity: 1 },
      { itemId: id('torch'), quantity: 10 },
      { itemId: id('waterskin'), quantity: 1 },
    ],
  }),
  def({
    id: id('burglars-pack'),
    name: "Burglar's Pack",
    category: 'container',
    expandsTo: [
      { itemId: id('backpack'), quantity: 1 },
      { itemId: id('ball-bearings'), quantity: 1 },
      { itemId: id('bell'), quantity: 1 },
      { itemId: id('candle'), quantity: 10 },
      { itemId: id('crowbar'), quantity: 1 },
      { itemId: id('hooded-lantern'), quantity: 1 },
      { itemId: id('oil'), quantity: 7 },
      { itemId: id('rations'), quantity: 5 },
      { itemId: id('rope'), quantity: 1 },
      { itemId: id('tinderbox'), quantity: 1 },
      { itemId: id('waterskin'), quantity: 1 },
    ],
  }),
  def({
    id: id('priests-pack'),
    name: "Priest's Pack",
    category: 'container',
    expandsTo: [
      { itemId: id('backpack'), quantity: 1 },
      { itemId: id('blanket'), quantity: 1 },
      { itemId: id('holy-water'), quantity: 1 },
      { itemId: id('lamp'), quantity: 1 },
      { itemId: id('rations'), quantity: 7 },
      { itemId: id('robe'), quantity: 1 },
      { itemId: id('tinderbox'), quantity: 1 },
    ],
  }),
]

export const SRD_2024_EQUIPMENT_BY_ID = new Map(
  SRD_2024_EQUIPMENT.map((entry) => [entry.id, entry]),
)
