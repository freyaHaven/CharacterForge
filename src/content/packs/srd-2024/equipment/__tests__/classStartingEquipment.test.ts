import { describe, expect, it } from 'vitest'
import type { ClassDefinition } from '../../../../../domain/class/types'
import type { EquipmentGrant } from '../../../../../domain/equipment/types'
import { GOLD_PIECES_ITEM_ID } from '../../../../../domain/equipment/types'
import { item } from '../../../../../domain/equipment/grants'
import { barbarianSrd2024 } from '../../classes/barbarian'
import { clericSrd2024 } from '../../classes/cleric'
import { fighterSrd2024 } from '../../classes/fighter'
import { monkSrd2024 } from '../../classes/monk'
import { paladinSrd2024 } from '../../classes/paladin'
import { rangerSrd2024 } from '../../classes/ranger'
import { rogueSrd2024 } from '../../classes/rogue'
import { SRD_2024_EQUIPMENT_BY_ID } from '../index'
import {
  BARBARIAN_PACKAGE_A,
  CLERIC_PACKAGE_A,
  FIGHTER_PACKAGE_A,
  FIGHTER_PACKAGE_B,
  MONK_PACKAGE_A,
  PALADIN_PACKAGE_A,
  RANGER_PACKAGE_A,
  ROGUE_PACKAGE_A,
} from '../packages'

const id = (slug: string) => `srd-2024:${slug}`

type ClassStartingEquipmentExpectation = {
  classDef: ClassDefinition
  options: Array<
    | {
        id: string
        label: string
        kind: 'items'
        grants: readonly EquipmentGrant[]
      }
    | {
        id: string
        label: string
        kind: 'gold'
        goldPieces: number
      }
  >
}

const CLASS_STARTING_EQUIPMENT: ClassStartingEquipmentExpectation[] = [
  {
    classDef: barbarianSrd2024,
    options: [
      { id: 'package-a', label: 'Package A', kind: 'items', grants: BARBARIAN_PACKAGE_A },
      { id: 'gold-alternative', label: '75 GP', kind: 'gold', goldPieces: 75 },
    ],
  },
  {
    classDef: clericSrd2024,
    options: [
      { id: 'package-a', label: 'Package A', kind: 'items', grants: CLERIC_PACKAGE_A },
      { id: 'gold-alternative', label: '110 GP', kind: 'gold', goldPieces: 110 },
    ],
  },
  {
    classDef: monkSrd2024,
    options: [
      { id: 'package-a', label: 'Package A', kind: 'items', grants: MONK_PACKAGE_A },
      { id: 'gold-alternative', label: '50 GP', kind: 'gold', goldPieces: 50 },
    ],
  },
  {
    classDef: paladinSrd2024,
    options: [
      { id: 'package-a', label: 'Package A', kind: 'items', grants: PALADIN_PACKAGE_A },
      { id: 'gold-alternative', label: '150 GP', kind: 'gold', goldPieces: 150 },
    ],
  },
  {
    classDef: rangerSrd2024,
    options: [
      { id: 'package-a', label: 'Package A', kind: 'items', grants: RANGER_PACKAGE_A },
      { id: 'gold-alternative', label: '150 GP', kind: 'gold', goldPieces: 150 },
    ],
  },
  {
    classDef: rogueSrd2024,
    options: [
      { id: 'package-a', label: 'Package A', kind: 'items', grants: ROGUE_PACKAGE_A },
      { id: 'gold-alternative', label: '100 GP', kind: 'gold', goldPieces: 100 },
    ],
  },
  {
    classDef: fighterSrd2024,
    options: [
      { id: 'package-a', label: 'Package A', kind: 'items', grants: FIGHTER_PACKAGE_A },
      { id: 'package-b', label: 'Package B', kind: 'items', grants: FIGHTER_PACKAGE_B },
      { id: 'gold-alternative', label: '155 GP', kind: 'gold', goldPieces: 155 },
    ],
  },
]

function formatGrants(grants: readonly EquipmentGrant[]): string[] {
  return grants
    .map((grant) => `${grant.itemId}×${grant.quantity}`)
    .sort()
}

function getChooseOptionEntitlement(classDef: ClassDefinition) {
  const entitlement = classDef.startingEquipment.entitlements[0]
  expect(entitlement?.type).toBe('choose-option')
  if (entitlement?.type !== 'choose-option') {
    throw new Error(`Expected choose-option for ${classDef.id}`)
  }
  return entitlement
}

describe('SRD 2024 class starting equipment packages', () => {
  it.each(CLASS_STARTING_EQUIPMENT)(
    '$classDef.name marks starting equipment as complete',
    ({ classDef }) => {
      expect(classDef.startingEquipment.completeness).toBe('complete')
    },
  )

  it.each(CLASS_STARTING_EQUIPMENT)(
    '$classDef.name exposes the expected option ids and labels',
    ({ classDef, options }) => {
      const entitlement = getChooseOptionEntitlement(classDef)

      expect(entitlement.options.map((option) => option.id)).toEqual(
        options.map((option) => option.id),
      )
      expect(entitlement.options.map((option) => option.label)).toEqual(
        options.map((option) => option.label),
      )
    },
  )

  it.each(CLASS_STARTING_EQUIPMENT)(
    '$classDef.name matches SRD item grants and gold amounts',
    ({ classDef, options }) => {
      const entitlement = getChooseOptionEntitlement(classDef)

      for (const expected of options) {
        const actual = entitlement.options.find((option) => option.id === expected.id)
        expect(actual).toBeDefined()

        if (expected.kind === 'gold') {
          expect(actual?.kind).toBe('gold')
          if (actual?.kind === 'gold') {
            expect(actual.goldPieces).toBe(expected.goldPieces)
          }
          continue
        }

        expect(actual?.kind).toBe('items')
        if (actual?.kind === 'items') {
          expect(formatGrants(actual.items)).toEqual(formatGrants(expected.grants))
        }
      }
    },
  )

  it('references only catalogued equipment item ids', () => {
    const referencedIds = new Set<string>()

    for (const { options } of CLASS_STARTING_EQUIPMENT) {
      for (const option of options) {
        if (option.kind !== 'items') {
          continue
        }
        for (const grant of option.grants) {
          referencedIds.add(grant.itemId)
        }
      }
    }

    for (const itemId of referencedIds) {
      expect(SRD_2024_EQUIPMENT_BY_ID.has(itemId)).toBe(true)
    }
  })
})

describe('SRD 2024 class starting equipment package contents', () => {
  it('matches Barbarian Package A', () => {
    expect(formatGrants(BARBARIAN_PACKAGE_A)).toEqual(
      formatGrants([
        item(id('greataxe')),
        item(id('handaxe'), 4),
        item(id('explorers-pack')),
        item(GOLD_PIECES_ITEM_ID, 15),
      ]),
    )
  })

  it('matches Cleric Package A', () => {
    expect(formatGrants(CLERIC_PACKAGE_A)).toEqual(
      formatGrants([
        item(id('chain-shirt')),
        item(id('shield')),
        item(id('mace')),
        item(id('holy-symbol')),
        item(id('priests-pack')),
        item(GOLD_PIECES_ITEM_ID, 7),
      ]),
    )
  })

  it('matches Monk Package A', () => {
    expect(formatGrants(MONK_PACKAGE_A)).toEqual(
      formatGrants([
        item(id('spear')),
        item(id('dagger'), 5),
        item(id('artisans-tools')),
        item(id('explorers-pack')),
        item(GOLD_PIECES_ITEM_ID, 11),
      ]),
    )
  })

  it('matches Paladin Package A', () => {
    expect(formatGrants(PALADIN_PACKAGE_A)).toEqual(
      formatGrants([
        item(id('chain-mail')),
        item(id('shield')),
        item(id('longsword')),
        item(id('javelin'), 6),
        item(id('holy-symbol')),
        item(id('priests-pack')),
        item(GOLD_PIECES_ITEM_ID, 9),
      ]),
    )
  })

  it('matches Ranger Package A', () => {
    expect(formatGrants(RANGER_PACKAGE_A)).toEqual(
      formatGrants([
        item(id('studded-leather-armor')),
        item(id('scimitar')),
        item(id('shortsword')),
        item(id('longbow')),
        item(id('arrows'), 20),
        item(id('quiver')),
        item(id('druidic-focus-mistletoe')),
        item(id('explorers-pack')),
        item(GOLD_PIECES_ITEM_ID, 7),
      ]),
    )
  })

  it('matches Rogue Package A', () => {
    expect(formatGrants(ROGUE_PACKAGE_A)).toEqual(
      formatGrants([
        item(id('leather-armor')),
        item(id('dagger'), 2),
        item(id('shortsword')),
        item(id('shortbow')),
        item(id('arrows'), 20),
        item(id('quiver')),
        item(id('thieves-tools')),
        item(id('burglars-pack')),
        item(GOLD_PIECES_ITEM_ID, 8),
      ]),
    )
  })

  it('matches Fighter Package A and B', () => {
    expect(formatGrants(FIGHTER_PACKAGE_A)).toEqual(
      formatGrants([
        item(id('chain-mail')),
        item(id('greatsword')),
        item(id('flail')),
        item(id('javelin'), 8),
        item(id('dungeoneers-pack')),
        item(GOLD_PIECES_ITEM_ID, 4),
      ]),
    )

    expect(formatGrants(FIGHTER_PACKAGE_B)).toEqual(
      formatGrants([
        item(id('studded-leather-armor')),
        item(id('scimitar')),
        item(id('shortsword')),
        item(id('longbow')),
        item(id('arrows'), 20),
        item(id('quiver')),
        item(id('dungeoneers-pack')),
        item(GOLD_PIECES_ITEM_ID, 11),
      ]),
    )
  })
})
