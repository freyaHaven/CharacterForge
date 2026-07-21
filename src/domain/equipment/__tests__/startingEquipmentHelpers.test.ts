import { describe, expect, it } from 'vitest'
import {
  createBackgroundStartingEquipment,
  createCompleteClassPackageOrGoldStartingEquipment,
  createSimplifiedClassStartingEquipment,
  GOLD_OPTION_ID,
  PACKAGE_OPTION_ID,
  STARTING_EQUIPMENT_ENTITLEMENT_ID,
} from '../startingEquipmentHelpers'
import { item } from '../grants'

describe('startingEquipmentHelpers', () => {
  it('creates background package vs 50 GP with stable ids', () => {
    const equipment = createBackgroundStartingEquipment([
      item('srd-2024:spear'),
    ])

    expect(equipment.completeness).toBe('complete')
    expect(equipment.entitlements[0]).toMatchObject({
      type: 'choose-option',
      id: STARTING_EQUIPMENT_ENTITLEMENT_ID,
    })
    expect(equipment.entitlements[0]?.type).toBe('choose-option')
    if (equipment.entitlements[0]?.type !== 'choose-option') {
      return
    }

    expect(equipment.entitlements[0].options.map((option) => option.id)).toEqual([
      PACKAGE_OPTION_ID,
      GOLD_OPTION_ID,
    ])
  })

  it('marks simplified class stubs as simplified', () => {
    const equipment = createSimplifiedClassStartingEquipment({
      packageLabel: 'Package A',
      items: [item('srd-2024:greataxe')],
      goldPieces: 75,
    })

    expect(equipment.completeness).toBe('simplified')
  })

  it('creates complete class package vs gold with package-a ids', () => {
    const equipment = createCompleteClassPackageOrGoldStartingEquipment({
      items: [item('srd-2024:greataxe'), item('srd-2024:gold-pieces', 15)],
      goldPieces: 75,
    })

    expect(equipment.completeness).toBe('complete')
    const entitlement = equipment.entitlements[0]
    expect(entitlement?.type).toBe('choose-option')
    if (entitlement?.type !== 'choose-option') {
      return
    }

    expect(entitlement.options.map((option) => option.id)).toEqual([
      'package-a',
      GOLD_OPTION_ID,
    ])
    expect(entitlement.options[1]?.kind).toBe('gold')
    if (entitlement.options[1]?.kind === 'gold') {
      expect(entitlement.options[1].goldPieces).toBe(75)
    }
  })
})
