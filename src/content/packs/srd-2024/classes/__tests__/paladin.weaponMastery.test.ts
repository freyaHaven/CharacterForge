import { describe, expect, it } from 'vitest'
import {
  createPaladinWeaponMasteryChoices,
  PALADIN_WEAPON_MASTERY_SLOT_THRESHOLDS,
} from '../paladin.weaponMastery'
import { getWeaponMasterySlotCount } from '../../../../../domain/class/weaponMastery'

describe('paladin weapon mastery schedule', () => {
  it('uses two mastery weapons from level 1 with no further unlocks', () => {
    expect(
      getWeaponMasterySlotCount(1, PALADIN_WEAPON_MASTERY_SLOT_THRESHOLDS),
    ).toBe(2)
    expect(
      getWeaponMasterySlotCount(20, PALADIN_WEAPON_MASTERY_SLOT_THRESHOLDS),
    ).toBe(2)
  })

  it('builds Paladin fixture mastery choices', () => {
    expect(createPaladinWeaponMasteryChoices(1)).toEqual({
      'weapon-mastery': ['longsword', 'javelin'],
    })
  })
})
